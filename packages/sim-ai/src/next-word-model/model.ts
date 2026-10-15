/**
 * A bigram next-word model: it only counts which token followed which.
 * No intention, no understanding. Everything here is pure and deterministic.
 */

/** A word is letters, combining marks (matras, viramas), digits and the joiners Indic scripts use; everything else that is not space is its own token. */
const TOKEN = /[\p{L}\p{M}\p{N}‌‍]+(?:['’][\p{L}\p{M}]+)*|[^\s\p{L}\p{M}\p{N}‌‍]/gu;
const WORD_START = /^[\p{L}\p{M}\p{N}]/u;

export const MAX_WORDS = 12;
export const MAX_SENTENCE_CHARS = 120;

/** Lower-case words, with punctuation kept as tokens of their own. Never splits inside a word, whatever the script. */
export const tokenise = (sentence: string): string[] => (sentence.toLocaleLowerCase().normalize("NFC").match(TOKEN) ?? []);

/** True for punctuation and symbols (including the Hindi danda), false for words. */
export const isPunctuation = (token: string): boolean => !WORD_START.test(token);

/** Split a block of text into sentences at . ! ? । and line breaks, keeping the mark with its sentence. */
export const splitSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?।॥])\s+|\n+/u)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

export const cleanSentence = (s: string, max = MAX_SENTENCE_CHARS): string => s.replace(/\s+/g, " ").trim().slice(0, max);

export interface Model {
  /** token -> (next token -> times seen), both in first-seen order. */
  next: Map<string, Map<string, number>>;
  vocabulary: Set<string>;
  sentences: number;
}

export function buildModel(sentences: readonly string[]): Model {
  const next = new Map<string, Map<string, number>>();
  const vocabulary = new Set<string>();
  let used = 0;
  for (const s of sentences) {
    const tokens = tokenise(s);
    if (!tokens.length) continue;
    used++;
    tokens.forEach((t) => vocabulary.add(t));
    for (let i = 0; i + 1 < tokens.length; i++) {
      const from = tokens[i]!;
      const to = tokens[i + 1]!;
      let row = next.get(from);
      if (!row) next.set(from, (row = new Map()));
      row.set(to, (row.get(to) ?? 0) + 1);
    }
  }
  return { next, vocabulary, sentences: used };
}

export interface Follower {
  word: string;
  count: number;
  total: number;
}

/** Everything seen after `word`, most frequent first. Ties keep the order they were first seen in. */
export function followers(model: Model, word: string): Follower[] {
  const row = model.next.get(word.toLocaleLowerCase());
  if (!row) return [];
  const total = [...row.values()].reduce((a, b) => a + b, 0);
  return [...row.entries()].map(([w, count]) => ({ word: w, count, total })).sort((a, b) => b.count - a.count);
}

/** The most frequent follower, with its fraction. null when the word was never followed by anything. */
export const predictNext = (model: Model, word: string): Follower | null => followers(model, word)[0] ?? null;

export const topCandidates = (model: Model, word: string, n = 3): Follower[] => followers(model, word).slice(0, n);

/** Words (not punctuation) that have at least one follower: the useful places to start. */
export const startableWords = (model: Model): string[] => [...model.next.keys()].filter((w) => !isPunctuation(w));

export interface Step extends Follower {
  from: string;
}

/**
 * Keep taking the most likely next word. Stops after the first punctuation
 * mark, at `maxWords` words, or when nothing ever followed the last word.
 */
export function generate(model: Model, start: string, maxWords = MAX_WORDS): { tokens: string[]; steps: Step[] } {
  const first = start.toLocaleLowerCase();
  const tokens = [first];
  const steps: Step[] = [];
  let words = isPunctuation(first) ? 0 : 1;
  while (words < maxWords && !isPunctuation(tokens[tokens.length - 1]!)) {
    const pick = predictNext(model, tokens[tokens.length - 1]!);
    if (!pick) break;
    steps.push({ ...pick, from: tokens[tokens.length - 1]! });
    tokens.push(pick.word);
    if (!isPunctuation(pick.word)) words++;
  }
  return { tokens, steps };
}

/** Join tokens for display: no space before punctuation. */
export const joinTokens = (tokens: readonly string[]): string => tokens.reduce((out, t, i) => (i === 0 ? t : isPunctuation(t) ? out + t : `${out} ${t}`), "");

/** Share as a whole percentage. */
export const percent = (f: Pick<Follower, "count" | "total">): number => (f.total ? Math.round((f.count / f.total) * 100) : 0);

/**
 * A word that starts with a capital letter in the middle of a sentence is
 * often a person's name. Returns the first such word, or null. "I" and its
 * contractions are not names, and scripts without capitals never match.
 */
export function likelyName(sentence: string): string | null {
  const words = sentence.split(/\s+/u).filter(Boolean);
  let sentenceStart = true;
  for (const raw of words) {
    const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    const ends = /[.!?।॥]$/u.test(raw);
    if (!sentenceStart && /^\p{Lu}/u.test(word) && !/^I(['’]|$)/u.test(word)) return word;
    sentenceStart = ends;
  }
  return null;
}
