/**
 * The hillside landscape, pure and deterministic. The learner's world is a
 * height (the "loss") above each position. Heights are scaled to 0..10 so the
 * same chart works for any declared range.
 */
export type LandscapeType = "bowl" | "two-valleys";

export interface Landscape {
  type: LandscapeType;
  min: number;
  max: number;
}

export type Direction = "left" | "right";
export const HEIGHT_MAX = 10;
/** Closer than this to the lowest point counts as having reached the bottom. */
export const BOTTOM_TOLERANCE = 0.5;

const gauss = (u: number, centre: number, width: number) => Math.exp(-(((u - centre) / width) ** 2));

/** Unscaled shapes over u in [0, 1]. The two-valley shape has a shallow valley on the left and the deepest point on the right. */
const SHAPES: Record<LandscapeType, (u: number) => number> = {
  bowl: (u) => (2 * u - 1) ** 2,
  "two-valleys": (u) => 6 * (u - 0.5) ** 2 - 3.2 * gauss(u, 0.22, 0.1) - 5 * gauss(u, 0.75, 0.1),
};

const SCALE = Object.fromEntries(
  (Object.keys(SHAPES) as LandscapeType[]).map((type) => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i <= 1000; i++) {
      const v = SHAPES[type](i / 1000);
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    return [type, { lo, span: hi - lo }];
  }),
) as Record<LandscapeType, { lo: number; span: number }>;

export function clamp(l: Landscape, x: number): number {
  return Math.min(l.max, Math.max(l.min, x));
}

/** Height (0..10) above a position. */
export function height(l: Landscape, x: number): number {
  const u = (x - l.min) / (l.max - l.min || 1);
  const s = SCALE[l.type];
  return (HEIGHT_MAX * (SHAPES[l.type](u) - s.lo)) / s.span;
}

/**
 * Slope under the learner's feet: how much the height changes across 5% of the
 * landscape's width, positive when the ground rises to the right.
 */
export function slope(l: Landscape, x: number): number {
  const d = (l.max - l.min) * 0.025;
  return height(l, x + d) - height(l, x - d);
}

export type SlopeKind = "flat" | "uphillRight" | "downhillRight";
export const FLAT_SLOPE = 0.1;

export function slopeKind(s: number): SlopeKind {
  if (Math.abs(s) < FLAT_SLOPE) return "flat";
  return s > 0 ? "uphillRight" : "downhillRight";
}

/** The lowest point of the whole landscape, found by fine sampling. */
export function globalMinimum(l: Landscape): { x: number; h: number } {
  let best = { x: l.min, h: height(l, l.min) };
  for (let i = 1; i <= 1000; i++) {
    const x = l.min + ((l.max - l.min) * i) / 1000;
    const h = height(l, x);
    if (h < best.h) best = { x, h };
  }
  return best;
}

/** How far the learner can see: about one step either way, so the next step lands just inside the window. */
export function fogRadius(l: Landscape, step: number): number {
  return Math.max(step * 1.25, (l.max - l.min) * 0.02);
}

/** The way the ground falls at x; flat ground counts as right. Used when the rule, not a person, picks the direction. */
export function downhill(l: Landscape, x: number): Direction {
  return slope(l, x) > 0 ? "left" : "right";
}

export interface SizeOption {
  id: "small" | "medium" | "large";
  value: number;
}

/** The step sizes a class can vote between: smallest, middle and largest, without duplicates. Fewer than two means there is nothing to vote on. */
export function sizeOptions(w: Pick<Walk, "stepMin" | "stepMax">): SizeOption[] {
  const all: SizeOption[] = [
    { id: "small", value: w.stepMin },
    { id: "medium", value: (w.stepMin + w.stepMax) / 2 },
    { id: "large", value: w.stepMax },
  ];
  return all.filter((o, i) => all.findIndex((x) => Math.abs(x.value - o.value) < 1e-9) === i);
}

/** The option with the most hands, or null on a tie at the top or no hands at all. */
export function plurality(counts: Record<string, number>, ids: readonly string[]): string | null {
  const best = Math.max(0, ...ids.map((id) => counts[id] ?? 0));
  const top = ids.filter((id) => (counts[id] ?? 0) === best);
  return best > 0 && top.length === 1 ? top[0]! : null;
}

export function takeStep(l: Landscape, x: number, dir: Direction, size: number): number {
  return clamp(l, x + (dir === "right" ? size : -size));
}

/** At a low point when neither a smallest step left nor right goes lower. */
export function isLowPoint(l: Landscape, x: number, stepMin: number): boolean {
  const h = height(l, x);
  return height(l, clamp(l, x - stepMin)) >= h && height(l, clamp(l, x + stepMin)) >= h;
}

export type Outcome = "walking" | "bottom" | "trapped" | "budget";

/**
 * Where the walk stands. A low point ends it: "bottom" if it is (near) the
 * lowest point anywhere, "trapped" if it is a valley with lower ground elsewhere.
 * Running out of steps elsewhere is "budget".
 */
export function outcome(l: Landscape, positions: readonly number[], stepMin: number, maxSteps: number): Outcome {
  const x = positions[positions.length - 1]!;
  if (positions.length > 1 && isLowPoint(l, x, stepMin)) {
    return height(l, x) - globalMinimum(l).h <= BOTTOM_TOLERANCE ? "bottom" : "trapped";
  }
  return positions.length - 1 >= maxSteps ? "budget" : "walking";
}

export function curvePoints(l: Landscape, from: number, to: number, n = 60): { x: number; h: number }[] {
  const lo = Math.max(l.min, from);
  const hi = Math.min(l.max, to);
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = lo + ((hi - lo) * i) / n;
    return { x, h: height(l, x) };
  });
}

/** The majority of a left/right vote, or null on a tie or no votes. */
export function majority(counts: Record<string, number>): Direction | null {
  const left = counts.left ?? 0;
  const right = counts.right ?? 0;
  if (left === right) return null;
  return left > right ? "left" : "right";
}

export interface Walk {
  landscape: Landscape;
  start: number;
  stepMin: number;
  stepMax: number;
  maxSteps: number;
}

/** Make a declared config safe to use: ordered bounds, start inside them, step limits in order. */
export function resolveWalk(c: {
  landscape: { type: LandscapeType; min: number; max: number };
  start: number;
  stepMin: number;
  stepMax: number;
  maxSteps?: number;
}): Walk {
  const lo = Math.min(c.landscape.min, c.landscape.max);
  const hi = Math.max(c.landscape.min, c.landscape.max);
  const landscape: Landscape = { type: c.landscape.type, min: lo, max: hi === lo ? lo + 1 : hi };
  return {
    landscape,
    start: clamp(landscape, c.start),
    stepMin: Math.min(c.stepMin, c.stepMax),
    stepMax: Math.max(c.stepMin, c.stepMax),
    maxSteps: Math.max(1, Math.round(c.maxSteps ?? 15)),
  };
}
