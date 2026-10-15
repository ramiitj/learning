/**
 * k-nearest neighbours, pure and deterministic: no randomness, no clock.
 * Distance is Euclidean on the declared features, so authors should give
 * features comparable scales. Ties are broken by the order of the examples.
 */
export const K = 3;

export interface Example {
  id: string;
  vector: number[];
  label: string;
}

export interface Neighbour {
  id: string;
  label: string;
  distance: number;
}

export interface Prediction {
  label: string;
  /** Share of the neighbours that agree with the chosen label, 0..1. */
  confidence: number;
  /** How many neighbours voted for each label. */
  votes: Record<string, number>;
  /** How many neighbours were used (fewer than k when there are fewer examples). */
  used: number;
  /** The training examples it relied on, nearest first. */
  neighbours: Neighbour[];
  /** Two of those neighbours look identical to the machine but carry different labels. */
  confused: boolean;
}

export function toVector(features: Record<string, number>, featureIds: readonly string[]): number[] {
  return featureIds.map((id) => {
    const v = features[id];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  });
}

export function distance(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

const same = (a: readonly number[], b: readonly number[]) => distance(a, b) === 0;

/** Pairs of examples with identical features but different labels: the examples disagree. */
export function conflicts(examples: readonly Example[]): [Example, Example][] {
  const out: [Example, Example][] = [];
  for (let i = 0; i < examples.length; i++) {
    for (let j = i + 1; j < examples.length; j++) {
      const a = examples[i]!;
      const b = examples[j]!;
      if (a.label !== b.label && same(a.vector, b.vector)) out.push([a, b]);
    }
  }
  return out;
}

/** Label one new example. Returns null when there is nothing to learn from. */
export function predict(examples: readonly Example[], vector: readonly number[], k: number = K): Prediction | null {
  if (examples.length === 0) return null;
  const ranked = examples
    .map((e, index) => ({ e, index, distance: distance(e.vector, vector) }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .slice(0, Math.min(k, examples.length));
  const votes: Record<string, number> = {};
  for (const r of ranked) votes[r.e.label] = (votes[r.e.label] ?? 0) + 1;
  const best = Math.max(...Object.values(votes));
  // Among tied labels, the one whose example is nearest wins.
  const label = ranked.find((r) => votes[r.e.label] === best)!.e.label;
  const confused = ranked.some((a, i) => ranked.some((b, j) => j > i && a.e.label !== b.e.label && same(a.e.vector, b.e.vector)));
  return {
    label,
    confidence: best / ranked.length,
    votes,
    used: ranked.length,
    neighbours: ranked.map((r) => ({ id: r.e.id, label: r.e.label, distance: r.distance })),
    confused,
  };
}

export type ConfidenceBand = "high" | "medium" | "low";

/** Words to go with the number, so colour and bars never carry the meaning alone. */
export function band(confidence: number): ConfidenceBand {
  if (confidence >= 0.99) return "high";
  if (confidence >= 0.6) return "medium";
  return "low";
}
