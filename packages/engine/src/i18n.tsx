import { Fragment, createElement, type ReactNode } from "react";
import { IntlMessageFormat } from "intl-messageformat";
import type { LessonT, UiT } from "./types";

export const FALLBACK_LOCALE = "en";

type Table = Record<string, string>;
const cache = new Map<string, IntlMessageFormat>();

function compile(locale: string, message: string): IntlMessageFormat {
  const id = `${locale}\u0000${message}`;
  let f = cache.get(id);
  if (!f) {
    f = new IntlMessageFormat(message, locale, undefined, { ignoreTag: false });
    cache.set(id, f);
  }
  return f;
}

const TERM_TAG = /<(term-[a-z0-9-]+)>/g;

export type TermRenderer = (termId: string, children: ReactNode, key: string) => ReactNode;

function formatRich(locale: string, message: string, values: Record<string, string | number> | undefined, renderTerm: TermRenderer): ReactNode {
  const tags: Record<string, (chunks: ReactNode[]) => ReactNode> = {};
  let n = 0;
  for (const m of message.matchAll(TERM_TAG)) {
    const tag = m[1]!;
    tags[tag] = (chunks) => renderTerm(tag.slice(5), createElement(Fragment, null, ...chunks), `${tag}-${n++}`);
  }
  tags.b = (chunks) => createElement("strong", { key: `b-${n++}` }, ...chunks);
  tags.em = (chunks) => createElement("em", { key: `em-${n++}` }, ...chunks);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out = compile(locale, message).format<ReactNode>({ ...(values ?? {}), ...tags } as any);
  return Array.isArray(out) ? createElement(Fragment, null, ...out) : out;
}

function formatPlain(locale: string, message: string, values?: Record<string, string | number>): string {
  const tags: Record<string, (chunks: string[]) => string> = { b: (c) => c.join(""), em: (c) => c.join("") };
  for (const m of message.matchAll(TERM_TAG)) tags[m[1]!] = (c) => c.join("");
  const out = compile(locale, message).format<string>({ ...(values ?? {}), ...tags });
  return Array.isArray(out) ? out.join("") : String(out);
}

/**
 * Lesson string translator. A key missing in the learner's locale falls back
 * to English, marked with lang="en" so screen readers switch voice; a key
 * missing everywhere renders as the key itself so authors can spot it.
 */
export function createLessonT(locale: string, strings: Record<string, Table>, renderTerm: TermRenderer): LessonT {
  const primary = strings[locale] ?? {};
  const fallback = strings[FALLBACK_LOCALE] ?? {};
  const lookup = (key: string): [string, string] | null =>
    key in primary ? [locale, primary[key]!] : key in fallback ? [FALLBACK_LOCALE, fallback[key]!] : null;
  return {
    has: (key) => lookup(key) !== null,
    text: (key, values) => {
      const hit = lookup(key);
      return hit ? formatPlain(hit[0], hit[1], values) : key;
    },
    rich: (key, values) => {
      const hit = lookup(key);
      if (!hit) return createElement("span", { "data-missing-string": key }, key);
      const node = formatRich(hit[0], hit[1], values, renderTerm);
      return hit[0] === locale ? node : createElement("span", { lang: hit[0], "data-fallback": "" }, node);
    },
  };
}

/** Interface strings: namespaced component strings first, then engine strings, then English. */
export function createUiT(locale: string, catalogs: Record<string, Table>[], namespace?: string): UiT {
  return (key, values) => {
    const candidates = namespace ? [`${namespace}.${key}`, key] : [key];
    for (const loc of [locale, FALLBACK_LOCALE]) {
      for (const cat of catalogs) {
        const table = cat[loc];
        if (!table) continue;
        for (const k of candidates) if (k in table) return formatPlain(loc, table[k]!, values);
      }
    }
    return key;
  };
}
