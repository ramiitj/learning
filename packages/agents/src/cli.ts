/**
 * Agent quality tool.
 *   tsx src/cli.ts prompt <agent> [--judge] [--out file]   assemble the exact system prompt
 *   tsx src/cli.ts check <agent> <case> <output.json> [--label rubric|baseline]   enforce the rubric and score against the benchmark
 *   tsx src/cli.ts bench <agent>                            run every benchmark case through the API (needs credentials)
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { enforceReviewer, type ReviewerOutput, type Violation } from "./enforce";
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
      check(agent, c.replace(".json", ""), out);
    }
  } else throw new Error(`unknown command ${cmd}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
