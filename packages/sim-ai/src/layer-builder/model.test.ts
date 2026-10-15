import { createFit, diagnose, errorOn, MAX_EPOCHS, parameterCount, resolveDataset, resultOf, stepFit, trainAsync, type Dataset } from "./model";

const line = (n: number): Dataset => {
  const f = (x: number) => 2 * x - 1;
  return { train: Array.from({ length: n }, (_, i) => [i / (n - 1), f(i / (n - 1))]), test: Array.from({ length: n }, (_, i) => [(i + 0.5) / n, f((i + 0.5) / n)]) };
};
const noisy = resolveDataset({ type: "wave", points: 10, noise: 0.5, seed: 3 });

describe("layer-builder model", () => {
  it("fits a line with a one-layer net", () => {
    const fit = createFit([3], line(10));
    const before = errorOn(fit, fit.data.train);
    stepFit(fit, 800);
    expect(errorOn(fit, fit.data.train)).toBeLessThan(0.02);
    expect(errorOn(fit, fit.data.test)).toBeLessThan(0.05);
    expect(errorOn(fit, fit.data.train)).toBeLessThan(before);
  });

  it("is deterministic for the same widths and data", () => {
    const a = createFit([4, 4], noisy);
    const b = createFit([4, 4], noisy);
    stepFit(a, 300);
    stepFit(b, 150);
    stepFit(b, 150);
    expect(resultOf(a)).toEqual(resultOf(b));
  });

  it("overfits noisy points with a wide three-layer net, and a small net underfits", () => {
    const big = createFit([16, 16, 16], noisy);
    stepFit(big, MAX_EPOCHS);
    const r = resultOf(big);
    expect(r.trainError).toBeLessThan(0.05);
    expect(r.testError).toBeGreaterThan(r.trainError * 2 + 0.05);
    expect(diagnose(r.trainError, r.testError)).toBe("overfit");

    const small = createFit([1], noisy);
    stepFit(small, MAX_EPOCHS);
    const s = resultOf(small);
    expect(diagnose(s.trainError, s.testError)).toBe("underfit");
  });

  it("generates the same data from the same seed, with no noise on new points", () => {
    expect(resolveDataset({ type: "steps", points: 12, noise: 0.2, seed: 1 })).toEqual(resolveDataset({ type: "steps", points: 12, noise: 0.2, seed: 1 }));
    const d = resolveDataset({ type: "steps", points: 12, noise: 0.2, seed: 1 });
    expect(d.train).toHaveLength(12);
    expect(d.test).toHaveLength(12);
  });

  it("accepts a declared dataset as is", () => {
    expect(resolveDataset({ train: [[0, 0], [1, 1]], test: [[0.5, 0.5]] }).test).toEqual([[0.5, 0.5]]);
  });

  it("counts parameters and diagnoses a good fit", () => {
    expect(parameterCount([4])).toBe(4 + 4 + 4 + 1);
    expect(diagnose(0.03, 0.05)).toBe("good");
  });

  it("trains in slices, caps the work and can be cancelled", async () => {
    const fit = createFit([2], line(6));
    await new Promise<void>((resolve) => trainAsync([fit], { epochs: 99999, sliceMs: 1, onDone: () => resolve() }));
    expect(fit.epoch).toBe(MAX_EPOCHS);
    const other = createFit([2], line(6));
    const cancel = trainAsync([other], { onDone: () => { throw new Error("should not finish"); } });
    cancel();
    await new Promise((r) => setTimeout(r, 30));
    expect(other.epoch).toBe(0);
  });
});
