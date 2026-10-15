"use client";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Button, ChoiceGroup, Tally, type BlockProps, type Counts } from "@lm/engine";
import { GlossaryRow } from "../glossary";
import type { PixelGridConfig, PixelTool } from "./contract";
import { MAX_SHADE, blankGrid, blur, cellCount, clampSize, countChanged, fitGrid, inkCount, setCell, shift, toggleCell, type Direction, type Grid } from "./model";

export interface PixelGridState {
  cells?: Grid;
  view?: "picture" | "numbers";
  tool?: "draw" | "erase";
  /** What the last blur or shift did, for the "how many numbers changed" line. */
  last?: { op: "blur" | "shift"; changed: number; total: number };
  /** Classroom: show-of-hands counts for the shift prediction. */
  counts?: Counts;
  tallyShown?: boolean;
  /** Personal: what the learner predicted before shifting. */
  guess?: "same" | "different";
}

type Props = BlockProps<PixelGridConfig & Record<string, unknown>, PixelGridState>;
const ALL_TOOLS: PixelTool[] = ["draw", "erase", "blur", "shift"];
const DIRECTIONS: Direction[] = ["left", "right", "up", "down"];
const DIRECTION_KEY = { left: "shiftLeft", right: "shiftRight", up: "shiftUp", down: "shiftDown" } as const;

export function PixelGrid(props: Props) {
  return <Sim {...props} classroom={false} />;
}
export function PixelGridClassroom(props: Props) {
  return <Sim {...props} classroom />;
}

