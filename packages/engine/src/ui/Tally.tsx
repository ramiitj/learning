"use client";
import { useId, type ReactNode } from "react";
import type { UiT } from "../types";
import { Button } from "./Button";

export type Counts = Record<string, number>;

/**
 * Show-of-hands entry and class distribution. Used by classroom variants when
 * students have no devices; Phase 2 live voting feeds the same distribution.
 * Counts are always shown as numbers, so colour never carries the meaning.
 */
export function Tally({ ui, options, counts, onChange, revealed, onReveal, highlight }: { ui: UiT; options: { id: string; label: ReactNode; text: string }[]; counts: Counts; onChange: (c: Counts) => void; revealed: boolean; onReveal: (v: boolean) => void; highlight?: string }) {
  const headingId = useId();
  const total = options.reduce((s, o) => s + (counts[o.id] ?? 0), 0);
  const max = Math.max(1, ...options.map((o) => counts[o.id] ?? 0));
  const set = (id: string, d: number) => onChange({ ...counts, [id]: Math.max(0, (counts[id] ?? 0) + d) });
  return (
    <section className="lm-tally" aria-labelledby={headingId}>
      <h4 id={headingId} className="lm-tally__title">{ui("tally.label")}</h4>
      <p className="lm-tally__help">{ui("tally.help")}</p>
      <ul className="lm-tally__list">
        {options.map((o) => {
          const n = counts[o.id] ?? 0;
          return (
            <li key={o.id} className="lm-tally__row" data-highlight={highlight === o.id || undefined}>
              <span className="lm-tally__label">{o.label}</span>
              <span className="lm-tally__controls">
                <Button variant="secondary" className="lm-tally__step" aria-label={ui("tally.remove", { option: o.text })} onClick={() => set(o.id, -1)} disabled={n === 0}>−</Button>
                <output className="lm-tally__count" aria-live="polite">{n}</output>
                <Button variant="primary" className="lm-tally__step" aria-label={ui("tally.add", { option: o.text })} onClick={() => set(o.id, +1)}>+</Button>
              </span>
              {revealed ? (
                <span className="lm-bar" aria-hidden="true">
                  <span className="lm-bar__fill" style={{ inlineSize: `${(n / max) * 100}%` }} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="lm-tally__total">{ui("tally.total", { n: total })}</p>
      <Button variant={revealed ? "quiet" : "primary"} onClick={() => onReveal(!revealed)} disabled={!revealed && total === 0}>
        {ui(revealed ? "tally.hide" : "tally.show")}
      </Button>
    </section>
  );
}
