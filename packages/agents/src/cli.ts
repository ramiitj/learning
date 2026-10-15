/**
 * Agent quality tool.
 *   tsx src/cli.ts prompt <agent> [--judge] [--out file]   assemble the exact system prompt
 *   tsx src/cli.ts check <agent> <case> <output.json> [--label rubric|baseline]   enforce the rubric and score against the benchmark
 *   tsx src/cli.ts make-check <agent> <task>                check a maker's recorded artifact, judge scores and judge calibration
 *   tsx src/cli.ts artifact <agent> <file.json>             enforce a maker's rubric (schema and deterministic checks) on any artifact
 *   tsx src/cli.ts bench <agent>                            run every benchmark case through the API (needs credentials)
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { enforceArtifact, enforceJudge, enforceReviewer, judgeVerdict, type JudgeOutput, type ReviewerOutput, type Violation } from "./enforce";
import { runArtifactChecks, scoreDecisions, type ExpectedDecision } from "./artifact-checks";
import type { MakerRubric } from "./rubric";
import { judgePrompt, systemPrompt } from "./prompt";
import { ROOT, loadAgent, type ReviewerRubric } from "./rubric";
import { runReviewer } from "./run";
import { existsSync } from "node:fs";
import { scoreReviewer, type Adjudication, type ReviewerScore, type Seed } from "./score";

const [cmd, agent, ...rest] = process.argv.slice(2);
const flag = (name: string) => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
};
const bench = (a: string) => path.join(ROOT, "benchmarks", a);

function report(agentId: string, caseName: string, output: unknown, violations: Violation[], score: ReviewerScore | null, rubric: ReviewerRubric) {
  const lines = [`${agentId} · ${caseName}`];
  lines.push(violations.length ? `  RUBRIC VIOLATIONS (${violations.length}) — output would be rejected:` : "  Rubric: followed (every check reported, severities calibrated, every flag located, quoted, explained, with a fix)");
  for (const v of violations.slice(0, 20)) lines.push(`    - ${v.rule}: ${v.detail}`);
  if (score) {
    const pct = (x: number) => `${Math.round(x * 100)}%`;
    if (score.seeds) lines.push(`  Caught ${score.caught.length}/${score.seeds} planted problems (recall ${pct(score.recall)}, blocking recall ${pct(score.blockingRecall)})`);
    lines.push(`  Flags ${score.flags}: ${score.matchedFlags} on planted problems, ${score.genuine.length} genuine (adjudicated), ${score.noise.length} noise, ${score.unadjudicated.length} not yet judged — precision ${pct(score.precision)}`);
    for (const m of score.missed) lines.push(`    MISSED ${m.id} [${m.check}, ${m.severity}] ${m.keys[0]} — ${m.note}`);
    for (const u of score.noise) lines.push(`    NOISE  ${u.id} [${u.check}, ${u.severity}] ${u.locale}:${u.stringKey} — ${u.problem.slice(0, 100)}`);
    for (const u of score.unadjudicated) lines.push(`    JUDGE? ${u.id} [${u.check}, ${u.severity}] ${u.locale}:${u.stringKey} — ${u.problem.slice(0, 100)}`);
  } else {
    const o = output as ReviewerOutput;
    const blocking = o.flags?.filter((f) => f.severity === "blocking") ?? [];
    lines.push(`  Clean control: ${blocking.length} blocking, ${(o.flags?.length ?? 0) - blocking.length} advisory flags (pass bar: at most ${rubric.passBar.maxCleanBlockingFlags} blocking)`);
    for (const f of o.flags ?? []) lines.push(`    ${f.severity.toUpperCase()} ${f.id} [${f.check}] ${f.locale}:${f.stringKey} — ${f.problem.slice(0, 110)}`);
  }
  return lines.join("\n");
}

function check(agentId: string, caseName: string, outputFile: string, label = "rubric") {
  const kit = loadAgent(agentId);
  if (kit.rubric.kind !== "reviewer") throw new Error("check currently scores reviewers; makers are scored by the judge");
  const output = JSON.parse(readFileSync(outputFile, "utf8"));
  const violations = enforceReviewer(output, kit.rubric);
  const seeds = (JSON.parse(readFileSync(path.join(bench(agentId), "expected", `${caseName}.json`), "utf8")) as { seeds: Seed[] }).seeds;
  // Score whatever flags exist even if the output broke the rubric: the violations are reported separately.
  const adjPath = path.join(bench(agentId), "adjudication.json");
  const adjudications = existsSync(adjPath) ? (JSON.parse(readFileSync(adjPath, "utf8")) as { verdicts: Adjudication[] }).verdicts : [];
  const score = Array.isArray(output.flags) ? scoreReviewer(output, seeds, adjudications) : null;
  const text = report(agentId, caseName, output, violations, score, kit.rubric);
  const dir = path.join(bench(agentId), "results");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${caseName}.${label}.scorecard.json`), JSON.stringify({ agent: agentId, case: caseName, label, violations, score }, null, 2));
  console.log(text);
  return { violations, score };
}

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

/**
 * Checks a maker's recorded run on one benchmark task:
 *   runs/<task>.artifact.json        the maker's artifact (schema + deterministic checks)
 *   runs/<task>.judge.json           an independent judge's scores (pass bar)
 *   calibration/<task>.degraded.json the artifact with planted defects, each aimed at one criterion
 *   runs/<task>.degraded.judge.json  the judge's scores on it: each targeted criterion must drop
 *   expected/<task>.json             (editor-in-chief) the correct decisions
 */
