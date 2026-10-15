/**
 * Imports the repository's content and platform documents into the CMS.
 *   pnpm --filter @lm/web cms:import            imports as drafts
 *   PUBLISH=1 pnpm --filter @lm/web cms:import  also publishes them (run by the creator only:
 *                                               publishing is always-ask, and running this is the approval)
 * Idempotent: existing documents are updated, not duplicated. Every write is logged.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { getPayload } from "payload";
import config from "@payload-config";
import { logEvent } from "../src/cms/events";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const publish = process.argv.includes("--publish") || process.env.PUBLISH === "1";
const read = (p: string) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));
const status = publish ? "published" : "draft";
const ctx = { system: true, reason: `import from repository${publish ? " (published by the creator)" : ""}` };

const payload = await getPayload({ config });

async function upsert(collection: "lessons" | "detours" | "glossary" | "analogies" | "concepts" | "audiences" | "agents" | "users", where: Record<string, unknown>, data: Record<string, unknown>, drafts = true) {
  const found = await payload.find({ collection, where: where as never, limit: 1, depth: 0, overrideAccess: true, draft: drafts });
  const body = { ...data, ...(drafts ? { _status: status } : {}) } as never;
  if (found.docs[0]) return payload.update({ collection, id: found.docs[0].id, data: body, overrideAccess: true, context: ctx, draft: drafts && !publish });
  return payload.create({ collection, data: body, overrideAccess: true, context: ctx, draft: drafts && !publish });
}

let n = 0;
for (const f of readdirSync(path.join(ROOT, "content/glossary")).filter((f) => f.endsWith(".json"))) {
  const locale = f.replace(".json", "");
  for (const [termId, e] of Object.entries(read(`content/glossary/${f}`) as Record<string, { term: string; definition: string }>)) {
    await upsert("glossary", { and: [{ termId: { equals: termId } }, { locale: { equals: locale } }] }, { termId, locale, term: e.term, definition: e.definition });
    n++;
  }
}
console.log(`glossary: ${n} entries`);

for (const f of readdirSync(path.join(ROOT, "content/detours")).filter((f) => f.endsWith(".json"))) {
  const detourId = f.replace(".json", "");
  await upsert("detours", { detourId: { equals: detourId } }, { detourId, doc: read(`content/detours/${f}`) });
  console.log(`detour: ${detourId}`);
}

for (const f of readdirSync(path.join(ROOT, "content/lessons")).filter((f) => f.endsWith(".json"))) {
  const doc = read(`content/lessons/${f}`);
  const saved = await upsert("lessons", { lessonId: { equals: doc.id } }, { lessonId: doc.id, doc });
  const v = (saved as { validation?: { passed: boolean; errors: number; warnings: number } }).validation;
  console.log(`lesson: ${doc.id} (${status}); validation ${v?.passed ? "passed" : "FAILED"}, ${v?.errors} errors, ${v?.warnings} warnings`);
  // The lesson's analogies go into the shared bank.
  for (const s of doc.stages) for (const b of s.blocks.filter((b: { type: string }) => b.type === "analogy")) {
    const en = doc.strings.en as Record<string, string>;
    await upsert("analogies", { and: [{ concept: { equals: b.config.concept } }, { source: { equals: en[b.config.sourceKey] } }] }, {
      concept: b.config.concept,
      source: en[b.config.sourceKey],
      mappings: b.config.mappings.map((m: { sourceKey: string; targetKey: string }) => ({ source: en[m.sourceKey], target: en[m.targetKey] })),
      breakPoint: en[b.config.breakPointKey],
      fading: (b.config.fading ?? []).map((k: string) => en[k]),
      subjects: [doc.meta.subject],
    });
  }
}

// The concept graph from docs/13: each concept depends on the one before it.
const graphLine = readFileSync(path.join(ROOT, "docs/13-ai-for-kids-v1-curriculum.md"), "utf8").match(/## Concept graph for v1\n\n(.*)/)?.[1] ?? "";
let prev: string | number | undefined;
for (const name of graphLine.split("→").map((s) => s.trim().replace(/\.$/, "")).filter(Boolean)) {
  const conceptId = name.replace(/\s+/g, "-");
  const doc = await upsert("concepts", { conceptId: { equals: conceptId } }, { conceptId, name, subject: "ai", prerequisites: prev ? [prev] : [] }, false);
  prev = doc.id;
}
console.log(`concepts: ${graphLine.split("→").length}`);

for (const a of read("platform/config/audiences.json").profiles) await upsert("audiences", { audienceId: { equals: a.id } }, { audienceId: a.id, label: a.label, profile: a }, false);

// Agents: registry entries and the users they act as.
const models = read("platform/config/models.json").tiers as Record<string, { model: string }>;
for (const f of readdirSync(path.join(ROOT, "platform/agents")).filter((f) => f.endsWith(".md") && f !== "README.md")) {
  const agentId = f.replace(".md", "");
  const profile = readFileSync(path.join(ROOT, "platform/agents", f), "utf8");
  const label = (/\*\*Model tier\.\*\*\s*([A-Za-z -]+?)[.(]/.exec(profile)?.[1] ?? "balanced").toLowerCase();
  const tier = label.startsWith("most") ? "most-capable" : label.startsWith("fast") ? "fast" : "balanced";
  const results = path.join(ROOT, "benchmarks", agentId, "results");
  const benchmark = existsSync(results) ? Object.fromEntries(readdirSync(results).map((r) => [r.replace(".scorecard.json", ""), read(`benchmarks/${agentId}/results/${r}`)])) : null;
  await upsert("agents", { agentId: { equals: agentId } }, { agentId, tier: `${tier} (${models[tier]?.model})`, benchmark }, false);
  await upsert("users", { and: [{ role: { equals: "agent" } }, { agentId: { equals: agentId } }] }, { name: agentId, role: "agent", agentId }, false);
}
console.log("agents: registry and agent users");

const constitution = readFileSync(path.join(ROOT, "platform/constitution.md"), "utf8");
const current = await payload.findGlobal({ slug: "constitution", overrideAccess: true });
if ((current as { text?: string }).text !== constitution) await payload.updateGlobal({ slug: "constitution", data: { text: constitution, amendmentReason: "Imported from platform/constitution.md" }, overrideAccess: true, context: ctx });
await payload.updateGlobal({ slug: "autonomy", data: { settings: read("platform/config/autonomy.json") }, overrideAccess: true, context: ctx });

await logEvent(payload, undefined, { action: "import.repository", reason: ctx.reason });
console.log("done");
process.exit(0);
