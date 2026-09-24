"use client";
import { useId } from "react";
import type { UiT } from "../types";

export type ConfidenceLevel = "low" | "mid" | "high";

/** Confidence rating that sits beside a prediction, for calibration. */
export function Confidence({ ui, value, onChange, disabled }: { ui: UiT; value: ConfidenceLevel | undefined; onChange: (v: ConfidenceLevel) => void; disabled?: boolean }) {
  const name = useId();
  const levels: ConfidenceLevel[] = ["low", "mid", "high"];
  return (
    <fieldset className="lm-confidence">
      <legend>{ui("confidence.label")}</legend>
      <div className="lm-confidence__row">
        {levels.map((l) => (
          <label key={l} className="lm-pill" data-selected={value === l || undefined}>
            <input type="radio" name={name} value={l} checked={value === l} disabled={disabled} onChange={() => onChange(l)} />
            <span>{ui(`confidence.${l}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