function Sim({ config, state, setState, t, ui, classroom, block }: Props & { classroom: boolean }) {
  const size = clampSize(config.size);
  const tools = config.tools ?? ALL_TOOLS;
  const canDraw = tools.includes("draw");
  const canErase = tools.includes("erase");
  const brush: "draw" | "erase" = state?.tool === "erase" && canErase ? "erase" : canDraw ? "draw" : "erase";
  const paintable = canDraw || canErase;
  const view = state?.view ?? "picture";
  const cells = fitGrid(state?.cells, size);
  const ink = inkCount(cells);
  const vote = !!config.sameKey && !!config.differentKey;
  const canShift = tools.includes("shift");
  // Shifting waits for a prediction: the class's revealed count, or the learner's own choice.
  const shiftLocked = canShift && (classroom ? vote && !state?.tallyShown : !state?.guess);
  const guessLabel = (g: "same" | "different") => (vote ? t.text(g === "same" ? config.sameKey! : config.differentKey!) : ui(g === "same" ? "predictSame" : "predictDifferent"));

  const gridRef = useRef<HTMLDivElement>(null);
  const painting = useRef(false);
  const [cursor, setCursor] = useState({ r: 0, c: 0 });
  const [announce, setAnnounce] = useState("");

  const edit = (fn: (g: Grid) => Grid, extra: Partial<PixelGridState> = {}, coalesce = false) =>
    setState((prev) => ({ ...prev, cells: fn(fitGrid(prev?.cells, size)), last: undefined, ...extra }), { coalesce });

  const paint = (r: number, c: number) => {
    const v = brush === "erase" ? 0 : MAX_SHADE;
    if (cells[r]?.[c] === v) return;
    edit((g) => setCell(g, r, c, v), {}, true);
  };

  const cellAt = (e: PointerEvent<HTMLDivElement>): { r: number; c: number } | null => {
    const hit = typeof document.elementFromPoint === "function" ? document.elementFromPoint(e.clientX, e.clientY) : null;
    const el = ((hit ?? e.target) as HTMLElement | null)?.closest<HTMLElement>("[data-r]");
    if (!el || !gridRef.current?.contains(el)) return null;
    return { r: Number(el.dataset.r), c: Number(el.dataset.c) };
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!paintable || (e.pointerType === "mouse" && e.button !== 0)) return;
    const p = cellAt(e);
    if (!p) return;
    painting.current = true;
    setCursor(p);
    paint(p.r, p.c);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!painting.current) return;
    const p = cellAt(e);
    if (p) paint(p.r, p.c);
  };
  const stop = () => {
    painting.current = false;
  };

  const focusCell = (r: number, c: number) => {
    setCursor({ r, c });
    gridRef.current?.querySelector<HTMLElement>(`[data-r="${r}"][data-c="${c}"]`)?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const { r, c } = cursor;
    const max = size - 1;
    const moves: Record<string, [number, number]> = { ArrowUp: [r - 1, c], ArrowDown: [r + 1, c], ArrowLeft: [r, c - 1], ArrowRight: [r, c + 1], Home: [r, 0], End: [r, max] };
    const to = moves[e.key];
    if (to) {
      e.preventDefault();
      focusCell(Math.min(max, Math.max(0, to[0])), Math.min(max, Math.max(0, to[1])));
    } else if ((e.key === " " || e.key === "Enter") && paintable) {
      e.preventDefault();
      const next = brush === "erase" ? setCell(cells, r, c, 0) : toggleCell(cells, r, c);
      edit(() => next, {}, true);
      setAnnounce(ui("cellNow", { r: r + 1, c: c + 1, v: next[r]![c]! }));
    }
  };

  const operate = (op: "blur" | "shift", fn: (g: Grid) => Grid) =>
    setState((prev) => {
      const before = fitGrid(prev?.cells, size);
      const after = fn(before);
      return { ...prev, cells: after, last: { op, changed: countChanged(before, after), total: cellCount(before) } };
    });

  const prompt = classroom ? <h3 className="lm-prompt">{t.rich(config.promptKey)}</h3> : <p className="lm-lead">{t.rich(config.promptKey)}</p>;

  return (
    <div className={`lm-pixel${classroom ? " lm-pixel--class" : ""}`} data-view={view}>
      {prompt}
      <GlossaryRow ids={config.glossary} ui={ui} />
      {classroom ? <p className="lm-notice" role="note">{ui("classroomPrompt")}</p> : null}

      <div className="lm-pixel__bar">
        <div role="group" aria-label={ui("viewLabel")} className="lm-row">
          <Button variant={view === "picture" ? "primary" : "secondary"} aria-pressed={view === "picture"} onClick={() => setState((p) => ({ ...p, view: "picture" }))}>{ui("showPicture")}</Button>
          <Button variant={view === "numbers" ? "primary" : "secondary"} aria-pressed={view === "numbers"} onClick={() => setState((p) => ({ ...p, view: "numbers" }))}>{ui("showNumbers")}</Button>
        </div>
        {paintable ? (
          <div role="group" aria-label={ui("toolsLabel")} className="lm-row">
            {canDraw ? <Button variant={brush === "draw" ? "primary" : "secondary"} aria-pressed={brush === "draw"} onClick={() => setState((p) => ({ ...p, tool: "draw" }))}>{ui("draw")}</Button> : null}
            {canErase ? <Button variant={brush === "erase" ? "primary" : "secondary"} aria-pressed={brush === "erase"} onClick={() => setState((p) => ({ ...p, tool: "erase" }))}>{ui("erase")}</Button> : null}
          </div>
        ) : null}
      </div>

      {/* Focus is roving on the cells (one tab stop), so the grid itself is not focusable. */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        ref={gridRef}
        role="grid"
        aria-label={ui("gridLabel", { size })}
        className="lm-pixel__grid"
        style={{ ["--n" as string]: size }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
        onKeyDown={onKeyDown}
      >
        {cells.map((row, r) => (
          <div role="row" className="lm-pixel__row" key={r}>
            {row.map((v, c) => (
              <div
                role="gridcell"
                key={c}
                data-r={r}
                data-c={c}
                data-v={v}
                tabIndex={cursor.r === r && cursor.c === c ? 0 : -1}
                aria-label={ui("cellLabel", { r: r + 1, c: c + 1, v })}
                className="lm-pixel__cell"
                style={{ ["--v" as string]: v }}
                onFocus={() => setCursor({ r, c })}
              >
                {view === "numbers" ? <span aria-hidden="true">{v}</span> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="lm-muted lm-small">{ink ? ui("drewCount", { n: ink }) : ui("empty")}</p>
      <p className="lm-muted lm-small">{ui("simplification")}</p>
      <p className="lm-sr-only" role="status" aria-live="polite">{announce}</p>

      {config.presets?.length ? (
        <div role="group" aria-label={ui("presetsLabel")} className="lm-row">
          {config.presets.map((p) => (
            <Button key={p.labelKey} variant="secondary" onClick={() => edit(() => fitGrid(p.rows, size))}>{t.text(p.labelKey)}</Button>
          ))}
        </div>
      ) : null}
      {paintable ? <Button variant="quiet" disabled={ink === 0} onClick={() => edit(() => blankGrid(size))}>{ui("clear")}</Button> : null}

      {!classroom && canShift ? (
        <ChoiceGroup
          legend={ui("predictQuestion")}
          name={`${block.id}-guess`}
          choices={(["same", "different"] as const).map((g) => ({ id: g, label: guessLabel(g) }))}
          value={state?.guess}
          onChange={(guess) => setState((p) => ({ ...p, guess: guess as "same" | "different" }))}
        />
      ) : null}

      {classroom && vote && canShift ? (
        <>
        <p className="lm-lead">{ui("classQuestion")}</p>
        <Tally
          ui={ui}
          options={[config.sameKey!, config.differentKey!].map((k) => ({ id: k, label: t.rich(k), text: t.text(k) }))}
          counts={state?.counts ?? {}}
          onChange={(counts) => setState((p) => ({ ...p, counts }), { coalesce: true })}
          revealed={!!state?.tallyShown}
          onReveal={(tallyShown) => setState((p) => ({ ...p, tallyShown }))}
        />
        </>
      ) : null}

      <div className="lm-pixel__ops">
        {tools.includes("blur") ? (
          <div className="lm-stack">
            <Button variant="secondary" disabled={ink === 0} onClick={() => operate("blur", blur)}>{ui("blur")}</Button>
            <p className="lm-muted lm-small">{ui("blurHelp")}</p>
          </div>
        ) : null}
        {tools.includes("shift") ? (
          <div role="group" aria-label={ui("shiftLabel")} className="lm-stack">
            <div className="lm-row">
              {DIRECTIONS.map((d) => (
                <Button key={d} variant="secondary" disabled={ink === 0 || shiftLocked} onClick={() => operate("shift", (g) => shift(g, d))}>{ui(DIRECTION_KEY[d])}</Button>
              ))}
            </div>
            {shiftLocked ? <p className="lm-muted lm-small">{ui(classroom ? "ready" : "predictFirst")}</p> : null}
            <p className="lm-muted lm-small">{ui("shiftHelp")}</p>
          </div>
        ) : null}
      </div>

      <div role="status" aria-live="polite" className="lm-pixel__result">
        {state?.last ? (
          <>
            <p>{ui("changed", { op: ui(state.last.op === "blur" ? "opBlur" : "opShift"), n: state.last.changed, total: state.last.total })}</p>
            {state.last.op === "shift" && !classroom && state.guess ? <p>{ui("youPredictedShift", { guess: guessLabel(state.guess) })}</p> : null}
            {state.last.op === "shift" ? <p className="lm-insight">{ui("shiftInsight")}</p> : null}
          </>
        ) : null}
      </div>
      {config.explainKey && state?.last ? <div className="lm-insight">{t.rich(config.explainKey)}</div> : null}
    </div>
  );
}
