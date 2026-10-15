/**
 * A tiny fully connected network for one-dimensional regression: tanh hidden
 * layers, a linear output, full-batch gradient descent with momentum and a
 * seeded random start. Everything is deterministic, runs in the browser and
 * touches nothing outside this file's arguments.
 */

export type Point = [number, number];
export interface Dataset {
  train: Point[];
  test: Point[];
}
export interface GeneratorSpec {
  type: "wave" | "steps";
  points: number;
  noise: number;
  seed: number;
}
export type DatasetConfig = Dataset | GeneratorSpec;

/** Total training work is capped so a low-end phone is never stuck. */
export const MAX_EPOCHS = 2000;
const LEARNING_RATE = 0.03;
const MOMENTUM = 0.9;
const CURVE_POINTS = 41;

/** Small, fast, seeded random numbers (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STEP_LEVELS = [-0.8, 0.6, -0.2, 0.9];
function truth(type: GeneratorSpec["type"], x: number): number {
  if (type === "wave") return Math.sin(2 * Math.PI * x);
  return STEP_LEVELS[Math.min(STEP_LEVELS.length - 1, Math.floor(x * STEP_LEVELS.length))]!;
}

/** Named generators keep lessons free of code: the same spec always gives the same points. */
export function resolveDataset(c: DatasetConfig): Dataset {
  if ("train" in c) return { train: c.train.map(([x, y]) => [x, y]), test: c.test.map(([x, y]) => [x, y]) };
  const n = Math.max(4, Math.min(60, Math.round(c.points)));
  const rand = rng(c.seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const train: Point[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i + 0.15 + 0.7 * rand()) / n;
    train.push([x, truth(c.type, x) + c.noise * gauss()]);
  }
  // New points come from the underlying pattern, between the training points, so test error shows how well the idea (not the noise) was learned.
  const test: Point[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) / n;
    test.push([x, truth(c.type, x)]);
  }
  return { train, test };
}

interface Scale {
  xMin: number;
  xSpan: number;
  yMean: number;
  yStd: number;
}
function makeScale(d: Dataset): Scale {
  const xs = [...d.train, ...d.test].map((p) => p[0]);
  const xMin = Math.min(...xs);
  const xSpan = Math.max(...xs) - xMin || 1;
  const ys = d.train.map((p) => p[1]);
  const yMean = ys.reduce((s, v) => s + v, 0) / (ys.length || 1);
  const variance = ys.reduce((s, v) => s + (v - yMean) ** 2, 0) / (ys.length || 1);
  return { xMin, xSpan, yMean, yStd: Math.sqrt(variance) || 1 };
}

export interface Fit {
  widths: number[];
  /** sizes[0] = 1 input, then the hidden widths, then 1 output. */
  sizes: number[];
  w: Float64Array[];
  b: Float64Array[];
  vw: Float64Array[];
  vb: Float64Array[];
  scale: Scale;
  data: Dataset;
  tx: Float64Array;
  ty: Float64Array;
  epoch: number;
}

export function parameterCount(widths: readonly number[]): number {
  const sizes = [1, ...widths, 1];
  let n = 0;
  for (let l = 0; l < sizes.length - 1; l++) n += sizes[l]! * sizes[l + 1]! + sizes[l + 1]!;
  return n;
}

export function createFit(widths: readonly number[], data: Dataset, seed = 7): Fit {
  const sizes = [1, ...widths, 1];
  const rand = rng(seed * 9973 + widths.length * 31 + widths.reduce((s, v) => s + v, 0));
  const w: Float64Array[] = [];
  const b: Float64Array[] = [];
  for (let l = 0; l < sizes.length - 1; l++) {
    const fanIn = sizes[l]!;
    const fanOut = sizes[l + 1]!;
    const limit = Math.sqrt(6 / (fanIn + fanOut));
    // The first layer gets a wider start so a narrow net can already bend.
    const boost = l === 0 ? 2.5 : 1;
    w.push(Float64Array.from({ length: fanIn * fanOut }, () => (rand() * 2 - 1) * limit * boost));
    b.push(new Float64Array(fanOut));
  }
  const scale = makeScale(data);
  return {
    widths: [...widths],
    sizes,
    w,
    b,
    vw: w.map((a) => new Float64Array(a.length)),
    vb: b.map((a) => new Float64Array(a.length)),
    scale,
    data,
    tx: Float64Array.from(data.train, (p) => ((p[0] - scale.xMin) / scale.xSpan) * 2 - 1),
    ty: Float64Array.from(data.train, (p) => (p[1] - scale.yMean) / scale.yStd),
    epoch: 0,
  };
}

/** Forward pass in scaled space. acts[l] holds the layer l activations. */
function forward(f: Fit, x: number, acts: Float64Array[]): number {
  acts[0]![0] = x;
  const last = f.sizes.length - 2;
  for (let l = 0; l <= last; l++) {
    const nin = f.sizes[l]!;
    const nout = f.sizes[l + 1]!;
    const a = acts[l]!;
    const o = acts[l + 1]!;
    const W = f.w[l]!;
    const B = f.b[l]!;
    for (let j = 0; j < nout; j++) {
      let s = B[j]!;
      for (let i = 0; i < nin; i++) s += W[j * nin + i]! * a[i]!;
      o[j] = l === last ? s : Math.tanh(s);
    }
  }
  return acts[last + 1]![0]!;
}

