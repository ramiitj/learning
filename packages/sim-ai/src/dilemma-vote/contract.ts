import type { ComponentContract } from "@lm/schema";
import { keys } from "@lm/primitives/shared/strings";
import { glossaryProperty } from "../glossary-schema";

export interface DilemmaOption {
  id: string;
  labelKey: string;
}

export interface DilemmaFramework {
  id: string;
  nameKey: string;
  /** How this way of thinking would decide, and why. */
  reasoningKey: string;
  /** The option it would choose, or null when it would not settle the question on its own. */
  choice: string | null;
}

export interface DilemmaVoteConfig {
  /** The scenario. */
  promptKey: string;
  options: DilemmaOption[];
  frameworks: DilemmaFramework[];
  reflectionKey?: string;
  /** Glossary term ids to link under the scenario (optional). */
  glossary?: string[];
}

export const dilemmaVoteContract: ComponentContract = {
  type: "dilemma-vote",
  versions: ["1.0"],
  act: "decide",
  vote: (c) => {
    const x = c as unknown as DilemmaVoteConfig;
    return { promptKey: x.promptKey, options: x.options.map((o) => ({ id: o.id, labelKey: o.labelKey })) };
  },
  configSchema: {
    type: "object",
    required: ["promptKey", "options", "frameworks"],
    additionalProperties: false,
    properties: {
      promptKey: { type: "string" },
      options: {
        type: "array",
        minItems: 2,
        maxItems: 6,
        items: {
          type: "object",
          required: ["id", "labelKey"],
          additionalProperties: false,
          properties: { id: { type: "string", minLength: 1 }, labelKey: { type: "string" } },
        },
      },
      frameworks: {
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: {
          type: "object",
          required: ["id", "nameKey", "reasoningKey", "choice"],
          additionalProperties: false,
          properties: {
            id: { type: "string", minLength: 1 },
            nameKey: { type: "string" },
            reasoningKey: { type: "string" },
            choice: { type: ["string", "null"] },
          },
        },
      },
      reflectionKey: { type: "string" },
      glossary: glossaryProperty,
    },
  },
  glossaryRefs: (c) => (c as { glossary?: string[] }).glossary ?? [],
  stringKeys: (c) => {
    const x = c as unknown as DilemmaVoteConfig;
    return keys(x.promptKey, x.options.map((o) => o.labelKey), x.frameworks.flatMap((f) => [f.nameKey, f.reasoningKey]), x.reflectionKey);
  },
};
