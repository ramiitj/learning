import type { ComponentContract } from "@lm/schema";
import { glossaryProperty } from "../glossary-schema";

export type PixelTool = "draw" | "erase" | "blur" | "shift";

export interface PixelGridConfig {
  promptKey: string;
  /** Squares per side, 8 to 16 (default 8). */
  size?: number;
  /** Ready-made drawings the learner can start from: rows of shades 0 (empty) to 9 (darkest). */
  presets?: { labelKey: string; rows: number[][] }[];
  /** Which tools are offered (default: all four). */
  tools?: PixelTool[];
  explainKey?: string;
  /** Classroom prediction before a shift: "mostly the same" and "very different". Both or neither. */
  sameKey?: string;
  differentKey?: string;
  mode?: string;
  /** Glossary term ids to link under the prompt (optional). */
  glossary?: string[];
}

const keys = (...xs: (string | string[] | undefined)[]): string[] => xs.flat().filter((x): x is string => typeof x === "string" && x.length > 0);

export const pixelGridContract: ComponentContract = {
  type: "pixel-grid",
  versions: ["1.0"],
  act: "build",
  vote: (c) => {
    const x = c as unknown as PixelGridConfig;
    if (!x.sameKey || !x.differentKey) return null;
    return {
      promptKey: x.promptKey,
      options: [
        { id: x.sameKey, labelKey: x.sameKey },
        { id: x.differentKey, labelKey: x.differentKey },
      ],
    };
  },
  configSchema: {
    type: "object",
    required: ["promptKey"],
    additionalProperties: false,
    dependentRequired: { sameKey: ["differentKey"], differentKey: ["sameKey"] },
    properties: {
      promptKey: { type: "string" },
      size: { type: "integer", minimum: 8, maximum: 16 },
      presets: {
        type: "array",
        maxItems: 8,
        items: {
          type: "object",
          required: ["labelKey", "rows"],
          additionalProperties: false,
          properties: {
            labelKey: { type: "string" },
            rows: {
              type: "array",
              minItems: 1,
              maxItems: 16,
              items: { type: "array", minItems: 1, maxItems: 16, items: { type: "integer", minimum: 0, maximum: 9 } },
            },
          },
        },
      },
      tools: { type: "array", uniqueItems: true, items: { enum: ["draw", "erase", "blur", "shift"] } },
      explainKey: { type: "string" },
      sameKey: { type: "string" },
      differentKey: { type: "string" },
      mode: { enum: ["class-vote"] },
      glossary: glossaryProperty,
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as PixelGridConfig;
    return keys(x.promptKey, x.explainKey, x.sameKey, x.differentKey, (x.presets ?? []).map((p) => p.labelKey));
  },
  blockRefs: () => [],
};
