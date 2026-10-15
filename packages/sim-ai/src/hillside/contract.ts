import type { ComponentContract } from "@lm/schema";
import { keys } from "@lm/primitives/shared/strings";
import { glossaryProperty } from "../glossary-schema";

export interface HillsideConfig {
  promptKey: string;
  /** The landscape, declared as data. */
  landscape: { type: "bowl" | "two-valleys"; min: number; max: number };
  start: number;
  /** Smallest and largest step the learner may take. */
  stepMin: number;
  stepMax: number;
  /** Step budget before the walk ends (default 15). */
  maxSteps?: number;
  /** Lesson string keys for the two directions (also the classroom vote options). */
  leftKey: string;
  rightKey: string;
  goalKey?: string;
  /** Shown once the view has faded into the full curve: connects the hill to a loss curve. */
  fadeKey?: string;
  /** Shown after the fade: where this picture breaks down. Required whenever fadeKey is set. */
  breaksKey?: string;
  /** Glossary term ids to link under the prompt (optional). */
  glossary?: string[];
}

export const DEFAULT_MAX_STEPS = 15;

/** Live-vote item ids: one per decision point, so counts never carry over between them. */
export const SIZE_ITEM = "size";
export const trapItem = (stepsTaken: number) => `trap-${stepsTaken}`;

export const hillsideContract: ComponentContract = {
  type: "hillside",
  versions: ["1.0"],
  act: "explore",
  vote: (c) => {
    const x = c as unknown as HillsideConfig;
    // Phones vote on the direction at each trap moment, one item per step count. The step-size vote has
    // different options (small, medium, large) and stays a show of hands, under its own item id.
    const n = x.maxSteps ?? DEFAULT_MAX_STEPS;
    return {
      promptKey: x.promptKey,
      options: [{ id: "left", labelKey: x.leftKey }, { id: "right", labelKey: x.rightKey }],
      perItem: Array.from({ length: n }, (_, i) => ({ id: trapItem(i + 1), labelKey: x.promptKey })),
    };
  },
  configSchema: {
    type: "object",
    required: ["promptKey", "landscape", "start", "stepMin", "stepMax", "leftKey", "rightKey"],
    additionalProperties: false,
    // An analogy always shows where it breaks (constitution Art. 7 and 14).
    dependentRequired: { fadeKey: ["breaksKey"] },
    properties: {
      promptKey: { type: "string" },
      landscape: {
        type: "object",
        required: ["type", "min", "max"],
        additionalProperties: false,
        properties: {
          type: { enum: ["bowl", "two-valleys"] },
          min: { type: "number" },
          max: { type: "number" },
        },
      },
      start: { type: "number" },
      stepMin: { type: "number", exclusiveMinimum: 0 },
      stepMax: { type: "number", exclusiveMinimum: 0 },
      maxSteps: { type: "integer", minimum: 1, maximum: 60 },
      leftKey: { type: "string" },
      rightKey: { type: "string" },
      goalKey: { type: "string" },
      fadeKey: { type: "string" },
      breaksKey: { type: "string" },
      glossary: glossaryProperty,
    },
  },
  glossaryRefs: (c) => (c as { glossary?: string[] }).glossary ?? [],
  stringKeys: (c) => {
    const x = c as unknown as HillsideConfig;
    return keys(x.promptKey, x.leftKey, x.rightKey, x.goalKey, x.fadeKey, x.breaksKey);
  },
};
