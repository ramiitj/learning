import type { ComponentPlugin } from "@lm/engine";
import { nextWordModelContract, type NextWordModelConfig } from "./contract";
import { messages } from "./messages";
import { NextWordModel, NextWordModelClassroom, type NextWordModelState } from "./NextWordModel";

export const nextWordModel: ComponentPlugin<NextWordModelConfig & Record<string, unknown>, NextWordModelState> = {
  ...nextWordModelContract,
  personal: NextWordModel,
  classroom: NextWordModelClassroom,
  messages,
  summarize: (state, _config, _t, ui) => (state?.stats && state.stats.s > 0 ? ui("summary", state.stats) : null),
};

export type { NextWordModelConfig } from "./contract";
export type { NextWordModelState } from "./NextWordModel";
