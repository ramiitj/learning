import { Registry } from "@lm/engine";
import { contracts, primitives } from "./index";

describe("primitive registry", () => {
  it("registers all 13 universal primitives from docs/05 exactly once", () => {
    const types = new Registry(primitives).types.sort();
    expect(types).toEqual(["analogy", "assemble", "break-it", "by-hand-then-automate", "check", "compare", "explain-back", "knob", "predict", "reveal", "sort", "takeaway", "your-data"]);
    expect(contracts.map((c) => c.type).sort()).toEqual(types);
  });

  for (const p of primitives) {
    it(`${p.type}: interface strings exist in en, hi and te with identical keys, including a how-to`, () => {
      const en = Object.keys(p.messages.en ?? {}).sort();
      expect(en).toContain("howto");
      for (const loc of ["hi", "te"]) expect(Object.keys(p.messages[loc] ?? {}).sort()).toEqual(en);
    });

    it(`${p.type}: English interface strings avoid the constitution's banned words`, () => {
      const text = Object.values(p.messages.en ?? {}).join(" ");
      expect(text).not.toMatch(/\b(obviously|simply|clearly|just|incorrect|wrong)\b|it's easy to see/i);
    });
  }
});
