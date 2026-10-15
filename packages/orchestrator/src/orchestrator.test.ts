// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "@lm/agents";
import type { Lesson } from "@lm/schema";
import { validate } from "@lm/validation";
import { repoContext } from "@lm/validation/repo";
import { advance, newRun, type PipelineStore, type Run } from "./index";
import { fakeClient } from "./testing";

const read = (p: string) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));
const ctx = repoContext(ROOT);

function memoryStore(opts: { spent?: number; limit?: number; off?: string[] } = {}) {
  const lessons = new Map<string, Lesson>();
  const saves: { agent: string; reason: string }[] = [];
  const decisions: { kind: string; title: string; agent: string }[] = [];
  const events: string[] = [];
  const guides: string[] = [];
  const store: PipelineStore = {
    saveRun: async () => undefined,
    getLesson: async (id) => structuredClone(lessons.get(id) ?? null),
    saveLessonDraft: async (doc, agent, reason) => {
      saves.push({ agent, reason });
      lessons.set(doc.id, structuredClone(doc));
      return validate(doc, ctx);
    },
    validate: async (doc) => validate(doc, ctx),
    saveTeacherGuide: async (id, locale) => void guides.push(`${id}:${locale}`),
    createDecision: async (d, agent) => (decisions.push({ kind: d.kind, title: d.title, agent }), decisions.length),
    previewLinks: async () => ({ en: { personal: "https://example/preview", classroom: "https://example/preview?c" } }),
    logEvent: async (action, agent) => void events.push(`${agent}:${action}`),
    agentEnabled: async (a) => !(opts.off ?? []).includes(a),
    addAgentCost: async () => undefined,
    budget: async () => ({ spentUsd: opts.spent ?? 0, limitUsd: opts.limit ?? 200, alertAt: 0.8 }),
    glossary: async () => ctx.glossary,
    audience: async () => read("platform/config/audiences.json").profiles[0],
  };
  return { store, lessons, saves, decisions, events, guides };
}

async function runToEnd(run: Run, deps: Parameters<typeof advance>[1], max = 30) {
  for (let i = 0; i < max && run.status !== "waiting-for-creator" && run.status !== "failed" && run.status !== "paused"; i++) run = await advance(run, deps);
  return run;
}

describe("orchestrator", () => {
  it("runs a request through every stage to the creator's preview, without publishing", async () => {
    const calls: string[] = [];
    const m = memoryStore();
    const run = await runToEnd(newRun(1, "A lesson on how a junk filter decides"), { store: m.store, client: fakeClient({ firstComposeBroken: true }, calls) });

    expect(run.status).toBe("waiting-for-creator");
    // Order follows docs/09; the first lesson failed validation and was sent back once.
    expect(calls).toEqual(["curriculum-instructional-designer", "analogy-specialist", "compose", "compose", "localisation-specialist", "accuracy-safety-reviewer", "novice-learner-panel", "compose", "localisation-specialist", "accuracy-safety-reviewer", "novice-learner-panel", "educator-enablement"]);
    // The revision kept every translation whose English did not change, and re-translated only the string it changed.
    const final = m.lessons.get("every-primitive")!;
    expect(final.strings.hi!["knob.success"]).toContain("अनुवाद");
    expect(Object.keys(final.strings.hi!).length).toBe(Object.keys(final.strings.en!).length);
    expect(m.lessons.get("every-primitive")!.localeStatus).toMatchObject({ hi: "draft", te: "draft" });
    expect(m.saves.map((s) => s.agent)).toEqual(["learning-experience-designer", "localisation-specialist", "learning-experience-designer", "localisation-specialist"]);
    expect(m.guides).toEqual(["every-primitive:en"]);
    // The creator gets one publish decision; nothing is published by the pipeline.
    expect(m.decisions).toEqual([{ kind: "publish", title: 'Publish "How does a junk filter decide?"?', agent: "editor-in-chief" }]);
    expect(run.flags.resolved.length).toBeGreaterThan(0);
    expect(run.costUsd).toBeGreaterThan(0);
    expect(m.events.some((e) => e.startsWith("localisation-specialist:pipeline.localise"))).toBe(true);
  });

  it("escalates flags that survive a revision to the creator as conflicts", async () => {
    const m = memoryStore();
    const run = await runToEnd(newRun(2, "x"), { store: m.store, client: fakeClient({ reviewFlagsTwice: true }, []) });
    expect(run.status).toBe("waiting-for-creator");
    expect(m.decisions.filter((d) => d.kind === "conflict")).toHaveLength(1);
    expect(m.decisions.at(-1)!.kind).toBe("publish");
  });

  it("pauses at the budget alert level and asks the creator", async () => {
    const m = memoryStore({ spent: 170, limit: 200 });
    const run = await runToEnd(newRun(3, "x"), { store: m.store, client: fakeClient({}, []) });
    expect(run.status).toBe("paused");
    expect(m.decisions).toEqual([expect.objectContaining({ kind: "budget" })]);
  });

  it("lets an urgent run continue past the alert level, but never past the limit", async () => {
    const calls: string[] = [];
    const urgent = { ...newRun(4, "x"), urgent: true };
    const ok = await advance(await advance(urgent, { store: memoryStore({ spent: 170, limit: 200 }).store, client: fakeClient({}, calls) }), { store: memoryStore({ spent: 170, limit: 200 }).store, client: fakeClient({}, calls) });
    expect(ok.status).toBe("running");
    const stopped = await advance({ ...newRun(5, "x"), urgent: true }, { store: memoryStore({ spent: 200, limit: 200 }).store, client: fakeClient({}, []) });
    expect(stopped.status).toBe("paused");
  });

  it("pauses when an agent it needs is switched off", async () => {
    const m = memoryStore({ off: ["analogy-specialist"] });
    const run = await runToEnd(newRun(6, "x"), { store: m.store, client: fakeClient({}, []) });
    expect(run.status).toBe("paused");
    expect(run.stage).toBe("analogies");
  });
});
