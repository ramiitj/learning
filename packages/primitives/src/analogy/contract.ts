import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export interface AnalogyMapping {
  sourceKey: string;
  targetKey: string;
}

/** Mirrors `$defs.analogyConfig` in schemas/lesson.schema.json, the authoritative contract. */
export interface AnalogyConfig {
  bankId?: string;
  concept: string;
  sourceKey: string;
  mappings: AnalogyMapping[];
  breakPointKey: string;
  /** A sequence of keys from the everyday situation to the formal one. */
  fading?: string[];
  audienceVariants?: Record<string, unknown>;
  localeVariants?: Record<string, unknown>;
  /** Optional heading, not part of the authoritative schema. */
  titleKey?: string;
}

export const analogyContract: ComponentContract = {
  type: "analogy",
  versions: ["1.0"],
  act: "explore",
  configSchema: {
    type: "object",
    required: ["concept", "sourceKey", "mappings", "breakPointKey"],
    additionalProperties: false,
    properties: {
      bankId: { type: "string" },
      concept: { type: "string" },
      sourceKey: { type: "string" },
      mappings: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["sourceKey", "targetKey"],
          properties: { sourceKey: { type: "string" }, targetKey: { type: "string" } },
        },
      },
      breakPointKey: { type: "string" },
      fading: { type: "array", items: { type: "string" } },
      audienceVariants: { type: "object" },
      localeVariants: { type: "object" },
      titleKey: { type: "string" },
      mode: { enum: ["teacher-led"] },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as AnalogyConfig;
    return keys(x.titleKey, x.sourceKey, x.mappings.flatMap((m) => [m.sourceKey, m.targetKey]), x.breakPointKey, x.fading);
  },
};
