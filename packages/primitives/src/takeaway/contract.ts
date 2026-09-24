import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export interface TakeawayConfig {
  cardKey: string;
  titleKey?: string;
  /**
   * Block ids whose summaries appear on the card. An include may be a block id
   * on its own, or a block id followed by a suffix after the first "-" (e.g.
   * "b4-model-summary" refers to block "b4" with a note of what it is for).
   * blockRefs() resolves each include to the part before the first "-" when
   * the include itself is not a known block id, so the validator can still
   * check the reference; the component resolves by exact id first, then by
   * the longest block-id prefix followed by "-".
   */
  includes: string[];
  /** A label for each include, in the same order ("My filter", "My messages"), so every line says what it is. */
  labelKeys?: string[];
  mode?: string;
}

export const takeawayContract: ComponentContract = {
  type: "takeaway",
  versions: ["1.0"],
  act: "build",
  configSchema: {
    type: "object",
    required: ["cardKey", "includes"],
    additionalProperties: false,
    properties: {
      cardKey: { type: "string" },
      titleKey: { type: "string" },
      includes: { type: "array", items: { type: "string" }, minItems: 1 },
      labelKeys: { type: "array", items: { type: "string" } },
      mode: { enum: ["class-card"] },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as TakeawayConfig;
    return keys(x.cardKey, x.titleKey, x.labelKeys);
  },
  // The validator only knows block ids, not the full block list, so it cannot
  // do the component's "exact id first, then longest id prefix" resolution.
  // We take the simpler, always-safe reading here: the part of an include
  // before its first "-" (or the whole include, when there is no "-").
  blockRefs: (c) => {
    const x = c as unknown as TakeawayConfig;
    return x.includes.map((inc) => (inc.includes("-") ? inc.slice(0, inc.indexOf("-")) : inc));
  },
};
