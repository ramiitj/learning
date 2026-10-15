import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./rubric";

/**
 * Deterministic checks on a maker's artifact. They run before the judge and
 * catch what can be counted rather than judged: a missing stage, a term used
 * before it is defined, a dropped placeholder, a period that runs to 45
 * minutes. A blocking finding rejects the artifact like a rubric violation.
 */
export interface Finding {
  check: string;
  severity: "blocking" | "advisory";
  where: string;
  detail: string;
}

type Json = Record<string, unknown>;
type Check = (artifact: Json, task: Json) => Finding[];

const STAGES = ["hook", "predict", "manipulate", "explain", "break-it", "transfer-reflect"];
const MAX_SENTENCE_WORDS = 18;
const banned = JSON.parse(readFileSync(path.join(ROOT, "platform/references/banned-phrases.json"), "utf8")) as Record<string, string[]>;

const arr = <T = Json>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);
const str = (x: unknown): string => (typeof x === "string" ? x : "");
const find = (check: string, severity: Finding["severity"], where: string, detail: string): Finding => ({ check, severity, where, detail });

function bannedIn(text: string, locale: string): string[] {
  const t = text.toLowerCase();
  return (banned[locale] ?? []).filter((p) => (locale === "en" ? new RegExp(`\\b${p.replace(/'/g, "['’]")}\\b`, "i").test(t) : t.includes(p.toLowerCase())));
}

/** Strips ICU arguments and term tags so only the words a learner reads remain. */
function prose(s: string): string {
  let out = s.replace(/<\/?term-[a-z0-9-]+>/g, "");
  // ICU arguments nest (plural branches hold text); strip innermost first until none remain.
  for (let prev = ""; prev !== out; ) [prev, out] = [out, out.replace(/\{[^{}]*\}/g, " ")];
  return out;
}

