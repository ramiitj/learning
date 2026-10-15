import type { ReviewerFlag, ReviewerOutput } from "./enforce";

export interface Seed {
  id: string;
  check: string;
  alsoAccept: string[];
  severity: "blocking" | "advisory";
  locale: string;
  keys: string[];
  block: string | null;
  note: string;
}

export interface Adjudication {
  stringKey: string;
  check: string;
  locale?: string;
  verdict: "genuine" | "noise" | "context";
  note: string;
}

export interface ReviewerScore {
  seeds: number;
  caught: string[];
  missed: Seed[];
  recall: number;
  blockingRecall: number;
  flags: number;
  matchedFlags: number;
  unmatched: ReviewerFlag[];
  /** Unmatched flags a person judged to be real problems in the lesson. */
  genuine: ReviewerFlag[];
  noise: ReviewerFlag[];
  /** Flags not yet judged: need a person to look at them. */
  unadjudicated: ReviewerFlag[];
  /** (matched + genuine) / (all flags - context-only); unadjudicated flags count against precision until judged. */
  precision: number;
}

function adjudicate(f: ReviewerFlag, list: Adjudication[]): Adjudication | undefined {
  const fk = norm(f.stringKey);
  return list.find((a) => {
    const ak = norm(a.stringKey);
    const keyOk = fk === ak || fk.includes(ak) || ak.includes(fk);
    const checkOk = a.check === f.check;
    const localeOk = !a.locale || a.locale === f.locale || f.locale === "all";
    return keyOk && checkOk && localeOk;
  });
}

const norm = (k: string) => k.toLowerCase().replace(/^glossary[:.]/, "").replace(/\s+/g, "");

function keyMatches(flag: ReviewerFlag, seed: Seed): boolean {
  const f = norm(flag.stringKey);
  return seed.keys.some((k) => {
    const s = norm(k);
    return f === s || f.includes(s) || s.includes(f);
  });
}

const checkMatches = (flag: ReviewerFlag, seed: Seed) => flag.check === seed.check || seed.alsoAccept.includes(flag.check);
const localeMatches = (flag: ReviewerFlag, seed: Seed) => flag.locale === seed.locale || flag.locale === "all";

/**
 * Scores a reviewer against planted problems. A seed is caught when a flag
 * points at its location with the right check (or an accepted alternative).
 * Location-by-key is tried first; a flag on the same block with the same
 * check catches a seed the key match missed.
 */
export function scoreReviewer(output: ReviewerOutput, seeds: Seed[], adjudications: Adjudication[] = []): ReviewerScore {
  const used = new Set<string>();
  const caught: string[] = [];
  const missed: Seed[] = [];
  for (const seed of seeds) {
    let hit = output.flags.find((f) => !used.has(f.id) && keyMatches(f, seed) && checkMatches(f, seed) && localeMatches(f, seed));
    hit ??= output.flags.find((f) => !used.has(f.id) && keyMatches(f, seed) && localeMatches(f, seed));
    hit ??= seed.block ? output.flags.find((f) => !used.has(f.id) && f.blockId === seed.block && checkMatches(f, seed) && localeMatches(f, seed)) : undefined;
    if (hit) {
      used.add(hit.id);
      caught.push(seed.id);
      // Further flags on the same seed are duplicates, not false alarms.
      for (const f of output.flags) if (!used.has(f.id) && keyMatches(f, seed) && localeMatches(f, seed)) used.add(f.id);
    } else missed.push(seed);
  }
  const blocking = seeds.filter((s) => s.severity === "blocking");
  const unmatched = output.flags.filter((f) => !used.has(f.id));
  const genuine: ReviewerFlag[] = [];
  const noise: ReviewerFlag[] = [];
  const unadjudicated: ReviewerFlag[] = [];
  let context = 0;
  for (const f of unmatched) {
    const a = adjudicate(f, adjudications);
    if (!a) unadjudicated.push(f);
    else if (a.verdict === "genuine") genuine.push(f);
    else if (a.verdict === "noise") noise.push(f);
    else context++;
  }
  const counted = output.flags.length - context;
  return {
    seeds: seeds.length,
    caught,
    missed,
    recall: seeds.length ? caught.length / seeds.length : 1,
    blockingRecall: blocking.length ? blocking.filter((s) => caught.includes(s.id)).length / blocking.length : 1,
    flags: output.flags.length,
    matchedFlags: output.flags.length - unmatched.length,
    unmatched,
    genuine,
    noise,
    unadjudicated,
    precision: counted ? (output.flags.length - unmatched.length + genuine.length) / counted : 1,
  };
}
