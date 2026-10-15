import type { ComponentContract } from "@lm/schema";
import { keys } from "@lm/primitives/shared/strings";
import { glossaryProperty } from "../glossary-schema";

export interface TrainFeature {
  id: string;
  labelKey: string;
}

export interface TrainItem {
  id: string;
  labelKey: string;
  /** A decorative glyph; aria-hidden, never the only way to tell items apart. */
  symbol?: string;
  /** A number for each declared feature id. */
  features: Record<string, number>;
}

export interface TrainClassifierConfig {
  promptKey: string;
  /** String keys naming the groups (two or more). When fromBlock is set they must match that sort block's groups. */
  groups: string[];
  features: TrainFeature[];
  /** Examples the machine learns from. */
  items: TrainItem[];
  /** Examples the machine then labels. */
  testItems: TrainItem[];
  /** Id of an earlier `sort` block whose placements supply the learner's labels. */
  fromBlock?: string;
  explainKey?: string;
  /** Glossary term ids to link under the intro (optional). */
  glossary?: string[];
}

const itemSchema = {
  type: "object",
  required: ["id", "labelKey", "features"],
  additionalProperties: false,
  properties: {
    id: { type: "string", minLength: 1 },
    labelKey: { type: "string" },
    symbol: { type: "string" },
    features: { type: "object", additionalProperties: { type: "number" } },
  },
};

export const trainClassifierContract: ComponentContract = {
  type: "train-classifier",
  versions: ["1.0"],
  act: "build",
  vote: (c) => {
    const x = c as unknown as TrainClassifierConfig;
    return {
      promptKey: x.promptKey,
      options: x.groups.map((g) => ({ id: g, labelKey: g })),
      perItem: x.testItems.map((i) => ({ id: i.id, labelKey: i.labelKey })),
    };
  },
  blockRefs: (c) => {
    const x = c as unknown as TrainClassifierConfig;
    return x.fromBlock ? [x.fromBlock] : [];
  },
  configSchema: {
    type: "object",
    required: ["promptKey", "groups", "features", "items", "testItems"],
    additionalProperties: false,
    properties: {
      promptKey: { type: "string" },
      groups: { type: "array", items: { type: "string" }, minItems: 2, uniqueItems: true },
      features: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["id", "labelKey"],
          additionalProperties: false,
          properties: { id: { type: "string", minLength: 1 }, labelKey: { type: "string" } },
        },
      },
      items: { type: "array", minItems: 2, items: itemSchema },
      testItems: { type: "array", minItems: 1, items: itemSchema },
      fromBlock: { type: "string" },
      explainKey: { type: "string" },
      glossary: glossaryProperty,
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as TrainClassifierConfig;
    return keys(
      x.promptKey,
      x.groups,
      x.features.map((f) => f.labelKey),
      x.items.map((i) => i.labelKey),
      x.testItems.map((i) => i.labelKey),
      x.explainKey,
    );
  },
};
