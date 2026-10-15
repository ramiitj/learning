import type { ComponentPlugin } from "@lm/engine";
import { predictContract, type PredictConfig } from "./contract";
import { messages } from "./messages";
import { Predict, PredictClassroom, type PredictState } from "./Predict";

export const predict: ComponentPlugin<PredictConfig & Record<string, unknown>, PredictState> = {
  ...predictContract,
  personal: Predict,
  classroom: PredictClassroom,
  messages,
  outcome: (state, config) => (state?.committed && state.choice ? { choice: state.choice, correct: config.answer ? state.choice === config.answer : undefined } : null),
  summarize: (state, _config, t, ui) => (state?.committed && state.choice ? ui("summary", { choice: t.text(state.choice) }) : null),
};
