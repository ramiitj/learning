/** Every AI simulation's interface strings, without React (first-use hints for the validator). */
import { messages as m0 } from "./train-classifier/messages";
import { messages as m1 } from "./pixel-grid/messages";
import { messages as m2 } from "./next-word-model/messages";
import { messages as m3 } from "./layer-builder/messages";
import { messages as m4 } from "./dilemma-vote/messages";
import { messages as m5 } from "./hillside/messages";

type Table = Record<string, Record<string, string>>;

export const aiMessages: Record<string, Table> = {
  "train-classifier": m0,
  "pixel-grid": m1,
  "next-word-model": m2,
  "layer-builder": m3,
  "dilemma-vote": m4,
  "hillside": m5,
};
