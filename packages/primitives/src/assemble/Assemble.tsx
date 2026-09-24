"use client";
import { useId, useMemo, useRef, useState } from "react";
import { Button, useFocusAfter, type BlockProps } from "@lm/engine";
import { seededShuffle } from "../shared/strings";
import type { AssembleConfig } from "./contract";

export interface AssembleState {
  order: string[];
  checked?: boolean;
}

type Props = BlockProps<AssembleConfig & Record<string, unknown>, AssembleState>;

function initialOrder(config: AssembleConfig, seed: string): string[] {
  let order = seededShuffle(config.pieces, seed).map((p) => p.id);
  if (config.targetOrder && order.length === config.targetOrder.length && order.every((id, i) => id === config.targetOrder![i])) {
    order = [...order.slice(1), order[0]!];
  }
  return order;
}

/** Same component for both modes: classroom adds a suggestion prompt before each move. */
export function Assemble({ block, config, mode, state, setState, t, ui }: Props) {
  const computedInitial = useMemo(() => initialOrder(config, block.id), [config, block.id]);
  const order = state?.order ?? computedInitial;
  const checked = !!state?.checked;
  const dragId = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const listId = useId();
  const total = config.pieces.length;
  const correctCount = config.targetOrder ? order.filter((id, i) => id === config.targetOrder![i]).length : 0;
  const allCorrect = !!config.targetOrder && correctCount === total;
  const focus = useFocusAfter<HTMLDivElement>(checked);

  const byId = useMemo(() => new Map(config.pieces.map((p) => [p.id, p])), [config.pieces]);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target]!, next[index]!];
    const item = byId.get(order[index]!);
    setAnnouncement(ui(dir === -1 ? "moveUp" : "moveDown", { item: item ? t.text(item.labelKey) : "" }));
    setState({ order: next, checked: false });
  };

  const reorderTo = (fromId: string, toIndex: number) => {
    const fromIndex = order.indexOf(fromId);
    if (fromIndex === -1 || fromIndex === toIndex) return;
    const next = [...order];
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, fromId);
    setState({ order: next, checked: false });
  };

  const check = () => {
    focus.arm();
    setState((prev) => ({ order: prev?.order ?? order, checked: true }));
  };

  return (
    <div className="lm-assemble">
      <p className="lm-lead">{t.rich(config.instructionKey)}</p>
      <p className="lm-sr-only" aria-live="polite" role="status">{announcement}</p>
      {mode === "classroom" ? <p className="lm-notice" role="note">{ui("classroomPrompt")}</p> : null}
      <ol className="lm-assemble__list" id={listId}>
        {order.map((id, i) => {
          const piece = byId.get(id);
          if (!piece) return null;
          const isCorrect = config.targetOrder ? config.targetOrder[i] === id : undefined;
          return (
            <li
              key={id}
              className="lm-assemble__row"
              data-status={checked && isCorrect === false ? "warm" : undefined}
              draggable
              onDragStart={() => { dragId.current = id; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (dragId.current) reorderTo(dragId.current, i); dragId.current = null; }}
            >
              <span className="lm-assemble__label">{t.rich(piece.labelKey)}</span>
              {checked && isCorrect === false ? <span className="lm-pill lm-assemble__badge">{ui("lookAgain")}</span> : null}
              <span className="lm-assemble__controls">
                <Button
                  variant="quiet"
                  aria-label={ui(i === 0 ? "atTop" : "moveUp", { item: t.text(piece.labelKey) })}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  ↑
                </Button>
                <Button
                  variant="quiet"
                  aria-label={ui(i === order.length - 1 ? "atBottom" : "moveDown", { item: t.text(piece.labelKey) })}
                  disabled={i === order.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </Button>
              </span>
            </li>
          );
        })}
      </ol>
      {config.targetOrder ? (
        <div className="lm-row">
          <Button variant="primary" onClick={check}>{ui("check")}</Button>
        </div>
      ) : null}
      {checked ? (
        <div ref={focus.ref} tabIndex={-1} className="lm-stack">
          <p>{ui("checkResult", { n: correctCount, total })}</p>
          {config.checkKey ? <p>{t.rich(config.checkKey)}</p> : null}
          {allCorrect && config.successKey ? <div className="lm-insight">{t.rich(config.successKey)}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
