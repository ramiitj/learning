"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, ChoiceGroup, Tally, useFocusAfter, type BlockProps, type Counts } from "@lm/engine";
import { GlossaryRow } from "../glossary";
import type { LayerBuilderConfig } from "./contract";
import { MAX_EPOCHS, betterOn, createFit, diagnose, parameterCount, resolveDataset, resultOf, sampleCurve, trainAsync, type BetterOn, type Dataset, type Fit, type Point, type TrainResult } from "./model";

export interface LayerBuilderState {
  /** Hidden layer widths the learner has built. */
  widths?: number[];
  /** What the last training run produced for exactly these widths. */
  result?: TrainResult;
  /** Personal: what the learner predicted before pressing Train, and the prediction the shown result answers. */
  guess?: BetterOn;
  predicted?: BetterOn;
  /** Classroom: show-of-hands counts, whether the tally is on screen, and both trained networks. */
  counts?: Counts;
  tallyShown?: boolean;
  small?: TrainResult;
  big?: TrainResult;
}

type Props = BlockProps<LayerBuilderConfig & Record<string, unknown>, LayerBuilderState>;
type Ui = Props["ui"];

const W = 320;
const H = 200;
const PAD = 14;

function useNumber(locale: string, digits = 2) {
  return (n: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

function startWidths(c: LayerBuilderConfig): number[] {
  return [Math.min(3, c.maxWidth)];
}
const smallWidths = (c: LayerBuilderConfig): number[] => [Math.min(2, c.maxWidth)];
const bigWidths = (c: LayerBuilderConfig): number[] => Array.from({ length: c.maxLayers }, () => c.maxWidth);

/** The data, the fitted curve, and the two kinds of point told apart by shape as well as position. */
function Chart({ data, curve, ui, locale, big = false }: { data: Dataset; curve?: Point[]; ui: Ui; locale: string; big?: boolean }) {
  const f1 = useNumber(locale, 1);
  const r = big ? 7 : 4;
  /** Test squares are larger than the training dots and hollow, so a dot on the same spot still shows inside the square. */
  const q = r * 1.7;
  const all = [...data.train, ...data.test, ...(curve ?? [])];
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const sx = (W - 2 * PAD) / (Math.max(...xs) - x0 || 1);
  const sy = (H - 2 * PAD) / (Math.max(...ys) - y0 || 1);
  const px = (x: number) => PAD + (x - x0) * sx;
  const py = (y: number) => H - PAD - (y - y0) * sy;
  const dataYs = [...data.train, ...data.test].map((p) => p[1]);
  const base = ui("chartLabel", { train: data.train.length, test: data.test.length, low: f1(Math.min(...dataYs)), high: f1(Math.max(...dataYs)) });
  const cy = (curve ?? []).map((p) => p[1]);
  const label = curve && curve.length > 1 ? `${base} ${ui("chartCurve", { start: f1(curve[0]![1]), end: f1(curve[curve.length - 1]![1]), low: f1(Math.min(...cy)), high: f1(Math.max(...cy)) })}` : base;
  return (
    <figure className={`lm-layers-chart${big ? " lm-layers-chart--class" : ""}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} focusable="false">
        <rect className="lm-layers-chart__bg" x="0" y="0" width={W} height={H} rx="8" />
        {curve && curve.length > 1 ? <polyline className="lm-layers-chart__curve" points={curve.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(" ")} /> : null}
        {data.test.map(([x, y], i) => (
          <g key={`t${i}`}>
            <rect className="lm-layers-chart__halo" x={px(x) - q} y={py(y) - q} width={2 * q} height={2 * q} />
            <rect className="lm-layers-chart__test" x={px(x) - q} y={py(y) - q} width={2 * q} height={2 * q} />
          </g>
        ))}
        {data.train.map(([x, y], i) => (
          <circle key={`r${i}`} className="lm-layers-chart__train" cx={px(x)} cy={py(y)} r={r} />
        ))}
      </svg>
      <figcaption className="lm-small lm-muted">
        <span>● {ui("legendTrain")}</span> <span>□ {ui("legendTest")}</span> <span>— {ui("legendCurve")}</span>
      </figcaption>
    </figure>
  );
}

/** Both errors as numbers and as a pair of bars, with the pattern named in words. */
function Errors({ result, ui, fmt, predicted }: { result: TrainResult; ui: Ui; fmt: (n: number) => string; predicted?: BetterOn }) {
  const verdict = diagnose(result.trainError, result.testError);
  const bar = (v: number) => `${Math.min(100, Math.max(0, v * 100))}%`;
  return (
    <div className="lm-layers-errors">
      <dl className="lm-layers-errors__list">
        <div>
          <dt>{ui("trainError")}</dt>
          <dd>
            <strong>{fmt(result.trainError)}</strong>
            <span className="lm-bar" aria-hidden="true"><span className="lm-bar__fill" style={{ inlineSize: bar(result.trainError) }} /></span>
          </dd>
        </div>
        <div>
          <dt>{ui("testError")}</dt>
          <dd>
            <strong>{fmt(result.testError)}</strong>
            <span className="lm-bar" aria-hidden="true"><span className="lm-bar__fill" style={{ inlineSize: bar(result.testError) }} /></span>
          </dd>
        </div>
      </dl>
      <p className="lm-small lm-muted">{ui("errorHelp")}</p>
      {predicted ? <p>{ui("youPredicted", { guess: ui(`guess_${predicted}`), actual: ui(`guess_${betterOn(result.trainError, result.testError)}`) })}</p> : null}
      <div className="lm-notice" data-verdict={verdict}>
        <strong>{ui(`${verdict}Title`)}</strong> {ui(verdict)}
      </div>
    </div>
  );
}

interface Run {
  percent: number;
  curves: (Point[] | undefined)[];
}

/** Runs training in short slices; cancels itself on unmount or when `cancelKey` changes. */
function useTrainer(cancelKey: string) {
  const [run, setRun] = useState<Run | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const [note, setNote] = useState<"started" | "stopped" | null>(null);
  const cancel = () => {
    cancelRef.current?.();
    cancelRef.current = null;
  };
  useEffect(
    () => () => {
      cancel();
      setRun(null);
    },
    [cancelKey],
  );
  const start = (fits: Fit[], onDone: (results: TrainResult[]) => void) => {
    cancel();
    setNote("started");
    setRun({ percent: 0, curves: fits.map(() => undefined) });
    cancelRef.current = trainAsync(fits, {
      onProgress: (done, total, fs) => setRun({ percent: Math.round((done / total) * 100), curves: fs.map((f) => (f.epoch > 0 ? sampleCurve(f, 25) : undefined)) }),
      onDone: (fs) => {
        cancelRef.current = null;
        setRun(null);
        setNote(null);
        onDone(fs.map(resultOf));
      },
    });
  };
  const stop = () => {
    cancel();
    setRun(null);
    setNote("stopped");
  };
  return { run, start, stop, note };
}

function Progress({ run, ui }: { run: Run | null; ui: Ui }) {
  return run ? (
    <p className="lm-layers-progress">
      <progress max={100} value={run.percent} aria-label={ui("trainingLabel")} />
      <span className="lm-small lm-muted">{ui("training", { percent: run.percent })}</span>
    </p>
  ) : null;
}

function Stepper({ index, value, min, max, disabled, ui, onChange }: { index: number; value: number; min: number; max: number; disabled: boolean; ui: Ui; onChange: (v: number) => void }) {
  return (
    <span className="lm-layers-stepper">
      <Button variant="secondary" className="lm-layers-step" aria-label={ui("fewer", { n: index + 1 })} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>−</Button>
      <output className="lm-layers-width" aria-live="polite">{ui("neurons", { n: value })}</output>
      <Button variant="secondary" className="lm-layers-step" aria-label={ui("more", { n: index + 1 })} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>+</Button>
    </span>
  );
}

export function LayerBuilder({ block, config, state, setState, t, ui, locale }: Props) {
  const fmt = useNumber(locale);
  const trainSteps = new Intl.NumberFormat(locale).format(MAX_EPOCHS);
  const data = useMemo(() => resolveDataset(config.dataset), [config.dataset]);
  const widths = state?.widths ?? startWidths(config);
  const result = state?.result;
  const trainer = useTrainer(`${widths.join(",")}|${state === undefined}`);
  const running = !!trainer.run;
  const listFocus = useFocusAfter<HTMLDivElement>(widths.length);

  const update = (next: number[]) => setState((prev) => ({ widths: next, guess: prev?.guess }));
  const live = trainer.run?.curves[0] ?? result?.curve;

  const train = () => {
    const fit = createFit(widths, data);
    trainer.start([fit], ([res]) => setState((prev) => ({ widths, result: res!, predicted: prev?.guess })));
  };

  return (
    <div className="lm-layers">
      <p className="lm-lead">{t.rich(config.promptKey)}</p>
      {config.analogyKey ? <div className="lm-callout" data-tone="insight">{t.rich(config.analogyKey)}</div> : null}
      {config.analogyKey && config.analogyBreaksKey ? <div className="lm-callout" data-tone="warm">{t.rich(config.analogyBreaksKey)}</div> : null}
      <p className="lm-small lm-muted">{ui("glossNetwork")}</p>
      <GlossaryRow ids={config.glossary} ui={ui} />
      {!running ? (
        <ChoiceGroup
          legend={ui("predictQuestion")}
          name={`${block.id}-guess`}
          choices={(["train", "new", "same"] as const).map((g) => ({ id: g, label: ui(`guess_${g}`) }))}
          value={state?.guess}
          onChange={(guess) => setState((prev) => ({ ...prev, guess: guess as BetterOn }))}
        />
      ) : null}
      <fieldset className="lm-layers-build">
        <legend>{ui("yourNetwork")}</legend>
        <div ref={listFocus.ref} tabIndex={-1} className="lm-layers-list">
          {widths.map((w, i) => (
            <div className="lm-layers-row" key={i}>
              <span className="lm-layers-name">{ui("layer", { n: i + 1 })}</span>
              <Stepper index={i} value={w} min={1} max={config.maxWidth} disabled={running} ui={ui} onChange={(v) => update(widths.map((x, j) => (j === i ? v : x)))} />
              {widths.length > 1 ? (
                <Button variant="quiet" disabled={running} onClick={() => { listFocus.arm(); update(widths.filter((_, j) => j !== i)); }}>{ui("removeLayer", { n: i + 1 })}</Button>
              ) : null}
            </div>
          ))}
        </div>
        <div className="lm-row lm-layers-actions">
          {widths.length < config.maxLayers ? (
            <Button variant="secondary" disabled={running} onClick={() => update([...widths, Math.min(widths[widths.length - 1] ?? 3, config.maxWidth)])}>{ui("addLayer")}</Button>
          ) : null}
          {running ? <Button variant="secondary" onClick={trainer.stop}>{ui("stop")}</Button> : <Button variant="primary" disabled={!state?.guess} onClick={train}>{ui("train", { n: trainSteps })}</Button>}
        </div>
        {!running && !state?.guess ? <p className="lm-small lm-muted">{ui("predictFirst")}</p> : null}
        <p className="lm-small lm-muted">{ui("networkSize", { layers: widths.length, params: parameterCount(widths) })}</p>
      </fieldset>
      <Progress run={trainer.run} ui={ui} />
      <p className="lm-layers-status" role="status">
        {running ? ui("trainingStarted") : result ? ui("trainDone", { train: fmt(result.trainError), test: fmt(result.testError) }) : trainer.note === "stopped" ? ui("stopped") : ""}
      </p>
      <Chart data={data} curve={live} ui={ui} locale={locale} />
      {result ? (
        <>
          <Errors result={result} ui={ui} fmt={fmt} predicted={state?.predicted} />
          {config.explainKey ? <div className="lm-insight">{t.rich(config.explainKey)}</div> : null}
        </>
      ) : !running ? (
        <p className="lm-muted">{ui("notTrained")}</p>
      ) : null}
    </div>
  );
}

/** Classroom: the class votes small or big, then the teacher trains both and the results go side by side. */
export function LayerBuilderClassroom({ config, state, setState, t, ui, locale }: Props) {
  const fmt = useNumber(locale);
  const trainSteps = new Intl.NumberFormat(locale).format(MAX_EPOCHS);
  const data = useMemo(() => resolveDataset(config.dataset), [config.dataset]);
  const trainer = useTrainer(`${state === undefined}`);
  const running = !!trainer.run;
  const hasVote = !!(config.smallKey && config.bigKey);
  const focus = useFocusAfter<HTMLDivElement>(!!state?.big);
  const nets = [
    { id: "small", widths: smallWidths(config), name: config.smallKey ? t.text(config.smallKey) : ui("smallName"), result: state?.small },
    { id: "big", widths: bigWidths(config), name: config.bigKey ? t.text(config.bigKey) : ui("bigName"), result: state?.big },
  ];
  const done = !!(state?.small && state?.big);

  const trainBoth = () => {
    focus.arm();
    trainer.start(nets.map((n) => createFit(n.widths, data)), ([small, big]) => setState((prev) => ({ ...prev, small: small!, big: big! })));
  };
  const better = done ? (state!.small!.testError === state!.big!.testError ? null : state!.small!.testError < state!.big!.testError ? nets[0]! : nets[1]!) : null;

  return (
    <div className="lm-layers">
      <h3 className="lm-prompt">{t.rich(config.promptKey)}</h3>
      {config.analogyKey ? <div className="lm-callout" data-tone="insight">{t.rich(config.analogyKey)}</div> : null}
      {config.analogyKey && config.analogyBreaksKey ? <div className="lm-callout" data-tone="warm">{t.rich(config.analogyBreaksKey)}</div> : null}
      <p className="lm-small lm-muted">{ui("glossNetwork")}</p>
      <GlossaryRow ids={config.glossary} ui={ui} />
      {hasVote ? (
        <>
          <p className="lm-lead">{ui("voteIntro")}</p>
          <Tally
            ui={ui}
            options={nets.map((n) => ({ id: n.id, label: n.name, text: n.name }))}
            counts={state?.counts ?? {}}
            onChange={(counts) => setState((prev) => ({ ...prev, counts }), { coalesce: true })}
            revealed={!!state?.tallyShown}
            onReveal={(tallyShown) => setState((prev) => ({ ...prev, tallyShown }))}
            highlight={better?.id}
          />
        </>
      ) : null}
      <div className="lm-row lm-layers-actions">
        {running ? <Button variant="secondary" onClick={trainer.stop}>{ui("stop")}</Button> : <Button variant="primary" disabled={hasVote && !state?.tallyShown} onClick={trainBoth}>{ui("trainBoth", { n: trainSteps })}</Button>}
      </div>
      {hasVote && !state?.tallyShown && !running ? <p className="lm-small lm-muted">{ui("voteFirst")}</p> : null}
      <Progress run={trainer.run} ui={ui} />
      <p className="lm-layers-status" role="status">
        {running ? ui("trainingStarted") : done ? ui("trainDoneBoth", { small: nets[0]!.name, smallTrain: fmt(state!.small!.trainError), smallTest: fmt(state!.small!.testError), big: nets[1]!.name, bigTrain: fmt(state!.big!.trainError), bigTest: fmt(state!.big!.testError) }) : trainer.note === "stopped" ? ui("stopped") : ""}
      </p>
      <div ref={focus.ref} tabIndex={-1} className="lm-layers-pair">
        {nets.map((n, i) => (
          <section key={n.id} className="lm-card" aria-label={n.name}>
            <h4>{n.name}</h4>
            <p className="lm-small lm-muted">{ui("shape", { layers: n.widths.length, widths: n.widths.join(", ") })}</p>
            <Chart data={data} curve={trainer.run?.curves[i] ?? n.result?.curve} ui={ui} locale={locale} big />
            {n.result ? <Errors result={n.result} ui={ui} fmt={fmt} /> : null}
          </section>
        ))}
      </div>
      {done ? (
        <>
          <p className="lm-lead">{better ? ui("better", { name: better.name }) : ui("sameError")}</p>
          {config.explainKey ? <div className="lm-insight">{t.rich(config.explainKey)}</div> : null}
        </>
      ) : null}
    </div>
  );
}
