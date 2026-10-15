"use client";
import { useId } from "react";
import { addCounts, Button, Tally, useFocusAfter, useLiveCounts, type BlockProps, type Counts } from "@lm/engine";
import type { HillsideConfig } from "./contract";
import {
  curvePoints,
  fogRadius,
  globalMinimum,
  height,
  HEIGHT_MAX,
  majority,
  outcome,
  resolveWalk,
  slope,
  slopeKind,
  takeStep,
  type Direction,
  type Landscape,
  type Outcome,
  type Walk,
} from "./model";

export interface HillsideState {
  /** Every position the learner has stood on, starting with the start. */
  positions?: number[];
  /** The chosen step size. */
  size?: number;
  /** The fog has been faded into the full curve. */
  faded?: boolean;
  /** Classroom: hands counted for this step and whether the count is on screen. */
  counts?: Counts;
  tallyShown?: boolean;
}

type Props = BlockProps<HillsideConfig & Record<string, unknown>, HillsideState>;
type T = Props["t"];
type Ui = Props["ui"];

const W = 300;
const H = 140;
const PAD = 12;
const sx = (frac: number) => PAD + frac * (W - 2 * PAD);
const sy = (h: number) => H - PAD - (h / HEIGHT_MAX) * (H - 2 * PAD);
const pointsAttr = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

function useWalk(config: HillsideConfig, state: HillsideState | undefined) {
  const walk = resolveWalk(config);
  const positions = state?.positions && state.positions.length ? state.positions : [walk.start];
  const here = positions[positions.length - 1]!;
  const size = Math.min(walk.stepMax, Math.max(walk.stepMin, state?.size ?? (walk.stepMin + walk.stepMax) / 2));
  const result = outcome(walk.landscape, positions, walk.stepMin, walk.maxSteps);
  return { walk, positions, here, size, result, done: result !== "walking", stepsLeft: walk.maxSteps - (positions.length - 1) };
}

function fmtNum(locale: string) {
  const f = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return (n: number) => f.format(Math.round(n * 10) / 10);
}

const SLOPE_KEY = { flat: "slopeFlat", uphillRight: "slopeUphillRight", downhillRight: "slopeDownhillRight" } as const;

function slopeText(l: Landscape, x: number, ui: Ui): string {
  return ui(SLOPE_KEY[slopeKind(slope(l, x))]);
}

