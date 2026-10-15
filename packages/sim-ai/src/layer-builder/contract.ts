import type { ComponentContract } from "@lm/schema";
import { keys } from "@lm/primitives/shared/strings";
import type { DatasetConfig } from "./model";

export interface LayerBuilderConfig {
  promptKey: string;
  /** Either the points themselves ([x, y] pairs) or a named generator, so content holds no code. */
  dataset: DatasetConfig;
  /** 1 to 3 hidden layers. */
  maxLayers: number;
  /** 1 to 16 neurons per layer. */
  maxWidth: number;
  /** Shown after the learner has trained a network. */
  explainKey?: string;
  /** Classroom vote: describes the small and the big network. Both are needed for a vote. */
  smallKey?: string;
  bigKey?: string;
}

const pair = { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 };
const points = { type: "array", items: pair, minItems: 2, maxItems: 200 };

export const layerBuilderContract: ComponentContract = {
  type: "layer-builder",
  versions: ["1.0"],
  act: "build",
  vote: (c) => {
    const x = c as unknown as LayerBuilderConfig;
    if (!x.smallKey || !x.bigKey) return null;
    return { promptKey: x.promptKey, options: [{ id: "small", labelKey: x.smallKey }, { id: "big", labelKey: x.bigKey }] };
  },
  configSchema: {
    type: "object",
    required: ["promptKey", "dataset", "maxLayers", "maxWidth"],
    additionalProperties: false,
    properties: {
      promptKey: { type: "string" },
      dataset: {
        oneOf: [
          {
            type: "object",
            required: ["train", "test"],
            additionalProperties: false,
            properties: { train: points, test: points },
          },
          {
            type: "object",
            required: ["type", "points", "noise", "seed"],
            additionalProperties: false,
            properties: {
              type: { enum: ["wave", "steps"] },
              points: { type: "integer", minimum: 4, maximum: 60 },
              noise: { type: "number", minimum: 0, maximum: 2 },
              seed: { type: "integer", minimum: 0 },
            },
          },
        ],
      },
      maxLayers: { type: "integer", minimum: 1, maximum: 3 },
      maxWidth: { type: "integer", minimum: 1, maximum: 16 },
      explainKey: { type: "string" },
      smallKey: { type: "string" },
      bigKey: { type: "string" },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as LayerBuilderConfig;
    return keys(x.promptKey, x.explainKey, x.smallKey, x.bigKey);
  },
};
