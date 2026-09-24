import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export interface YourDataConfig {
  promptKey: string;
  kind: "list" | "text";
  minItems?: number;
  maxItems?: number;
  maxLength?: number;
  placeholderKey?: string;
  /** Examples offered if the learner is stuck; used one at a time via "Use an example". */
  exampleKeys?: string[];
  mode?: string;
}

export const yourDataContract: ComponentContract = {
  type: "your-data",
  versions: ["1.0"],
  act: "build",
  configSchema: {
    type: "object",
    required: ["promptKey", "kind"],
    additionalProperties: false,
    properties: {
      promptKey: { type: "string" },
      kind: { enum: ["list", "text"] },
      minItems: { type: "integer", minimum: 0 },
      maxItems: { type: "integer", minimum: 1 },
      maxLength: { type: "integer", minimum: 1 },
      placeholderKey: { type: "string" },
      exampleKeys: { type: "array", items: { type: "string" } },
      mode: { enum: ["class-contributions"] },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as YourDataConfig;
    return keys(x.promptKey, x.placeholderKey, x.exampleKeys);
  },
};
