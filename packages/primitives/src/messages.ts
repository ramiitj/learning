/**
 * Every primitive's interface strings, without React. The validation service
 * reads these to confirm each component has its first-use hint in every locale.
 */
import { messages as m0 } from "./analogy/messages";
import { messages as m1 } from "./assemble/messages";
import { messages as m2 } from "./break-it/messages";
import { messages as m3 } from "./by-hand-then-automate/messages";
import { messages as m4 } from "./check/messages";
import { messages as m5 } from "./compare/messages";
import { messages as m6 } from "./explain-back/messages";
import { messages as m7 } from "./knob/messages";
import { messages as m8 } from "./predict/messages";
import { messages as m9 } from "./reveal/messages";
import { messages as m10 } from "./sort/messages";
import { messages as m11 } from "./takeaway/messages";
import { messages as m12 } from "./your-data/messages";

type Table = Record<string, Record<string, string>>;

export const componentMessages: Record<string, Table> = Object.fromEntries([
  ["analogy", m0],
  ["assemble", m1],
  ["break-it", m2],
  ["by-hand-then-automate", m3],
  ["check", m4],
  ["compare", m5],
  ["explain-back", m6],
  ["knob", m7],
  ["predict", m8],
  ["reveal", m9],
  ["sort", m10],
  ["takeaway", m11],
  ["your-data", m12],
] as [string, Table][]);

/** Locale -> component types that have a first-use hint. */
export function howToByLocale(): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const [type, table] of Object.entries(componentMessages)) {
    for (const [locale, m] of Object.entries(table)) if (m.howto?.trim()) (out[locale] ??= new Set()).add(type);
  }
  return out;
}
