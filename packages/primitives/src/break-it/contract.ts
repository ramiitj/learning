import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export interface BreakItAttempt {
  id: string;
  labelKey: string;
  resultKey: string;
  breaks: boolean;
}

export interface BreakItConfig {
  challengeKey: string;
  /** The block id of the system being broken, when there is one to point at. */
  target?: string;
  attempts?: BreakItAttempt[];
  /** Used by domain simulations that let the learner relabel data; accepted and ignored here. */
  allowRelabel?: boolean;
  reflectKey: string;
  notePromptKey?: string;
}

export const breakItContract: ComponentContract = {
  type: "break-it",
  versions: ["1.0"],
  act: "explore",
  configSchema: {
    type: "object",
    required: ["challengeKey", "reflectKey"],
    additionalProperties: false,
    properties: {
      challengeKey: { type: "string" },
      target: { type: "string" },
      attempts: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "labelKey", "resultKey", "breaks"],
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            labelKey: { type: "string" },
            resultKey: { type: "string" },
            breaks: { type: "boolean" },
          },
        },
      },
      allowRelabel: { type: "boolean" },
      reflectKey: { type: "string" },
      notePromptKey: { type: "string" },
      mode: { enum: ["class-suggests"] },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as BreakItConfig;
    return keys(x.challengeKey, (x.attempts ?? []).flatMap((a) => [a.labelKey, a.resultKey]), x.reflectKey, x.notePromptKey);
  },
  blockRefs: (c) => {
    const x = c as unknown as BreakItConfig;
    return x.target ? [x.target] : [];
  },
};
