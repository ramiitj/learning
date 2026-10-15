/**
 * Test helpers: a stand-in for the Claude API that answers as each agent
 * from its recorded benchmark output, so the pipeline can be exercised end
 * to end without an API key.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, loadAgent, type ReviewerRubric } from "@lm/agents";
import type { Lesson } from "@lm/schema";
import type { ModelClient } from "./index";

const read = (p: string) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));
const lessonFixture = (): Lesson => read("content/lessons/every-primitive.json");

/** A clean review: every check run and passed, no flags. */
function cleanReview(agent: string) {
  const r = loadAgent(agent).rubric as ReviewerRubric;
  return { agent, checks: r.checks.map((c) => ({ check: c.id, status: "pass", note: "checked" })), flags: [], summary: { blocking: 0, advisory: 0, verdict: "ready-for-creator" }, ...(r.personas ? { personaVerdicts: r.personas.map((p) => ({ persona: p.id, wouldContinue: "yes", reason: "clear" })) } : {}) };
}

/** Rough "translation" that keeps every placeholder, tag and number, so the localisation checks pass. */
function fakeTranslate(text: string, word: string): string {
  return text.replace(/(<[^>]+>)|(\{[a-zA-Z_]+(?=[,}]))|\b(plural|select|one|other|few|many|zero|two)\b|([A-Za-z][A-Za-z'’]*)/g, (m, tag, arg, kw, w) => (tag || arg || kw ? m : w ? word : m));
}

export interface Script {
  firstComposeBroken?: boolean;
  reviewFlagsTwice?: boolean;
}

/** A stand-in for the Claude API: answers as each agent from its recorded benchmark output. */
export function fakeClient(script: Script, calls: string[]): ModelClient {
  let composes = 0;
  let reviews = 0;
  const answer = (system: string, input: Record<string, unknown>): unknown => {
    const agent = /You are the "([a-z-]+)" agent/.exec(system)?.[1] ?? "?";
    const composing = system.includes("## This step: write the lesson document");
    calls.push(composing ? "compose" : agent);
    if (composing) {
      composes++;
      const l = lessonFixture();
      if (script.firstComposeBroken && composes === 1) l.stages = l.stages.filter((s) => s.stage !== "break-it");
      // A revision rewrites one English string, as a designer fixing a flag would.
      if (input.flagsToResolve) l.strings.en!["knob.success"] = "Score 10: on the threshold, so it goes to junk.";
      // The designer writes English only.
      if (composes > 0) l.strings = { en: l.strings.en! };
      return l;
    }
    switch (agent) {
      case "curriculum-instructional-designer":
        return read("benchmarks/curriculum-instructional-designer/runs/data-decides.artifact.json");
      case "analogy-specialist":
        return read("benchmarks/analogy-specialist/runs/weights.artifact.json");
      case "localisation-specialist": {
        const strings = input.strings as Record<string, string>;
        return {
          agent,
          strings: Object.entries(strings).flatMap(([key, text]) => [
            { key, locale: "hi", text: fakeTranslate(text, "अनुवाद"), confidence: "high", note: "" },
            { key, locale: "te", text: fakeTranslate(text, "అనువాదం"), confidence: "high", note: "" },
          ]),
          terminology: [],
          notesForReviewers: [],
        };
      }
      case "accuracy-safety-reviewer":
      case "novice-learner-panel": {
        reviews++;
        const flagged = reviews <= 2 || (script.reviewFlagsTwice && reviews <= 4);
        if (!flagged) return cleanReview(agent);
        return agent === "accuracy-safety-reviewer" ? read("benchmarks/accuracy-safety-reviewer/runs/clean.rubric.json") : cleanReview(agent);
      }
      case "educator-enablement":
        return read("benchmarks/educator-enablement/runs/junk-filter-guide.artifact.json");
      case "editor-in-chief": {
        const conflicts = (input.conflicts as { id: string }[]) ?? [];
        return {
          agent,
          resolutions: conflicts.map((c, i) => ({ conflictId: c.id, positions: [], decision: i === 0 ? "escalate" : "side-a", resolution: "r", reason: "x", options: i === 0 ? ["Keep", "Change"] : [] })),
          creatorSummary: { made: "m", flagsAndResolutions: "f", forYourDecision: conflicts.length ? ["c1"] : [], weaknesses: ["w"] },
        };
      }
    }
    throw new Error(`no fake answer for ${agent}`);
  };
  return {
    messages: {
      stream: (params: { system: { text: string }[]; messages: { content: string }[] }) => ({
        finalMessage: async () => ({
          content: [{ type: "text", text: JSON.stringify(answer(params.system[0]!.text, JSON.parse(params.messages[0]!.content))) }],
          usage: { input_tokens: 10_000, output_tokens: 2_000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
          stop_reason: "end_turn",
        }),
      }),
    },
  } as unknown as ModelClient;
}

