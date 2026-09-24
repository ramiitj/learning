import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export interface RevealConfig {
  textKey: string;
  questionKey?: string;
  /** Further ideas uncovered one at a time. */
  steps?: string[];
  /** Media set shown with the text (media blocks arrive with the media pipeline). */
  imageSet?: string;
}

export const revealContract: ComponentContract = {
  type: "reveal",
  versions: ["1.0"],
  act: "connective",
  configSchema: {
    type: "object",
    required: ["textKey"],
    additionalProperties: false,
    properties: {
      textKey: { type: "string" },
      questionKey: { type: "string" },
      steps: { type: "array", items: { type: "string" } },
      imageSet: { type: "string" },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as RevealConfig;
    return keys(x.textKey, x.questionKey, x.steps);
  },
};
