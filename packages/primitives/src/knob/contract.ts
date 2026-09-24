import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";
import { modelSchema, modelStringKeys, type ModelSpec } from "../shared/model";

export interface KnobGoal {
  /** The output value the learner is trying to reach. */
  target: number;
  /** How close to the target counts as reaching it. */
  tolerance: number;
  goalKey: string;
  successKey: string;
}

/** Turns the output into a decision at a threshold, e.g. "junk" at 10 or more. */
export interface KnobDecision {
  threshold: number;
  aboveKey: string;
  belowKey: string;
}

export interface KnobConfig {
  promptKey: string;
  model: ModelSpec;
  /** ICU sentence receiving {output} and each input id as values, so numbers in the sentence update live. */
  outputTemplateKey?: string;
  goal?: KnobGoal;
  /** When present, {decision} is passed to outputTemplateKey and the threshold is marked on the gauge. */
  decision?: KnobDecision;
}

export const knobContract: ComponentContract = {
  type: "knob",
  versions: ["1.0"],
  act: "explore",
  configSchema: {
    type: "object",
    required: ["promptKey", "model"],
    additionalProperties: false,
    properties: {
      promptKey: { type: "string" },
      model: modelSchema,
      outputTemplateKey: { type: "string" },
      decision: {
        type: "object",
        required: ["threshold", "aboveKey", "belowKey"],
        additionalProperties: false,
        properties: { threshold: { type: "number" }, aboveKey: { type: "string" }, belowKey: { type: "string" } },
      },
      goal: {
        type: "object",
        required: ["target", "tolerance", "goalKey", "successKey"],
        additionalProperties: false,
        properties: {
          target: { type: "number" },
          tolerance: { type: "number", minimum: 0 },
          goalKey: { type: "string" },
          successKey: { type: "string" },
        },
      },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as KnobConfig;
    return keys(x.promptKey, modelStringKeys(x.model), x.outputTemplateKey, x.goal?.goalKey, x.goal?.successKey, x.decision?.aboveKey, x.decision?.belowKey);
  },
};
