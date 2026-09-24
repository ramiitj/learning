/**
 * Declarative models for `knob` and `compare`. Lessons may not contain code,
 * so a lesson picks a model type and supplies numbers; the arithmetic lives
 * here, where it is reviewed and tested.
 */
export interface ModelInput {
  id: string;
  labelKey: string;
  kind?: "slider" | "toggle";
  min?: number;
  max?: number;
  step?: number;
  initial: number;
  weight: number;
}

export interface ModelSpec {
  type: "linear" | "threshold";
  inputs: ModelInput[];
  bias?: number;
  /** For `threshold`: the output is 1 when the weighted sum reaches this value. */
  threshold?: number;
  output: { labelKey: string; min: number; max: number; decimals?: number; labelKeys?: [string, string] };
}

export const modelSchema = {
  type: "object",
  required: ["type", "inputs", "output"],
  additionalProperties: false,
  properties: {
    type: { enum: ["linear", "threshold"] },
    bias: { type: "number" },
    threshold: { type: "number" },
    inputs: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "labelKey", "initial", "weight"],
        additionalProperties: false,
        properties: {
          id: { type: "string", pattern: "^[a-z][a-z0-9_]*$" },
          labelKey: { type: "string" },
          kind: { enum: ["slider", "toggle"] },
          min: { type: "number" },
          max: { type: "number" },
          step: { type: "number", exclusiveMinimum: 0 },
          initial: { type: "number" },
          weight: { type: "number" },
        },
      },
    },
    output: {
      type: "object",
      required: ["labelKey", "min", "max"],
      additionalProperties: false,
      properties: {
        labelKey: { type: "string" },
        min: { type: "number" },
        max: { type: "number" },
        decimals: { type: "integer", minimum: 0, maximum: 4 },
        labelKeys: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
      },
    },
  },
} as const;

export type Values = Record<string, number>;

export const initialValues = (m: ModelSpec): Values => Object.fromEntries(m.inputs.map((i) => [i.id, i.initial]));

export function weightedSum(m: ModelSpec, v: Values): number {
  return m.inputs.reduce((s, i) => s + i.weight * (v[i.id] ?? i.initial), m.bias ?? 0);
}

export function evaluate(m: ModelSpec, v: Values): number {
  const sum = weightedSum(m, v);
  if (m.type === "threshold") return sum >= (m.threshold ?? 0) ? 1 : 0;
  const d = m.output.decimals ?? 0;
  const clamped = Math.min(m.output.max, Math.max(m.output.min, sum));
  return Number(clamped.toFixed(d));
}

export const modelStringKeys = (m: ModelSpec): string[] => [m.output.labelKey, ...(m.output.labelKeys ?? []), ...m.inputs.map((i) => i.labelKey)];
