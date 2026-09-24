import type { ComponentPlugin } from "@lm/engine";
import { cleanInput } from "../shared/strings";
import { explainBackContract, type ExplainBackConfig } from "./contract";
import { messages } from "./messages";
import { ExplainBack, ExplainBackClassroom, type ExplainBackState } from "./ExplainBack";

export const explainBack: ComponentPlugin<ExplainBackConfig & Record<string, unknown>, ExplainBackState> = {
  ...explainBackContract,
  personal: ExplainBack,
  classroom: ExplainBackClassroom,
  messages,
  summarize: (state, config, t, _ui) => {
    if (!state) return null;
    if (state.text && state.text.trim()) return cleanInput(state.text, 120);
    if (state.choice) {
      const opt = config.options?.find((o) => o.id === state.choice);
      if (opt) return cleanInput(t.text(opt.textKey), 120);
    }
    return null;
  },
};

export type { ExplainBackConfig, ExplainBackState };