const newActs = (f: Fit) => f.sizes.map((n) => new Float64Array(n));

/** Run whole epochs of full-batch gradient descent with momentum. */
export function stepFit(f: Fit, epochs: number): void {
  const n = f.tx.length;
  if (n === 0) return;
  const L = f.sizes.length - 1;
  const acts = newActs(f);
  const gw = f.w.map((a) => new Float64Array(a.length));
  const gb = f.b.map((a) => new Float64Array(a.length));
  const delta = f.sizes.map((s) => new Float64Array(s));
  for (let e = 0; e < epochs; e++) {
    gw.forEach((a) => a.fill(0));
    gb.forEach((a) => a.fill(0));
    for (let k = 0; k < n; k++) {
      const pred = forward(f, f.tx[k]!, acts);
      delta[L]![0] = (2 * (pred - f.ty[k]!)) / n;
      for (let l = L - 1; l >= 0; l--) {
        const nin = f.sizes[l]!;
        const nout = f.sizes[l + 1]!;
        const W = f.w[l]!;
        const dOut = delta[l + 1]!;
        const a = acts[l]!;
        for (let j = 0; j < nout; j++) {
          gb[l]![j]! += dOut[j]!;
          for (let i = 0; i < nin; i++) gw[l]![j * nin + i]! += dOut[j]! * a[i]!;
        }
        if (l > 0) {
          for (let i = 0; i < nin; i++) {
            let s = 0;
            for (let j = 0; j < nout; j++) s += W[j * nin + i]! * dOut[j]!;
            delta[l]![i] = s * (1 - a[i]! * a[i]!);
          }
        }
      }
    }
    for (let l = 0; l < L; l++) {
      const W = f.w[l]!, B = f.b[l]!, VW = f.vw[l]!, VB = f.vb[l]!;
      for (let i = 0; i < W.length; i++) {
        VW[i] = MOMENTUM * VW[i]! - LEARNING_RATE * gw[l]![i]!;
        W[i]! += VW[i]!;
      }
      for (let i = 0; i < B.length; i++) {
        VB[i] = MOMENTUM * VB[i]! - LEARNING_RATE * gb[l]![i]!;
        B[i]! += VB[i]!;
      }
    }
    f.epoch++;
  }
}

/** The fitted value at x, in the data's own units. */
export function predictAt(f: Fit, x: number): number {
  const acts = newActs(f);
  const out = forward(f, ((x - f.scale.xMin) / f.scale.xSpan) * 2 - 1, acts);
  return out * f.scale.yStd + f.scale.yMean;
}

/**
 * Error as a share of the spread of the training answers: 0 is perfect, 1 is
 * no better than always guessing the average. Comparable across datasets.
 */
export function errorOn(f: Fit, points: readonly Point[]): number {
  if (points.length === 0) return 0;
  let s = 0;
  for (const [x, y] of points) s += (predictAt(f, x) - y) ** 2;
  return s / points.length / (f.scale.yStd * f.scale.yStd);
}

export function sampleCurve(f: Fit, n = CURVE_POINTS): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const x = f.scale.xMin + (f.scale.xSpan * i) / (n - 1);
    out.push([round(x), round(predictAt(f, x))]);
  }
  return out;
}

const round = (v: number) => Math.round(v * 1000) / 1000;

export interface TrainResult {
  widths: number[];
  epochs: number;
  trainError: number;
  testError: number;
  curve: Point[];
}

export function resultOf(f: Fit): TrainResult {
  return { widths: [...f.widths], epochs: f.epoch, trainError: round(errorOn(f, f.data.train)), testError: round(errorOn(f, f.data.test)), curve: sampleCurve(f) };
}

export type Diagnosis = "underfit" | "overfit" | "good";

/** Names what the two errors say together. Never leans on one number alone. */
export function diagnose(trainError: number, testError: number): Diagnosis {
  if (trainError > 0.2 && testError > 0.1) return "underfit";
  if (testError > 0.1 && testError > 2 * trainError + 0.05) return "overfit";
  return "good";
}

/**
 * Train one or more fits in short slices so the page stays responsive. Each
 * slice is time-boxed; the result does not depend on how the work is sliced.
 * Returns a cancel function.
 */
export function trainAsync(fits: Fit[], opts: { epochs?: number; onProgress?: (done: number, total: number, fits: Fit[]) => void; onDone: (fits: Fit[]) => void; sliceMs?: number }): () => void {
  const epochs = Math.min(MAX_EPOCHS, opts.epochs ?? MAX_EPOCHS);
  const sliceMs = opts.sliceMs ?? 12;
  const total = epochs * fits.length;
  let done = 0;
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    if (cancelled) return;
    const start = Date.now();
    do {
      const idx = Math.floor(done / epochs);
      const fit = fits[idx]!;
      const chunk = Math.min(10, epochs - (done - idx * epochs));
      stepFit(fit, chunk);
      done += chunk;
    } while (done < total && Date.now() - start < sliceMs);
    opts.onProgress?.(done, total, fits);
    if (done >= total) opts.onDone(fits);
    else timer = setTimeout(run, 0);
  };
  timer = setTimeout(run, 0);
  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}
