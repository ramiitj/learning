import type { ComponentPlugin } from "@lm/engine";
import { takeawayContract, type TakeawayConfig } from "./contract";
import { messages } from "./messages";
import { Takeaway, type TakeawayState } from "./Takeaway";

export const takeaway: ComponentPlugin<TakeawayConfig & Record<string, unknown>, TakeawayState> = {
  ...takeawayContract,
  personal: Takeaway,
  classroom: Takeaway,
  messages,
  summarize: () => null,
};

export type { TakeawayConfig } from "./contract";
export type { TakeawayState } from "./Takeaway";
export { resolveInclude, downloadCard } from "./Takeaway";