/** What the learner can see: a small window of the ground around them. Fog (hatching) fills the rest. */
function FogView({ walk, positions, here, ui, locale }: { walk: Walk; positions: number[]; here: number; ui: Ui; locale: string }) {
  const id = useId();
  const f = fmtNum(locale);
  const r = fogRadius(walk.landscape, walk.stepMax);
  const lo = here - r;
  const frac = (x: number) => (x - lo) / (2 * r);
  const line = curvePoints(walk.landscape, lo, here + r, 50).map((p) => ({ x: sx(frac(p.x)), y: sy(p.h) }));
  const hHere = height(walk.landscape, here);
  const seen = positions.slice(0, -1).filter((p) => Math.abs(p - here) <= r);
  return (
    <svg className="lm-hill__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ui("fogAlt", { height: f(hHere), slope: slopeText(walk.landscape, here, ui) })}>
      <defs>
        <pattern id={`${id}-fog`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="var(--color-surface-2)" />
      <rect x="0" y="0" width={PAD + 24} height={H} fill={`url(#${id}-fog)`} />
      <rect x={W - PAD - 24} y="0" width={PAD + 24} height={H} fill={`url(#${id}-fog)`} />
      <polyline points={pointsAttr(line)} fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
      {seen.map((p) => (
        <rect key={p} x={sx(frac(p)) - 4} y={sy(height(walk.landscape, p)) - 4} width="8" height="8" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
      ))}
      <line x1={sx(0.5)} x2={sx(0.5)} y1={sy(hHere)} y2={H - PAD} stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx={sx(0.5)} cy={sy(hHere)} r="8" fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2" />
    </svg>
  );
}

function Legend({ ui }: { ui: Ui }) {
  const shape = (child: React.ReactNode) => (
    <svg className="lm-hill__swatch" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">{child}</svg>
  );
  return (
    <ul className="lm-hill__legend lm-small">
      <li>{shape(<rect x="3" y="3" width="10" height="10" fill="var(--color-ink)" />)} {ui("legendStart")}</li>
      <li>{shape(<polygon points="8,1 15,8 8,15 1,8" fill="var(--color-accent)" />)} {ui("legendEnd")}</li>
      <li>{shape(<circle cx="8" cy="8" r="4" fill="var(--color-ink)" />)} {ui("legendPath")}</li>
      <li>{shape(<line x1="0" x2="16" y1="8" y2="8" stroke="var(--color-insight)" strokeWidth="3" strokeDasharray="4 3" />)} {ui("legendLowest")}</li>
    </ul>
  );
}

const diamond = (cx: number, cy: number, r: number) => `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;

/** The fog fades: the whole curve, the path walked, the lowest ground, and the height-over-steps (loss) chart. */
function FullView({ walk, positions, ui, locale }: { walk: Walk; positions: number[]; ui: Ui; locale: string }) {
  const f = fmtNum(locale);
  const l = walk.landscape;
  const frac = (x: number) => (x - l.min) / (l.max - l.min);
  const curve = curvePoints(l, l.min, l.max, 80).map((p) => ({ x: sx(frac(p.x)), y: sy(p.h) }));
  const pts = positions.map((p) => ({ x: sx(frac(p)), y: sy(height(l, p)) }));
  const heights = positions.map((p) => height(l, p));
  const low = globalMinimum(l);
  const last = pts[pts.length - 1]!;
  const n = Math.max(1, positions.length - 1);
  const loss = heights.map((h, i) => ({ x: sx(i / n), y: sy(h) }));
  return (
    <div className="lm-hill__full lm-stack">
      <h3 className="lm-hill__heading">{ui("hillHeading")}</h3>
      <svg className="lm-hill__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ui("fullAlt", { height: f(heights[heights.length - 1]!) })}>
        <rect x="0" y="0" width={W} height={H} fill="var(--color-surface-2)" />
        <line x1={PAD} x2={W - PAD} y1={sy(low.h)} y2={sy(low.h)} stroke="var(--color-insight)" strokeWidth="2" strokeDasharray="4 3" />
        <polyline points={pointsAttr(curve)} fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
        <polyline points={pointsAttr(pts)} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="5 3" />
        {pts.slice(1, -1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--color-ink)" />
        ))}
        <rect x={pts[0]!.x - 5} y={pts[0]!.y - 5} width="10" height="10" fill="var(--color-ink)" />
        {pts.length > 1 ? <polygon points={diamond(last.x, last.y, 8)} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2" /> : null}
      </svg>
      <h3 className="lm-hill__heading">{ui("lossHeading")}</h3>
      <svg className="lm-hill__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ui("lossAlt", { first: f(heights[0]!), last: f(heights[heights.length - 1]!), steps: positions.length - 1 })}>
        <rect x="0" y="0" width={W} height={H} fill="var(--color-surface-2)" />
        <line x1={PAD} x2={W - PAD} y1={sy(low.h)} y2={sy(low.h)} stroke="var(--color-insight)" strokeWidth="2" strokeDasharray="4 3" />
        <polyline points={pointsAttr(loss)} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinejoin="round" />
        {loss.slice(1, -1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--color-ink)" />
        ))}
        <rect x={loss[0]!.x - 5} y={loss[0]!.y - 5} width="10" height="10" fill="var(--color-ink)" />
        {loss.length > 1 ? <polygon points={diamond(loss[loss.length - 1]!.x, loss[loss.length - 1]!.y, 8)} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2" /> : null}
      </svg>
      <Legend ui={ui} />
    </div>
  );
}

function StepTable({ walk, positions, ui, locale }: { walk: Walk; positions: number[]; ui: Ui; locale: string }) {
  const f = fmtNum(locale);
  return (
    <details className="lm-hill__table">
      <summary>{ui("tableToggle")}</summary>
      <table>
        <caption>{ui("tableCaption")}</caption>
        <thead>
          <tr><th scope="col">{ui("colStep")}</th><th scope="col">{ui("colPosition")}</th><th scope="col">{ui("colHeight")}</th></tr>
        </thead>
        <tbody>
          {positions.map((p, i) => (
            <tr key={i}>
              <th scope="row">{i === 0 ? ui("rowStart") : i}</th>
              <td>{f(p)}</td>
              <td>{f(height(walk.landscape, p))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function SizeSlider({ walk, size, onChange, ui, locale, idPrefix }: { walk: Walk; size: number; onChange: (n: number) => void; ui: Ui; locale: string; idPrefix: string }) {
  const f = fmtNum(locale);
  const step = (walk.stepMax - walk.stepMin) / 9 || 1;
  return (
    <div className="lm-hill__size">
      <label htmlFor={`${idPrefix}-size`}>{ui("stepSize")}</label>
      <div className="lm-row">
        <input id={`${idPrefix}-size`} type="range" min={walk.stepMin} max={walk.stepMax} step={step} value={size} disabled={walk.stepMin === walk.stepMax} onChange={(e) => onChange(Number(e.target.value))} aria-describedby={`${idPrefix}-size-out`} />
        <output id={`${idPrefix}-size-out`} htmlFor={`${idPrefix}-size`}>{f(size)}</output>
      </div>
    </div>
  );
}

function Status({ walk, positions, here, t, ui, locale, config }: { walk: Walk; positions: number[]; here: number; t: T; ui: Ui; locale: string; config: HillsideConfig; }) {
  const f = fmtNum(locale);
  const n = positions.length - 1;
  const text =
    n === 0
      ? ui("atStart", { height: f(height(walk.landscape, here)) })
      : ui("announce", {
          n,
          direction: t.text(positions[n]! < positions[n - 1]! ? config.leftKey : config.rightKey),
          height: f(height(walk.landscape, here)),
          before: f(height(walk.landscape, positions[n - 1]!)),
        });
  return <p className="lm-hill__status" role="status">{text}</p>;
}

function Surroundings({ walk, here, positions, ui, locale }: { walk: Walk; here: number; positions: number[]; ui: Ui; locale: string }) {
  const f = fmtNum(locale);
  const s = slope(walk.landscape, here);
  return (
    <div className="lm-hill__readout">
      <p className="lm-lead lm-hill__height">{ui("heightHere", { height: f(height(walk.landscape, here)) })}</p>
      <p>{ui("positionHere", { position: f(here) })} · {ui("slopeNumber", { slope: `${s > 0 ? "+" : ""}${f(s)}` })}</p>
      <p>{slopeText(walk.landscape, here, ui)}</p>
      <p className="lm-muted lm-small lm-hill__trail">{ui("trail", { list: positions.map((p) => f(height(walk.landscape, p))).join(" → ") })}</p>
    </div>
  );
}

const OUTCOME_KEY: Record<Exclude<Outcome, "walking">, string> = { bottom: "outcomeBottom", trapped: "outcomeTrapped", budget: "outcomeBudget" };

function Finish({ result, faded, onFade, config, t, ui, focusRef }: { result: Exclude<Outcome, "walking">; faded: boolean; onFade: (v: boolean) => void; config: HillsideConfig; t: T; ui: Ui; focusRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={focusRef} tabIndex={-1} className="lm-stack lm-hill__finish">
      <p className="lm-callout" data-tone={result === "bottom" ? "insight" : "warm"}>{ui(OUTCOME_KEY[result])}</p>
      <div className="lm-row">
        <Button variant="primary" aria-pressed={faded} onClick={() => onFade(!faded)}>{ui("fadeToggle")}</Button>
        <span className="lm-muted lm-small">{ui("fadeHelp")}</span>
      </div>
      {faded && config.fadeKey ? <div className="lm-insight">{t.rich(config.fadeKey)}</div> : null}
    </div>
  );
}

export function Hillside({ block, config, state, setState, t, ui, locale }: Props) {
  const w = useWalk(config, state);
  const focus = useFocusAfter<HTMLDivElement>(w.done);
  const move = (dir: Direction) => {
    const next = [...w.positions, takeStep(w.walk.landscape, w.here, dir, w.size)];
    if (outcome(w.walk.landscape, next, w.walk.stepMin, w.walk.maxSteps) !== "walking") focus.arm();
    setState((prev) => ({ ...prev, positions: next, size: w.size }));
  };
  const idPrefix = `hill-${block.id}`;
  return (
    <div className="lm-hill">
      <p className="lm-lead">{t.rich(config.promptKey)}</p>
      {config.goalKey ? <p className="lm-notice">{t.rich(config.goalKey)}</p> : null}
      {state?.faded && w.done ? <FullView walk={w.walk} positions={w.positions} ui={ui} locale={locale} /> : <FogView walk={w.walk} positions={w.positions} here={w.here} ui={ui} locale={locale} />}
      <Surroundings walk={w.walk} here={w.here} positions={w.positions} ui={ui} locale={locale} />
      <Status walk={w.walk} positions={w.positions} here={w.here} t={t} ui={ui} locale={locale} config={config} />
      {!w.done ? (
        <div className="lm-hill__controls">
          <SizeSlider walk={w.walk} size={w.size} onChange={(size) => setState((prev) => ({ ...prev, size }), { coalesce: true })} ui={ui} locale={locale} idPrefix={idPrefix} />
          <div className="lm-row">
            <Button variant="primary" onClick={() => move("left")}><span aria-hidden="true">← </span>{t.text(config.leftKey)}</Button>
            <Button variant="primary" onClick={() => move("right")}>{t.text(config.rightKey)}<span aria-hidden="true"> →</span></Button>
          </div>
          <p className="lm-muted lm-small">{ui("stepsLeft", { n: w.stepsLeft })}</p>
        </div>
      ) : (
        <Finish result={w.result as Exclude<Outcome, "walking">} faded={!!state?.faded} onFade={(faded) => setState((prev) => ({ ...prev, faded }))} config={config} t={t} ui={ui} focusRef={focus.ref} />
      )}
      {w.positions.length > 1 ? <StepTable walk={w.walk} positions={w.positions} ui={ui} locale={locale} /> : null}
    </div>
  );
}

/** Classroom: the class votes left or right for every step; the teacher takes it. */
export function HillsideClassroom({ block, config, state, setState, t, ui, locale }: Props) {
  const w = useWalk(config, state);
  const focus = useFocusAfter<HTMLDivElement>(w.done);
  const phones = useLiveCounts();
  const counts: Counts = state?.counts ?? {};
  const decision = majority(addCounts(counts, phones));
  const shown = !!state?.tallyShown;
  const options = [
    { id: "left", label: t.rich(config.leftKey), text: t.text(config.leftKey) },
    { id: "right", label: t.rich(config.rightKey), text: t.text(config.rightKey) },
  ];
  const take = () => {
    if (!decision) return;
    const next = [...w.positions, takeStep(w.walk.landscape, w.here, decision, w.size)];
    if (outcome(w.walk.landscape, next, w.walk.stepMin, w.walk.maxSteps) !== "walking") focus.arm();
    setState((prev) => ({ ...prev, positions: next, size: w.size, counts: {}, tallyShown: false }));
  };
  const idPrefix = `hill-${block.id}-class`;
  return (
    <div className="lm-hill lm-hill--classroom">
      <p className="lm-lead">{t.rich(config.promptKey)}</p>
      {config.goalKey ? <p className="lm-notice">{t.rich(config.goalKey)}</p> : null}
      {state?.faded && w.done ? <FullView walk={w.walk} positions={w.positions} ui={ui} locale={locale} /> : <FogView walk={w.walk} positions={w.positions} here={w.here} ui={ui} locale={locale} />}
      <Surroundings walk={w.walk} here={w.here} positions={w.positions} ui={ui} locale={locale} />
      <Status walk={w.walk} positions={w.positions} here={w.here} t={t} ui={ui} locale={locale} config={config} />
      {!w.done ? (
        <div className="lm-hill__controls">
          <h3 className="lm-hill__heading">{ui("classHeading")}</h3>
          <p className="lm-muted">{ui("classIntro")}</p>
          <SizeSlider walk={w.walk} size={w.size} onChange={(size) => setState((prev) => ({ ...prev, size }), { coalesce: true })} ui={ui} locale={locale} idPrefix={idPrefix} />
          <Tally ui={ui} options={options} counts={counts} onChange={(c) => setState((prev) => ({ ...prev, counts: c }), { coalesce: true })} revealed={shown} onReveal={(v) => setState((prev) => ({ ...prev, tallyShown: v }))} highlight={shown ? (decision ?? undefined) : undefined} />
          {shown && !decision ? <p className="lm-notice" role="status">{ui("classTie")}</p> : null}
          <Button variant="primary" disabled={!shown || !decision} onClick={take}>{ui("classTake")}</Button>
          <p className="lm-muted lm-small">{ui("stepsLeft", { n: w.stepsLeft })}</p>
        </div>
      ) : (
        <Finish result={w.result as Exclude<Outcome, "walking">} faded={!!state?.faded} onFade={(faded) => setState((prev) => ({ ...prev, faded }))} config={config} t={t} ui={ui} focusRef={focus.ref} />
      )}
      {w.positions.length > 1 ? <StepTable walk={w.walk} positions={w.positions} ui={ui} locale={locale} /> : null}
    </div>
  );
}
