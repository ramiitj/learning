import type { ComponentPlugin } from "@lm/engine";
import { analogyContract, type AnalogyConfig } from "./contract";
import { messages } from "./messages";
import { Analogy, AnalogyClassroom, type AnalogyState } from "./Analogy";

export const analogy: ComponentPlugin<AnalogyConfig & Record<string, unknown>, AnalogyState> = {
  ...analogyContract,
  personal: Analogy,
  classroom: AnalogyClassroom,
  messages,
  summarize: () => null,
};

export type { AnalogyConfig, AnalogyState };
