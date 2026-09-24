"use client";
import { Button, ChoiceGroup, HintLadder, Tally, useEngine, useFocusAfter, type BlockProps, type Counts } from "@lm/engine";
import type { CheckConfig } from "./contract";

export interface CheckState {
  choice?: string;
  attempts: string[];
  hintsShown: number;
  solved?: boolean;
  /** Classroom: show-of-hands counts and whether the result is on screen. */
  counts?: Counts;
  tallyShown?: boolean;
  revealed?: boolean;
}

type Props = BlockProps<CheckConfig & Record<string, unknown>, CheckState>;

const initial: CheckState = { attempts: [], hintsShown: 0 };

export function Check({ config, state = initial, setState, t, ui }: Props) {
  const { detours, openDetour } = useEngine();
  const solved = !!state.solved;
  const focus = useFocusAfter<HTMLDivElement>(state.attempts.length);
  const choices = config.options.map((k) => ({ id: k, label: t.rich(k) }));
  const lastAttempt = state.attempts[state.attempts.length - 1];
  const attemptedNotLanding = state.attempts.length > 0 && !solved;
  const canOfferDetour = state.attempts.length >= 2 && !solved && !!config.detour && config.detour in detours;

  const onCheck = () => {
    if (!state.choice) return;
    const correct = state.choice === config.answer;
    focus.arm();
    setState({ ...state, attempts: [...state.attempts, state.choice], solved: correct });
  };

  return (
    <div className="lm-check">
      <ChoiceGroup legend={t.rich(config.promptKey)} choices={choices} value={state.choice} locked={solved} onChange={(choice) => setState({ ...state, choice })} />
      <Button variant="primary" disabled={!state.choice || solved} onClick={onCheck}>
        {ui("check")}
      </Button>
      {state.attempts.length > 0 ? (
        <div ref={focus.ref} tabIndex={-1} className="lm-check__result">
          {solved ? (
            <div className="lm-callout" data-tone="insight">
              {lastAttempt && config.feedback?.[lastAttempt] ? <p>{t.rich(config.feedback[lastAttempt]!)}</p> : null}
              {config.explainKey ? <div className="lm-insight">{t.rich(config.explainKey)}</div> : null}
            </div>
          ) : (
            <p className="lm-callout" data-tone="warm">
              {lastAttempt && config.feedback?.[lastAttempt] ? t.rich(config.feedback[lastAttempt]!) : ui("again")}
            </p>
          )}
        </div>
      ) : null}
      {attemptedNotLanding && config.hints?.length ? (
        <HintLadder ui={ui} hints={config.hints.map((k) => t.rich(k))} shown={state.hintsShown} onShow={(n) => setState({ ...state, hintsShown: n })} />
      ) : null}
      {canOfferDetour ? (
        <Button variant="quiet" onClick={() => openDetour(config.detour!)}>
          {ui("detourOffer")}
        </Button>
      ) : null}
    </div>
  );
}

/** Classroom: the class votes, the teacher can show the answer once ready. */
export function CheckClassroom({ config, state = initial, setState, t, ui }: Props) {
  const focus = useFocusAfter<HTMLDivElement>(state.revealed);
  const options = config.options.map((k) => ({ id: k, label: t.rich(k), text: t.text(k) }));
  return (
    <div className="lm-check">
      <h3 className="lm-check__prompt">{t.rich(config.promptKey)}</h3>
      <Tally ui={ui} options={options} counts={state.counts ?? {}} onChange={(counts) => setState({ ...state, counts }, { coalesce: true })} revealed={!!state.tallyShown} onReveal={(tallyShown) => setState({ ...state, tallyShown })} highlight={state.revealed ? config.answer : undefined} />
      {!state.revealed ? (
        <Button variant="primary" onClick={() => { focus.arm(); setState({ ...state, revealed: true, tallyShown: true }); }}>
          {ui("showAnswer")}
        </Button>
      ) : (
        <div ref={focus.ref} tabIndex={-1} className="lm-stack">
          <p className="lm-callout" data-tone="insight">{t.rich(config.answer)}</p>
          {config.explainKey ? <div className="lm-insight">{t.rich(config.explainKey)}</div> : null}
        </div>
      )}
    </div>
  );
}
