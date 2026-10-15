/**
 * The orchestrator (docs/09): turns a request into a validated draft in the
 * creator's preview by running the agents in a fixed order. It is
 * subject-agnostic and storage-agnostic: the app supplies a PipelineStore (the
 * CMS, acting as each agent so every permission applies) and a model client.
 *
 * Each call to `advance` performs one step and saves the run, so a step never
 * outlives a serverless function and a crash resumes where it stopped.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, loadAgent, runStructured, systemPrompt, enforceArtifact, enforceReviewer, reviewerOutputSchema, type AgentKit, type MakerRubric, type ReviewerOutput, type ReviewerRubric, type RunResult, type Violation } from "@lm/agents";
import { catalogue as contracts } from "@lm/catalogue";
import type { Lesson } from "@lm/schema";
import type { ValidationReport } from "@lm/validation";

export type Stage = "plan" | "draft" | "analogies" | "compose" | "localise" | "review" | "revise" | "re-review" | "resolve" | "teacher-guide" | "creator-preview" | "done";
export const STAGES: Stage[] = ["plan", "draft", "analogies", "compose", "localise", "review", "revise", "re-review", "resolve", "teacher-guide", "creator-preview", "done"];

export interface StepRecord {
  stage: Stage;
  agent: string;
  attempts: number;
  violations: Violation[];
  costUsd: number;
  usage: RunResult["usage"];
  output?: unknown;
  note?: string;
  at: string;
}

export interface Run {
  id: string | number;
  request: string;
  lessonId?: string | null;
  stage: Stage;
  status: "queued" | "running" | "waiting-for-creator" | "done" | "failed" | "paused";
  costUsd: number;
  steps: StepRecord[];
  flags: { open: Flag[]; resolved: Flag[] };
  /** Urgent runs continue past the budget alert level (never past the limit). */
  urgent?: boolean;
}

export type Flag = ReviewerOutput["flags"][number] & { reviewer: string };

/** What the orchestrator needs from storage. The app implements it with the CMS, acting as each agent. */
export interface PipelineStore {
  saveRun(run: Run, currentAgent: string | null): Promise<void>;
  getLesson(lessonId: string): Promise<Lesson | null>;
  /** Saves a draft as `agent`, through that agent's permissions. Returns the validation report. */
  saveLessonDraft(doc: Lesson, agent: string, reason: string): Promise<ValidationReport>;
  validate(doc: unknown): Promise<ValidationReport>;
  saveTeacherGuide(lessonId: string, locale: string, guide: unknown, agent: string): Promise<void>;
  createDecision(d: { title: string; kind: string; summary: string; positions?: unknown; options?: string[]; target?: string; dissent?: string }, agent: string): Promise<string | number>;
  previewLinks(lessonId: string): Promise<Record<string, { personal: string; classroom: string }>>;
  logEvent(action: string, agent: string, target: string, data?: unknown): Promise<void>;
  agentEnabled(agent: string): Promise<boolean>;
  addAgentCost(agent: string, usd: number): Promise<void>;
  /** Spend so far this month and the creator's limit. */
  budget(): Promise<{ spentUsd: number; limitUsd: number; alertAt: number }>;
  glossary(): Promise<Record<string, Record<string, { term: string; definition: string }>>>;
  audience(id: string): Promise<unknown>;
}

export type ModelClient = Parameters<typeof runStructured>[0];

// ---------- cost ----------

const models = JSON.parse(readFileSync(path.join(ROOT, "platform/config/models.json"), "utf8")) as { pricing: Record<string, { input: number; output: number; cacheRead: number }> };
export function costOf(model: string, u: RunResult["usage"]): number {
  const p = models.pricing[model];
  if (!p) return 0;
  return (u.input * p.input + u.output * p.output + u.cacheRead * p.cacheRead + u.cacheWrite * p.input * 2) / 1_000_000;
}

