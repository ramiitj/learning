"use client";
import { Button, ChoiceGroup, Confidence, Tally, useFocusAfter, type BlockProps, type ConfidenceLevel, type Counts } from "@lm/engine";
import type { PredictConfig } from "./contract";

export interface PredictState {
  choice?: string;
  confidence?: ConfidenceLevel;
  committed?: boolean;
  /** Classroom: show-of-hands counts and whether the result is on screen. */
  counts?: Counts;
  tallyShown?: boolean;
  revealed?: boolean;
}

type Props = BlockProps<PredictConfig & Record<string, unknown>, PredictState>;

export function Predict({ config, state = {}, setState, t, ui }: Props) {
  const committed = !!state.committed;
  const focus = useFocusAfter<HTMLDivElement>(committed);
  const choices = config.choices.map((k) => ({ id: k, label: t.rich(k) }));
  const needsConfidence = !!config.confidence;
  const canCommit = !!state.choice && (!needsConfidence || !!state.confidence);
  const matched = config.answer ? state.choice === config.answer : undefined;

  return (
    <div className="lm-predict">
      <ChoiceGroup legend={t.rich(config.promptKey)} choices={choices} value={state.choice} locked={committed} onChange={(choice) => setState({ ...state, choice })} />
      {needsConfidence ? <Confidence ui={ui} value={state.confidence} disabled={committed} onChange={(confidence) => setState({ ...state, confidence })} /> : null}
      {!committed ? (
        <Button variant="primary" disabled={!canCommit} onClick={() => { focus.arm(); setState({ ...state, committed: true }); }}>
          {ui("commit")}
        </Button>
      ) : (
        <div ref={focus.ref} tabIndex={-1} className="lm-stack">
          {matched !== undefined ? <p className="lm-callout" data-tone={matched ? "insight" : "warm"}>{ui(matched ? "matches" : "differs")}</p> : null}
          {state.choice && config.choiceFeedback?.[state.choice] ? <p>{t.rich(config.choiceFeedback[state.choice]!)}</p> : null}
          <div className="lm-insight">{t.rich(config.revealKey)}</div>
          {matched === false && state.confidence === "high" ? <p className="lm-muted">{ui("calibrationSure")}</p> : null}
          {matched === false && state.confidence === "low" ? <p className="lm-muted">{ui("calibrationUnsure")}</p> : null}
          {config.showOthersGuesses && config.othersDistribution ? <Others config={config} mine={state.choice} t={t} ui={ui} /> : null}
          <Button variant="quiet" onClick={() => setState({ ...state, committed: false })}>{ui("change")}</Button>
        </div>
      )}
    </div>
  );
}

function Others({ config, mine, t, ui }: { config: PredictConfig; mine?: string; t: Props["t"]; ui: Props["ui"] }) {
  const dist = config.othersDistribution ?? {};
  const max = Math.max(1, ...Object.values(dist));
  return (
    <figure className="lm-others">
      <figcaption>{ui("others")}</figcaption>
      <ul>
        {config.choices.map((k) => (
          <li key={k} data-mine={mine === k || undefined}>
            <span>{t.rich(k)}</span>
            <span className="lm-muted">{ui("othersCount", { n: dist[k] ?? 0 })}</span>
            <span className="lm-bar" aria-hidden="true"><span className="lm-bar__fill" style={{ inlineSize: `${((dist[k] ?? 0) / max) * 100}%` }} /></span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Classroom: the class votes (show of hands), the distribution goes up, then the reveal. */
export function PredictClassroom({ config, state = {}, setState, t, ui }: Props) {
  const focus = useFocusAfter<HTMLDivElement>(state.revealed);
  const options = config.choices.map((k) => ({ id: k, label: t.rich(k), text: t.text(k) }));
  return (
    <div className="lm-predict">
      <h3 className="lm-prompt">{t.rich(config.promptKey)}</h3>
      <Tally ui={ui} options={options} counts={state.counts ?? {}} onChange={(counts) => setState({ ...state, counts }, { coalesce: true })} revealed={!!state.tallyShown} onReveal={(tallyShown) => setState({ ...state, tallyShown })} highlight={state.revealed ? config.answer : undefined} />
      {!state.revealed ? (
        <Button variant="primary" onClick={() => { focus.arm(); setState({ ...state, revealed: true, tallyShown: true }); }}>{ui("revealClass")}</Button>
      ) : (
        <div ref={focus.ref} tabIndex={-1} className="lm-insight">{t.rich(config.revealKey)}</div>
      )}
    </div>
  );
}
