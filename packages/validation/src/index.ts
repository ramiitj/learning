/**
 * The validation service (docs/03, docs/04). Runs on every save, by the
 * creator or an agent: structural validation against the schema and every
 * component contract, then the pedagogy checks. Results go back to whoever
 * saved, including agents through the MCP connector.
 */
import { IntlMessageFormat } from "intl-messageformat";
import { allBlocks, STAGE_ORDER, type ComponentContract, type Lesson } from "@lm/schema";
import { validateLesson, type Issue as StructuralIssue } from "@lm/schema/validate";

export type CheckId =
  | "structure"
  | "act-density"
  | "grammar"
  | "undefined-terms"
  | "banned-phrases"
  | "analogy-completeness"
  | "anthropomorphism"
  | "reading-level"
  | "first-use-help"
  | "media-rules"
  | "locale-completeness"
  | "checks-present"
  | "ending"
  | "messages";

export interface Finding {
  check: CheckId;
  severity: "error" | "warning";
  path: string;
  message: string;
  locale?: string;
}

export interface ValidationContext {
  contracts: readonly ComponentContract[];
  /** locale -> term id -> entry. */
  glossary: Record<string, Record<string, { term: string; definition: string }>>;
  /** locale -> phrases a learner must never be told (Article 6). */
  bannedPhrases: Record<string, string[]>;
  /** Audience profile limits, by audience id. */
  audiences: Record<string, { maxSentenceWords: number }>;
  /** Component types whose first-use hint exists, by locale. Omit to skip the check. */
  howTo?: Record<string, ReadonlySet<string>>;
}

export interface ValidationReport {
  passed: boolean;
  errors: number;
  warnings: number;
  findings: Finding[];
  /** Locales whose strings are complete and reviewed by a human: only these may be published. */
  publishableLocales: string[];
  checks: Record<CheckId, "pass" | "warning" | "error">;
}

const ALL_CHECKS: CheckId[] = ["structure", "messages", "act-density", "grammar", "undefined-terms", "banned-phrases", "analogy-completeness", "anthropomorphism", "reading-level", "first-use-help", "media-rules", "locale-completeness", "checks-present", "ending"];
const TERM_TAG = /<term-([a-z0-9-]+)>/g;
const MIND = /\b(understands?|knows?|thinks?|believes?|wants?|decides to|cares?|feels?|is trying to|lies|remembers? you|learns? about you|intends?)\b/i;
const MACHINE = /\b(AI|filter|machine|model|computer|program|system|algorithm|chatbot)\b/i;
/** A machine as the subject of a mind verb, within a few words: "the filter knows", "AI really thinks". */
const MACHINE_MIND = new RegExp(`${MACHINE.source}(?:\\s+\\w+){0,2}?\\s+${MIND.source}`, "i");
const NEGATED = /\b(does not|doesn't|cannot|can't|never|no idea|not|only)\b/i;

/** Text a learner reads: no ICU arguments, no tags. */
export function plain(message: string): string {
  let out = message.replace(/<\/?[a-z0-9-]+>/g, "");
  for (let prev = ""; prev !== out; ) [prev, out] = [out, out.replace(/\{[^{}]*\}/g, " ")];
  return out.replace(/\s+/g, " ").trim();
}

const sentences = (s: string) => s.split(/(?<=[.!?।])\s+/).map((x) => x.trim()).filter(Boolean);
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

function bannedIn(text: string, phrases: string[], locale: string): string[] {
  const t = text.toLowerCase();
  return phrases.filter((p) => (locale === "en" ? new RegExp(`\\b${p.replace(/'/g, "['’]")}\\b`, "i").test(t) : t.includes(p.toLowerCase())));
}

