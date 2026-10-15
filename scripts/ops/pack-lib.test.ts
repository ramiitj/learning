import { describe, expect, it } from "vitest";
import { CMS_QUERIES, cmsContentFiles, cmsReplaces, describeLesson, LAUNCHER, packName, parseArgs, readme, selectLessons, sha256, START_CMD, START_SH, type CmsRows, type LessonFile } from "./pack-lib";

const lesson = (id: string, status: string): LessonFile => ({ id, version: 1, status, locales: ["en", "hi", "te"], localeStatus: { en: "draft" }, sha256: "x" });

describe("selectLessons", () => {
  const all = [lesson("b-pub", "published"), lesson("a-draft", "draft"), lesson("c-pub", "published"), lesson("d-review", "in-review")];

  it("includes only published lessons by default", () => {
    const s = selectLessons(all);
    expect(s.lessons.map((l) => l.id)).toEqual(["b-pub", "c-pub"]);
    expect(s.unpublished).toEqual([]);
  });

  it("adds --include lessons and reports the unpublished ones", () => {
    const s = selectLessons(all, ["a-draft"]);
    expect(s.lessons.map((l) => l.id)).toEqual(["a-draft", "b-pub", "c-pub"]);
    expect(s.unpublished).toEqual(["a-draft"]);
  });

  it("rejects an unknown id rather than shipping an incomplete pack", () => {
    expect(() => selectLessons(all, ["nope"])).toThrow(/nope/);
  });

  it("returns nothing when nothing is published", () => {
    expect(selectLessons([lesson("a", "draft")]).lessons).toEqual([]);
  });
});

describe("describeLesson", () => {
  it("reads id, version, status, locales and a checksum of the exact file", () => {
    const text = JSON.stringify({ id: "x", version: 3, status: "published", strings: { te: {}, en: {} }, localeStatus: { en: "reviewed" } });
    expect(describeLesson(text)).toEqual({ id: "x", version: 3, status: "published", locales: ["en", "te"], localeStatus: { en: "reviewed" }, sha256: sha256(text) });
  });
});

describe("parseArgs", () => {
  it("parses --include lists in both forms", () => {
    expect(parseArgs(["--include", "a,b", "--include=c"]).include).toEqual(["a", "b", "c"]);
  });
  it("rejects unknown options and --reuse-work without --work", () => {
    expect(() => parseArgs(["--publish"])).toThrow(/Unknown option/);
    expect(() => parseArgs(["--reuse-work"])).toThrow(/--work/);
  });
});

describe("pack files", () => {
  it("names test packs so they cannot be mistaken for a release", () => {
    const d = new Date("2026-10-15T12:00:00Z");
    expect(packName(d, false)).toBe("lesson-pack-2026-10-15");
    expect(packName(d, true)).toBe("lesson-pack-2026-10-15-test");
  });

  it("serves on port 8080 on every network interface, never with a database", () => {
    expect(LAUNCHER).toContain('process.env.PORT || "8080"');
    expect(LAUNCHER).toContain('"0.0.0.0"');
    expect(LAUNCHER).toContain("delete env.DATABASE_URI");
    expect(LAUNCHER).toContain("networkInterfaces");
  });

  it("start scripts run the launcher and explain a missing Node.js", () => {
    expect(START_SH.startsWith("#!/bin/sh")).toBe(true);
    expect(START_SH).toContain("node launch.cjs");
    expect(START_CMD).toContain("node launch.cjs");
    expect(START_CMD).toContain("\r\n");
  });

  it("README lists the lessons, warns on test packs, and has Hindi and Telugu notes", () => {
    const r = readme({ name: "lesson-pack-x-test", lessons: [lesson("every-primitive", "draft")], test: true });
    expect(r).toContain("every-primitive (version 1; languages: en, hi, te)");
    expect(r).toContain("TEST PACK");
    expect(r).toContain("Node.js 22 LTS");
    expect(r).toContain("show of");
    expect(r).toMatch(/[ऀ-ॿ]/);
    expect(r).toMatch(/[ఀ-౿]/);
    expect(readme({ name: "p", lessons: [], test: false })).not.toContain("TEST PACK");
  });
});

describe("--from-cms", () => {
  const rows = (over: Partial<CmsRows> = {}): CmsRows => ({
    lessons: [{ lessonId: "m1", doc: { id: "m1", version: 2, status: "draft", strings: { en: {} } } }],
    detours: [{ detourId: "rule", doc: { id: "rule", blocks: [] } }],
    glossary: [
      { termId: "clue", locale: "en", term: "clue", definition: "a sign" },
      { termId: "clue", locale: "hi", term: "सुराग", definition: "संकेत" },
    ],
    guides: [{ lessonId: "m1", locale: "en", guide: { objectivesPlain: ["x"] } }],
    ...over,
  });

  it("parses --from-cms and refuses it with --include (a CMS pack is published lessons only)", () => {
    expect(parseArgs(["--from-cms"]).fromCms).toBe(true);
    expect(parseArgs([]).fromCms).toBe(false);
    expect(() => parseArgs(["--from-cms", "--include", "x"])).toThrow(/published lessons only/);
  });

  it("reads published rows only, through SELECT statements", () => {
    for (const sql of Object.values(CMS_QUERIES)) {
      expect(sql).toMatch(/^SELECT /);
      expect(sql).toContain("_status = 'published'");
      expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/i);
    }
  });

  it("writes the files a pack serves, marking CMS-published lessons as published", () => {
    const c = cmsContentFiles(rows());
    const lesson = JSON.parse(c.lessons.get("lessons/m1.json")!);
    expect(lesson.status).toBe("published");
    expect(describeLesson(c.lessons.get("lessons/m1.json")!)).toMatchObject({ id: "m1", version: 2, status: "published" });
    expect(JSON.parse(c.glossary.get("glossary/hi.json")!)).toEqual({ clue: { term: "सुराग", definition: "संकेत" } });
    expect([...c.detours.keys()]).toEqual(["detours/rule.json"]);
    expect([...c.guides.keys()]).toEqual(["teacher-guides/m1.en.json"]);
  });

  it("refuses ids that would escape the content folder", () => {
    expect(() => cmsContentFiles(rows({ lessons: [{ lessonId: "../../etc/x", doc: { id: "../../etc/x" } }] }))).toThrow(/Refusing lesson/);
    expect(() => cmsContentFiles(rows({ detours: [{ detourId: "a/b", doc: {} }] }))).toThrow(/Refusing detour/);
    expect(() => cmsContentFiles(rows({ guides: [{ lessonId: "m1", locale: "../x", guide: {} }] }))).toThrow(/Refusing teacher guide locale/);
    expect(() => cmsContentFiles(rows({ lessons: [{ lessonId: "m1", doc: { id: "m2" } }] }))).toThrow(/document id/);
  });

  it("mirrors the live site: lessons and guides only from the CMS, detours fall back to the repository, glossary replaced when the CMS has one", () => {
    expect(cmsReplaces(cmsContentFiles(rows())).clear).toEqual(["lessons", "teacher-guides", "glossary"]);
    expect(cmsReplaces(cmsContentFiles(rows({ glossary: [] }))).clear).toEqual(["lessons", "teacher-guides"]);
  });
});
