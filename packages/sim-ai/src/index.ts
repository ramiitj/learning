/**
 * Domain simulations for the AI subject (docs/05). They are plugins with the
 * same contract as the universal primitives; nothing here is known to the
 * core engine. Every model runs in the browser: nothing a learner types,
 * draws or sorts is sent anywhere.
 */
import type { AnyPlugin } from "@lm/engine";

export const aiSimulations: readonly AnyPlugin[] = [];
