import type { ComponentPlugin } from "@lm/engine";
import { checkContract, type CheckConfig } from "./contract";
import { messages } from "./messages";
import { Check, CheckClassroom, type CheckState } from "./Check";

export const check: ComponentPlugin<CheckConfig & Record<string, unknown>, CheckState> = {
  ...checkContract,
  personal: Check,
  classroom: CheckClassroom,
  messages,
  // The first attempt is what shows a misconception; later attempts are the hint ladder doing its work.
  outcome: (state, config) => (state?.attempts?.[0] ? { choice: state.attempts[0], correct: state.attempts[0] === config.answer } : null),
  summarize: () => null,
};

export type { CheckConfig, CheckState };
