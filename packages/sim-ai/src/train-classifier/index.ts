import type { ComponentPlugin } from "@lm/engine";
import { trainClassifierContract, type TrainClassifierConfig } from "./contract";
import { messages } from "./messages";
import { TrainClassifier, TrainClassifierClassroom, labelTestItems, type TrainClassifierState } from "./TrainClassifier";

export const trainClassifier: ComponentPlugin<TrainClassifierConfig & Record<string, unknown>, TrainClassifierState> = {
  ...trainClassifierContract,
  personal: TrainClassifier,
  classroom: TrainClassifierClassroom,
  messages,
  summarize: (state, config, _t, ui) => {
    if (!state?.trainedOn) return null;
    return ui("summary", { n: Object.keys(state.trainedOn).length, m: labelTestItems(config, state.trainedOn).filter((r) => r.prediction).length });
  },
};

export * from "./contract";
export * from "./model";
