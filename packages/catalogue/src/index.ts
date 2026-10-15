/**
 * The component catalogue: every component lessons may use, React-free. This
 * is the one place plugins are registered for the platform's services (the
 * validator, the CMS, the MCP connector, live voting, the orchestrator). The
 * web app registers the matching renderers in LessonClient.
 * Adding a component is an architecture change (always-ask).
 */
import type { ComponentContract } from "@lm/schema";
import { contracts as primitiveContracts } from "@lm/primitives/contracts";
import { componentMessages } from "@lm/primitives/messages";
import { aiContracts } from "@lm/sim-ai/contracts";
import { aiMessages } from "@lm/sim-ai/messages";

export const catalogue: readonly ComponentContract[] = [...primitiveContracts, ...aiContracts];

export const catalogueMessages: Record<string, Record<string, Record<string, string>>> = { ...componentMessages, ...aiMessages };

/** Locale -> component types that have a first-use hint. */
export function howToByLocale(): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const [type, table] of Object.entries(catalogueMessages)) {
    for (const [locale, m] of Object.entries(table)) if (m.howto?.trim()) (out[locale] ??= new Set()).add(type);
  }
  return out;
}
