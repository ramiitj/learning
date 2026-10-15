import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { cookies, draftMode } from "next/headers";
import { readPreview } from "@/auth/session";
import { unstable_cache } from "next/cache";
import type { Detour, Glossary, GlossaryEntry } from "@lm/engine";
import { catalogue as contracts } from "@lm/catalogue";
import type { Lesson } from "@lm/schema";
import { hasErrors, validateLesson } from "@lm/schema/validate";

/**
 * Where learner-facing content comes from. With a database configured
 * (DATABASE_URI), it is the CMS: published versions only, cached until a
 * publish revalidates them, or the latest drafts in the creator's preview.
 * Without one (offline lesson packs, CI builds), it is the repository's
 * /content folder. Pages never know which.
 */
const fromCms = () => !!process.env.DATABASE_URI;

async function cms() {
  const [{ getPayload }, { default: config }] = await Promise.all([import("payload"), import("@payload-config")]);
  return getPayload({ config });
}

/** The lesson id the creator's signed preview link opened, if any. Drafts of other lessons stay hidden. */
async function previewedLesson(): Promise<string | null> {
  try {
    if (!(await draftMode()).isEnabled) return null;
    return await readPreview((await cookies()).get("lm-preview")?.value ?? null);
  } catch {
    return null; // outside a request (build-time static params)
  }
}
const previewing = async () => (await previewedLesson()) !== null;

// ---------- repository source ----------

function contentRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, "content");
    if (existsSync(path.join(candidate, "lessons"))) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error("content/ folder not found");
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

const files = {
  async lessonIds() {
    const all = await readdir(path.join(contentRoot(), "lessons"));
    return all.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
  },
  async glossary(): Promise<Glossary> {
    const dir = path.join(contentRoot(), "glossary");
    const out: Glossary = {};
    for (const f of await readdir(dir)) if (f.endsWith(".json")) out[f.replace(/\.json$/, "")] = await readJson<Record<string, GlossaryEntry>>(path.join(dir, f));
    return out;
  },
  async detour(id: string) {
    const file = path.join(contentRoot(), "detours", `${id}.json`);
    return existsSync(file) ? readJson<Detour>(file) : null;
  },
  async lesson(id: string) {
    const file = path.join(contentRoot(), "lessons", `${id}.json`);
    return existsSync(file) ? readJson<unknown>(file) : null;
  },
};

// ---------- CMS source ----------

const cmsSource = {
  lessonIds: unstable_cache(
    async () => {
      const p = await cms();
      const { docs } = await p.find({ collection: "lessons", where: { _status: { equals: "published" } }, limit: 1000, depth: 0, select: { lessonId: true } });
      return docs.map((d) => d.lessonId).sort();
    },
    ["lesson-ids"],
    { tags: ["content"] },
  ),
  glossary: (draft: boolean) =>
    unstable_cache(
      async (): Promise<Glossary> => {
        const p = await cms();
        const { docs } = await p.find({ collection: "glossary", limit: 5000, depth: 0, draft, overrideAccess: draft, where: draft ? {} : { _status: { equals: "published" } } });
        const out: Glossary = {};
        for (const d of docs) (out[d.locale] ??= {})[d.termId] = { term: d.term, definition: d.definition };
        return out;
      },
      ["glossary", String(draft)],
      { tags: ["content"], revalidate: draft ? 1 : false },
    )(),
  async detour(id: string, draft: boolean) {
    const p = await cms();
    const { docs } = await p.find({ collection: "detours", where: { detourId: { equals: id }, ...(draft ? {} : { _status: { equals: "published" } }) }, limit: 1, depth: 0, draft, overrideAccess: draft });
    return (docs[0]?.doc as Detour | undefined) ?? null;
  },
  async lesson(id: string, draft: boolean) {
    const load = async () => {
      const p = await cms();
      const { docs } = await p.find({ collection: "lessons", where: { lessonId: { equals: id }, ...(draft ? {} : { _status: { equals: "published" } }) }, limit: 1, depth: 0, draft, overrideAccess: draft });
      return (docs[0]?.doc as unknown) ?? null;
    };
    return draft ? load() : unstable_cache(load, ["lesson", id], { tags: ["content"] })();
  },
};

// ---------- what pages use ----------

export async function listLessonIds(): Promise<string[]> {
  return fromCms() ? cmsSource.lessonIds() : files.lessonIds();
}

export async function getGlossary(): Promise<Glossary> {
  if (!fromCms()) return files.glossary();
  const g = await cmsSource.glossary(await previewing());
  return Object.keys(g).length ? g : files.glossary();
}

/** Only the learner's locale and the English fallback are sent to the browser. */
export function glossaryFor(glossary: Glossary, locale: string): Glossary {
  return { en: glossary.en ?? {}, ...(glossary[locale] ? { [locale]: glossary[locale] } : {}) };
}

export async function getDetours(ids: Iterable<string>): Promise<Record<string, Detour>> {
  const draft = await previewing();
  const out: Record<string, Detour> = {};
  for (const id of new Set(ids)) {
    const d = fromCms() ? ((await cmsSource.detour(id, draft)) ?? (await files.detour(id))) : await files.detour(id);
    if (d) out[id] = d;
  }
  return out;
}

/** Load a lesson and fail loudly if it does not validate: an invalid lesson never renders. */
export async function getLesson(id: string): Promise<Lesson | null> {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  const doc = fromCms() ? await cmsSource.lesson(id, (await previewedLesson()) === id) : await files.lesson(id);
  if (!doc) return null;
  const glossary = await getGlossary();
  const issues = validateLesson(doc, { contracts, glossaryTerms: new Set(Object.keys(glossary.en ?? {})) });
  if (hasErrors(issues)) {
    throw new Error(`Lesson "${id}" failed validation:\n${issues.map((i) => `  [${i.severity}] ${i.path}: ${i.message}`).join("\n")}`);
  }
  return doc as Lesson;
}

export function detourIdsOf(lesson: Pick<Lesson, "stages">): string[] {
  return lesson.stages.flatMap((s) => s.blocks.flatMap((b) => [...(b.detours ?? []), ...(typeof b.config.detour === "string" ? [b.config.detour] : [])]));
}
