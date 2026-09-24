import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export interface SortItem {
  id: string;
  labelKey: string;
  /** A decorative emoji or short glyph; aria-hidden, never the only way to tell items apart. */
  symbol?: string;
  /** The group an expert would choose. Optional, and never used to grade the learner. */
  group?: string;
}

export interface SortConfig {
  instructionKey: string;
  /** 2-4 string keys naming the groups. */
  groups: string[];
  items?: SortItem[];
  /** A CMS item set, when items are supplied by content ops rather than inline. */
  itemSet?: string;
  /** Shown once everything is sorted. */
  revealKey?: string;
  mode?: string;
}

export const sortContract: ComponentContract = {
  type: "sort",
  versions: ["1.0"],
  act: "decide",
  configSchema: {
    type: "object",
    required: ["instructionKey", "groups"],
    additionalProperties: false,
    anyOf: [{ required: ["items"] }, { required: ["itemSet"] }],
    properties: {
      instructionKey: { type: "string" },
      groups: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
      items: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["id", "labelKey"],
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            labelKey: { type: "string" },
            symbol: { type: "string" },
            group: { type: "string" },
          },
        },
      },
      itemSet: { type: "string" },
      revealKey: { type: "string" },
      mode: { enum: ["vote-per-item"] },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as SortConfig;
    return keys(x.instructionKey, x.groups, (x.items ?? []).map((i) => i.labelKey), x.revealKey);
  },
};
