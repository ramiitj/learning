// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { enforceArtifact, enforceJudge, enforceReviewer, judgeVerdict, type JudgeOutput, type ReviewerOutput } from "./enforce";
import { scoreDecisions, type ExpectedDecision } from "./artifact-checks";
import { systemPrompt } from "./prompt";
import { ROOT, loadAgent, type MakerRubric, type ReviewerRubric } from "./rubric";
import { scoreReviewer, type Adjudication, type Seed } from "./score";

const json = (p: string) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));
const rubricIds = readdirSync(path.join(ROOT, "platform/rubrics")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));

describe("rubrics", () => {
  it.each(rubricIds)("%s loads with its profile, references and model", (id) => {
    const kit = loadAgent(id);
    expect(kit.model).toMatch(/^claude-/);
    expect(kit.references.length).toBe(kit.rubric.references.length);
  });

  it.each(rubricIds)("%s has a byte-stable system prompt (so it can be cached)", (id) => {
    expect(systemPrompt(loadAgent(id))).toBe(systemPrompt(loadAgent(id)));
  });
});

const asr = loadAgent("accuracy-safety-reviewer").rubric as ReviewerRubric;

function cleanOutput(r: ReviewerRubric): ReviewerOutput {
  return {
    agent: r.agent,
    checks: r.checks.map((c) => ({ check: c.id, status: "pass", note: "checked" })),
    flags: [],
    summary: { blocking: 0, advisory: 0, verdict: "ready-for-creator" },
  };
}

function withFlag(r: ReviewerRubric, check: string, severity: "blocking" | "advisory" = "blocking"): ReviewerOutput {
  const o = cleanOutput(r);
  o.checks.find((c) => c.check === check)!.status = "flagged";
  o.flags.push({ id: "f1", check, severity, locale: "en", stringKey: "b1.text", blockId: "b1", quote: "the quoted words", problem: "a problem", why: "because it misleads learners", fix: "say this instead" });
  o.summary = { blocking: severity === "blocking" ? 1 : 0, advisory: severity === "advisory" ? 1 : 0, verdict: severity === "blocking" ? "needs-revision" : "ready-for-creator" };
  return o;
}

const rules = (o: unknown) => enforceReviewer(o, asr).map((v) => v.rule);

describe("enforceReviewer", () => {
  it("accepts a complete, consistent report", () => {
    expect(rules(cleanOutput(asr))).toEqual([]);
    expect(rules(withFlag(asr, "factual-accuracy"))).toEqual([]);
  });

  it("rejects a report that skips a check", () => {
    const o = cleanOutput(asr);
    o.checks.pop();
    expect(rules(o)).toContain("all-checks-reported");
  });

  it("rejects a check marked pass that has flags", () => {
    const o = withFlag(asr, "privacy");
    o.checks.find((c) => c.check === "privacy")!.status = "pass";
    expect(rules(o)).toContain("status-matches-flags");
  });

  it("rejects a blocking problem downgraded to advisory", () => {
    expect(rules(withFlag(asr, "factual-accuracy", "advisory"))).toContain("calibrated");
  });

  it("rejects a flag with no fix, and a summary that does not add up", () => {
    const o = withFlag(asr, "privacy");
    o.flags[0]!.fix = "";
    o.summary.blocking = 0;
    expect(rules(o)).toEqual(expect.arrayContaining(["fix", "summary"]));
  });

  it("rejects an invented category", () => {
    const o = withFlag(asr, "privacy");
    o.flags[0]!.check = "vibes";
    expect(rules(o)).toContain("schema");
  });

  it("requires every persona on the novice panel to give a verdict", () => {
    const panel = loadAgent("novice-learner-panel").rubric as ReviewerRubric;
    const o = { ...cleanOutput(panel), personaVerdicts: [] };
    expect(enforceReviewer(o, panel).map((v) => v.rule)).toContain("all-personas-played");
  });
});

describe("scoreReviewer", () => {
  const seed: Seed = { id: "s1", check: "factual-accuracy", alsoAccept: [], severity: "blocking", locale: "en", keys: ["b1.text"], block: "b1", note: "" };

  it("counts a flag at the seed's location as a catch", () => {
    const s = scoreReviewer(withFlag(asr, "factual-accuracy"), [seed]);
    expect(s.caught).toEqual(["s1"]);
    expect(s.precision).toBe(1);
  });

  it("counts a missed seed and an unjudged flag against the reviewer", () => {
    const o = withFlag(asr, "privacy");
    o.flags[0]!.stringKey = "b9.text";
    o.flags[0]!.blockId = "b9";
    const s = scoreReviewer(o, [seed]);
    expect(s.recall).toBe(0);
    expect(s.unadjudicated).toHaveLength(1);
    expect(s.precision).toBe(0);
  });

  it("credits a flag a person judged genuine", () => {
    const o = withFlag(asr, "privacy");
    const adj: Adjudication[] = [{ stringKey: "b1.text", check: "privacy", verdict: "genuine", note: "" }];
    expect(scoreReviewer(o, [], adj).precision).toBe(1);
  });
});