export function validate(doc: unknown, ctx: ValidationContext): ValidationReport {
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);

  const structural: StructuralIssue[] = validateLesson(doc, { contracts: ctx.contracts, glossaryTerms: new Set(Object.keys(ctx.glossary.en ?? {})) });
  for (const i of structural) add({ check: i.check === "strings" ? "locale-completeness" : "structure", severity: i.severity, path: i.path, message: i.message });
  // Keep going after schema errors when the document has a lesson's basic shape, so authors see every problem at once.
  if (!hasLessonShape(doc)) return report(findings, []);

  const lesson = doc as Lesson;
  const byType = new Map(ctx.contracts.map((c) => [c.type, c]));
  const blocks = [...allBlocks(lesson)];
  const core = blocks.filter((b) => (b.block.depth ?? "core") === "core");
  const keyOwner = new Map<string, string>();
  for (const { block } of blocks) for (const k of byType.get(block.type)?.stringKeys(block.config) ?? []) keyOwner.set(k, block.id);
  const coreKeys = new Set(core.flatMap(({ block }) => byType.get(block.type)?.stringKeys(block.config) ?? []));

  // Every message must be a valid ICU message in its locale.
  for (const [locale, table] of Object.entries(lesson.strings)) {
    for (const [key, msg] of Object.entries(table)) {
      try {
        new IntlMessageFormat(msg, locale);
      } catch (e) {
        add({ check: "messages", severity: "error", path: `/strings/${locale}/${key}`, locale, message: `not a valid ICU message: ${(e as Error).message}` });
      }
    }
  }

  // Grammar (Article 5): all six stages, in order.
  const stages = lesson.stages.map((s) => s.stage);
  for (const s of STAGE_ORDER) if (!stages.includes(s)) add({ check: "grammar", severity: "error", path: "/stages", message: `no "${s}" stage` });
  for (let i = 1; i < stages.length; i++) {
    if (STAGE_ORDER.indexOf(stages[i]!) < STAGE_ORDER.indexOf(stages[i - 1]!)) add({ check: "grammar", severity: "error", path: `/stages/${i}`, message: `"${stages[i]}" comes after "${stages[i - 1]}"` });
  }

  // Act density (Article 4), on the core path.
  let run = 0;
  for (const { block } of core) {
    run = byType.get(block.type)?.act === "connective" ? run + 1 : 0;
    if (run === 3) add({ check: "act-density", severity: "error", path: `/blocks/${block.id}`, message: "third block in a row without a decide, predict, build, explore or explain act" });
  }

  // Undefined terms: every tagged term and every declared term is in the glossary in each locale.
  for (const [locale, table] of Object.entries(lesson.strings)) {
    if (lesson.localeStatus[locale] === "missing") continue;
    for (const [key, msg] of Object.entries(table)) {
      for (const m of msg.matchAll(TERM_TAG)) {
        if (!ctx.glossary[locale]?.[m[1]!]) add({ check: "undefined-terms", severity: "error", path: `/strings/${locale}/${key}`, locale, message: `term "${m[1]}" has no ${locale} glossary entry` });
      }
    }
  }
  for (const { block } of blocks) {
    for (const t of block.glossaryTerms ?? []) {
      for (const locale of Object.keys(lesson.strings)) {
        if (lesson.localeStatus[locale] !== "missing" && !ctx.glossary[locale]?.[t]) add({ check: "undefined-terms", severity: "error", path: `/blocks/${block.id}`, locale, message: `glossary term "${t}" has no ${locale} entry` });
      }
    }
  }
  // A glossary word appearing in English core text before the block that introduces it.
  const introducedAt = new Map<string, number>();
  for (const { block, index } of blocks) {
    const tagged = (byType.get(block.type)?.stringKeys(block.config) ?? []).flatMap((k) => [...(lesson.strings.en?.[k] ?? "").matchAll(TERM_TAG)].map((m) => m[1]!));
    for (const t of [...(block.glossaryTerms ?? []), ...tagged]) if (!introducedAt.has(t)) introducedAt.set(t, index);
  }
  for (const [term, at] of introducedAt) {
    const word = ctx.glossary.en?.[term]?.term;
    if (!word) continue;
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i");
    const early = core.find(({ block, index }) => index < at && (byType.get(block.type)?.stringKeys(block.config) ?? []).some((k) => re.test(plain(lesson.strings.en?.[k] ?? ""))));
    if (early) add({ check: "undefined-terms", severity: "warning", path: `/blocks/${early.block.id}`, locale: "en", message: `"${word}" is used before the block that defines it` });
  }

  // Banned phrases (Article 6), every locale.
  for (const [locale, table] of Object.entries(lesson.strings)) {
    for (const [key, msg] of Object.entries(table)) {
      for (const p of bannedIn(plain(msg), ctx.bannedPhrases[locale] ?? [], locale)) add({ check: "banned-phrases", severity: "error", path: `/strings/${locale}/${key}`, locale, message: `uses "${p}"` });
    }
  }

  // Analogy completeness (Article 7).
  const analogies = blocks.filter(({ block }) => block.type === "analogy");
  for (const { block } of analogies) {
    const c = block.config as { mappings?: unknown[]; breakPointKey?: string };
    if ((c.mappings?.length ?? 0) < 2) add({ check: "analogy-completeness", severity: "error", path: `/blocks/${block.id}`, message: "an analogy needs at least two mappings" });
    const bp = plain(lesson.strings.en?.[c.breakPointKey ?? ""] ?? "");
    if (bp.length < 20) add({ check: "analogy-completeness", severity: "error", path: `/blocks/${block.id}`, message: "the break point is missing or too thin" });
    if (/\b(perfect(ly)?|in every way|exactly the same)\b/i.test(bp)) add({ check: "analogy-completeness", severity: "error", path: `/blocks/${block.id}`, message: "the break point claims the analogy is perfect" });
  }
  const conceptsWithAnalogy = new Map<string, number>();
  for (const { block } of analogies) {
    const concept = String((block.config as { concept?: string }).concept ?? "");
    conceptsWithAnalogy.set(concept, (conceptsWithAnalogy.get(concept) ?? 0) + 1);
  }
  for (const [concept, n] of conceptsWithAnalogy) if (n < 2) add({ check: "analogy-completeness", severity: "warning", path: "/stages", message: `"${concept}" has one analogy; hard concepts need at least two (Article 7)` });

  // Anthropomorphism (AI subject only): mind verbs on machines, outside break points.
  if (lesson.meta.subject === "ai") {
    const breakKeys = new Set(analogies.map(({ block }) => String((block.config as { breakPointKey?: string }).breakPointKey)));
    for (const [key, msg] of Object.entries(lesson.strings.en ?? {})) {
      if (breakKeys.has(key)) continue;
      for (const s of sentences(plain(msg))) {
        if (MACHINE_MIND.test(s) && !NEGATED.test(s)) add({ check: "anthropomorphism", severity: "warning", path: `/strings/en/${key}`, locale: "en", message: `a machine may be given a mind: "${s.slice(0, 100)}"` });
      }
    }
  }

  // Reading level: sentence length on the core path, per the strictest audience.
  const limits = lesson.meta.audiences.map((a) => ctx.audiences[a]?.maxSentenceWords).filter((n): n is number => typeof n === "number");
  const max = limits.length ? Math.min(...limits) : 18;
  for (const key of coreKeys) {
    for (const s of sentences(plain(lesson.strings.en?.[key] ?? ""))) {
      const n = wordCount(s);
      if (n > max) add({ check: "reading-level", severity: "warning", path: `/strings/en/${key}`, locale: "en", message: `${n}-word sentence (limit ${max}): "${s.slice(0, 70)}…"` });
    }
  }

  // First-use help: each component type used has its how-to hint in every published locale.
  if (ctx.howTo) {
    const types = new Set(blocks.map(({ block }) => block.type));
    for (const [locale, set] of Object.entries(ctx.howTo)) {
      if (lesson.localeStatus[locale] === "missing") continue;
      for (const t of types) if (!set.has(t)) add({ check: "first-use-help", severity: "error", path: `/components/${t}`, locale, message: `"${t}" has no ${locale} first-use hint` });
    }
  }

  // Media rules: captions and transcripts in every published locale; never autoplay.
  for (const { block } of blocks) {
    const c = block.config as { media?: { captions?: Record<string, string>; transcripts?: Record<string, string>; autoplay?: boolean } };
    if (!c.media) continue;
    if (c.media.autoplay) add({ check: "media-rules", severity: "error", path: `/blocks/${block.id}`, message: "media must not autoplay" });
    for (const [locale, status] of Object.entries(lesson.localeStatus)) {
      if (status === "missing") continue;
      if (!c.media.captions?.[locale]) add({ check: "media-rules", severity: "error", path: `/blocks/${block.id}`, locale, message: `no ${locale} captions` });
      if (!c.media.transcripts?.[locale]) add({ check: "media-rules", severity: "error", path: `/blocks/${block.id}`, locale, message: `no ${locale} transcript` });
    }
  }

  // Checks present and mapped to objectives.
  if (!lesson.checks.pre.length) add({ check: "checks-present", severity: "error", path: "/checks/pre", message: "no pre-check" });
  if (!lesson.checks.post.length) add({ check: "checks-present", severity: "error", path: "/checks/post", message: "no post-check" });
  for (const o of lesson.meta.objectives) if (!lesson.checks.post.some((c) => c.objective === o.id)) add({ check: "checks-present", severity: "error", path: `/meta/objectives/${o.id}`, message: "objective has no post-check item" });

  // Ending (Article 5): the last stage leaves the learner with something to keep or a reflection.
  const last = lesson.stages.at(-1);
  if (last?.stage !== "transfer-reflect") add({ check: "ending", severity: "error", path: "/stages", message: "the lesson does not end with transfer-and-reflect" });
  else if (!last.blocks.some((b) => b.type === "takeaway" || b.type === "explain-back")) add({ check: "ending", severity: "error", path: "/stages/transfer-reflect", message: "the ending gives the learner nothing to keep and no reflection" });

  // Publishable locales: complete, with no locale errors, and reviewed by a human.
  const localeErrors = new Set(findings.filter((f) => f.severity === "error" && f.locale).map((f) => f.locale));
  const completeness = findings.filter((f) => f.check === "locale-completeness" && f.severity === "error").map((f) => f.path.split("/")[2]);
  const structurallyBroken = findings.some((f) => f.check === "structure" && f.severity === "error");
  const publishable = structurallyBroken ? [] : Object.entries(lesson.localeStatus)
    .filter(([l, s]) => s === "reviewed" && !localeErrors.has(l) && !completeness.includes(l))
    .map(([l]) => l);
  return report(findings, publishable);
}

function hasLessonShape(doc: unknown): doc is Lesson {
  const d = doc as Partial<Lesson> | null;
  return !!d && Array.isArray(d.stages) && d.stages.every((s) => Array.isArray(s?.blocks)) && typeof d.strings === "object" && !!d.meta && Array.isArray(d.meta.objectives) && !!d.checks && Array.isArray(d.checks.pre) && Array.isArray(d.checks.post) && typeof d.localeStatus === "object";
}

function report(findings: Finding[], publishableLocales: string[]): ValidationReport {
  const checks = Object.fromEntries(ALL_CHECKS.map((c) => [c, "pass"])) as ValidationReport["checks"];
  for (const f of findings) if (checks[f.check] !== "error") checks[f.check] = f.severity === "error" ? "error" : "warning";
  const errors = findings.filter((f) => f.severity === "error").length;
  return { passed: errors === 0, errors, warnings: findings.length - errors, findings, publishableLocales, checks };
}
