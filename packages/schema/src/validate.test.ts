// @vitest-environment node
import m1 from "../../../examples/m1-how-do-machines-learn.json" with { type: "json" };
import type { ComponentContract } from "./index";
import { hasErrors, validateBlocks, validateLesson } from "./validate";

/** Permissive stand-ins: these tests exercise the validator, not the real contracts. */
const loose = (type: string, stringKeys: (c: Record<string, unknown>) => string[] = () => []): ComponentContract => ({
  type, versions: ["1.0"], act: "explore", configSchema: { type: "object" }, stringKeys,
});
const contracts = ["reveal", "predict", "sort", "train-classifier", "analogy", "break-it", "explain-back", "takeaway"].map((t) => loose(t));
const clone = <T,>(x: T): T => structuredClone(x);

describe("validateLesson", () => {
  it("accepts the m1 exemplar lesson", () => {
    const issues = validateLesson(m1, { contracts });
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("rejects documents that break the lesson schema", () => {
    const bad = clone(m1) as Record<string, unknown>;
    delete bad.stages;
    expect(hasErrors(validateLesson(bad, { contracts }))).toBe(true);
  });

  it("rejects unregistered components and unknown versions", () => {
    const doc = clone(m1);
    doc.stages[0]!.blocks[0]!.type = "hologram";
    doc.stages[1]!.blocks[0]!.componentVersion = "9.0";
    const messages = validateLesson(doc, { contracts }).map((i) => i.message).join("\n");
    expect(messages).toMatch(/"hologram" is not registered/);
    expect(messages).toMatch(/no renderer for version 9.0/);
  });

  it("checks each block's config against its component contract", () => {
    const strict = contracts.map((c) => (c.type === "reveal" ? { ...c, configSchema: { type: "object", required: ["textKey"], properties: { textKey: { type: "string" } }, additionalProperties: false } } : c));
    const doc = clone(m1);
    (doc.stages[0]!.blocks[0]!.config as Record<string, unknown>) = { text: "inline text is not allowed" };
    const issues = validateLesson(doc, { contracts: strict });
    expect(issues.some((i) => i.check === "config" && i.path.startsWith("/blocks/b1/config"))).toBe(true);
  });

  it("reports string keys missing in English as errors and in other locales as warnings", () => {
    const withKeys = contracts.map((c) => (c.type === "reveal" ? loose("reveal", (cfg) => [String(cfg.textKey), "not.there"]) : c));
    const doc = clone(m1);
    doc.localeStatus = { en: "draft", hi: "draft", te: "missing" };
    (doc.strings as Record<string, Record<string, string>>).hi = { title: "शीर्षक" };
    const issues = validateLesson(doc, { contracts: withKeys }).filter((i) => i.check === "strings");
    expect(issues.find((i) => i.path === "/strings/en")?.severity).toBe("error");
    expect(issues.find((i) => i.path === "/strings/hi")?.severity).toBe("warning");
    expect(issues.find((i) => i.path === "/strings/te")).toBeUndefined();
  });

  it("checks check answers, objectives, glossary terms and block references", () => {
    const refs = contracts.map((c) => (c.type === "takeaway" ? { ...c, blockRefs: () => ["nope"] } : c));
    const doc = clone(m1);
    doc.checks.post[0]!.answer = "post1.z";
    doc.checks.pre[0]!.objective = "o9";
    const messages = validateLesson(doc, { contracts: refs, glossaryTerms: new Set(["model"]) }).map((i) => i.message).join("\n");
    expect(messages).toMatch(/answer "post1.z" is not one of the options/);
    expect(messages).toMatch(/objective "o9"/);
    expect(messages).toMatch(/glossary term "training"/);
    expect(messages).toMatch(/unknown block "nope"/);
  });
});

describe("validateBlocks", () => {
  it("validates detour blocks and their strings", () => {
    const issues = validateBlocks([{ id: "d1", type: "reveal", componentVersion: "1.0", config: { textKey: "a" } }], { en: {} }, { contracts: [loose("reveal", (c) => [String(c.textKey)])], extraKeys: ["title"] });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toMatch(/2 missing: title, a|2 missing: a, title/);
  });
});
