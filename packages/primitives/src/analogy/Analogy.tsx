"use client";
import { useId } from "react";
import { Button, type BlockProps } from "@lm/engine";
import type { AnalogyConfig } from "./contract";

export interface AnalogyState {
  active?: number;
  fade?: number;
  sawBreak?: boolean;
}

type Props = BlockProps<AnalogyConfig & Record<string, unknown>, AnalogyState> & { teacher?: boolean };

const initial: AnalogyState = {};

function AnalogyBody({ block, config, state = initial, setState, t, ui, teacher }: Props) {
  const idBase = useId();
  const mappings = config.mappings;
  const fading = config.fading ?? [];
  const fadeIdx = fading.length ? Math.min(state.fade ?? 0, fading.length - 1) : 0;

  const nextPair = () => {
    const next = mappings.length ? ((state.active ?? -1) + 1) % mappings.length : 0;
    setState({ ...state, active: next });
  };

  return (
    <div className="lm-analogy">
      {config.titleKey ? <h3 className="lm-analogy__title">{t.rich(config.titleKey)}</h3> : null}
      <p className="lm-lead">{t.rich(config.sourceKey)}</p>

      {teacher ? (
        <Button variant="secondary" onClick={nextPair}>
          {ui("nextPair")}
        </Button>
      ) : null}

      <div className="lm-analogy__legend" aria-hidden="true">
        <span>{ui("everyday")}</span>
        <span>{ui("formal")}</span>
      </div>
      <ul className="lm-analogy__rows">
        {mappings.map((m, i) => {
          const targetId = `${idBase}-target-${i}`;
          const active = state.active === i;
          return (
            <li key={`${block.id}-${i}`} className="lm-analogy__row" data-active={active || undefined}>
              <button type="button" className="lm-analogy__source" aria-pressed={active} aria-describedby={targetId} onClick={() => setState({ ...state, active: i })}>
                <span className="lm-analogy__badge" aria-hidden="true">
                  {i + 1}
                </span>
                {t.rich(m.sourceKey)}
              </button>
              <p id={targetId} className="lm-analogy__target" data-active={active || undefined}>
                <span className="lm-analogy__badge" aria-hidden="true">
                  {i + 1}
                </span>
                {t.rich(m.targetKey)}
              </p>
            </li>
          );
        })}
      </ul>

      {fading.length > 0 ? (
        <div className="lm-analogy__fade">
          <div className="lm-row">
            <span className="lm-muted lm-small">{ui("fadeStart")}</span>
            <input
              type="range"
              min={0}
              max={fading.length - 1}
              value={fadeIdx}
              aria-label={ui("fadeSlider")}
              onChange={(e) => setState({ ...state, fade: Number(e.target.value) }, { coalesce: true })}
            />
            <span className="lm-muted lm-small">{ui("fadeEnd")}</span>
          </div>
          <div className="lm-row">
            <Button variant="quiet" disabled={fadeIdx === 0} onClick={() => setState({ ...state, fade: fadeIdx - 1 })}>
              {ui("fadePrev")}
            </Button>
            <span className="lm-muted lm-small">{ui("fadeProgress", { n: fadeIdx + 1, total: fading.length })}</span>
            <Button variant="quiet" disabled={fadeIdx === fading.length - 1} onClick={() => setState({ ...state, fade: fadeIdx + 1 })}>
              {ui("fadeNext")}
            </Button>
          </div>
          <p className="lm-analogy__fadeText">{t.rich(fading[fadeIdx]!)}</p>
        </div>
      ) : null}

      <Button variant="quiet" aria-expanded={!!state.sawBreak} onClick={() => setState({ ...state, sawBreak: !state.sawBreak })}>
        {ui(state.sawBreak ? "breakHide" : "breakShow")}
      </Button>
      {state.sawBreak ? (
        <p className="lm-notice" role="note">
          {t.rich(config.breakPointKey)}
        </p>
      ) : null}
    </div>
  );
}

export function Analogy(props: Props) {
  return <AnalogyBody {...props} teacher={false} />;
}

/** Classroom: the same correspondence, projected; the teacher steps through mappings. */
export function AnalogyClassroom(props: Props) {
  return <AnalogyBody {...props} teacher />;
}
