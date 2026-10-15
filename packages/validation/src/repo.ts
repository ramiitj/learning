import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { contracts } from "@lm/primitives/contracts";
import { howToByLocale } from "@lm/primitives/messages";
import type { ValidationContext } from "./index";

/**
 * Builds the validation context from the repository: platform configuration,
 * references and (until the CMS supplies it) the glossary in /content.
 */
export function repoContext(root: string, glossary?: ValidationContext["glossary"]): ValidationContext {
  const read = (p: string) => JSON.parse(readFileSync(path.join(root, p), "utf8"));
  const banned = read("platform/references/banned-phrases.json") as Record<string, unknown>;
  const audiences = (read("platform/config/audiences.json") as { profiles: { id: string; maxSentenceWords: number }[] }).profiles;
  return {
    contracts,
    glossary: glossary ?? Object.fromEntries(readdirSync(path.join(root, "content/glossary")).filter((f) => f.endsWith(".json")).map((f) => [f.replace(".json", ""), read(`content/glossary/${f}`)])),
    bannedPhrases: Object.fromEntries(Object.entries(banned).filter(([, v]) => Array.isArray(v))) as Record<string, string[]>,
    audiences: Object.fromEntries(audiences.map((a) => [a.id, { maxSentenceWords: a.maxSentenceWords }])),
    howTo: howToByLocale(),
  };
}
