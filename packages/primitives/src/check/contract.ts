import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export interface CheckConfig {
  promptKey: string;
  /** String keys of the answer options. */
  options: string[];
  /** The option key that is the answer. */
  answer: string;
  /** Per-option response, keyed by option key. */
  feedback?: Record<string, string>;
  /** A gentle nudge -> worked example, one rung at a time. */
  hints?: string[];
  /** Shown once the learner's choice matches the answer. */
  explainKey?: string;
  /** Detour id offered after two attempts that do not land. */
  detour?: string;
}

export const checkContract: ComponentContract = {
  type: "check",
  versions: ["1.0"],
  act: "decide",
  configSchema: {
    type: "object",
    required: ["promptKey", "options", "answer"],
    additionalProperties: false,
    properties: {
      promptKey: { type: "string" },
      options: { type: "array", items: { type: "string" }, minItems: 2 },
      answer: { type: "string" },
      feedback: { type: "object", additionalProperties: { type: "string" } },
      hints: { type: "array", items: { type: "string" } },
      explainKey: { type: "string" },
      detour: { type: "string" },
      mode: { enum: ["class-vote"] },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as CheckConfig;
    return keys(x.promptKey, x.options, Object.values(x.feedback ?? {}), x.hints, x.explainKey);
  },
};
