/** Helpers for contracts: collect string keys from config values. */
export const keys = (...xs: (string | string[] | undefined | null)[]): string[] => xs.flat().filter((x): x is string => typeof x === "string" && x.length > 0);

/** A deterministic shuffle so server and client render the same order. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Trim, collapse whitespace and cap length, so empty or silly input is handled gracefully. */
export function cleanInput(s: string, maxLength: number): string {
  return s.replace(/\s+/g, " ").trim().slice(0, maxLength);
}
