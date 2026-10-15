import { describe, expect, it } from "vitest";
import { buildReport, learningGains, revisionList, toHtml, toMarkdown, type Finding, type LessonInfo, type Row } from "./pilot";

const row = (metric: string, key: string, count: number, locale = "en"): Row => ({ lessonId: "l1", locale, mode: "personal", metric, key, count });
const checks = { pre: [{ id: "pre1", objective: "o1" }], post: [{ id: "post1", objective: "o1" }, { id: "post2", objective: "o2" }] };

describe("learning gain", () => {
  it("is post first-try rate minus pre rate when both have at least 5 answers", () => {
    const g = learningGains(checks, [row("pre", "pre1:1", 3), row("pre", "pre1:0", 7), row("post", "post1:1", 8), row("post", "post1:0", 2)]);
    expect(g.find((x) => x.objective === "o1")?.gain).toBe(50);
  });
  it("says why it cannot be computed", () => {
    const g = learningGains(checks, [row("pre", "pre1:1", 1), row("pre", "pre1:0", 2), row("post", "post1:1", 8)]);
    expect(g.find((x) => x.objective === "o1")).toMatchObject({ gain: null, why: expect.stringContaining("pre-check answers") });
    expect(g.find((x) => x.objective === "o2")?.why).toMatch(/no pre-check/);
    expect(learningGains(checks, [row("post", "post1:1", 9)])[0]?.why).toMatch(/no pre-check answers yet/);
    expect(learningGains(checks, [row("pre", "pre1:1", 9), row("post", "post1:1", 2)])[0]?.why).toMatch(/post-check/);
  });
});

describe("revision list", () => {
  const f = (id: number, severity: Finding["severity"], lesson: string | null, observed: string): Finding => ({ id, severity, lesson, observed, source: "usability-session", status: "open" });
  it("puts blockers first, then majors by lessons affected, then analytics, then minors", () => {
    const slice = { lessonId: "l1", title: "L1", locale: "en", starts: 40, returning: 0, completes: 10, completion: 25, dropOff: { blockId: "b3", lost: 20, lostShare: 50 }, misconceptions: [], gains: [], help: { detour: 0, depth: 0, expand: 0, glossary: 0 } };
    const list = revisionList(
      [f(1, "minor", "l1", "tiny"), f(2, "major", "l1", "Slider unclear"), f(3, "major", "l2", "Text too small"), f(4, "major", "l1", "text too small"), f(5, "blocker", "l2", "Cannot continue"), { ...f(6, "blocker", "l1", "old"), status: "fixed" }],
      [slice],
      ["l1", "l2"],
    );
    expect(list.map((i) => i.kind)).toEqual(["blocker", "major", "major", "analytics", "minor"]);
    expect(list[1]?.lessons.sort()).toEqual(["l1", "l2"]);
    expect(list.map((i) => i.rank)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("exports", () => {
  const lessons: LessonInfo[] = [{ lessonId: "l1", title: "Lesson <one>", doc: { checks } }];
  const report = buildReport({ from: "2026-10-01", to: "2026-10-15", lessons, locales: ["en", "hi"], rows: [row("start", "", 12), row("complete", "", 6)], findings: [{ id: 1, severity: "major", lesson: "l1", observed: "A | pipe", source: "review", status: "open" }], reports: [], incidents: [] });
  it("renders Markdown with a checkbox column", () => {
    const md = toMarkdown(report);
    expect(md).toContain("| [ ] | 1 | major |");
    expect(md).toContain("50%");
    expect(toMarkdown(report, { ids: report.revisions.map((r) => r.id) })).toContain("[x]");
  });
  it("renders escaped, script-free HTML", () => {
    const html = toHtml(report);
    expect(html).toContain("Lesson &lt;one&gt;");
    expect(html).not.toContain("<script");
    expect(html).toContain("<table>");
  });
});
