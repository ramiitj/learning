"use client";
import { useId, type ReactNode } from "react";

export interface Choice {
  id: string;
  label: ReactNode;
  /** Extra line shown under the label once the group is locked (e.g. feedback). */
  note?: ReactNode;
  tone?: "neutral" | "insight" | "warm";
}

/**
 * A single-choice question as large tappable cards backed by native radio
 * inputs, so keyboard and screen readers get the standard radio behaviour.
 */
export function ChoiceGroup({ legend, choices, value, onChange, locked = false, name }: { legend: ReactNode; choices: Choice[]; value: string | undefined; onChange: (id: string) => void; locked?: boolean; name?: string }) {
  const auto = useId();
  const groupName = name ?? auto;
  return (
    <fieldset className="lm-choices" data-locked={locked || undefined}>
      <legend className="lm-choices__legend">{legend}</legend>
      {choices.map((c) => {
        const id = `${groupName}-${c.id}`;
        return (
          <div key={c.id} className="lm-choice" data-selected={value === c.id || undefined} data-tone={c.tone}>
            <input type="radio" id={id} name={groupName} value={c.id} checked={value === c.id} disabled={locked && value !== c.id} onChange={() => onChange(c.id)} />
            <label htmlFor={id}>
              <span className="lm-choice__label">{c.label}</span>
              {c.note ? <span className="lm-choice__note">{c.note}</span> : null}
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}
