/**
 * Domain simulations for the AI subject (docs/05). They are plugins with the
 * same contract as the universal primitives; nothing here is known to the
 * core engine. Every model runs in the browser: nothing a learner types,
 * draws or sorts is sent anywhere.
 */
import type { AnyPlugin } from "@lm/engine";
import { trainClassifier } from "./train-classifier";
import { pixelGrid } from "./pixel-grid";
import { nextWordModel } from "./next-word-model";
import { layerBuilder } from "./layer-builder";
import { dilemmaVote } from "./dilemma-vote";
import { hillside } from "./hillside";

export const aiSimulations: readonly AnyPlugin[] = [trainClassifier, pixelGrid, nextWordModel, layerBuilder, dilemmaVote, hillside];

export { trainClassifier, pixelGrid, nextWordModel, layerBuilder, dilemmaVote, hillside };
