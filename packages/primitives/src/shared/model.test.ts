import { evaluate, initialValues, weightedSum, type ModelSpec } from "./model";

const linear: ModelSpec = { type: "linear", bias: 1, inputs: [{ id: "a", labelKey: "a", initial: 2, weight: 3 }, { id: "b", labelKey: "b", initial: 0, weight: -1 }], output: { labelKey: "o", min: 0, max: 10 } };

describe("model", () => {
  it("computes a weighted sum with bias", () => {
    expect(weightedSum(linear, { a: 2, b: 1 })).toBe(6);
    expect(evaluate(linear, initialValues(linear))).toBe(7);
  });
  it("clamps linear output to its range", () => {
    expect(evaluate(linear, { a: 10, b: 0 })).toBe(10);
    expect(evaluate(linear, { a: 0, b: 5 })).toBe(0);
  });
  it("fires a threshold model at or above the threshold", () => {
    const t: ModelSpec = { ...linear, type: "threshold", threshold: 7 };
    expect(evaluate(t, { a: 2, b: 0 })).toBe(1);
    expect(evaluate(t, { a: 2, b: 1 })).toBe(0);
  });
});