export function makeCheck(agentId: string, task: string) {
  const kit = loadAgent(agentId);
  if (kit.rubric.kind !== "maker") throw new Error(`${agentId} is not a maker`);
  const r = kit.rubric as MakerRubric;
  const dir = bench(agentId);
  const input = readJson(path.join(dir, "tasks", `${task}.json`));
  const artifact = readJson(path.join(dir, "runs", `${task}.artifact.json`));
  const violations = enforceArtifact(artifact, r, input);
  const advisories = violations.some((v) => v.rule === "schema") ? [] : runArtifactChecks(agentId, artifact, input).filter((f) => f.severity === "advisory");
  const lines = [`${agentId} · ${task}`];
  lines.push(violations.length ? `  ARTIFACT REJECTED (${violations.length}):` : `  Artifact: schema and all ${r.artifactChecks.length} automatic checks passed${advisories.length ? ` (${advisories.length} advisory notes)` : ""}`);
  for (const v of violations.slice(0, 20)) lines.push(`    - ${v.rule}: ${v.detail}`);
  for (const f of advisories.slice(0, 10)) lines.push(`    note ${f.check}: ${f.where}: ${f.detail}`);
  const card: Record<string, unknown> = { agent: agentId, task, violations, advisories };

  const expectedPath = path.join(dir, "expected", `${task}.json`);
  if (existsSync(expectedPath)) {
    const d = scoreDecisions(artifact, (readJson(expectedPath) as { decisions: ExpectedDecision[] }).decisions);
    card.decisions = d;
    lines.push(`  Decisions: ${Math.round(d.accuracy * 100)}% correct; escalated ${Math.round(d.escalationRecall * 100)}% of what must go to the creator; ${d.wrongEscalations} unnecessary escalations`);
    for (const x of d.results.filter((x) => !x.correct)) lines.push(`    WRONG ${x.conflictId}: expected ${x.expected}, got ${x.got || "nothing"}`);
  }

  const judgePath = path.join(dir, "runs", `${task}.judge.json`);
  if (existsSync(judgePath)) {
    const j = readJson(judgePath) as JudgeOutput;
    const jv = enforceJudge(j, r);
    const v = judgeVerdict(j, r);
    card.judge = { violations: jv, ...v, scores: Object.fromEntries(j.scores.map((s) => [s.criterion, s.score])) };
    lines.push(`  Judge: ${jv.length ? `INVALID (${jv.map((x) => x.detail).join("; ")})` : `mean ${v.mean} / 4, lowest blocking ${v.minBlocking} — ${v.pass ? "PASSES" : "BELOW"} the bar (${r.passBar.meanScore}, blocking ≥ ${r.passBar.minBlockingCriterion})`}`);
    lines.push(`    ${j.scores.map((s) => `${s.criterion} ${s.score}`).join(" · ")}`);

    const degPath = path.join(dir, "calibration", `${task}.degraded.json`);
    const degJudgePath = path.join(dir, "runs", `${task}.degraded.judge.json`);
    if (existsSync(degPath) && existsSync(degJudgePath)) {
      const defects = (readJson(degPath) as { defects: { criterion: string; description: string }[] }).defects;
      const dj = readJson(degJudgePath) as JudgeOutput;
      const before = (c: string) => j.scores.find((s) => s.criterion === c)?.score ?? 0;
      const after = (c: string) => dj.scores.find((s) => s.criterion === c)?.score ?? 0;
      const targeted = [...new Set(defects.map((d) => d.criterion))];
      const detected = targeted.filter((c) => after(c) < before(c) && after(c) <= 2);
      const untouched = r.criteria.map((c) => c.id).filter((c) => !targeted.includes(c));
      const drift = untouched.filter((c) => Math.abs(after(c) - before(c)) > 1);
      card.calibration = { targeted, detected, drift, sensitivity: detected.length / (targeted.length || 1) };
      lines.push(`  Judge calibration: planted defects detected on ${detected.length}/${targeted.length} targeted criteria (score fell to 2 or below); ${drift.length} untargeted criteria moved by more than 1`);
      for (const c of targeted.filter((c) => !detected.includes(c))) lines.push(`    UNDETECTED ${c}: ${before(c)} → ${after(c)}`);
    }
  }
  mkdirSync(path.join(dir, "results"), { recursive: true });
  writeFileSync(path.join(dir, "results", `${task}.scorecard.json`), JSON.stringify(card, null, 2));
  console.log(lines.join("\n"));
  return card;
}

