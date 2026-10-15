import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateBlocks } from "@lm/schema/validate";
import { aiContracts } from "./contracts";

const preview = JSON.parse(readFileSync(resolve(__dirname, "../../../content/previews/sim-ai.json"), "utf8")) as { blocks: { id: string; type: string; componentVersion: string; config: Record<string, unknown> }[]; strings: Record<string, Record<string, string>> };

describe("content/previews/sim-ai.json", () => {
  it("passes every simulation's contract, with all strings present in en, hi and te", () => {
    const issues = validateBlocks(preview.blocks as never, preview.strings, { contracts: aiContracts as never, locales: ["en", "hi", "te"] });
    expect(issues.filter((i) => i.severity === "error").map((i) => `${i.path}: ${i.message}`)).toEqual([]);
  });

  it("has the same keys in every locale", () => {
    const en = Object.keys(preview.strings.en!).sort();
    expect(Object.keys(preview.strings.hi!).sort()).toEqual(en);
    expect(Object.keys(preview.strings.te!).sort()).toEqual(en);
  });

  it("trains the classifier on six or more examples with comparable scales", () => {
    const tc = preview.blocks.find((b) => b.type === "train-classifier")!.config as { items: { features: Record<string, number> }[] };
    expect(tc.items.length).toBeGreaterThanOrEqual(6);
    const spread = (id: string) => Math.max(...tc.items.map((i) => i.features[id]!)) / Math.min(...tc.items.map((i) => i.features[id]!));
    const ids = Object.keys(tc.items[0]!.features);
    const sizes = ids.map((id) => Math.max(...tc.items.map((i) => i.features[id]!)));
    expect(Math.max(...sizes) / Math.min(...sizes)).toBeLessThan(5);
    expect(spread(ids[0]!)).toBeGreaterThan(1);
  });

  it("gives the dilemma two balanced options and a Care framework that withholds a verdict", () => {
    const dv = preview.blocks.find((b) => b.type === "dilemma-vote")!.config as { frameworks: { id: string; choice: string | null }[] };
    expect(dv.frameworks.find((f) => f.id === "care")!.choice).toBeNull();
    expect(preview.strings.en!["dv.o1"]).toBe("Follow the list, so no one is missed");
    expect(preview.strings.en!["dv.o2"]).toBe("Let teachers decide, with the list as one input");
    expect(preview.strings.en!["dv.scenario"]).toMatch(/ill/);
  });
});
