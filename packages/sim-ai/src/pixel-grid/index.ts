import type { ComponentPlugin } from "@lm/engine";
import { pixelGridContract, type PixelGridConfig } from "./contract";
import { messages } from "./messages";
import { PixelGrid, PixelGridClassroom, type PixelGridState } from "./PixelGrid";
import { inkCount } from "./model";

export const pixelGrid: ComponentPlugin<PixelGridConfig & Record<string, unknown>, PixelGridState> = {
  ...pixelGridContract,
  personal: PixelGrid,
  classroom: PixelGridClassroom,
  messages,
  summarize: (state, _config, _t, ui) => {
    const n = state?.cells ? inkCount(state.cells) : 0;
    return n > 0 ? ui("summary", { n }) : null;
  },
};

export type { PixelGridConfig } from "./contract";
export type { PixelGridState } from "./PixelGrid";