// ---------- prompts for steps whose contract is the lesson itself ----------

const lessonSchema = () => JSON.parse(readFileSync(path.join(ROOT, "schemas/lesson.schema.json"), "utf8"));
const catalogue = () => contracts.map((c) => ({ type: c.type, versions: c.versions, act: c.act, configSchema: c.configSchema }));

/** The Learning Experience Designer writing the lesson document itself. Its contract is the schema plus the validation service. */
export function composePrompt(kit: AgentKit): string {
  return [
    systemPrompt(kit),
    "## This step: write the lesson document",
    "Return only a lesson document (JSON) that matches the lesson schema below, uses only the components in the catalogue with configs matching their contracts, references every string by key, and includes every key in strings.en. Leave strings.hi and strings.te empty objects and localeStatus { en: \"draft\", hi: \"missing\", te: \"missing\" }. status is \"draft\". The validation service runs on your output; any error is sent back to you to fix.",
    `## Lesson schema\n\n${JSON.stringify(lessonSchema())}`,
    `## Component catalogue\n\n${JSON.stringify(catalogue())}`,
  ].join("\n\n");
}

// ---------- the pipeline ----------

export interface Deps {
  store: PipelineStore;
  client: ModelClient;
  /** Override agent kits (tests). */
  kit?: (id: string) => AgentKit;
}

const stepRecord = (stage: Stage, agent: string, model: string, r: RunResult, note?: string): StepRecord => ({ stage, agent, attempts: r.attempts, violations: r.violations, costUsd: costOf(model, r.usage), usage: r.usage, output: r.output, note, at: new Date().toISOString() });
const last = <T>(run: Run, stage: Stage) => run.steps.filter((s) => s.stage === stage).at(-1)?.output as T | undefined;
const next = (s: Stage): Stage => STAGES[STAGES.indexOf(s) + 1] ?? "done";

