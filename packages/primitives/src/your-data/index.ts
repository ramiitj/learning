import type { ComponentPlugin } from "@lm/engine";
import { cleanInput } from "../shared/strings";
import { yourDataContract, type YourDataConfig } from "./contract";
import { messages } from "./messages";
import { YourData, type YourDataState } from "./YourData";

export const yourData: ComponentPlugin<YourDataConfig & Record<string, unknown>, YourDataState> = {
  ...yourDataContract,
  personal: YourData,
  classroom: YourData,
  messages,
  summarize: (state, config) => {
    if (config.kind === "list") {
      if (!state?.items?.length) return null;
      return state.items.map((i) => cleanInput(i, config.maxLength ?? 80)).map((i) => `“${i}”`).join("  ·  ");
    }
    const text = cleanInput(state?.text ?? "", 1000);
    if (!text) return null;
    return text.length > 120 ? `${text.slice(0, 119)}…` : text;
  },
};

export type { YourDataConfig } from "./contract";
export type { YourDataState } from "./YourData";
