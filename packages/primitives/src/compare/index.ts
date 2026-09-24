import type { ComponentPlugin } from "@lm/engine";
import { compareContract, type CompareConfig } from "./contract";
import { messages } from "./messages";
import { Compare, CompareClassroom, type CompareState } from "./Compare";
import { evaluate } from "../shared/model";

export const compare: ComponentPlugin<CompareConfig & Record<string, unknown>, CompareState> = {
  ...compareContract,
  personal: Compare,
  classroom: CompareClassroom,
  messages,
  summarize: (state, config, t, ui) => {
    if (!state?.ran) return null;
    const shared = state.values ?? {};
    const base: Record<string, number> = Object.fromEntries(config.model.inputs.map((i) => [i.id, i.initial]));
    const results = config.variants.map((v) => ({
      label: t.text(v.labelKey),
      output: evaluate(config.model, { ...base, ...shared, ...v.overrides }),
    }));
    return ui("summary", { a: results[0]!.label, aOutput: results[0]!.output, b: results[1]!.label, bOutput: results[1]!.output });
  },
};

export * from "./contract";
export * from "./Compare";
