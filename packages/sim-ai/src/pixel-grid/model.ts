/** Pure image operations for the pixel grid. A grid is rows of shades 0 (empty) to 9 (darkest). */
export type Grid = number[][];
export type Direction = "left" | "right" | "up" | "down";

export const MIN_SIZE = 8;
export const MAX_SIZE = 16;
export const MAX_SHADE = 9;

export const clampSize = (n: number | undefined): number => {
  const v = Math.round(Number.isFinite(n) ? (n as number) : MIN_SIZE);
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, v));
};

export const clampShade = (v: unknown): number => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
  return Math.min(MAX_SHADE, Math.max(0, n));
};

export const blankGrid = (size: number): Grid => Array.from({ length: size }, () => Array<number>(size).fill(0));

/** Fit any rows into a size x size grid: missing cells are 0, extras are cut, values are clamped. Rows are centred when smaller. */
export function fitGrid(rows: readonly (readonly number[])[] | undefined, size: number): Grid {
  const out = blankGrid(size);
  if (!rows) return out;
  const h = Math.min(rows.length, size);
  const w = Math.min(Math.max(0, ...rows.map((r) => r.length)), size);
  const top = Math.floor((size - h) / 2);
  const left = Math.floor((size - w) / 2);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) out[top + r]![left + c] = clampShade(rows[r]![c]);
  return out;
}

export const setCell = (g: Grid, r: number, c: number, v: number): Grid => {
  if (g[r]?.[c] === undefined || g[r]![c] === clampShade(v)) return g;
  return g.map((row, i) => (i === r ? row.map((x, j) => (j === c ? clampShade(v) : x)) : row));
};

/** Draw toggles between empty and darkest. */
export const toggleCell = (g: Grid, r: number, c: number): Grid => setCell(g, r, c, (g[r]?.[c] ?? 0) > 0 ? 0 : MAX_SHADE);

/** Blur: every square becomes the average of itself and its neighbours (3x3), rounded. Edge squares average the neighbours that exist. */
export function blur(g: Grid): Grid {
  const n = g.length;
  return g.map((row, r) =>
    row.map((_, c) => {
      let sum = 0;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const v = g[r + dr]?.[c + dc];
          if (v !== undefined) {
            sum += v;
            count++;
          }
        }
      return n ? Math.round(sum / count) : 0;
    }),
  );
}

/** Shift the whole picture by one square. What moves off the edge is lost; new squares are empty. */
export function shift(g: Grid, dir: Direction): Grid {
  const dr = dir === "up" ? 1 : dir === "down" ? -1 : 0;
  const dc = dir === "left" ? 1 : dir === "right" ? -1 : 0;
  return g.map((row, r) => row.map((_, c) => g[r + dr]?.[c + dc] ?? 0));
}

/** How many squares hold a different number in the two grids. */
export function countChanged(a: Grid, b: Grid): number {
  let n = 0;
  for (let r = 0; r < a.length; r++) for (let c = 0; c < (a[r]?.length ?? 0); c++) if (a[r]![c] !== b[r]?.[c]) n++;
  return n;
}

export const cellCount = (g: Grid): number => g.reduce((s, r) => s + r.length, 0);
export const inkCount = (g: Grid): number => g.reduce((s, r) => s + r.filter((v) => v > 0).length, 0);
