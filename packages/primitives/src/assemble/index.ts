import type { ComponentPlugin } from "@lm/engine";
import { assembleContract, type AssembleConfig } from "./contract";
import { messages } from "./messages";
import { Assemble, type AssembleState } from "./Assemble";

export const assemble: ComponentPlugin<AssembleConfig & Record<string, unknown>, AssembleState> = {
  ...assembleContract,
  personal: Assemble,
  classroom: Assemble,
  messages,
  summarize: (state, config, t) => {
    if (!state?.order?.length) return null;
    const byId = new Map(config.pieces.map((p) => [p.id, p]));
    return state.order.map((id) => (byId.get(id) ? t.text(byId.get(id)!.labelKey) : id)).join(" → ");
  },
};

export type { AssembleConfig, AssemblePiece } from "./contract";
export type { AssembleState } from "./Assemble";
