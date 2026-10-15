import Ajv2020 from "ajv/dist/2020.js";
import type { MakerRubric, ReviewerRubric } from "./rubric";
import { judgeOutputSchema, reviewerOutputSchema } from "./contract";

const ajv = new Ajv2020({ allErrors: true, strict: false });

export interface Violation {
  rule: string;
  detail: string;
}

export interface ReviewerFlag {
  id: string;
  persona?: string;
  check: string;
  severity: "blocking" | "advisory";
  locale: string;
  stringKey: string;
  blockId: string;
  quote: string;
  problem: string;
  why: string;
  fix: string;
}

export interface ReviewerOutput {
  agent: string;
  checks: { check: string; status: "pass" | "flagged" | "not-applicable"; note: string }[];
  flags: ReviewerFlag[];
  summary: { blocking: number; advisory: number; verdict: string };
  personaVerdicts?: { persona: string; wouldContinue: string; reason: string }[];
}

/**
 * Enforces a reviewer's rubric on its output. Output with any violation is
 * rejected by the runner and the agent is asked to redo it: this is what
 * makes the rubric binding rather than advice.
 */
export function enforceReviewer(output: unknown, r: ReviewerRubric): Violation[] {
  const v: Violation[] = [];
  const validate = ajv.compile(reviewerOutputSchema(r));
  if (!validate(output)) {
    for (const e of validate.errors ?? []) v.push({ rule: "schema", detail: `${e.instancePath || "/"} ${e.message}` });
    return v;
  }
  const o = output as unknown as ReviewerOutput;

  // Every check run and reported exactly once.
  for (const c of r.checks) {
    const n = o.checks.filter((x) => x.check === c.id).length;
    if (n === 0) v.push({ rule: "all-checks-reported", detail: `check "${c.id}" was not reported` });
    if (n > 1) v.push({ rule: "all-checks-reported", detail: `check "${c.id}" reported ${n} times` });
  }
  // Every persona played and gave a verdict.
  for (const p of r.personas ?? []) {
    const n = (o.personaVerdicts ?? []).filter((x) => x.persona === p.id).length;
    if (n !== 1) v.push({ rule: "all-personas-played", detail: `persona "${p.id}" gave ${n} verdicts` });
  }
  // Status agrees with flags.
  for (const c of o.checks) {
    const flagged = o.flags.some((f) => f.check === c.check);
    if (c.status === "flagged" && !flagged) v.push({ rule: "status-matches-flags", detail: `"${c.check}" marked flagged but has no flag` });
    if (c.status !== "flagged" && flagged) v.push({ rule: "status-matches-flags", detail: `"${c.check}" has flags but is marked ${c.status}` });
  }
  // Severity follows the rubric.
  const byId = new Map(r.checks.map((c) => [c.id, c]));
  for (const f of o.flags) {
    const c = byId.get(f.check);
    if (c && c.defaultSeverity === "blocking" && f.severity === "advisory" && !c.advisoryWhen) {
      v.push({ rule: "calibrated", detail: `flag ${f.id} (${f.check}) is advisory but the rubric makes ${f.check} blocking` });
    }
  }
  // Report quality: located, quoted, explained, with a fix.
  for (const f of o.flags) {
    if (!f.stringKey.trim()) v.push({ rule: "located", detail: `flag ${f.id} has no location` });
    if (f.quote.trim().length < 2) v.push({ rule: "quoted", detail: `flag ${f.id} quotes nothing` });
    if (f.why.trim().length < 10) v.push({ rule: "explained", detail: `flag ${f.id} does not explain why` });
    if (f.fix.trim().length < 5) v.push({ rule: "fix", detail: `flag ${f.id} suggests no fix` });
  }
  // Summary is consistent.
  const blocking = o.flags.filter((f) => f.severity === "blocking").length;
  const advisory = o.flags.length - blocking;
  if (o.summary.blocking !== blocking || o.summary.advisory !== advisory) v.push({ rule: "summary", detail: `summary says ${o.summary.blocking}/${o.summary.advisory}, flags are ${blocking}/${advisory}` });
  if ((blocking > 0) !== (o.summary.verdict === "needs-revision")) v.push({ rule: "summary", detail: `verdict "${o.summary.verdict}" with ${blocking} blocking flags` });
  return v;
}

export interface JudgeOutput {
  agent: string;
  scores: { criterion: string; score: number; evidence: string; improve: string }[];
  overall: string;
}

export function enforceJudge(output: unknown, r: MakerRubric): Violation[] {
  const v: Violation[] = [];
  const validate = ajv.compile(judgeOutputSchema(r));
  if (!validate(output)) {
    for (const e of validate.errors ?? []) v.push({ rule: "schema", detail: `${e.instancePath || "/"} ${e.message}` });
    return v;
  }
  const o = output as JudgeOutput;
  for (const c of r.criteria) {
    const n = o.scores.filter((s) => s.criterion === c.id).length;
    if (n !== 1) v.push({ rule: "all-criteria-scored", detail: `criterion "${c.id}" scored ${n} times` });
  }
  for (const s of o.scores) if (s.evidence.trim().length < 10) v.push({ rule: "evidence", detail: `${s.criterion} has no evidence` });
  return v;
}

/** Validates a maker's artifact against its rubric's artifact schema. */
export function enforceArtifact(output: unknown, r: MakerRubric): Violation[] {
  const validate = ajv.compile(r.artifactSchema);
  return validate(output) ? [] : (validate.errors ?? []).map((e) => ({ rule: "schema", detail: `${e.instancePath || "/"} ${e.message}` }));
}
