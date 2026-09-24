import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Detour, Glossary, GlossaryEntry } from "@lm/engine";
import { contracts } from "@lm/primitives/contracts";
import type { Lesson } from "@lm/schema";
import { hasErrors, validateLesson } from "@lm/schema/validate";

/**
 * Phase 1 reads content from the repository's /content folder at build time.
 * Phase 3 replaces this module with the CMS; pages do not change.
 */
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

export async function listLessonIds(): Promise<string[]> {
  const files = await readdir(path.join(contentRoot(), "lessons"));
  return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
}

export async function getGlossary(): Promise<Glossary> {
  const dir = path.join(contentRoot(), "glossary");
  const out: Glossary = {};
  for (const f of await readdir(dir)) {
    if (f.endsWith(".json")) out[f.replace(/\.json$/, "")] = await readJson<Record<string, GlossaryEntry>>(path.join(dir, f));
  }
  return out;
}

/** Only the learner's locale and the English fallback are sent to the browser. */
export function glossaryFor(glossary: Glossary, locale: string): Glossary {
  return { en: glossary.en ?? {}, ...(glossary[locale] ? { [locale]: glossary[locale] } : {}) };
}

export async function getDetours(ids: Iterable<string>): Promise<Record<string, Detour>> {
  const out: Record<string, Detour> = {};
  for (const id of new Set(ids)) {
    const file = path.join(contentRoot(), "detours", `${id}.json`);
    if (existsSync(file)) out[id] = await readJson<Detour>(file);
  }
  return out;
}

/** Load a lesson and fail loudly (at build) if it does not validate. */
export async function getLesson(id: string): Promise<Lesson | null> {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  const file = path.join(contentRoot(), "lessons", `${id}.json`);
  if (!existsSync(file)) return null;
  const doc = await readJson<unknown>(file);
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
