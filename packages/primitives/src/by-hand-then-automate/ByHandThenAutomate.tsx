"use client";
import { useEffect, useRef, useState } from "react";
import { Button, useFocusAfter, type BlockProps } from "@lm/engine";
import type { ByHandConfig, ByHandItem, Process } from "./contract";

export interface ByHandState {
  manual: Record<string, "above" | "below" | number>;
  automated?: boolean;
}

type Props = BlockProps<ByHandConfig & Record<string, unknown>, ByHandState>;

function fmt(locale: string, n: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(n);
}

function ruleResult(process: Process, value: number): "above" | "below" | number {
  return process.type === "threshold" ? (value >= process.threshold ? "above" : "below") : process.weight * value + process.bias;
}

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** The working, spelled out fully, for one item. */
function Working({ config, item, locale, t, ui }: { config: ByHandConfig; item: ByHandItem; locale: string; t: Props["t"]; ui: Props["ui"] }) {
  const { process } = config;
  if (process.type === "threshold") {
    const above = item.value >= process.threshold;
    return (
      <p className="lm-by-hand-then-automate__working">
        <code>{ui("workingThreshold", { value: fmt(locale, item.value), symbol: above ? "≥" : "<", threshold: fmt(locale, process.threshold), result: t.text(above ? process.aboveKey : process.belowKey) })}</code>
      </p>
    );
  }
  const result = process.weight * item.value + process.bias;
  return (
    <p className="lm-by-hand-then-automate__working">
      <code>{ui("workingLinear", { value: fmt(locale, item.value), weight: fmt(locale, process.weight), bias: fmt(locale, process.bias), result: fmt(locale, result) })}</code>
    </p>
  );
}

function resultText(config: ByHandConfig, item: ByHandItem, locale: string, t: Props["t"]): string {
  const r = ruleResult(config.process, item.value);
  return typeof r === "number" ? fmt(locale, r) : t.text(config.process.type === "threshold" ? (r === "above" ? config.process.aboveKey : config.process.belowKey) : r);
}

function ManualStep({ config, item, index, total, mode, locale, t, ui, onAnswer, answer }: {
  config: ByHandConfig; item: ByHandItem; index: number; total: number; mode: "personal" | "classroom";
  locale: string; t: Props["t"]; ui: Props["ui"]; onAnswer: (v: "above" | "below" | number) => void; answer?: "above" | "below" | number;
}) {
  const [typed, setTyped] = useState("");
  const answered = answer !== undefined;
  const process = config.process;
  const differs = answered && answer !== ruleResult(process, item.value);
  return (
    <div className="lm-by-hand-then-automate__step">
      <p className="lm-muted lm-small">{ui("stepProgress", { n: index + 1, m: total })}</p>
      <p className="lm-lead">{t.rich(item.labelKey)}</p>
      <p>{ui("itemValue", { value: fmt(locale, item.value) })}</p>
      {mode === "classroom" && !answered ? <p className="lm-notice">{ui("classroomCheck")}</p> : null}
      {!answered ? (
        process.type === "threshold" ? (
          <div className="lm-row">
            <Button variant="secondary" onClick={() => onAnswer("above")}>{t.rich(process.aboveKey)}</Button>
            <Button variant="secondary" onClick={() => onAnswer("below")}>{t.rich(process.belowKey)}</Button>
          </div>
        ) : (
          <div className="lm-row">
            <label htmlFor={`bhta-${item.id}`}>{ui("numberInputLabel")}</label>
            <input id={`bhta-${item.id}`} type="number" inputMode="decimal" value={typed} onChange={(e) => setTyped(e.target.value)} />
            <Button variant="primary" disabled={typed.trim() === ""} onClick={() => onAnswer(Number(typed))}>{ui("workOut")}</Button>
          </div>
        )
      ) : (
        <div className="lm-stack">
          <Working config={config} item={item} locale={locale} t={t} ui={ui} />
          {differs ? <p className="lm-muted">{ui("differs", { result: resultText(config, item, locale, t) })}</p> : null}
        </div>
      )}
    </div>
  );
}

export function ByHandThenAutomate({ config, state, setState, t, ui, locale, mode }: Props) {
  const manualCount = config.manualCount ?? 2;
  const manualItems = config.items.slice(0, manualCount);
  const manual = state?.manual ?? {};
  const nextIndex = manualItems.findIndex((it) => !(it.id in manual));
  const manualDone = nextIndex === -1;
  const focus = useFocusAfter<HTMLDivElement>(Object.keys(manual).length);

  const [revealCount, setRevealCount] = useState(() => (state?.automated ? config.items.length : 0));
  const [running, setRunning] = useState(false);
  const tableFocus = useFocusAfter<HTMLDivElement>(revealCount >= config.items.length && (running || !!state?.automated));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const startAutomation = () => {
    tableFocus.arm();
    if (reducedMotion()) {
      setRevealCount(config.items.length);
      setState({ ...state, manual, automated: true });
      return;
    }
    setRunning(true);
    setRevealCount(0);
    const step = (n: number) => {
      setRevealCount(n);
      if (n < config.items.length) {
        timer.current = setTimeout(() => step(n + 1), 80);
      } else {
        setRunning(false);
        setState({ ...state, manual, automated: true });
      }
    };
    timer.current = setTimeout(() => step(1), 80);
  };

  const showTable = running || !!state?.automated;

  return (
    <div className="lm-by-hand-then-automate">
      <p className="lm-lead">{t.rich(config.introKey)}</p>
      <p>{t.rich(config.ruleKey, { threshold: config.process.type === "threshold" ? fmt(locale, config.process.threshold) : 0, weight: config.process.type === "linear" ? fmt(locale, config.process.weight) : 0, bias: config.process.type === "linear" ? fmt(locale, config.process.bias) : 0 })}</p>

      <div className="lm-stack">
        {manualItems.slice(0, manualDone ? manualItems.length : nextIndex + 1).map((item, i) => (
          <div key={item.id} ref={i === nextIndex ? focus.ref : undefined} tabIndex={i === nextIndex ? -1 : undefined}>
            <ManualStep
              config={config}
              item={item}
              index={i}
              total={manualItems.length}
              mode={mode}
              locale={locale}
              t={t}
              ui={ui}
              answer={manual[item.id]}
              onAnswer={(v) => setState({ ...state, manual: { ...manual, [item.id]: v } })}
            />
          </div>
        ))}
        {manualDone && !showTable ? (
          <Button variant="primary" onClick={startAutomation}>{ui("automateButton", { n: config.items.length })}</Button>
        ) : null}
      </div>

      {showTable ? (
        <div ref={tableFocus.ref} tabIndex={-1} className="lm-stack">
          <p role="status" aria-live="polite" className="lm-muted lm-small">{ui("machineCount", { n: Math.min(revealCount, config.items.length) })}</p>
          <table className="lm-by-hand-then-automate__table">
            <caption>{ui("tableCaption", { n: config.items.length })}</caption>
            <thead>
              <tr>
                <th scope="col">{ui("colItem")}</th>
                <th scope="col">{ui("colResult")}</th>
                <th scope="col">{ui("colWorking")}</th>
              </tr>
            </thead>
            <tbody>
              {config.items.slice(0, revealCount).map((item) => (
                <tr key={item.id}>
                  <th scope="row">{t.rich(item.labelKey)}</th>
                  <td>{resultText(config, item, locale, t)}</td>
                  <td><Working config={config} item={item} locale={locale} t={t} ui={ui} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {state?.automated ? <div className="lm-insight">{t.rich(config.automateKey)}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
