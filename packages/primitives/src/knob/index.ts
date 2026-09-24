import type { ComponentPlugin } from "@lm/engine";
import { knobContract, type KnobConfig } from "./contract";
import { messages } from "./messages";
import { Knob, KnobClassroom, type KnobState } from "./Knob";
import { evaluate } from "../shared/model";

export const knob: ComponentPlugin<KnobConfig & Record<string, unknown>, KnobState> = {
  ...knobContract,
  personal: Knob,
  classroom: KnobClassroom,
  messages,
  summarize: (state, config, t, ui) => {
    if (!state?.values) return null;
    const output = evaluate(config.model, state.values);
    const outputText =
      config.model.type === "threshold" && config.model.output.labelKeys
        ? t.text(config.model.output.labelKeys[output as 0 | 1])
        : String(output);
    const decision = config.decision ? t.text(output >= config.decision.threshold ? config.decision.aboveKey : config.decision.belowKey) : "";
    return config.outputTemplateKey ? t.text(config.outputTemplateKey, { output: outputText, decision, ...state.values }) : ui("outputFallback", { label: t.text(config.model.output.labelKey), value: outputText });
  },
};

export * from "./contract";
export * from "./Knob";
