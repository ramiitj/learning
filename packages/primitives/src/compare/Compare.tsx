"use client";
import { Button, ChoiceGroup, Tally, useFocusAfter, type BlockProps, type Counts } from "@lm/engine";
import { evaluate, weightedSum, type ModelSpec, type Values } from "../shared/model";
import type { CompareConfig, CompareVariant } from "./contract";

export interface CompareState {
  /** Learner's current values for the shared (non-overridden) inputs. */
  values?: Values;
  prediction?: string;
  ran?: boolean;
  /** Classroom show-of-hands. */
  counts?: Counts;
  tallyShown?: boolean;
}

type Props = BlockProps<CompareConfig & Record<string, unknown>, CompareState>;

function fmt(locale: string, n: number, decimals?: number): string {
  return new Intl.NumberFormat(locale, decimals !== undefined ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : { maximumFractionDigits: 3 }).format(n);
}

function workingLine(locale: string, model: ModelSpec, values: Values): string {
  const parts = model.inputs.map((i) => `${fmt(locale, i.weight)} × ${fmt(locale, values[i.id] ?? i.initial)}`);
  const sum = weightedSum(model, values);
  if (model.bias) parts.push(fmt(locale, model.bias));
  return `${parts.join(" + ")} = ${fmt(locale, sum)}`;
}

function sharedIds(config: CompareConfig): string[] {
  if (config.shared) return config.shared;
  const overridden = new Set([...Object.keys(config.variants[0].overrides), ...Object.keys(config.variants[1].overrides)]);
  return config.model.inputs.map((i) => i.id).filter((id) => !overridden.has(id));
}

function effectiveValues(config: CompareConfig, variant: CompareVariant, shared: Values): Values {
  const base: Values = Object.fromEntries(config.model.inputs.map((i) => [i.id, i.initial]));
  return { ...base, ...shared, ...variant.overrides };
}

function outputText(locale: string, model: ModelSpec, output: number, t: Props["t"]): string {
  if (model.type === "threshold" && model.output.labelKeys) return t.text(model.output.labelKeys[output as 0 | 1]);
  return fmt(locale, output, model.output.decimals);
}