function sentences(text: string): string[] {
  return prose(text)
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const MIND = /\b(understands?|knows?|thinks?|believes?|wants?|decides to|cares?|feels?|is trying to|lies|remembers? you|learns? about you|intends?)\b/i;
const AI_SUBJECT = /\b(AI|filter|machine|model|computer|program|system|it)\b/i;

/** Heuristic: a mind verb in a sentence about a machine. Advisory, because context decides. */
function mindVerbs(text: string, where: string): Finding[] {
  return sentences(text)
    .filter((s) => MIND.test(s) && AI_SUBJECT.test(s) && !/\b(does not|doesn't|cannot|can't|never|no idea|not)\b/i.test(s))
    .map((s) => find("ai-framing", "advisory", where, `possible mind verb applied to a machine: "${s.slice(0, 120)}"`));
}

function bannedCheck(texts: [string, string][], locale = "en"): Finding[] {
  return texts.flatMap(([where, text]) => bannedIn(prose(text), locale).map((p) => find("banned-phrases", "blocking", where, `uses "${p}" (Article 6)`)));
}

// ---------- Curriculum & Instructional Designer ----------

const curriculum: Record<string, Check> = {
  "grammar-order": (a) => {
    const seq = arr(a.sequence);
    const out: Finding[] = [];
    for (const s of STAGES) if (!seq.some((b) => b.stage === s)) out.push(find("grammar-order", "blocking", "sequence", `no "${s}" stage`));
    let last = 0;
    for (const b of seq) {
      const i = STAGES.indexOf(str(b.stage));
      if (i < last) out.push(find("grammar-order", "blocking", str(b.id), `stage "${b.stage}" comes after "${STAGES[last]}"`));
      last = Math.max(last, i);
    }
    return out;
  },
  "terms-defined-before-use": (a) => {
    const out: Finding[] = [];
    const glossary = new Set(arr(a.glossary).map((g) => str(g.term).toLowerCase()));
    // A prerequisite may be written "term: what it means"; the term is what steps refer to.
    const prereq = new Set(arr(a.prerequisites).map((p) => str(p.concept).split(":")[0]!.trim().toLowerCase()));
    const known = new Set<string>();
    for (const b of arr(a.sequence)) {
      for (const t of arr<string>(b.termsIntroduced)) {
        known.add(t.toLowerCase());
        if (!glossary.has(t.toLowerCase())) out.push(find("terms-defined-before-use", "blocking", str(b.id), `term "${t}" has no glossary entry`));
      }
      for (const t of arr<string>(b.termsUsed)) {
        const k = t.toLowerCase();
        if (!known.has(k) && !prereq.has(k)) out.push(find("terms-defined-before-use", "blocking", str(b.id), `term "${t}" is used before it is introduced and is not a declared prerequisite`));
      }
    }
    return out;
  },
  "objectives-checked": (a) => {
    const out: Finding[] = [];
    const objectives = arr(a.objectives).map((o) => str(o.id));
    const checks = (a.checks ?? {}) as Json;
    const post = arr(checks.post);
    for (const o of objectives) if (!post.some((p) => p.objective === o)) out.push(find("objectives-checked", "blocking", o, "objective has no post-check item"));
    for (const p of [...arr(checks.pre), ...post]) if (!objectives.includes(str(p.objective))) out.push(find("objectives-checked", "blocking", str(p.id), `check item maps to unknown objective "${p.objective}"`));
    if (!arr(checks.pre).length) out.push(find("objectives-checked", "blocking", "checks.pre", "no pre-check"));
    if (!post.some((p) => p.transfer === true)) out.push(find("objectives-checked", "blocking", "checks.post", "no transfer item in the post-check"));
    return out;
  },
  "act-density": (a) => actDensity(arr(a.sequence)),
  "prerequisites-resolved": (a) =>
    arr(a.prerequisites)
      .filter((p) => p.handledBy === "detour" && str(p.detourOutline).trim().length < 40)
      .map((p) => find("prerequisites-resolved", "blocking", str(p.concept), "detour has no outline")),
  "banned-phrases": (a) => bannedCheck(arr(a.sequence).map((b) => [str(b.id), str(b.draftText)])),
  "reading-level": (a) =>
    arr(a.sequence)
      .filter((b) => b.depth === "core")
      .flatMap((b) =>
        sentences(str(b.draftText))
          .filter((s) => s.split(/\s+/).length > MAX_SENTENCE_WORDS)
          .map((s) => find("reading-level", "advisory", str(b.id), `${s.split(/\s+/).length}-word sentence (limit ${MAX_SENTENCE_WORDS}): "${s.slice(0, 80)}…"`)),
      ),
};

function actDensity(blocks: Json[], isPassive = (b: Json) => b.learnerAct === "none"): Finding[] {
  const out: Finding[] = [];
  let run = 0;
  for (const b of blocks) {
    run = isPassive(b) ? run + 1 : 0;
    if (run === 3) out.push(find("act-density", "blocking", str(b.id), "third block in a row without a learner act"));
  }
  return out;
}

// ---------- Learning Experience & Interaction Designer ----------

const REFUSED = /\b(streaks?|leaderboards?|badges?|confetti|XP|progress bar|autoplay\w*|click next|press next|level up)\b/i;

const experience: Record<string, Check> = {
  "act-density": (a) => actDensity(arr(a.blocks), (b) => b.learnerAct === "none" || b.component === "reveal"),
  "hook-is-question": (a) => {
    const hook = (a.hook ?? {}) as Json;
    return /[?？]/.test(str(hook.text)) ? [] : [find("hook-is-question", "blocking", "hook", "the hook asks no question")];
  },
  "classroom-variants": (a) =>
    arr(a.blocks)
      .filter((b) => str(b.classroomVariant).trim().length < 15)
      .map((b) => find("classroom-variants", "blocking", str(b.id), "no classroom variant")),
  "ending-keepable": (a) => {
    const blocks = arr(a.blocks);
    const out: Finding[] = [];
    if (blocks.at(-1)?.stage !== "transfer-reflect") out.push(find("ending-keepable", "blocking", "blocks", "the lesson does not end in transfer-reflect"));
    if (blocks.at(-1)?.component === "check") out.push(find("ending-keepable", "blocking", str(blocks.at(-1)?.id), "the lesson ends on a quiz (Article 5)"));
    if (str(((a.ending ?? {}) as Json).keepable).trim().length < 10) out.push(find("ending-keepable", "blocking", "ending", "nothing for the learner to keep"));
    return out;
  },
  "refused-patterns": (a) =>
    [["hook", str(((a.hook ?? {}) as Json).text)], ...arr(a.blocks).map((b) => [str(b.id), `${str(b.text)} ${str(b.configSummary)} ${str(b.classroomVariant)}`]), ["ending", str(((a.ending ?? {}) as Json).text)]]
      .flatMap(([where, t]) => (REFUSED.test(t!) ? [find("refused-patterns", "blocking", where!, `Article 14 pattern: "${REFUSED.exec(t!)![0]}"`)] : [])),
  "banned-phrases": (a) => bannedCheck([["hook", str(((a.hook ?? {}) as Json).text)], ...arr(a.blocks).map((b) => [str(b.id), str(b.text)] as [string, string]), ["ending", str(((a.ending ?? {}) as Json).text)]]),
  "ai-framing": (a) => arr(a.blocks).flatMap((b) => mindVerbs(str(b.text), str(b.id))),
};

// ---------- Analogy Specialist ----------

const CULTURE = /\b(cricket|diwali|holi|eid|christmas|rupees?|₹|roti|chapati|dosa|chai|rangoli|kabaddi|bollywood|thanksgiving|baseball|dollars?)\b/i;

const analogy: Record<string, Check> = {
  "two-analogies": (a) => (arr(a.analogies).length >= 2 ? [] : [find("two-analogies", "blocking", "analogies", "hard concepts need at least two analogies (Article 7)")]),
  "mappings-complete": (a) =>
    arr(a.analogies).flatMap((x) => {
      const m = arr(x.mappings);
      const out = m.length < 3 ? [find("mappings-complete", "blocking", str(x.id), `only ${m.length} mappings`)] : [];
      return out.concat(m.filter((p) => str(p.relation).trim().length < 5).map(() => find("mappings-complete", "blocking", str(x.id), "a mapping names no relation")));
    }),
  "break-points-honest": (a) =>
    arr(a.analogies).flatMap((x) => {
      const bp = str(x.breakPoint);
      if (bp.trim().length < 30) return [find("break-points-honest", "blocking", str(x.id), "break point missing or too thin")];
      if (/\b(perfect(ly)?|exactly the same|in every way)\b/i.test(bp)) return [find("break-points-honest", "blocking", str(x.id), "break point claims the analogy is perfect")];
      return [];
    }),
  "universal-sources": (a) =>
    arr(a.analogies).flatMap((x) => {
      const text = `${str(x.source)} ${arr(x.mappings).map((m) => str(m.source)).join(" ")}`;
      return CULTURE.test(text) ? [find("universal-sources", "blocking", str(x.id), `culture-specific detail in the base analogy: "${CULTURE.exec(text)![0]}" belongs in a locale variant`)] : [];
    }),
  "ai-framing": (a) => arr(a.analogies).flatMap((x) => arr(x.mappings).flatMap((m) => mindVerbs(str(m.target), str(x.id)))),
};

// ---------- Localisation Specialist ----------

const placeholders = (s: string) => [...s.matchAll(/\{\s*([a-zA-Z_][\w]*)/g)].map((m) => m[1]).sort();
const pluralBranches = (s: string) => [...s.matchAll(/\b(zero|one|two|few|many|other|=\d+)\s*\{/g)].map((m) => m[1]).sort();
const termTags = (s: string) => [...s.matchAll(/<(term-[a-z0-9-]+)>/g)].map((m) => m[1]).sort();
const numbers = (s: string) => [...prose(s).matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0].replace(/,/g, "")).sort();
const same = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const SCRIPT: Record<string, RegExp> = { hi: /[ऀ-ॿ]/g, te: /[ఀ-౿]/g };

const localisation: Record<string, Check> = {
  "all-strings-translated": (a, t) => {
    const got = new Set(arr(a.strings).map((s) => `${s.locale}:${s.key}`));
    return Object.keys((t.strings ?? {}) as Json).flatMap((k) =>
      ["hi", "te"].filter((l) => !got.has(`${l}:${k}`)).map((l) => find("all-strings-translated", "blocking", `${l}:${k}`, "missing")),
    );
  },
  "placeholders-kept": (a, t) =>
    arr(a.strings).flatMap((s) => {
      const src = str(((t.strings ?? {}) as Json)[str(s.key)]);
      const out: Finding[] = [];
      if (!same(placeholders(src), placeholders(str(s.text)))) out.push(find("placeholders-kept", "blocking", `${s.locale}:${s.key}`, `placeholders ${JSON.stringify(placeholders(src))} became ${JSON.stringify(placeholders(str(s.text)))}`));
      if (!same(pluralBranches(src), pluralBranches(str(s.text)))) out.push(find("placeholders-kept", "blocking", `${s.locale}:${s.key}`, "plural branches changed"));
      return out;
    }),
  "numbers-kept": (a, t) =>
    arr(a.strings).flatMap((s) => {
      const src = str(((t.strings ?? {}) as Json)[str(s.key)]);
      return same(numbers(src), numbers(str(s.text))) ? [] : [find("numbers-kept", "blocking", `${s.locale}:${s.key}`, `numbers ${JSON.stringify(numbers(src))} became ${JSON.stringify(numbers(str(s.text)))}`)];
    }),
  "term-tags-kept": (a, t) =>
    arr(a.strings).flatMap((s) => {
      const src = str(((t.strings ?? {}) as Json)[str(s.key)]);
      return same(termTags(src), termTags(str(s.text))) ? [] : [find("term-tags-kept", "blocking", `${s.locale}:${s.key}`, "term tags changed")];
    }),
  "script-correct": (a) =>
    arr(a.strings).flatMap((s) => {
      const letters = prose(str(s.text)).match(/\p{L}/gu)?.length ?? 0;
      const native = prose(str(s.text)).match(SCRIPT[str(s.locale)] ?? /$^/g)?.length ?? 0;
      return letters && native / letters < 0.6 ? [find("script-correct", "blocking", `${s.locale}:${s.key}`, `only ${Math.round((100 * native) / letters)}% of letters are in the ${s.locale} script`)] : [];
    }),
  "uncertainty-noted": (a) =>
    arr(a.strings)
      .filter((s) => s.confidence !== "high" && str(s.note).trim().length < 10)
      .map((s) => find("uncertainty-noted", "blocking", `${s.locale}:${s.key}`, `confidence ${s.confidence} with no note for the reviewer`)),
  "banned-phrases": (a) => arr(a.strings).flatMap((s) => bannedCheck([[`${s.locale}:${s.key}`, str(s.text)]], str(s.locale))),
};

// ---------- Educator Enablement ----------

const words = (x: unknown): number => (typeof x === "string" ? x.split(/\s+/).filter(Boolean).length : Array.isArray(x) ? x.reduce((n: number, y) => n + words(y), 0) : x && typeof x === "object" ? Object.values(x).reduce((n: number, y) => n + words(y), 0) : 0);

const educator: Record<string, Check> = {
  "timing-fits": (a) => {
    const total = arr(a.timing).reduce((n, s) => n + (typeof s.minutes === "number" ? s.minutes : 0), 0);
    return total > 40 ? [find("timing-fits", "blocking", "timing", `segments add up to ${total} minutes; a period is 40`)] : total < 30 ? [find("timing-fits", "advisory", "timing", `only ${total} minutes planned`)] : [];
  },
  "no-device-path": (a) => (str(a.noDeviceAlternative).trim().length >= 80 ? [] : [find("no-device-path", "blocking", "noDeviceAlternative", "no real no-device alternative")]),
  "misconceptions-covered": (a) => (arr(a.misconceptions).length >= 3 ? [] : [find("misconceptions-covered", "blocking", "misconceptions", `${arr(a.misconceptions).length} misconceptions; at least 3 expected`)]),
  "one-page": (a) => {
    const n = words({ ...a, parentNote: "" });
    return n > 700 ? [find("one-page", "blocking", "guide", `${n} words; one page is about 600`)] : [];
  },
  "banned-phrases": (a) => bannedCheck([["guide", JSON.stringify(a)]]),
};

// ---------- Editor-in-Chief ----------

const editor: Record<string, Check> = {
  "every-conflict-resolved": (a, t) => {
    const done = new Set(arr(a.resolutions).map((r) => str(r.conflictId)));
    return arr(t.conflicts).filter((c) => !done.has(str(c.id))).map((c) => find("every-conflict-resolved", "blocking", str(c.id), "conflict not resolved or escalated"));
  },
  "escalation-rules": (a) =>
    arr(a.resolutions).flatMap((r) => {
      const n = arr(r.options).length;
      if (r.decision === "escalate" && (n < 1 || n > 3)) return [find("escalation-rules", "blocking", str(r.conflictId), `escalation offers ${n} options; 1 to 3 expected`)];
      return [];
    }),
  "summary-honest": (a) => {
    const s = (a.creatorSummary ?? {}) as Json;
    const escalated = arr(a.resolutions).filter((r) => r.decision === "escalate").length;
    const out: Finding[] = [];
    if (!arr(s.weaknesses).length) out.push(find("summary-honest", "blocking", "creatorSummary", "states no weaknesses"));
    if (arr(s.forYourDecision).length < escalated) out.push(find("summary-honest", "blocking", "creatorSummary", `${escalated} escalations but ${arr(s.forYourDecision).length} items for the creator's decision`));
    return out;
  },
};

export const ARTIFACT_CHECKS: Record<string, Record<string, Check>> = {
  "curriculum-instructional-designer": curriculum,
  "learning-experience-designer": experience,
  "analogy-specialist": analogy,
  "localisation-specialist": localisation,
  "educator-enablement": educator,
  "editor-in-chief": editor,
};

/** Runs every deterministic check registered for the agent. */
export function runArtifactChecks(agent: string, artifact: unknown, task: unknown = {}): Finding[] {
  const checks = ARTIFACT_CHECKS[agent];
  if (!checks) return [];
  return Object.values(checks).flatMap((c) => c(artifact as Json, task as Json));
}

/** Scores the Editor-in-Chief's decisions against expected answers. */
export interface ExpectedDecision {
  conflictId: string;
  decision: "side-a" | "side-b" | "both" | "escalate";
  /** Other decisions that are also correct (for example "both" when a side's concern can be kept). */
  alsoAccept?: string[];
  why: string;
}

export function scoreDecisions(artifact: unknown, expected: ExpectedDecision[]) {
  const res = arr((artifact as Json).resolutions);
  const results = expected.map((e) => {
    const got = str(res.find((r) => r.conflictId === e.conflictId)?.decision);
    return { conflictId: e.conflictId, expected: e.decision, got, correct: got === e.decision || (e.alsoAccept ?? []).includes(got) };
  });
  const mustEscalate = expected.filter((e) => e.decision === "escalate");
  return {
    accuracy: results.filter((r) => r.correct).length / (expected.length || 1),
    escalationRecall: mustEscalate.filter((e) => results.find((r) => r.conflictId === e.conflictId)?.got === "escalate").length / (mustEscalate.length || 1),
    wrongEscalations: results.filter((r) => r.got === "escalate" && r.expected !== "escalate").length,
    results,
  };
}
