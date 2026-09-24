import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";
import { modelSchema, modelStringKeys, type ModelSpec } from "../shared/model";

export interface CompareVariant {
  id: string;
  labelKey: string;
  /** Input ids fixed to a particular value for this variant, isolating the one thing being compared. */
  overrides: Record<string, number>;
}

export interface CompareConfig {
  promptKey: string;
  model: ModelSpec;
  /** Exactly two variants: what is being compared. */
  variants: [CompareVariant, CompareVariant];
  /** Input ids the learner can still change for both variants; defaults to inputs neither variant overrides. */
  shared?: string[];
  /** A question asking which variant will come out higher, asked before running. */
  predictKey?: string;
  explainKey: string;
}

export const compareContract: ComponentContract = {
  type: "compare",
  versions: ["1.0"],
  act: "explore",
  configSchema: {
    type: "object",
    required: ["promptKey", "model", "variants", "explainKey"],
    additionalProperties: false,
    properties: {
      promptKey: { type: "string" },
      model: modelSchema,
      variants: {
        type: "array",
        minItems: 2,
        maxItems: 2,
        items: {
          type: "object",
          required: ["id", "labelKey", "overrides"],
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            labelKey: { type: "string" },
            overrides: { type: "object", additionalProperties: { type: "number" } },
          },
        },
      },
      shared: { type: "array", items: { type: "string" } },
      predictKey: { type: "string" },
      explainKey: { type: "string" },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as CompareConfig;
    return keys(x.promptKey, modelStringKeys(x.model), x.variants.map((v) => v.labelKey), x.predictKey, x.explainKey);
  },
};
