import type { ComponentPlugin } from "@lm/engine";
import { layerBuilderContract, type LayerBuilderConfig } from "./contract";
import { messages } from "./messages";
import { LayerBuilder, LayerBuilderClassroom, type LayerBuilderState } from "./LayerBuilder";
import { diagnose } from "./model";

export const layerBuilder: ComponentPlugin<LayerBuilderConfig & Record<string, unknown>, LayerBuilderState> = {
  ...layerBuilderContract,
  personal: LayerBuilder,
  classroom: LayerBuilderClassroom,
  messages,
  summarize: (state, _config, _t, ui) =>
    state?.result && state.widths
      ? ui("summary", { layers: state.widths.length, train: state.result.trainError, test: state.result.testError, verdict: ui(`${diagnose(state.result.trainError, state.result.testError)}Title`) })
      : null,
};

export * from "./contract";
export * from "./LayerBuilder";
