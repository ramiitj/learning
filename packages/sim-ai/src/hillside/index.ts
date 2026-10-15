import type { ComponentPlugin } from "@lm/engine";
import { hillsideContract, type HillsideConfig } from "./contract";
import { messages } from "./messages";
import { Hillside, HillsideClassroom, type HillsideState } from "./Hillside";
import { height, resolveWalk } from "./model";

export const hillside: ComponentPlugin<HillsideConfig & Record<string, unknown>, HillsideState> = {
  ...hillsideContract,
  personal: Hillside,
  classroom: HillsideClassroom,
  messages,
  summarize: (state, config, _t, ui) => {
    if (!state?.positions || state.positions.length < 2) return null;
    const walk = resolveWalk(config);
    const h = height(walk.landscape, state.positions[state.positions.length - 1]!);
    return ui("summary", { n: state.positions.length - 1, height: String(Math.round(h * 10) / 10) });
  },
};

export * from "./contract";
export * from "./model";
