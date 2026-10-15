import { clamp, curvePoints, downhill, fogRadius, plurality, sizeOptions, globalMinimum, height, isLowPoint, majority, outcome, resolveWalk, slope, slopeKind, takeStep, type Landscape } from "./model";

const bowl: Landscape = { type: "bowl", min: 0, max: 100 };
const valleys: Landscape = { type: "two-valleys", min: 0, max: 100 };

describe("hillside model", () => {
  it("scales heights to 0..10, with the bowl lowest in the middle", () => {
    expect(height(bowl, 50)).toBeCloseTo(0);
    expect(height(bowl, 0)).toBeCloseTo(10);
    expect(height(bowl, 100)).toBeCloseTo(10);
    expect(globalMinimum(bowl).x).toBeCloseTo(50, 0);
  });

  it("has a shallow valley on the left and the deepest ground on the right in two-valleys", () => {
    const g = globalMinimum(valleys);
    expect(g.x).toBeGreaterThan(70);
    expect(g.x).toBeLessThan(80);
    expect(g.h).toBeCloseTo(0, 1);
    expect(isLowPoint(valleys, 22.5, 2)).toBe(true);
    expect(height(valleys, 22.5)).toBeGreaterThan(2);
    expect(height(valleys, 50)).toBeGreaterThan(height(valleys, 22.5));
  });

  it("reports the slope sign and kind", () => {
    expect(slope(bowl, 20)).toBeLessThan(0);
    expect(slopeKind(slope(bowl, 20))).toBe("downhillRight");
    expect(slopeKind(slope(bowl, 80))).toBe("uphillRight");
    expect(slopeKind(slope(bowl, 50))).toBe("flat");
  });

  it("clamps steps to the landscape and is deterministic", () => {
    expect(takeStep(bowl, 98, "right", 10)).toBe(100);
    expect(takeStep(bowl, 3, "left", 10)).toBe(0);
    expect(takeStep(bowl, 50, "left", 5)).toBe(45);
    expect(clamp(bowl, -5)).toBe(0);
    expect(curvePoints(valleys, 0, 100, 10)).toEqual(curvePoints(valleys, 0, 100, 10));
    expect(fogRadius(bowl, 30)).toBe(37.5);
    expect(fogRadius(bowl, 1)).toBe(2);
  });

  it("classifies a walk as walking, bottom, trapped or out of budget", () => {
    expect(outcome(bowl, [10], 2, 5)).toBe("walking");
    expect(outcome(bowl, [47, 50], 2, 5)).toBe("bottom");
    expect(outcome(valleys, [10, 22], 2, 5)).toBe("trapped");
    expect(outcome(valleys, [10, 16, 12], 2, 2)).toBe("budget");
    expect(outcome(valleys, [10, 16, 12], 2, 5)).toBe("walking");
    expect(outcome(valleys, [30, 50, 70, 74], 2, 5)).toBe("bottom");
  });

  it("takes the majority of a left/right vote, or null on a tie", () => {
    expect(majority({ left: 3, right: 1 })).toBe("left");
    expect(majority({ right: 2 })).toBe("right");
    expect(majority({ left: 2, right: 2 })).toBeNull();
    expect(majority({})).toBeNull();
  });

  it("makes odd configs safe", () => {
    const w = resolveWalk({ landscape: { type: "bowl", min: 10, max: 0 }, start: 99, stepMin: 5, stepMax: 1 });
    expect(w).toEqual({ landscape: { type: "bowl", min: 0, max: 10 }, start: 10, stepMin: 1, stepMax: 5, maxSteps: 15 });
    expect(resolveWalk({ landscape: { type: "bowl", min: 3, max: 3 }, start: 3, stepMin: 1, stepMax: 1 }).landscape.max).toBe(4);
  });

  it("picks the downhill direction by the rule, and offers distinct step sizes to vote on", () => {
    expect(downhill(bowl, 20)).toBe("right");
    expect(downhill(bowl, 80)).toBe("left");
    expect(sizeOptions({ stepMin: 2, stepMax: 10 })).toEqual([{ id: "small", value: 2 }, { id: "medium", value: 6 }, { id: "large", value: 10 }]);
    expect(sizeOptions({ stepMin: 3, stepMax: 3 })).toEqual([{ id: "small", value: 3 }]);
    expect(plurality({ small: 2, large: 1 }, ["small", "medium", "large"])).toBe("small");
    expect(plurality({ small: 1, large: 1 }, ["small", "medium", "large"])).toBeNull();
    expect(plurality({}, ["small"])).toBeNull();
  });
});
