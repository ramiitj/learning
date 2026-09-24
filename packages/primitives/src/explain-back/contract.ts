import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export type ExplainBackMode = "choose" | "own-analogy" | "own-words";

export interface ExplainBackOption {
  id: string;
  textKey: string;
  feedbackKey: string;
  best?: boolean;
}

export interface ExplainBackConfig {
  mode: ExplainBackMode;
  promptKey: string;
  options?: ExplainBackOption[];
  breakPointPromptKey?: string;
  modelAnswerKey?: string;
}

export const explainBackContract: ComponentContract = {
  type: "explain-back",
  versions: ["1.0"],
  act: "explain",
  configSchema: {
    type: "object",
    required: ["mode", "promptKey"],
    additionalProperties: false,
    properties: {
      mode: { enum: ["choose", "own-analogy", "own-words"] },
      promptKey: { type: "string" },
      options: {
        type: "array",
        minItems: 2,
        items: {
          type: "object",
          required: ["id", "textKey", "feedbackKey"],
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            textKey: { type: "string" },
            feedbackKey: { type: "string" },
            best: { type: "boolean" },
          },
        },
      },
      breakPointPromptKey: { type: "string" },
      modelAnswerKey: { type: "string" },
    },
    if: { properties: { mode: { const: "choose" } }, required: ["mode"] },
    then: { required: ["options"] },
  },
  stringKeys: (c) => {
    const x = c as unknown as ExplainBackConfig;
    return keys(x.promptKey, (x.options ?? []).flatMap((o) => [o.textKey, o.feedbackKey]), x.breakPointPromptKey, x.modelAnswerKey);
  },
};