/**
 * Recorded runs are the evidence behind each agent's scorecard. A rubric
 * change that the recorded rubric-bound runs no longer satisfy, or that drops
 * their scores below the pass bar, fails here and needs fresh runs.
 */
describe("recorded benchmark runs meet the pass bar", () => {
  const agents = readdirSync(path.join(ROOT, "benchmarks")).filter((a) => existsSync(path.join(ROOT, "benchmarks", a, "runs")));
  const runs = agents.flatMap((a) =>
    readdirSync(path.join(ROOT, "benchmarks", a, "runs"))
      .filter((f) => f.endsWith(".rubric.json"))
      .map((f) => [a, f.replace(/\.rubric\.json$/, "")] as const),
  );

  it.each(runs)("%s · %s", (agent, caseName) => {
    const r = loadAgent(agent).rubric as ReviewerRubric;
    const output = json(`benchmarks/${agent}/runs/${caseName}.rubric.json`) as ReviewerOutput;
    expect(enforceReviewer(output, r)).toEqual([]);
    const seeds = (json(`benchmarks/${agent}/expected/${caseName}.json`) as { seeds: Seed[] }).seeds;
    const adjPath = `benchmarks/${agent}/adjudication.json`;
    const adj = existsSync(path.join(ROOT, adjPath)) ? (json(adjPath) as { verdicts: Adjudication[] }).verdicts : [];
    const s = scoreReviewer(output, seeds, adj);
    if (seeds.length) {
      expect(s.blockingRecall).toBeGreaterThanOrEqual(r.passBar.blockingRecall);
      expect(s.recall).toBeGreaterThanOrEqual(r.passBar.overallRecall);
    } else {
      // On a clean lesson, blocking flags must be real problems a person confirmed.
      const unconfirmed = [...s.noise, ...s.unadjudicated].filter((f) => f.severity === "blocking");
      expect(unconfirmed.length).toBeLessThanOrEqual(r.passBar.maxCleanBlockingFlags);
    }
    expect(s.precision).toBeGreaterThanOrEqual(r.passBar.precision);
  });
});

describe("recorded maker runs meet the pass bar", () => {
  const makers = readdirSync(path.join(ROOT, "benchmarks")).filter((a) => existsSync(path.join(ROOT, "benchmarks", a, "tasks")));
  const runs = makers.flatMap((a) =>
    readdirSync(path.join(ROOT, "benchmarks", a, "tasks"))
      .map((f) => f.replace(/\.json$/, ""))
      .filter((t) => existsSync(path.join(ROOT, "benchmarks", a, "runs", `${t}.artifact.json`)))
      .map((t) => [a, t] as const),
  );

  it.each(runs)("%s · %s", (agent, task) => {
    const r = loadAgent(agent).rubric as MakerRubric;
    const dir = `benchmarks/${agent}`;
    const artifact = json(`${dir}/runs/${task}.artifact.json`);
    expect(enforceArtifact(artifact, r, json(`${dir}/tasks/${task}.json`))).toEqual([]);
    if (existsSync(path.join(ROOT, dir, "expected", `${task}.json`))) {
      const d = scoreDecisions(artifact, (json(`${dir}/expected/${task}.json`) as { decisions: ExpectedDecision[] }).decisions);
      expect(d.escalationRecall).toBe(1);
      expect(d.accuracy).toBeGreaterThanOrEqual(0.9);
    }
    const judgePath = `${dir}/runs/${task}.judge.json`;
    if (!existsSync(path.join(ROOT, judgePath))) return;
    const judge = json(judgePath) as JudgeOutput;
    expect(enforceJudge(judge, r)).toEqual([]);
    expect(judgeVerdict(judge, r).pass).toBe(true);
    // The judge must have seen the planted defects: each targeted criterion fell to 2 or below.
    const degJudge = `${dir}/runs/${task}.degraded.judge.json`;
    if (!existsSync(path.join(ROOT, degJudge))) return;
    const defects = (json(`${dir}/calibration/${task}.degraded.json`) as { defects: { criterion: string }[] }).defects;
    const after = json(degJudge) as JudgeOutput;
    for (const d of defects) expect(after.scores.find((s) => s.criterion === d.criterion)!.score).toBeLessThanOrEqual(2);
  });
});
