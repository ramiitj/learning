/**
 * Validates every lesson in /content with the full validation service (schema,
 * component contracts and every pedagogy check in docs/04), and every detour
 * against the schema and contracts. Runs in CI; the web build also refuses to
 * render a lesson that fails.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { catalogue as contracts } from "@lm/catalogue";
import { hasErrors, validateBlocks, type Issue } from "@lm/schema/validate";
import { validate } from "@lm/validation";
import { repoContext } from "@lm/validation/repo";

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

const ctx = repoContext(path.resolve(root, ".."));
for (const f of readdirSync(path.join(root, "lessons")).filter((f) => f.endsWith(".json"))) {
  const r = validate(read(path.join(root, "lessons", f)), ctx);
  failed ||= !r.passed;
  console.log(`${r.passed ? "✓" : "✗"} lessons/${f} — ${r.errors} errors, ${r.warnings} warnings; publishable locales: ${r.publishableLocales.join(", ") || "none"}`);
  for (const i of r.findings) console.log(`    [${i.severity}] ${i.check} ${i.path}: ${i.message}`);
}
for (const f of readdirSync(path.join(root, "detours")).filter((f) => f.endsWith(".json"))) {
  const d = read(path.join(root, "detours", f));
  report(`detours/${f}`, validateBlocks(d.blocks, d.strings, { contracts, glossaryTerms, extraKeys: [d.titleKey] }));
}
process.exit(failed ? 1 : 0);
