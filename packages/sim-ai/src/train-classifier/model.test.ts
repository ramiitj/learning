import { band, conflicts, distance, predict, toVector, type Example } from "./model";

const ex = (id: string, v: number[], label: string): Example => ({ id, vector: v, label });
const train = [ex("a", [1], "small"), ex("b", [2], "small"), ex("c", [1.5], "small"), ex("d", [10], "big"), ex("e", [9], "big"), ex("f", [11], "big")];

describe("train-classifier model", () => {
  it("measures Euclidean distance and fills missing features with 0", () => {
    expect(distance([0, 0], [3, 4])).toBe(5);
    expect(toVector({ x: 2 }, ["x", "y"])).toEqual([2, 0]);
  });

  it("labels by the three nearest neighbours with their share as confidence", () => {
    const p = predict(train, [3])!;
    expect(p.label).toBe("small");
    expect(p.confidence).toBe(1);
    expect(p.neighbours.map((n) => n.id)).toEqual(["b", "c", "a"]);
  });

  it("gives partial confidence when neighbours split", () => {
    const p = predict([ex("a", [0], "x"), ex("b", [1], "x"), ex("c", [2], "y")], [0.4])!;
    expect(p.label).toBe("x");
    expect(p.confidence).toBeCloseTo(2 / 3);
    expect(p.votes).toEqual({ x: 2, y: 1 });
    expect(band(p.confidence)).toBe("medium");
    expect(band(1)).toBe("high");
    expect(band(1 / 3)).toBe("low");
  });

  it("is deterministic and breaks ties by the nearest example", () => {
    const set = [ex("a", [0], "x"), ex("b", [1], "y"), ex("c", [2], "z")];
    const first = predict(set, [0.9])!;
    expect(first.label).toBe("y");
    expect(first.confidence).toBeCloseTo(1 / 3);
    expect(predict(set, [0.9])).toEqual(first);
  });

  it("uses fewer neighbours when there are fewer examples, and nothing when there are none", () => {
    expect(predict([ex("a", [0], "x"), ex("b", [5], "y")], [1])!.used).toBe(2);
    expect(predict([], [1])).toBeNull();
  });

  it("detects examples that disagree and lowers confidence for them", () => {
    const set = [ex("a", [4], "small"), ex("b", [4], "big"), ex("c", [4.1], "big"), ex("d", [20], "big")];
    expect(conflicts(set).map(([a, b]) => [a.id, b.id])).toEqual([["a", "b"]]);
    const p = predict(set, [4])!;
    expect(p.confused).toBe(true);
    expect(p.confidence).toBeCloseTo(2 / 3);
    expect(predict(set, [20])!.confused).toBe(false);
  });
});
