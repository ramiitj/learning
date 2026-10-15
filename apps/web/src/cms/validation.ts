import path from "node:path";
import type { Payload } from "payload";
import { validate, type ValidationContext, type ValidationReport } from "@lm/validation";
import { repoContext } from "@lm/validation/repo";

const ROOT = path.resolve(process.cwd(), process.cwd().endsWith(path.join("apps", "web")) ? "../.." : ".");

/** The glossary as the CMS holds it: locale -> term id -> entry (drafts included, for authoring). */
export async function cmsGlossary(payload: Payload): Promise<ValidationContext["glossary"]> {
  const { docs } = await payload.find({ collection: "glossary", limit: 5000, depth: 0, overrideAccess: true, draft: true });
  const out: ValidationContext["glossary"] = {};
  for (const d of docs) (out[d.locale] ??= {})[d.termId] = { term: d.term, definition: d.definition };
  return out;
}

export async function validateWithCms(payload: Payload, doc: unknown): Promise<ValidationReport> {
  const glossary = await cmsGlossary(payload);
  // Until the glossary is imported, fall back to the repository's.
  const ctx = repoContext(ROOT, Object.keys(glossary).length ? glossary : undefined);
  return validate(doc, ctx);
}

export const repoRoot = () => ROOT;