/** Performs the run's next step. Returns the updated run. */
export async function advance(run: Run, deps: Deps): Promise<Run> {
  const { store } = deps;
  const kitOf = deps.kit ?? loadAgent;
  if (run.status === "done" || run.status === "waiting-for-creator" || run.status === "failed") return run;

  // Budget: pause non-urgent work at the alert level, all work at the limit (docs/09, cost control).
  const b = await store.budget();
  if (b.limitUsd > 0 && (b.spentUsd >= b.limitUsd || (!run.urgent && b.spentUsd >= b.limitUsd * b.alertAt))) {
    if (run.status !== "paused") {
      run.status = "paused";
      await store.saveRun(run, null);
      await store.createDecision({ title: "Agent budget reached", kind: "budget", summary: `This month's agent spend is $${b.spentUsd.toFixed(2)} of $${b.limitUsd.toFixed(2)}. The pipeline paused "${run.request.slice(0, 80)}". Raise the limit or mark the run urgent to continue.`, target: `pipeline-runs/${run.id}` }, "editor-in-chief");
    }
    return run;
  }
  run.status = "running";

  const call = async (stage: Stage, agentId: string, system: string, schema: Record<string, unknown> | null, input: unknown, enforce: (o: unknown) => Violation[], note?: string) => {
    if (!(await store.agentEnabled(agentId))) throw new AgentOff(agentId);
    await store.saveRun({ ...run, stage }, agentId);
    const kit = kitOf(agentId);
    const r = await runStructured(deps.client, kit.model, system, schema, input, enforce);
    const rec = stepRecord(stage, agentId, kit.model, r, note);
    run.steps.push(rec);
    run.costUsd += rec.costUsd;
    await store.addAgentCost(agentId, rec.costUsd);
    await store.logEvent(`pipeline.${stage}`, agentId, `pipeline-runs/${run.id}`, { attempts: r.attempts, violations: r.violations.length, costUsd: rec.costUsd });
    return r;
  };
  const maker = (stage: Stage, agentId: string, task: unknown) => {
    const kit = kitOf(agentId);
    const r = kit.rubric as MakerRubric;
    return call(stage, agentId, systemPrompt(kit), r.artifactSchema as Record<string, unknown>, task, (o) => enforceArtifact(o, r, task));
  };
  const reviewer = (stage: Stage, agentId: string, input: unknown) => {
    const kit = kitOf(agentId);
    const r = kit.rubric as ReviewerRubric;
    return call(stage, agentId, systemPrompt(kit), reviewerOutputSchema(r) as unknown as Record<string, unknown>, input, (o) => enforceReviewer(o, r));
  };
  /** The lesson document is held to the validation service in composeValidated; here only its basic shape is checked. */
  const compose = (stage: Stage, input: unknown) =>
    call(stage, "learning-experience-designer", composePrompt(kitOf("learning-experience-designer")), null, input, (o) =>
      o && typeof o === "object" && typeof (o as { id?: unknown }).id === "string" && Array.isArray((o as { stages?: unknown }).stages) ? [] : [{ rule: "schema", detail: "Return one lesson document: an object with id, meta, stages, checks, strings and localeStatus." }],
    );

  try {
    const glossary = await store.glossary();
    const audience = await store.audience("school-13-17");
    const lesson = run.lessonId ? await store.getLesson(run.lessonId) : null;

    switch (run.stage) {
      case "plan": {
        await store.logEvent("pipeline.plan", "editor-in-chief", `pipeline-runs/${run.id}`, { stages: STAGES });
        run.stage = next(run.stage);
        break;
      }
      case "draft": {
        await maker("draft", "curriculum-instructional-designer", { task: run.request, existingLesson: lesson, audience, existingGlossary: glossary.en ?? {}, availableComponents: contracts.map((c) => c.type) });
        run.stage = next(run.stage);
        break;
      }
      case "analogies": {
        const draft = last<{ title?: string; glossary?: { term: string; definition: string }[] }>(run, "draft");
        await maker("analogies", "analogy-specialist", { task: `Design analogies for the hardest concept in this lesson: ${draft?.title ?? run.request}`, concept: draft?.glossary?.[0] ?? run.request, lessonDraft: draft, audience, locales: ["en", "hi", "te"] });
        run.stage = next(run.stage);
        break;
      }
      case "compose": {
        const input = { request: run.request, lessonId: run.lessonId ?? undefined, instructionalDraft: last(run, "draft"), analogies: last(run, "analogies"), existingLesson: lesson, glossary: glossary.en ?? {}, audience };
        const doc = await composeValidated("compose", input);
        run.lessonId = doc.id;
        run.stage = next(run.stage);
        break;
      }
      case "localise": {
        if (!lesson) throw new Error("no lesson to localise");
        // Only what is missing: everything the first time, then just the strings a revision changed.
        const todo = Object.fromEntries(Object.entries(lesson.strings.en ?? {}).filter(([k]) => !lesson.strings.hi?.[k] || !lesson.strings.te?.[k]));
        const afterRevision = run.steps.some((s) => s.stage === "revise");
        if (Object.keys(todo).length === 0) {
          run.stage = afterRevision ? "re-review" : "review";
          break;
        }
        const task = { task: "Translate these English strings into Hindi (hi) and Telugu (te) for the school-13-17 audience.", strings: todo, context: lesson.meta, glossary: { hi: glossary.hi ?? {}, te: glossary.te ?? {} }, audience };
        const r = await maker("localise", "localisation-specialist", task);
        if (r.violations.length === 0) {
          const out = r.output as { strings: { key: string; locale: "hi" | "te"; text: string }[] };
          const doc = structuredClone(lesson);
          for (const s of out.strings) (doc.strings[s.locale] ??= {})[s.key] = s.text;
          doc.localeStatus = { ...doc.localeStatus, hi: "draft", te: "draft" };
          await store.saveLessonDraft(doc, "localisation-specialist", afterRevision ? "Hindi and Telugu for revised strings" : "Hindi and Telugu drafts");
        }
        run.stage = afterRevision ? "re-review" : "review";
        break;
      }
      case "review":
      case "re-review": {
        if (!lesson) throw new Error("no lesson to review");
        const input = { task: "Review this lesson draft for the school-13-17 audience in en, hi and te.", lesson, glossary, audience };
        const [asr, panel] = await Promise.all([reviewer(run.stage, "accuracy-safety-reviewer", input), reviewer(run.stage, "novice-learner-panel", input)]);
        const flags: Flag[] = [];
        for (const [who, r] of [["accuracy-safety-reviewer", asr], ["novice-learner-panel", panel]] as const) for (const f of (r.output as ReviewerOutput | null)?.flags ?? []) flags.push({ ...f, reviewer: who });
        if (run.stage === "re-review") run.flags.resolved.push(...run.flags.open.filter((f) => !flags.some((g) => g.stringKey === f.stringKey && g.check === f.check)));
        run.flags.open = flags.filter((f) => f.severity === "blocking");
        // After a revision, skip straight to resolution; after the first review, revise if anything blocks.
        run.stage = run.stage === "review" ? (run.flags.open.length ? "revise" : "teacher-guide") : run.flags.open.length ? "resolve" : "teacher-guide";
        break;
      }
      case "revise": {
        if (!lesson) throw new Error("no lesson to revise");
        await composeValidated("revise", { request: run.request, lessonId: lesson.id, existingLesson: { ...lesson, strings: { en: lesson.strings.en } }, flagsToResolve: run.flags.open, rule: "Fix every flag in the English text and the blocks. Keep the lesson id. Do not invent changes beyond the flags. Safety and accuracy flags are never overruled.", glossary: glossary.en ?? {}, audience }, lesson);
        // Revised English strings need new translations before the re-review.
        run.stage = "localise";
        break;
      }
      case "resolve": {
        const conflicts = run.flags.open.map((f, i) => ({
          id: `c${i + 1}`,
          context: `${f.locale}:${f.stringKey} in lesson ${run.lessonId}`,
          a: { agent: f.reviewer, position: `${f.problem} Fix: ${f.fix}` },
          b: { agent: "learning-experience-designer", position: "The flag remained after one revision." },
        }));
        const task = { task: "Resolve each conflict, then write the creator summary. side-a is position a, side-b is position b.", conflicts };
        const r = await maker("resolve", "editor-in-chief", task);
        const out = r.output as { resolutions?: { conflictId: string; decision: string; resolution: string; reason: string; options?: string[] }[] } | null;
        for (const res of out?.resolutions ?? []) {
          if (res.decision !== "escalate") continue;
          const c = conflicts.find((x) => x.id === res.conflictId);
          await store.createDecision({ title: `Unresolved flag: ${c?.context ?? res.conflictId}`, kind: "conflict", summary: res.resolution, positions: c ? [c.a, c.b] : undefined, options: res.options, target: run.lessonId ? `lessons/${run.lessonId}` : undefined, dissent: c?.a.position }, "editor-in-chief");
        }
        run.stage = next(run.stage);
        break;
      }
      case "teacher-guide": {
        if (!lesson) throw new Error("no lesson for a teacher guide");
        const r = await maker("teacher-guide", "educator-enablement", { task: "Write the teacher guide for this lesson.", lesson: { ...lesson, strings: { en: lesson.strings.en } }, audience });
        if (r.violations.length === 0) await store.saveTeacherGuide(lesson.id, "en", r.output, "educator-enablement");
        run.stage = next(run.stage);
        break;
      }
      case "creator-preview": {
        if (!lesson) throw new Error("no lesson to preview");
        const report = await store.validate(lesson);
        const links = await store.previewLinks(lesson.id);
        const failed = run.steps.filter((s) => s.violations.length);
        const summary = [
          `Request: ${run.request}`,
          `Validation: ${report.passed ? "passes" : `${report.errors} errors`}, ${report.warnings} warnings.`,
          `Reviewer flags resolved: ${run.flags.resolved.length}; still open: ${run.flags.open.length}${run.flags.open.length ? " (see the conflict decisions)" : ""}.`,
          failed.length ? `Steps that still broke their rubric: ${failed.map((s) => `${s.stage} (${s.agent})`).join(", ")}.` : "Every step met its rubric.",
          "Hindi and Telugu are drafts until native speakers review them.",
          `Cost: $${run.costUsd.toFixed(2)}.`,
          `Preview (English): ${links.en?.personal ?? ""}`,
        ].join("\n");
        await store.createDecision({ title: `Publish "${lesson.strings.en?.[lesson.meta.titleKey] ?? lesson.id}"?`, kind: "publish", summary, target: `lessons/${lesson.id}` }, "editor-in-chief");
        run.stage = "done";
        run.status = "waiting-for-creator";
        await store.saveRun(run, null);
        return run;
      }
      case "done":
        run.status = "done";
        break;
    }
    await store.saveRun(run, null);
    return run;
  } catch (e) {
    if (e instanceof AgentOff) {
      run.status = "paused";
      await store.logEvent("pipeline.paused", e.agent, `pipeline-runs/${run.id}`, { reason: "agent switched off" });
    } else {
      run.status = "failed";
      run.steps.push({ stage: run.stage, agent: "orchestrator", attempts: 0, violations: [{ rule: "error", detail: (e as Error).message }], costUsd: 0, usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, at: new Date().toISOString() });
      await store.logEvent("pipeline.failed", "editor-in-chief", `pipeline-runs/${run.id}`, { error: (e as Error).message });
    }
    await store.saveRun(run, null);
    return run;
  }

  /** Writes the lesson, then holds it to the validation service: errors go back to the agent once. */
  async function composeValidated(stage: Stage, input: Record<string, unknown>, previous?: Lesson): Promise<Lesson> {
    let r = await compose(stage, input);
    let report = await store.validate(r.output);
    if (!report.passed) {
      const violations = report.findings.filter((f) => f.severity === "error").map((f) => ({ rule: f.check, detail: `${f.path}: ${f.message}` }));
      r = await compose(stage, { ...input, previousAttempt: r.output, validationErrors: violations });
      report = await store.validate(r.output);
      run.steps.at(-1)!.violations = report.findings.filter((f) => f.severity === "error").map((f) => ({ rule: f.check, detail: `${f.path}: ${f.message}` }));
    }
    const doc = r.output as Lesson;
    if (!doc || typeof doc !== "object" || !doc.id) throw new Error(`${stage}: the agent did not return a lesson document`);
    if (previous) {
      // The designer writes English only. Keep each translation whose English did not change; drop the rest for re-translation.
      for (const locale of Object.keys(previous.strings).filter((l) => l !== "en")) {
        doc.strings[locale] = Object.fromEntries(Object.entries(previous.strings[locale] ?? {}).filter(([k]) => doc.strings.en?.[k] !== undefined && doc.strings.en[k] === previous.strings.en?.[k]));
      }
      doc.localeStatus = { ...previous.localeStatus, en: doc.localeStatus?.en ?? "draft" };
    }
    await store.saveLessonDraft({ ...doc, status: "draft" }, "learning-experience-designer", stage === "revise" ? "revision for reviewer flags" : "first draft");
    return doc;
  }
}

class AgentOff extends Error {
  constructor(readonly agent: string) {
    super(`${agent} is switched off`);
  }
}

export function newRun(id: string | number, request: string, lessonId?: string | null, urgent = false): Run {
  return { id, request, lessonId: lessonId ?? null, stage: "plan", status: "queued", costUsd: 0, steps: [], flags: { open: [], resolved: [] }, urgent };
}
