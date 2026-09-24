import type { ComponentPlugin } from "@lm/engine";
import { revealContract, type RevealConfig } from "./contract";
import { messages } from "./messages";
import { Reveal, type RevealState } from "./Reveal";

/** Classroom variant: the same view; the teacher controls the reveal from the projected screen. */
export const reveal: ComponentPlugin<RevealConfig & Record<string, unknown>, RevealState> = {
  ...revealContract,
  personal: Reveal,
  classroom: Reveal,
  messages,
  howToApplies: (config) => (config.steps?.length ?? 0) > 0,
};
