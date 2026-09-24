import type { ComponentPlugin } from "@lm/engine";
import { checkContract, type CheckConfig } from "./contract";
import { messages } from "./messages";
import { Check, CheckClassroom, type CheckState } from "./Check";

export const check: ComponentPlugin<CheckConfig & Record<string, unknown>, CheckState> = {
  ...checkContract,
  personal: Check,
  classroom: CheckClassroom,
  messages,
  summarize: () => null,
};

export type { CheckConfig, CheckState };
