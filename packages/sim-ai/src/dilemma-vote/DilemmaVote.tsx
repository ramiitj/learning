"use client";
import { useId, useMemo, type RefObject } from "react";
import { Button, ChoiceGroup, Tally, useFocusAfter, type BlockProps, type Counts } from "@lm/engine";
import { cleanInput, seededShuffle } from "@lm/primitives/shared/strings";
import { GlossaryRow } from "../glossary";
import type { DilemmaFramework, DilemmaVoteConfig } from "./contract";

export interface DilemmaVoteState {
  choice?: string;
  /** The learner's own reason. Stays in this block's state on the device. */
  reason?: string;
  committed?: boolean;
  /** Classroom: show-of-hands counts, whether the tally is on screen, and how many frameworks are revealed. */
  counts?: Counts;
  tallyShown?: boolean;
  shown?: number;
}

type Props = BlockProps<DilemmaVoteConfig & Record<string, unknown>, DilemmaVoteState>;

const MAX_REASON = 300;

/**
 * Every way of thinking gets an identical card. The order is a fixed shuffle
 * per block, so no framework is always first and none is given prominence.
 */
function Cards({ frameworks, config, mine, t, ui, focusLast }: { frameworks: DilemmaFramework[]; config: DilemmaVoteConfig; mine?: string; t: Props["t"]; ui: Props["ui"]; focusLast?: RefObject<HTMLLIElement | null> }) {
  const optionIds = new Set(config.options.map((o) => o.id));
  return (
    <ul className="lm-dilemma-cards">
      {frameworks.map((f, i) => {
        const option = f.choice !== null && optionIds.has(f.choice) ? config.options.find((o) => o.id === f.choice) : undefined;
        return (
          <li key={f.id} className="lm-card lm-dilemma-card" ref={i === frameworks.length - 1 ? focusLast : undefined} tabIndex={focusLast && i === frameworks.length - 1 ? -1 : undefined}>
            <h4>{t.rich(f.nameKey)}</h4>
            <p>{t.rich(f.reasoningKey)}</p>
            <p className="lm-dilemma-verdict">
              <strong>{option ? ui("wouldChoose", { option: t.text(option.labelKey) }) : ui("wouldNotSettle")}</strong>
              {mine && option ? <span className="lm-muted lm-small lm-dilemma-agree">{ui(option.id === mine ? "sameAsYou" : "differsFromYou")}</span> : null}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function DilemmaVote({ config, state, setState, t, ui, block }: Props) {
  const reasonId = useId();
  const committed = !!state?.committed;
  const focus = useFocusAfter<HTMLDivElement>(committed);
  const frameworks = useMemo(() => seededShuffle(config.frameworks, block.id), [config.frameworks, block.id]);
  const choices = config.options.map((o) => ({ id: o.id, label: t.rich(o.labelKey) }));
  const chosen = config.options.find((o) => o.id === state?.choice);
  const reason = cleanInput(state?.reason ?? "", MAX_REASON);

  return (
    <div className="lm-dilemma">
      <GlossaryRow ids={config.glossary} ui={ui} />
      <ChoiceGroup legend={t.rich(config.promptKey)} choices={choices} value={state?.choice} locked={committed} onChange={(choice) => setState({ ...state, choice })} />
      {!committed ? (
        <>
          <div className="lm-dilemma-reason">
            <label htmlFor={reasonId}>{ui("reasonLabel")}</label>
            <textarea id={reasonId} rows={3} maxLength={MAX_REASON} aria-describedby={`${reasonId}-help`} value={state?.reason ?? ""} onChange={(e) => setState({ ...state, reason: e.target.value }, { coalesce: true })} />
            <p id={`${reasonId}-help`} className="lm-small lm-muted">{ui("reasonHelp")}</p>
          </div>
          <Button variant="primary" disabled={!state?.choice} onClick={() => { focus.arm(); setState({ ...state, committed: true }); }}>{ui("lockIn")}</Button>
        </>
      ) : (
        <div ref={focus.ref} tabIndex={-1} className="lm-stack">
          <div className="lm-notice">
            <p>{ui("yourChoice", { option: chosen ? t.text(chosen.labelKey) : "" })}</p>
            {reason ? <p>{ui("yourReason", { reason })}</p> : null}
          </div>
          <p className="lm-muted">{ui("noSingleAnswer")}</p>
          <h3>{ui("frameworksHeading")}</h3>
          <Cards frameworks={frameworks} config={config} mine={state?.choice} t={t} ui={ui} />
          {config.reflectionKey ? (
            <div className="lm-insight">
              <strong>{ui("reflect")}</strong>
              <div>{t.rich(config.reflectionKey)}</div>
            </div>
          ) : null}
          <Button variant="quiet" onClick={() => setState({ ...state, committed: false })}>{ui("change")}</Button>
        </div>
      )}
    </div>
  );
}

/** Classroom: the class votes, then the teacher reveals the ways of thinking one at a time. */
export function DilemmaVoteClassroom({ config, state, setState, t, ui, block }: Props) {
  const frameworks = useMemo(() => seededShuffle(config.frameworks, block.id), [config.frameworks, block.id]);
  const shown = Math.min(state?.shown ?? 0, frameworks.length);
  const focus = useFocusAfter<HTMLLIElement>(shown);
  const options = config.options.map((o) => ({ id: o.id, label: t.rich(o.labelKey), text: t.text(o.labelKey) }));
  return (
    <div className="lm-dilemma">
      <h3 className="lm-prompt">{t.rich(config.promptKey)}</h3>
      <GlossaryRow ids={config.glossary} ui={ui} />
      <p className="lm-muted">{ui("voteIntro")}</p>
      <Tally ui={ui} options={options} counts={state?.counts ?? {}} onChange={(counts) => setState((prev) => ({ ...prev, counts }), { coalesce: true })} revealed={!!state?.tallyShown} onReveal={(tallyShown) => setState((prev) => ({ ...prev, tallyShown }))} />
      <h3>{ui("frameworksHeading")}</h3>
      <p className="lm-muted" role="status">{ui("shown", { shown, total: frameworks.length })}</p>
      {shown > 0 ? <Cards frameworks={frameworks.slice(0, shown)} config={config} t={t} ui={ui} focusLast={focus.ref} /> : null}
      {shown < frameworks.length ? (
        <Button variant="primary" onClick={() => { focus.arm(); setState((prev) => ({ ...prev, shown: shown + 1 })); }}>{ui("revealNext")}</Button>
      ) : (
        <div className="lm-insight">
          <p>{ui("allShown")}</p>
          {config.reflectionKey ? <div>{t.rich(config.reflectionKey)}</div> : null}
        </div>
      )}
    </div>
  );
}
