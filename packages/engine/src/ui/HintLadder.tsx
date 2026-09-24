"use client";
import type { ReactNode } from "react";
import type { UiT } from "../types";
import { Button } from "./Button";

/** Hints that go from a gentle nudge to a worked example, one rung at a time. */
export function HintLadder({ ui, hints, shown, onShow }: { ui: UiT; hints: ReactNode[]; shown: number; onShow: (n: number) => void }) {
  if (hints.length === 0) return null;
  return (
    <div className="lm-hints">
      {hints.slice(0, shown).map((h, i) => (
        <div key={i} className="lm-hint" role="note">
          <span className="lm-hint__step">{ui("hint.progress", { n: i + 1, total: hints.length })}</span>
          <div>{h}</div>
        </div>
      ))}
      {shown < hints.length ? (
        <Button variant="quiet" onClick={() => onShow(shown + 1)}>
          {ui(shown === 0 ? "hint.show" : "hint.next")}
        </Button>
      ) : null}
    </div>
  );
}
