/**
 * Validates every lesson and detour in /content against the lesson schema and
 * the registered component contracts. Runs in CI; the web build also refuses
 * to render a lesson that fails. Pedagogy checks (docs/04) arrive with the
 * validation service in Phase 3.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { contracts } from "@lm/primitives/contracts";
import { hasErrors, validateBlocks, validateLesson, type Issue } from "@lm/schema/validate";

const root = path.resolve(import.meta.dirname, "../content");
const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const glossaryTerms = new Set(Object.keys(read(path.join(root, "glossary/en.json"))));
let failed = false;

function report(name: string, issues: Issue[]) {
  const errs = hasErrors(issues);
  failed ||= errs;
  console.log(`${errs ? "✗" : "✓"} ${name}${issues.length ? "" : " — no issues"}`);
  for (const i of issues) console.log(`    [${i.severity}] ${i.check} ${i.path}: ${i.message}`);
}

for (const f of readdirSync(path.join(root, "lessons")).filter((f) => f.endsWith(".json"))) {
  report(`lessons/${f}`, validateLesson(read(path.join(root, "lessons", f)), { contracts, glossaryTerms }));
}
for (const f of readdirSync(path.join(root, "detours")).filter((f) => f.endsWith(".json"))) {
  const d = read(path.join(root, "detours", f));
  report(`detours/${f}`, validateBlocks(d.blocks, d.strings, { contracts, glossaryTerms, extraKeys: [d.titleKey] }));
}
process.exit(failed ? 1 : 0);
