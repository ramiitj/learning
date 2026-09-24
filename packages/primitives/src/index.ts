/** The universal primitives of docs/05, registered with the lesson engine. */
import type { AnyPlugin } from "@lm/engine";
import { analogy } from "./analogy";
import { assemble } from "./assemble";
import { breakIt } from "./break-it";
import { byHandThenAutomate } from "./by-hand-then-automate";
import { check } from "./check";
import { compare } from "./compare";
import { explainBack } from "./explain-back";
import { knob } from "./knob";
import { predict } from "./predict";
import { reveal } from "./reveal";
import { sort } from "./sort";
import { takeaway } from "./takeaway";
import { yourData } from "./your-data";

export const primitives: readonly AnyPlugin[] = [reveal, predict, knob, sort, assemble, yourData, byHandThenAutomate, breakIt, compare, explainBack, analogy, check, takeaway];

export { contracts } from "./contracts";
export { analogy, assemble, breakIt, byHandThenAutomate, check, compare, explainBack, knob, predict, reveal, sort, takeaway, yourData };
