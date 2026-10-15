import { describe, expect, it } from "vitest";
import { describeLesson, LAUNCHER, packName, parseArgs, readme, selectLessons, sha256, START_CMD, START_SH, type LessonFile } from "./pack-lib";

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
