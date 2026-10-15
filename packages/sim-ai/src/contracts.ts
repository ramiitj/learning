/** The React-free half of every AI simulation: what the validator, CMS, MCP server and live voting need. */
import type { ComponentContract } from "@lm/schema";
import { trainClassifierContract } from "./train-classifier/contract";
import { pixelGridContract } from "./pixel-grid/contract";
import { nextWordModelContract } from "./next-word-model/contract";
import { layerBuilderContract } from "./layer-builder/contract";
import { dilemmaVoteContract } from "./dilemma-vote/contract";
import { hillsideContract } from "./hillside/contract";

export const aiContracts: readonly ComponentContract[] = [trainClassifierContract, pixelGridContract, nextWordModelContract, layerBuilderContract, dilemmaVoteContract, hillsideContract];
