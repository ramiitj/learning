import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export interface PredictConfig {
  promptKey: string;
  /** String keys of the choices. */
  choices: string[];
  confidence?: boolean;
  revealKey: string;
  /** The choice that matches what actually happens, if there is one. Predictions can also be open. */
  answer?: string;
  /** Per-choice response, keyed by choice key. */
  choiceFeedback?: Record<string, string>;
  /** Show how others guessed (aggregated, anonymous) after committing. */
  showOthersGuesses?: boolean;
  /** Aggregated guesses from earlier learners, keyed by choice key. */
  othersDistribution?: Record<string, number>;
}

export const predictContract: ComponentContract = {
  type: "predict",
  versions: ["1.0"],
  act: "predict",
  configSchema: {
    type: "object",
    required: ["promptKey", "choices", "revealKey"],
    additionalProperties: false,
    properties: {
      promptKey: { type: "string" },
      choices: { type: "array", items: { type: "string" }, minItems: 2 },
      confidence: { type: "boolean" },
      revealKey: { type: "string" },
      answer: { type: "string" },
      choiceFeedback: { type: "object", additionalProperties: { type: "string" } },
      showOthersGuesses: { type: "boolean" },
      othersDistribution: { type: "object", additionalProperties: { type: "number", minimum: 0 } },
      mode: { enum: ["class-vote"] },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as PredictConfig;
    return keys(x.promptKey, x.choices, x.revealKey, Object.values(x.choiceFeedback ?? {}));
  },
};
