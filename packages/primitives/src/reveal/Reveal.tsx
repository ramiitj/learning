"use client";
import { Button, useFocusAfter, type BlockProps } from "@lm/engine";
import type { RevealConfig } from "./contract";

export interface RevealState {
  shown: number;
}

export function Reveal({ config, state, setState, t, ui }: BlockProps<RevealConfig & Record<string, unknown>, RevealState>) {
  const steps = config.steps ?? [];
  const shown = Math.min(state?.shown ?? 0, steps.length);
  const focus = useFocusAfter<HTMLParagraphElement>(shown);
  return (
    <div className="lm-reveal">
      <p className="lm-lead">{t.rich(config.textKey)}</p>
      {steps.slice(0, shown).map((k, i) => (
        <p key={k} className="lm-reveal__step" tabIndex={-1} ref={i === shown - 1 ? focus.ref : undefined}>
          {t.rich(k)}
        </p>
      ))}
      {shown < steps.length ? (
        <Button variant="primary" onClick={() => { focus.arm(); setState({ shown: shown + 1 }); }}>{ui("next")}</Button>
      ) : null}
      {config.questionKey && shown === steps.length ? <p className="lm-question">{t.rich(config.questionKey)}</p> : null}
    </div>
  );
}
