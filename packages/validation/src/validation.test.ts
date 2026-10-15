// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Lesson } from "@lm/schema";
import { validate } from "./index";
import { repoContext } from "./repo";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const ctx = repoContext(ROOT);
const lesson = () => JSON.parse(readFileSync(path.join(ROOT, "content/lessons/every-primitive.json"), "utf8")) as Lesson;
const errorsOf = (l: unknown) => validate(l, ctx).findings.filter((f) => f.severity === "error").map((f) => f.check);

describe("validation service", () => {
  it("passes the test lesson, and publishes no locale a human has not reviewed", () => {
    const r = validate(lesson(), ctx);
    expect(r.findings.filter((f) => f.severity === "error")).toEqual([]);
    expect(r.passed).toBe(true);
    expect(r.publishableLocales).toEqual(expect.not.arrayContaining(["hi", "te"]));
  });

  it("catches a missing stage and stages out of order", () => {
    const l = lesson();
    l.stages = l.stages.filter((s) => s.stage !== "break-it").reverse();
    expect(errorsOf(l)).toEqual(expect.arrayContaining(["grammar"]));
  });

  it("catches three connective blocks in a row", () => {
    const l = lesson();
    const reveal = l.stages.flatMap((s) => s.blocks).find((b) => b.type === "reveal")!;
    l.stages[0]!.blocks.push({ ...reveal, id: "x1" }, { ...reveal, id: "x2" });
    expect(errorsOf(l)).toContain("act-density");
  });

  it("catches a banned phrase in Hindi and an invalid ICU message", () => {
    const l = lesson();
    const key = Object.keys(l.strings.hi!)[0]!;
    l.strings.hi![key] = "ज़ाहिर है यह आसान है";
    l.strings.en![key] = "Broken {count, plural, one {#}";
    expect(errorsOf(l)).toEqual(expect.arrayContaining(["banned-phrases", "messages"]));
  });

  it("catches a term tag with no glossary entry", () => {
    const l = lesson();
    const key = Object.keys(l.strings.en!)[0]!;
    l.strings.en![key] += " <term-nonsense>nonsense</term-nonsense>";
    expect(errorsOf(l)).toContain("undefined-terms");
  });

  it("catches an analogy that claims to be perfect, and a lesson that ends on nothing", () => {
    const l = lesson();
    const an = l.stages.flatMap((s) => s.blocks).find((b) => b.type === "analogy")!;
    l.strings.en![(an.config as { breakPointKey: string }).breakPointKey] = "This comparison works perfectly in every way.";
    l.stages.at(-1)!.blocks = l.stages.at(-1)!.blocks.filter((b) => b.type !== "takeaway" && b.type !== "explain-back");
    expect(errorsOf(l)).toEqual(expect.arrayContaining(["analogy-completeness", "ending"]));
  });

  it("catches an objective with no post-check", () => {
    const l = lesson();
    l.checks.post = [];
    expect(errorsOf(l)).toContain("checks-present");
  });

  it("flags a machine given a mind, outside a break point", () => {
    const l = lesson();
    l.strings.en!["hook.q"] = "The filter understands which messages are dangerous.";
    expect(validate(l, ctx).findings.some((f) => f.check === "anthropomorphism")).toBe(true);
  });

  it("only publishes a locale a human reviewed", () => {
    const l = lesson();
    l.localeStatus = { ...l.localeStatus, hi: "reviewed" };
    expect(validate(l, ctx).publishableLocales).toContain("hi");
  });
});
