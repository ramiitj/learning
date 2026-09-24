"use client";
import { useId } from "react";
import { Button, useFocusAfter, type BlockProps } from "@lm/engine";
import type { BreakItConfig } from "./contract";

export interface BreakItState {
  tried: string[];
  note?: string;
  reflection?: string;
}

type Props = BlockProps<BreakItConfig & Record<string, unknown>, BreakItState>;

const initial: BreakItState = { tried: [] };
const MAX_NOTE = 500;

export function BreakIt({ config, state = initial, setState, t, ui }: Props) {
  const attempts = config.attempts ?? [];
  const focus = useFocusAfter<HTMLDivElement>(state.tried.length);
  const noteId = useId();
  const reflectId = useId();

  const tryAttempt = (id: string) => {
    if (state.tried.includes(id)) return;
    focus.arm();
    setState({ ...state, tried: [...state.tried, id] });
  };

  const goToTarget = () => {
    const el = config.target ? document.getElementById(`block-${config.target}`) : null;
    el?.scrollIntoView({ block: "start" });
    el?.focus({ preventScroll: true });
  };

  const brokenCount = attempts.filter((a) => a.breaks && state.tried.includes(a.id)).length;

  return (
    <div className="lm-break-it">
      <p className="lm-lead">{t.rich(config.challengeKey)}</p>

      {attempts.length > 0 ? (
        <>
          <div className="lm-break-it__attempts">
            {attempts.map((a) => (
              <Button key={a.id} variant="secondary" onClick={() => tryAttempt(a.id)}>
                {ui("try", { label: t.text(a.labelKey) })}
              </Button>
            ))}
          </div>
          <div ref={focus.ref} tabIndex={-1} className="lm-break-it__results">
            {attempts
              .filter((a) => state.tried.includes(a.id))
              .map((a) => (
                <div key={a.id} className="lm-callout" data-tone={a.breaks ? "warm" : "insight"}>
                  <p className="lm-break-it__resultLabel">{ui(a.breaks ? "broke" : "held")}</p>
                  <p>{t.rich(a.resultKey)}</p>
                </div>
              ))}
          </div>
          {state.tried.length > 0 ? <p className="lm-muted">{ui("foundCount", { n: brokenCount, total: attempts.length })}</p> : null}
        </>
      ) : (
        <div className="lm-notice" role="note">
          <p>{ui("aboveNote")}</p>
          {config.target ? (
            <Button variant="quiet" onClick={goToTarget}>
              {ui("goToTarget")}
            </Button>
          ) : null}
        </div>
      )}

      <div className="lm-break-it__field">
        <label htmlFor={noteId}>{config.notePromptKey ? t.rich(config.notePromptKey) : ui("elseTriedLabel")}</label>
        <textarea id={noteId} value={state.note ?? ""} onChange={(e) => setState({ ...state, note: e.target.value.slice(0, MAX_NOTE) }, { coalesce: true })} />
      </div>

      <div className="lm-break-it__field">
        <label htmlFor={reflectId}>{t.rich(config.reflectKey)}</label>
        <textarea id={reflectId} value={state.reflection ?? ""} onChange={(e) => setState({ ...state, reflection: e.target.value.slice(0, MAX_NOTE) }, { coalesce: true })} />
      </div>
    </div>
  );
}

/** Classroom: the teacher clicks the attempts the class suggests; reflection is a pair discussion, not typed. */
export function BreakItClassroom({ config, state = initial, setState, t, ui }: Props) {
  const attempts = config.attempts ?? [];
  const focus = useFocusAfter<HTMLDivElement>(state.tried.length);

  const tryAttempt = (id: string) => {
    if (state.tried.includes(id)) return;
    focus.arm();
    setState({ ...state, tried: [...state.tried, id] });
  };

  const goToTarget = () => {
    const el = config.target ? document.getElementById(`block-${config.target}`) : null;
    el?.scrollIntoView({ block: "start" });
    el?.focus({ preventScroll: true });
  };

  const brokenCount = attempts.filter((a) => a.breaks && state.tried.includes(a.id)).length;

  return (
    <div className="lm-break-it">
      <h3 className="lm-break-it__prompt">{t.rich(config.challengeKey)}</h3>

      {attempts.length > 0 ? (
        <>
          <div className="lm-break-it__attempts">
            {attempts.map((a) => (
              <Button key={a.id} variant="secondary" onClick={() => tryAttempt(a.id)}>
                {ui("try", { label: t.text(a.labelKey) })}
              </Button>
            ))}
          </div>
          <div ref={focus.ref} tabIndex={-1} className="lm-break-it__results">
            {attempts
              .filter((a) => state.tried.includes(a.id))
              .map((a) => (
                <div key={a.id} className="lm-callout" data-tone={a.breaks ? "warm" : "insight"}>
                  <p className="lm-break-it__resultLabel">{ui(a.breaks ? "broke" : "held")}</p>
                  <p>{t.rich(a.resultKey)}</p>
                </div>
              ))}
          </div>
          {state.tried.length > 0 ? <p className="lm-muted">{ui("foundCount", { n: brokenCount, total: attempts.length })}</p> : null}
        </>
      ) : (
        <div className="lm-notice" role="note">
          <p>{ui("aboveNote")}</p>
          {config.target ? (
            <Button variant="quiet" onClick={goToTarget}>
              {ui("goToTarget")}
            </Button>
          ) : null}
        </div>
      )}

      <div className="lm-insight">
        <p>{t.rich(config.reflectKey)}</p>
        <p className="lm-muted">{ui("discussPairs")}</p>
      </div>
    </div>
  );
}
