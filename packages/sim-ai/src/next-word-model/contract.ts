import type { ComponentContract } from "@lm/schema";
import { glossaryProperty } from "../glossary-schema";

export interface NextWordModelConfig {
  promptKey: string;
  /** An earlier your-data block whose state holds the learner's sentences. */
  fromBlock?: string;
  /** A lesson string with example sentences separated by "|", used when there is no fromBlock or it is empty. */
  starterSentencesKey?: string;
  /** Most sentences the model learns from (default 10). */
  maxSentences?: number;
  explainKey?: string;
  mode?: string;
  /** Glossary term ids to link under the intro (optional). */
  glossary?: string[];
}

const keys = (...xs: (string | string[] | undefined)[]): string[] => xs.flat().filter((x): x is string => typeof x === "string" && x.length > 0);

export const nextWordModelContract: ComponentContract = {
  type: "next-word-model",
  versions: ["1.0"],
  act: "build",
  // The classroom prediction is among the top three candidates, which depend on the class's sentences: no fixed options for phones.
  vote: () => null,
  configSchema: {
    type: "object",
    required: ["promptKey"],
    additionalProperties: false,
    properties: {
      promptKey: { type: "string" },
      fromBlock: { type: "string" },
      starterSentencesKey: { type: "string" },
      maxSentences: { type: "integer", minimum: 1, maximum: 50 },
      explainKey: { type: "string" },
      mode: { enum: ["class-contributions"] },
      glossary: glossaryProperty,
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as NextWordModelConfig;
    return keys(x.promptKey, x.starterSentencesKey, x.explainKey);
  },
  blockRefs: (c) => {
    const x = c as unknown as NextWordModelConfig;
    return x.fromBlock ? [x.fromBlock] : [];
  },
};
