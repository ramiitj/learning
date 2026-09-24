import type { ComponentPlugin } from "@lm/engine";
import { byHandThenAutomateContract, type ByHandConfig } from "./contract";
import { messages } from "./messages";
import { ByHandThenAutomate, type ByHandState } from "./ByHandThenAutomate";

export const byHandThenAutomate: ComponentPlugin<ByHandConfig & Record<string, unknown>, ByHandState> = {
  ...byHandThenAutomateContract,
  personal: ByHandThenAutomate,
  classroom: ByHandThenAutomate,
  messages,
  summarize: (state, config, _t, ui) => {
    const manualCount = Object.keys(state?.manual ?? {}).length;
    if (!manualCount && !state?.automated) return null;
    return ui("summary", { m: manualCount, n: config.items.length });
  },
};

export * from "./contract";
export * from "./ByHandThenAutomate";
