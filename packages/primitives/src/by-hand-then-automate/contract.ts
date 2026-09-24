import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export type Process =
  | { type: "threshold"; threshold: number; aboveKey: string; belowKey: string }
  | { type: "linear"; weight: number; bias: number };

export interface ByHandItem {
  id: string;
  labelKey: string;
  value: number;
}

export interface ByHandConfig {
  introKey: string;
  process: Process;
  items: ByHandItem[];
  /** How many items the learner does by hand before the machine takes over. Default 2. */
  manualCount?: number;
  /** ICU text describing the rule; receives {threshold}, {weight}, {bias}. */
  ruleKey: string;
  automateKey: string;
  /** What each item's number is, e.g. "Junk score". Defaults to a generic "Value". */
  valueLabelKey?: string;
}

export const byHandThenAutomateContract: ComponentContract = {
  type: "by-hand-then-automate",
  versions: ["1.0"],
  act: "build",
  configSchema: {
    type: "object",
    required: ["introKey", "process", "items", "ruleKey", "automateKey"],
    additionalProperties: false,
    properties: {
      introKey: { type: "string" },
      process: {
        oneOf: [
          {
            type: "object",
            required: ["type", "threshold", "aboveKey", "belowKey"],
            additionalProperties: false,
            properties: {
              type: { const: "threshold" },
              threshold: { type: "number" },
              aboveKey: { type: "string" },
              belowKey: { type: "string" },
            },
          },
          {
            type: "object",
            required: ["type", "weight", "bias"],
            additionalProperties: false,
            properties: {
              type: { const: "linear" },
              weight: { type: "number" },
              bias: { type: "number" },
            },
          },
        ],
      },
      items: {
        type: "array",
        minItems: 3,
        items: {
          type: "object",
          required: ["id", "labelKey", "value"],
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            labelKey: { type: "string" },
            value: { type: "number" },
          },
        },
      },
      manualCount: { type: "integer", minimum: 0 },
      ruleKey: { type: "string" },
      automateKey: { type: "string" },
      valueLabelKey: { type: "string" },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as ByHandConfig;
    const processKeys = x.process.type === "threshold" ? [x.process.aboveKey, x.process.belowKey] : [];
    return keys(x.introKey, x.ruleKey, x.automateKey, x.valueLabelKey, x.items.map((i) => i.labelKey), processKeys);
  },
};
