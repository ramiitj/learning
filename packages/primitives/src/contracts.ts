/**
 * The React-free half of every primitive: what the validator, the CMS and the
 * MCP server need. Importing this never pulls in UI code.
 */
import type { ComponentContract } from "@lm/schema";
import { analogyContract } from "./analogy/contract";
import { assembleContract } from "./assemble/contract";
import { breakItContract } from "./break-it/contract";
import { byHandThenAutomateContract } from "./by-hand-then-automate/contract";
import { checkContract } from "./check/contract";
import { compareContract } from "./compare/contract";
import { explainBackContract } from "./explain-back/contract";
import { knobContract } from "./knob/contract";
import { predictContract } from "./predict/contract";
import { revealContract } from "./reveal/contract";
import { sortContract } from "./sort/contract";
import { takeawayContract } from "./takeaway/contract";
import { yourDataContract } from "./your-data/contract";

export const contracts: readonly ComponentContract[] = [
  revealContract,
  predictContract,
  knobContract,
  sortContract,
  assembleContract,
  yourDataContract,
  byHandThenAutomateContract,
  breakItContract,
  compareContract,
  explainBackContract,
  analogyContract,
  checkContract,
  takeawayContract,
];
