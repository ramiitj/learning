"use client";
import { GlossaryTerm, useEngine, type UiT } from "@lm/engine";

/**
 * The words a lesson author chose to explain, as the engine's own glossary
 * links (tap to see the definition in place). Ids that are not in the glossary
 * are skipped, so a missing term never breaks the block.
 */
export function GlossaryRow({ ids, ui }: { ids?: readonly string[]; ui: UiT }) {
  const { glossary } = useEngine();
  const known = (ids ?? []).filter((id) => id in glossary);
  if (!known.length) return null;
  return (
    <div className="lm-words">
      <span className="lm-words__label">{ui("glossary.here")}</span>
      {known.map((id) => (
        <GlossaryTerm key={id} termId={id} chip>{glossary[id]!.term}</GlossaryTerm>
      ))}
    </div>
  );
}
