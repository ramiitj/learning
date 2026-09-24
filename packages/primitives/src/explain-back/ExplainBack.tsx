"use client";
import { useId } from "react";
import { Button, ChoiceGroup, Tally, useFocusAfter, type BlockProps, type Counts } from "@lm/engine";
import type { ExplainBackConfig } from "./contract";

export interface ExplainBackState {
  choice?: string;
  text?: string;
  breakPoint?: string;
  kept?: boolean;
  /** Classroom (choose mode): show-of-hands counts and whether the result is on screen. */
  counts?: Counts;
  tallyShown?: boolean;
  revealed?: boolean;
}

type Props = BlockProps<ExplainBackConfig & Record<string, unknown>, ExplainBackState>;

const initial: ExplainBackState = {};
const MAX_LEN = 600;

export function ExplainBack({ config, state = initial, setState, t, ui }: Props) {
  const textId = useId();
  const breakId = useId();

  if (config.mode === "choose") {
    const options = (config.options ?? []).map((o) => ({ id: o.id, label: t.rich(o.textKey) }));
    const chosen = config.options?.find((o) => o.id === state.choice);
    return (
      <div className="lm-explain-back">
        <ChoiceGroup legend={t.rich(config.promptKey)} choices={options} value={state.choice} onChange={(choice) => setState({ ...state, choice })} />
        {chosen ? (
          <p className="lm-callout" data-tone={chosen.best ? "insight" : "warm"}>
            {t.rich(chosen.feedbackKey)}
          </p>
        ) : null}
      </div>
    );
  }

  const canKeep = config.mode === "own-analogy" ? !!state.text?.trim() && !!state.breakPoint?.trim() : !!state.text?.trim();
  const focus = useFocusAfter<HTMLDivElement>(state.kept);

  return (
    <div className="lm-explain-back">
      <p className="lm-lead">{t.rich(config.promptKey)}</p>

      <div className="lm-explain-back__field">
        <label htmlFor={textId}>{config.mode === "own-analogy" ? ui("yourComparison") : ui("yourExplanation")}</label>
        <textarea id={textId} value={state.text ?? ""} disabled={state.kept} onChange={(e) => setState({ ...state, text: e.target.value.slice(0, MAX_LEN) }, { coalesce: true })} />
      </div>

      {config.mode === "own-analogy" ? (
        <div className="lm-explain-back__field">
          <label htmlFor={breakId}>{config.breakPointPromptKey ? t.rich(config.breakPointPromptKey) : ui("yourComparison")}</label>
          <textarea id={breakId} value={state.breakPoint ?? ""} disabled={state.kept} onChange={(e) => setState({ ...state, breakPoint: e.target.value.slice(0, MAX_LEN) }, { coalesce: true })} />
        </div>
      ) : null}

      {!state.kept ? (
        <Button variant="primary" disabled={!canKeep} onClick={() => { focus.arm(); setState({ ...state, kept: true }); }}>
          {ui("keep")}
        </Button>
      ) : (
        <div ref={focus.ref} tabIndex={-1} className="lm-explain-back__kept">
          {config.modelAnswerKey ? (
            <div className="lm-insight">
              <p className="lm-explain-back__modelIntro">{ui("modelIntro")}</p>
              {t.rich(config.modelAnswerKey)}
            </div>
          ) : null}
          <Button variant="quiet" onClick={() => setState({ ...state, kept: false })}>
            {ui("change")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Classroom: prompt projected big, discussed in pairs; `choose` mode adds a class tally then the reveal. */
export function ExplainBackClassroom({ config, state = initial, setState, t, ui }: Props) {
  const focus = useFocusAfter<HTMLDivElement>(state.revealed);

  if (config.mode === "choose") {
    const options = (config.options ?? []).map((o) => ({ id: o.id, label: t.rich(o.textKey), text: t.text(o.textKey) }));
    const best = config.options?.find((o) => o.best) ?? config.options?.[0];
    return (
      <div className="lm-explain-back">
        <h3 className="lm-explain-back__prompt">{t.rich(config.promptKey)}</h3>
        <p className="lm-muted">{ui("discuss")}</p>
        <Tally ui={ui} options={options} counts={state.counts ?? {}} onChange={(counts) => setState({ ...state, counts }, { coalesce: true })} revealed={!!state.tallyShown} onReveal={(tallyShown) => setState({ ...state, tallyShown })} highlight={state.revealed ? best?.id : undefined} />
        {!state.revealed ? (
          <Button variant="primary" onClick={() => { focus.arm(); setState({ ...state, revealed: true, tallyShown: true }); }}>
            {ui("showBest")}
          </Button>
        ) : best ? (
          <div ref={focus.ref} tabIndex={-1} className="lm-callout" data-tone="insight">
            {t.rich(best.feedbackKey)}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="lm-explain-back">
      <h3 className="lm-explain-back__prompt">{t.rich(config.promptKey)}</h3>
      <p className="lm-muted">{ui("discuss")}</p>
      {config.breakPointPromptKey ? <p>{t.rich(config.breakPointPromptKey)}</p> : null}
    </div>
  );
}
