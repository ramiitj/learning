import type { ComponentPlugin } from "@lm/engine";
import { cleanInput } from "../shared/strings";
import { breakItContract, type BreakItConfig } from "./contract";
import { messages } from "./messages";
import { BreakIt, BreakItClassroom, type BreakItState } from "./BreakIt";

export const breakIt: ComponentPlugin<BreakItConfig & Record<string, unknown>, BreakItState> = {
  ...breakItContract,
  personal: BreakIt,
  classroom: BreakItClassroom,
  messages,
  summarize: (state, _config, _t, ui) => {
    if (!state) return null;
    if (state.reflection && state.reflection.trim()) return cleanInput(state.reflection, 120);
    if (state.tried.length > 0) return ui("summaryFound", { n: state.tried.length });
    return null;
  },
};

export type { BreakItConfig, BreakItState };
