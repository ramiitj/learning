"use client";
import { useId, useState } from "react";
import { Button, type BlockProps } from "@lm/engine";
import { cleanInput } from "../shared/strings";
import type { YourDataConfig } from "./contract";

export interface YourDataState {
  items?: string[];
  text?: string;
  /** How many of config.exampleKeys have already been offered. */
  usedExamples?: number;
}

type Props = BlockProps<YourDataConfig & Record<string, unknown>, YourDataState>;

const DEFAULTS = { minItems: 1, maxItems: 5, maxLength: 80 };

export function YourData({ config, mode, state, setState, t, ui }: Props) {
  const maxItems = config.maxItems ?? DEFAULTS.maxItems;
  const maxLength = config.maxLength ?? DEFAULTS.maxLength;
  const promptId = useId();

  return (
    <div className="lm-your-data">
      <p className="lm-lead" id={promptId}>{t.rich(config.promptKey)}</p>
      <p className="lm-muted lm-small">{ui("privacyNote")}</p>
      {mode === "classroom" ? <p className="lm-notice" role="note">{ui("classroomPrompt")}</p> : null}
      {config.kind === "list" ? (
        <ListInput config={config} maxItems={maxItems} maxLength={maxLength} state={state} setState={setState} t={t} ui={ui} />
      ) : (
        <TextInput maxLength={maxLength} state={state} setState={setState} t={t} ui={ui} />
      )}
    </div>
  );
}

function ListInput({ config, maxItems, maxLength, state, setState, t, ui }: Pick<Props, "config" | "state" | "setState" | "t" | "ui"> & { maxItems: number; maxLength: number }) {
  const items = state?.items ?? [];
  const usedExamples = state?.usedExamples ?? 0;
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState("");
  const inputId = useId();

  const add = (raw: string) => {
    const value = cleanInput(raw, maxLength);
    if (!value) {
      setHint(ui("emptyHint"));
      return;
    }
    if (items.some((i) => i.toLowerCase() === value.toLowerCase())) {
      setHint(ui("duplicateHint"));
      return;
    }
    if (items.length >= maxItems) {
      setHint(ui("maxItemsHint", { max: maxItems }));
      return;
    }
    setHint("");
    setDraft("");
    setState((prev) => ({ ...prev, items: [...(prev?.items ?? []), value] }));
  };

  const remove = (item: string) => {
    setState((prev) => ({ ...prev, items: (prev?.items ?? []).filter((i) => i !== item) }));
  };

  const useExample = () => {
    const examples = config.exampleKeys ?? [];
    if (usedExamples >= examples.length) {
      setHint(ui("noMoreExamples"));
      return;
    }
    const value = t.text(examples[usedExamples]!);
    setState((prev) => ({ ...prev, usedExamples: (prev?.usedExamples ?? 0) + 1 }));
    add(value);
  };

  return (
    <div className="lm-your-data__list">
      <div className="lm-row">
        <label className="lm-your-data__label" htmlFor={inputId}>{config.placeholderKey ? t.text(config.placeholderKey) : ui("inputLabel")}</label>
        <input
          id={inputId}
          type="text"
          className="lm-your-data__input"
          value={draft}
          placeholder={config.placeholderKey ? t.text(config.placeholderKey) : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(draft); } }}
        />
        <Button variant="primary" onClick={() => add(draft)}>{ui("addLabel")}</Button>
      </div>
      {hint ? <p className="lm-muted lm-small" role="status" aria-live="polite">{hint}</p> : null}
      {config.exampleKeys?.length ? (
        <Button variant="quiet" onClick={useExample}>{ui("useExample")}</Button>
      ) : null}
      {items.length ? (
        <ul className="lm-your-data__items">
          {items.map((item) => (
            <li key={item}>
              <span>{item}</span>
              <Button variant="quiet" aria-label={ui("remove", { item })} onClick={() => remove(item)}>×</Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TextInput({ maxLength, state, setState, ui }: Pick<Props, "state" | "setState" | "ui" | "t"> & { maxLength: number }) {
  const text = state?.text ?? "";
  const textareaId = useId();
  return (
    <div className="lm-your-data__text">
      <label htmlFor={textareaId} className="lm-your-data__label">{ui("textLabel")}</label>
      <textarea
        id={textareaId}
        className="lm-your-data__textarea"
        value={text}
        onChange={(e) => setState((prev) => ({ ...prev, text: e.target.value.slice(0, maxLength) }), { coalesce: true })}
      />
      <p className="lm-muted lm-small">{ui("charCount", { n: text.length, max: maxLength })}</p>
    </div>
  );
}