function SharedControls({ config, shared, locale, t, onChange, idPrefix }: { config: CompareConfig; shared: Values; locale: string; t: Props["t"]; onChange: (id: string, v: number) => void; idPrefix: string }) {
  const ids = sharedIds(config);
  if (ids.length === 0) return null;
  return (
    <div className="lm-compare__shared">
      {config.model.inputs
        .filter((i) => ids.includes(i.id))
        .map((input) => {
          const id = `${idPrefix}-${input.id}`;
          const value = shared[input.id] ?? input.initial;
          const min = input.min ?? 0;
          const max = input.max ?? 10;
          const step = input.step ?? 1;
          return (
            <div className="lm-compare__control" key={input.id}>
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

function Panel({ config, variant, shared, locale, t, ui }: { config: CompareConfig; variant: CompareVariant; shared: Values; locale: string; t: Props["t"]; ui: Props["ui"] }) {
  const values = effectiveValues(config, variant, shared);
  const output = evaluate(config.model, values);
  return (
    <section className="lm-compare__panel" aria-label={t.text(variant.labelKey)}>
      <h4>{t.rich(variant.labelKey)}</h4>
      {Object.entries(variant.overrides).map(([id, value]) => {
        const input = config.model.inputs.find((i) => i.id === id);
        return (
          <p key={id} className="lm-muted lm-small">
            {ui("fixed", { label: input ? t.text(input.labelKey) : id, value: fmt(locale, value) })}
          </p>
        );
      })}
      <p className="lm-lead">{ui("outputFallback", { label: t.text(config.model.output.labelKey), value: outputText(locale, config.model, output, t) })}</p>
      <span className="lm-bar" aria-hidden="true">
        <span className="lm-bar__fill" style={{ inlineSize: `${Math.min(100, Math.max(0, ((output - config.model.output.min) / (config.model.output.max - config.model.output.min || 1)) * 100))}%` }} />
      </span>
      <p className="lm-small">
        <span className="lm-muted">{ui("workingHeading")}</span>
        <br />
        <code>{workingLine(locale, config.model, values)}</code>
      </p>
    </section>
  );
}

function higherVariant(config: CompareConfig, shared: Values): string | undefined {
  const outputs = config.variants.map((v) => evaluate(config.model, effectiveValues(config, v, shared)));
  if (outputs[0] === outputs[1]) return undefined;
  return outputs[0]! > outputs[1]! ? config.variants[0]!.id : config.variants[1]!.id;
}

export function Compare({ config, state, setState, t, ui, locale, block }: Props) {
  const shared = state?.values ?? {};
  const ran = !!state?.ran;
  const focus = useFocusAfter<HTMLDivElement>(ran);
  const canRun = !config.predictKey || !!state?.prediction;
  const winner = higherVariant(config, shared);
  return (
    <div className="lm-compare">
      <p className="lm-lead">{t.rich(config.promptKey)}</p>
      {config.predictKey ? (
        <ChoiceGroup
          legend={t.rich(config.predictKey)}
          choices={config.variants.map((v) => ({ id: v.id, label: t.rich(v.labelKey) }))}
          value={state?.prediction}
          locked={ran}
          onChange={(id) => setState({ ...state, values: shared, prediction: id })}
        />
      ) : null}
      <SharedControls config={config} shared={shared} locale={locale} t={t} onChange={(id, v) => setState({ ...state, values: { ...shared, [id]: v }, ran, prediction: state?.prediction })} idPrefix={`compare-${block.id}`} />
      {!ran ? (
        <Button variant="primary" disabled={!canRun} onClick={() => { focus.arm(); setState({ ...state, values: shared, ran: true }); }}>
          {ui("run")}
        </Button>
      ) : (
        <div ref={focus.ref} tabIndex={-1} className="lm-stack">
          <div className="lm-compare__panels">
            {config.variants.map((v) => (
              <Panel key={v.id} config={config} variant={v} shared={shared} locale={locale} t={t} ui={ui} />
            ))}
          </div>
          <div className="lm-insight">{t.rich(config.explainKey)}</div>
          {state?.prediction && winner ? (
            <p className="lm-muted">{ui(state.prediction === winner ? "predictionMatches" : "predictionDiffers")}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Classroom: predict via a show of hands, then run and compare side by side. */
export function CompareClassroom({ config, state, setState, t, ui, locale, block }: Props) {
  const shared = state?.values ?? {};
  const ran = !!state?.ran;
  const focus = useFocusAfter<HTMLDivElement>(ran);
  const winner = higherVariant(config, shared);
  const options = config.variants.map((v) => ({ id: v.id, label: t.rich(v.labelKey), text: t.text(v.labelKey) }));
  const topVoted = () => {
    const counts = state?.counts ?? {};
    const [a, b] = config.variants;
    return (counts[a.id] ?? 0) >= (counts[b.id] ?? 0) ? a.id : b.id;
  };
  return (
    <div className="lm-compare">
      <p className="lm-lead">{t.rich(config.promptKey)}</p>
      {config.predictKey ? (
        <>
          <h3 className="lm-prompt">{t.rich(config.predictKey)}</h3>
          <Tally
            ui={ui}
            options={options}
            counts={state?.counts ?? {}}
            onChange={(counts) => setState({ ...state, values: shared, counts }, { coalesce: true })}
            revealed={!!state?.tallyShown}
            onReveal={(tallyShown) => setState({ ...state, tallyShown })}
            highlight={ran ? winner : undefined}
          />
        </>
      ) : null}
      <SharedControls config={config} shared={shared} locale={locale} t={t} onChange={(id, v) => setState({ ...state, values: { ...shared, [id]: v } })} idPrefix={`compare-${block.id}-classroom`} />
      {!ran ? (
        <Button variant="primary" onClick={() => { focus.arm(); setState({ ...state, values: shared, ran: true, prediction: config.predictKey ? topVoted() : undefined }); }}>
          {ui("run")}
        </Button>
      ) : (
        <div ref={focus.ref} tabIndex={-1} className="lm-stack">
          <div className="lm-compare__panels">
            {config.variants.map((v) => (
              <Panel key={v.id} config={config} variant={v} shared={shared} locale={locale} t={t} ui={ui} />
            ))}
          </div>
          <div className="lm-insight">{t.rich(config.explainKey)}</div>
        </div>
      )}
    </div>
  );
}
