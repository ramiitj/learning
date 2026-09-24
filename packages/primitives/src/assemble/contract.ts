import type { ComponentContract } from "@lm/schema";
import { keys } from "../shared/strings";

export interface AssemblePiece {
  id: string;
  labelKey: string;
}

export interface AssembleConfig {
  instructionKey: string;
  pieces: AssemblePiece[];
  /** The piece ids in the order an expert would put them, when there is one right order. */
  targetOrder?: string[];
  successKey?: string;
  /** Shown after checking, whatever the result. */
  checkKey?: string;
  mode?: string;
}

export const assembleContract: ComponentContract = {
  type: "assemble",
  versions: ["1.0"],
  act: "build",
  configSchema: {
    type: "object",
    required: ["instructionKey", "pieces"],
    additionalProperties: false,
    properties: {
      instructionKey: { type: "string" },
      pieces: {
        type: "array",
        minItems: 2,
        items: {
          type: "object",
          required: ["id", "labelKey"],
          additionalProperties: false,
          properties: { id: { type: "string" }, labelKey: { type: "string" } },
        },
      },
      targetOrder: { type: "array", items: { type: "string" } },
      successKey: { type: "string" },
      checkKey: { type: "string" },
      mode: { enum: ["class-suggestions"] },
    },
  },
  stringKeys: (c) => {
    const x = c as unknown as AssembleConfig;
    return keys(x.instructionKey, x.pieces.map((p) => p.labelKey), x.successKey, x.checkKey);
  },
};
