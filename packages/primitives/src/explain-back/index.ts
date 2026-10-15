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
  outcome: (state, config) => {
    // Choosing shows the feedback at once, so the first choice is the answer.
    if (config.mode !== "choose" || !state?.choice) return null;
    const best = config.options?.find((o) => o.best)?.id;
    return { choice: state.choice, correct: best ? state.choice === best : undefined };
  },
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
