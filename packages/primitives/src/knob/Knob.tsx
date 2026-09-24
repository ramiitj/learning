"use client";
import { Button, useFocusAfter, type BlockProps } from "@lm/engine";
import { evaluate, initialValues, weightedSum, type ModelSpec, type Values } from "../shared/model";
import type { KnobConfig } from "./contract";

export interface KnobState {
  values: Values;
  /** Set once the goal has ever been reached, so the moment is kept even if the learner moves on. */
  reached?: boolean;
  /** Classroom: the class has committed a direction prediction and unlocked the controls. */
  classPredicted?: boolean;
}

type Props = BlockProps<KnobConfig & Record<string, unknown>, KnobState>;

function fmt(locale: string, n: number, decimals?: number): string {
  return new Intl.NumberFormat(locale, decimals !== undefined ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : { maximumFractionDigits: 3 }).format(n);
}

/** Every step of the weighted sum, spelled out: "0.5 × 4 + 1 × 2 + 0 = 4". */
function workingLine(locale: string, model: ModelSpec, values: Values): string {
  const parts = model.inputs.map((i) => `${fmt(locale, i.weight)} × ${fmt(locale, values[i.id] ?? i.initial)}`);
  const sum = weightedSum(model, values);
  if (model.bias) parts.push(fmt(locale, model.bias));
  return `${parts.join(" + ")} = ${fmt(locale, sum)}`;
}

function withinTolerance(output: number, goal: KnobConfig["goal"]): boolean {
  return !!goal && Math.abs(output - goal.target) <= goal.tolerance;
}

function Controls({ config, values, locale, t, ui, onChange, idPrefix }: { config: KnobConfig; values: Values; locale: string; t: Props["t"]; ui: Props["ui"]; onChange: (id: string, v: number) => void; idPrefix: string }) {
  return (
    <div className="lm-knob__controls">
      {config.model.inputs.map((input) => {
        const id = `${idPrefix}-${input.id}`;
        const value = values[input.id] ?? input.initial;
        if (input.kind === "toggle") {
          const checked = value >= 1;
          return (
            <div className="lm-knob__control" key={input.id}>
              <label className="lm-knob__toggle" htmlFor={id}>
                <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(input.id, e.target.checked ? 1 : 0)} />
                <span>{t.rich(input.labelKey)}</span>
                <span className="lm-muted lm-small">{ui(checked ? "toggleOn" : "toggleOff")}</span>
              </label>
            </div>
          );
        }
        const min = input.min ?? 0;
        const max = input.max ?? 10;
        const step = input.step ?? 1;
        return (
          <div className="lm-knob__control" key={input.id}>
            <label htmlFor={id}>{t.rich(input.labelKey)}</label>
            <div className="lm-row">
              <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(input.id, Number(e.target.value))} aria-describedby={`${id}-out`} />
              <output id={`${id}-out`} htmlFor={id}>{fmt(locale, value)}</output>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Readout({ config, values, locale, t, ui }: { config: KnobConfig; values: Values; locale: string; t: Props["t"]; ui: Props["ui"] }) {
  const { model } = config;
  const output = evaluate(model, values);
  const isReached = withinTolerance(output, config.goal);
  const outputText =
    model.type === "threshold" && model.output.labelKeys
      ? t.text(model.output.labelKeys[output as 0 | 1])
      : fmt(locale, output, model.output.decimals);
  const decision = config.decision ? t.text(output >= config.decision.threshold ? config.decision.aboveKey : config.decision.belowKey) : "";
  const bodyText = config.outputTemplateKey
    ? t.text(config.outputTemplateKey, { output: outputText, decision, ...values })
    : ui("outputFallback", { label: t.text(model.output.labelKey), value: outputText });
  const range = model.output.max - model.output.min || 1;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - model.output.min) / range) * 100));
  const outputPct = pct(output);
  const goal = config.goal;
  return (
    <div className="lm-knob__readout">
      <p className="lm-lead">{bodyText}</p>
      <div className="lm-knob__gauge-wrap">
        <span className="lm-bar" aria-hidden="true">
          <span className="lm-bar__fill" style={{ inlineSize: `${outputPct}%` }} />
          {goal ? (
            <span
              className="lm-knob__target"
              style={{
                insetInlineStart: `${pct(goal.target - goal.tolerance)}%`,
                inlineSize: `${pct(goal.target + goal.tolerance) - pct(goal.target - goal.tolerance)}%`,
              }}
            />
          ) : null}
        </span>
        {goal ? <p className="lm-muted lm-small">{goal.tolerance === 0 ? ui("targetExact", { value: fmt(locale, goal.target) }) : ui("target", { min: fmt(locale, goal.target - goal.tolerance), max: fmt(locale, goal.target + goal.tolerance) })}</p> : null}
      </div>
      <p className="lm-knob__working">
        <span className="lm-muted lm-small">{ui("workingHeading")}</span>
        <br />
        <code>{workingLine(locale, model, values)}</code>
      </p>
      {goal && isReached ? (
        <div className="lm-insight">{t.rich(goal.successKey)}</div>
      ) : null}
    </div>
  );
}

export function Knob({ config, state, setState, t, ui, locale, block }: Props) {
  const values = state?.values ?? initialValues(config.model);
  const onChange = (id: string, v: number) => {
    const nextValues = { ...values, [id]: v };
    const output = evaluate(config.model, nextValues);
    const reached = state?.reached || withinTolerance(output, config.goal);
    setState({ values: nextValues, reached }, { coalesce: true });
  };
  return (
    <div className="lm-knob">
      <p className="lm-lead">{t.rich(config.promptKey)}</p>
      {config.goal ? <p className="lm-notice">{t.rich(config.goal.goalKey)}</p> : null}
      <Controls config={config} values={values} locale={locale} t={t} ui={ui} onChange={onChange} idPrefix={`knob-${block.id}`} />
      <Readout config={config} values={values} locale={locale} t={t} ui={ui} />
    </div>
  );
}

/** Classroom: the class predicts direction before the teacher's controls unlock. */
export function KnobClassroom({ config, state, setState, t, ui, locale, block }: Props) {
  const predicted = !!state?.classPredicted;
  const focus = useFocusAfter<HTMLDivElement>(predicted);
  const values = state?.values ?? initialValues(config.model);
  const onChange = (id: string, v: number) => {
    const nextValues = { ...values, [id]: v };
    const output = evaluate(config.model, nextValues);
    const reached = state?.reached || withinTolerance(output, config.goal);
    setState({ ...state, classPredicted: true, values: nextValues, reached }, { coalesce: true });
  };
  return (
    <div className="lm-knob">
      <p className="lm-lead">{t.rich(config.promptKey)}</p>
      {config.goal ? <p className="lm-notice">{t.rich(config.goal.goalKey)}</p> : null}
      {!predicted ? (
        <div className="lm-stack">
          <p>{ui("classPredictPrompt")}</p>
          <Button variant="primary" onClick={() => { focus.arm(); setState({ ...state, values, classPredicted: true }); }}>
            {ui("classPredictCommit")}
          </Button>
        </div>
      ) : (
        <div ref={focus.ref} tabIndex={-1}>
          <p className="lm-muted">{ui("classControlsIntro")}</p>
          <Controls config={config} values={values} locale={locale} t={t} ui={ui} onChange={onChange} idPrefix={`knob-${block.id}-classroom`} />
          <Readout config={config} values={values} locale={locale} t={t} ui={ui} />
        </div>
      )}
    </div>
  );
}