async function main() {
  if (!cmd || !agent) throw new Error("usage: prompt|check|bench <agent> ...");
  if (cmd === "prompt") {
    const kit = loadAgent(agent);
    const text = rest.includes("--judge") ? judgePrompt(kit) : systemPrompt(kit);
    const out = flag("--out");
    if (out) writeFileSync(out, text);
    else process.stdout.write(text);
    console.error(`${agent}: ${text.length} chars, model tier ${kit.tier} (${kit.model})`);
  } else if (cmd === "check") {
    const [caseName, outputFile] = rest;
    if (!caseName || !outputFile) throw new Error("usage: check <agent> <case> <output.json>");
    const { violations, score } = check(agent, caseName, outputFile, flag("--label"));
    process.exitCode = violations.length || (score && score.blockingRecall < 0.95) ? 1 : 0;
  } else if (cmd === "make-check") {
    const [task] = rest;
    if (!task) throw new Error("usage: make-check <agent> <task>");
    const card = makeCheck(agent, task);
    process.exitCode = (card.violations as unknown[]).length ? 1 : 0;
  } else if (cmd === "artifact") {
    const [file] = rest;
    if (!file) throw new Error("usage: artifact <agent> <file.json>");
    const rubric = loadAgent(agent).rubric as MakerRubric;
    const output = JSON.parse(readFileSync(file, "utf8"));
    const violations = enforceArtifact(output, rubric);
    const advisory = runArtifactChecks(agent, output).filter((f) => f.severity !== "blocking");
    console.log(violations.length ? `${agent}: ${violations.length} rubric violations` : `${agent}: rubric followed`);
    for (const v of violations) console.log(`  ✗ ${v.rule}: ${v.detail}`);
    for (const f of advisory) console.log(`  · ${f.check} (advisory) ${f.where}: ${f.detail}`);
    process.exitCode = violations.length ? 1 : 0;
  } else if (cmd === "bench") {
    const kit = loadAgent(agent);
    const cases = readdirSync(path.join(bench(agent), "cases")).filter((f) => f.endsWith(".json"));
    for (const c of cases) {
      const input = JSON.parse(readFileSync(path.join(bench(agent), "cases", c), "utf8"));
      const res = await runReviewer(kit, input);
      const out = path.join(bench(agent), "results", c.replace(".json", ".output.json"));
      mkdirSync(path.dirname(out), { recursive: true });
      writeFileSync(out, JSON.stringify(res.output, null, 2));
      console.log(`usage: ${JSON.stringify(res.usage)}; attempts ${res.attempts}`);
      const { violations, score } = check(agent, c.replace(".json", ""), out);
      const bar = (kit.rubric as ReviewerRubric).passBar;
      const seeded = !!score?.seeds;
      if (violations.length || (score && (score.precision < bar.precision || (seeded && (score.blockingRecall < bar.blockingRecall || score.recall < bar.overallRecall))))) process.exitCode = 1;
    }
  } else throw new Error(`unknown command ${cmd}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
