/**
 * The pilot report (docs/14, Phase 6): learning gains, misconceptions,
 * usability findings and a prioritised revision list, built only from
 * anonymous daily totals, the creator's own findings, and open reports.
 * Pure functions, so the rules are testable without a database.
 */
import { allBlocks } from "@lm/schema";

/** Counts below this are never shown, so no small group can be singled out. */
export const K = 5;

export interface Row {
  lessonId: string;
  locale: string;
  mode: string;
  metric: string;
  key: string;
  count: number;
}
export interface Check {
  id: string;
  objective: string;
  promptKey?: string;
}
export interface LessonInfo {
  lessonId: string;
  title: string;
  doc?: { checks?: { pre?: Check[]; post?: Check[] }; strings?: Record<string, Record<string, string>>; meta?: { objectives?: { id: string }[] } };
}
export interface Finding {
  id: string | number;
  lesson?: string | null;
  locale?: string | null;
  mode?: string | null;
  observed: string;
  severity: "blocker" | "major" | "minor";
  source: string;
  suggestedChange?: string | null;
  status: string;
}

export interface Gain {
  objective: string;
  /** Percentage points, post (first try) minus pre; null when it cannot be computed. */
  gain: number | null;
  pre: { right: number; all: number };
  post: { right: number; all: number };
  /** Why there is no gain, in the creator's words. */
  why?: string;
}

const sum = (rows: Row[], metric: string, pred: (k: string) => boolean) => rows.filter((r) => r.metric === metric && pred(r.key)).reduce((n, r) => n + r.count, 0);

/** Learning gain per objective: post-check first-try rate minus pre-check rate, only when both have at least K answers. */
export function learningGains(checks: { pre?: Check[]; post?: Check[] } | undefined, rows: Row[]): Gain[] {
  const pre = checks?.pre ?? [];
  const post = checks?.post ?? [];
  const objectives = [...new Set([...pre, ...post].map((c) => c.objective))];
  return objectives.map((objective) => {
    const tally = (items: Check[], metric: string) => {
      const ids = new Set(items.filter((c) => c.objective === objective).map((c) => c.id));
      const key = (k: string) => ids.has(k.split(":")[0]!);
      const right = sum(rows, metric, (k) => key(k) && k.endsWith(":1"));
      return { right, all: right + sum(rows, metric, (k) => key(k) && k.endsWith(":0")) };
    };
    const p = tally(pre, "pre");
    const q = tally(post, "post");
    let why: string | undefined;
    if (!pre.some((c) => c.objective === objective)) why = "no pre-check for this objective";
    else if (!post.some((c) => c.objective === objective)) why = "no post-check for this objective";
    else if (p.all === 0) why = "no pre-check answers yet (pre-checks may be switched off)";
    else if (p.all < K) why = `fewer than ${K} pre-check answers`;
    else if (q.all < K) why = `fewer than ${K} post-check answers`;
    return { objective, pre: p, post: q, gain: why ? null : Math.round((100 * q.right) / q.all - (100 * p.right) / p.all), why };
  });
}

export interface Misconception {
  blockId: string;
  label: string;
  n: number;
  share: number;
}
export interface Slice {
  lessonId: string;
  title: string;
  locale: string;
  starts: number;
  returning: number;
  completes: number;
  completion: number | null;
  /** The core block after which most opens were lost. */
  dropOff: { blockId: string; lost: number; lostShare: number } | null;
  misconceptions: Misconception[];
  gains: Gain[];
  help: { detour: number; depth: number; expand: number; glossary: number };
}

/** One lesson and locale, from the day's totals. Counts under K are held back (null or omitted). */
export function sliceOf(lesson: LessonInfo, locale: string, rows: Row[]): Slice {
  const mine = rows.filter((r) => r.lessonId === lesson.lessonId && r.locale === locale);
  const total = (metric: string, key?: string) => sum(mine, metric, (k) => key === undefined || k === key);
  const starts = total("start") + total("return");
  const completes = total("complete");
  const en = lesson.doc?.strings?.en ?? {};
  const blocks = lesson.doc && Array.isArray((lesson.doc as { stages?: unknown }).stages) ? [...allBlocks(lesson.doc as Parameters<typeof allBlocks>[0])].map((b) => b.block).filter((b) => (b.depth ?? "core") === "core") : [];

  let dropOff: Slice["dropOff"] = null;
  let prev = starts;
  for (const b of blocks) {
    const here = total("reach", b.id);
    const lost = prev - here;
    if (starts >= K && lost >= K && (!dropOff || lost > dropOff.lost)) dropOff = { blockId: b.id, lost, lostShare: Math.round((100 * lost) / starts) };
    prev = here;
  }

  const misconceptions: Misconception[] = [];
  for (const b of blocks) {
    const answers = mine.filter((r) => r.metric === "answer" && r.key.startsWith(`${b.id}:`));
    const all = answers.reduce((n, r) => n + r.count, 0);
    const byChoice = new Map<string, { n: number; correct: string }>();
    for (const r of answers) {
      const [, choice = "", correct = "-"] = r.key.split(":");
      const o = byChoice.get(choice) ?? { n: 0, correct };
      o.n += r.count;
      byChoice.set(choice, o);
    }
    for (const [choice, o] of byChoice) if (o.correct === "0" && o.n >= K && all >= K) misconceptions.push({ blockId: b.id, label: en[choice] ?? choice, n: o.n, share: Math.round((100 * o.n) / all) });
  }
  misconceptions.sort((a, b) => b.n - a.n);

  return {
    lessonId: lesson.lessonId,
    title: lesson.title,
    locale,
    starts,
    returning: total("return"),
    completes,
    completion: starts >= K && completes >= K ? Math.round((100 * completes) / starts) : null,
    dropOff,
    misconceptions,
    gains: learningGains(lesson.doc?.checks, mine),
    help: { detour: total("detour"), depth: total("depth"), expand: total("expand"), glossary: total("glossary") },
  };
}

export interface RevisionItem {
  /** Stable, so an approval names exactly what the creator saw. */
  id: string;
  rank: number;
  kind: "blocker" | "major" | "analytics" | "minor";
  text: string;
  lessons: string[];
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Blockers first; then majors, most lessons affected first (the same
 * observation on several lessons counts once, over all of them); then
 * analytics items by how many learners they touch; minors last.
 */
export function revisionList(findings: Finding[], slices: Slice[], allLessonIds: string[]): RevisionItem[] {
  const open = findings.filter((f) => ["open", "planned"].includes(f.status));
  const items: Omit<RevisionItem, "rank">[] = [];
  for (const f of open.filter((f) => f.severity === "blocker")) items.push({ id: `finding:${f.id}`, kind: "blocker", text: `${f.observed}${f.suggestedChange ? ` → ${f.suggestedChange}` : ""}`, lessons: f.lesson ? [f.lesson] : allLessonIds });

  const groups = new Map<string, { ids: (string | number)[]; text: string; lessons: Set<string> }>();
  for (const f of open.filter((f) => f.severity === "major")) {
    const g = groups.get(norm(f.observed)) ?? { ids: [], text: `${f.observed}${f.suggestedChange ? ` → ${f.suggestedChange}` : ""}`, lessons: new Set<string>() };
    g.ids.push(f.id);
    for (const l of f.lesson ? [f.lesson] : allLessonIds) g.lessons.add(l);
    groups.set(norm(f.observed), g);
  }
  [...groups.values()].sort((a, b) => b.lessons.size - a.lessons.size).forEach((g) => items.push({ id: `finding:${g.ids.join("+")}`, kind: "major", text: g.text, lessons: [...g.lessons] }));

  const analytics: (Omit<RevisionItem, "rank"> & { impact: number })[] = [];
  for (const s of slices) {
    const where = `${s.title} (${s.locale})`;
    if (s.dropOff) analytics.push({ id: `analytics:${s.lessonId}:${s.locale}:drop:${s.dropOff.blockId}`, kind: "analytics", text: `${where}: ${s.dropOff.lost} opens (${s.dropOff.lostShare}%) stop at block ${s.dropOff.blockId}.`, lessons: [s.lessonId], impact: s.dropOff.lost });
    for (const m of s.misconceptions.slice(0, 2)) analytics.push({ id: `analytics:${s.lessonId}:${s.locale}:mis:${m.blockId}`, kind: "analytics", text: `${where}: ${m.share}% of first answers at ${m.blockId} are the misconception "${m.label}" (${m.n}). Consider a clearer set-up or hint.`, lessons: [s.lessonId], impact: m.n });
    for (const g of s.gains) if (g.gain !== null && g.gain <= 0) analytics.push({ id: `analytics:${s.lessonId}:${s.locale}:gain:${g.objective}`, kind: "analytics", text: `${where}: no learning gain on objective ${g.objective} (${g.gain >= 0 ? "+" : ""}${g.gain} points).`, lessons: [s.lessonId], impact: g.post.all });
  }
  analytics.sort((a, b) => b.impact - a.impact).forEach(({ impact: _i, ...rest }) => items.push(rest));

  for (const f of open.filter((f) => f.severity === "minor")) items.push({ id: `finding:${f.id}`, kind: "minor", text: `${f.observed}${f.suggestedChange ? ` → ${f.suggestedChange}` : ""}`, lessons: f.lesson ? [f.lesson] : allLessonIds });
  return items.map((it, i) => ({ ...it, rank: i + 1 }));
}

export interface OpenReport {
  id: string | number;
  summary: string;
  lessonId?: string | null;
  locale?: string | null;
  status: string;
}
export interface OpenIncident {
  id: string | number;
  title: string;
  severity: string;
  status: string;
}
export interface PilotReport {
  from: string;
  to: string;
  generatedAt: string;
  slices: Slice[];
  findings: Finding[];
  reports: OpenReport[];
  incidents: OpenIncident[];
  revisions: RevisionItem[];
}

export function buildReport(input: { from: string; to: string; lessons: LessonInfo[]; locales: string[]; rows: Row[]; findings: Finding[]; reports: OpenReport[]; incidents: OpenIncident[]; now?: Date }): PilotReport {
  const slices = input.lessons.flatMap((l) => input.locales.map((loc) => sliceOf(l, loc, input.rows))).filter((s) => s.starts > 0);
  return {
    from: input.from,
    to: input.to,
    generatedAt: (input.now ?? new Date()).toISOString(),
    slices,
    findings: input.findings,
    reports: input.reports,
    incidents: input.incidents,
    revisions: revisionList(input.findings, slices, input.lessons.map((l) => l.lessonId)),
  };
}

const n = (v: number | null, suffix = "") => (v === null ? "not enough data" : `${v}${suffix}`);
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

export function toMarkdown(r: PilotReport, approved?: { ids: string[]; by?: string }): string {
  const L: string[] = [`# Pilot report, ${r.from} to ${r.to}`, "", `Generated ${r.generatedAt}. Built from anonymous daily totals; counts under ${K} are held back.`, ""];
  L.push("## Per lesson and language", "");
  if (!r.slices.length) L.push("No lesson was opened in this period.", "");
  for (const s of r.slices) {
    L.push(`### ${s.title} (${s.locale})`, "", `- Reach: ${s.starts} opens (${s.returning} returning). Completion: ${n(s.completion, "%")} (${s.completes} reached the end).`);
    L.push(`- Drop-off: ${s.dropOff ? `most opens stop at ${s.dropOff.blockId} (${s.dropOff.lost}, ${s.dropOff.lostShare}% of opens)` : "no block loses a notable group"}.`);
    L.push(`- Misconceptions (first answers): ${s.misconceptions.length ? s.misconceptions.map((m) => `${m.blockId} "${m.label}" ${m.share}% (${m.n})`).join("; ") : "none above the reporting threshold"}.`);
    L.push(`- Learning gain: ${s.gains.length ? s.gains.map((g) => `${g.objective} ${g.gain === null ? `not computed (${g.why})` : `${g.gain >= 0 ? "+" : ""}${g.gain} points (pre ${g.pre.right}/${g.pre.all}, post ${g.post.right}/${g.post.all})`}`).join("; ") : "no checks"}.`);
    L.push(`- Help used: ${s.help.detour} detours, ${s.help.glossary} glossary opens, ${s.help.depth} depth changes, ${s.help.expand} layers opened.`, "");
  }
  L.push("## Usability findings", "");
  for (const sev of ["blocker", "major", "minor"] as const) {
    const fs = r.findings.filter((f) => f.severity === sev);
    L.push(`### ${sev[0]!.toUpperCase()}${sev.slice(1)} (${fs.length})`, "");
    if (!fs.length) L.push("None recorded.");
    for (const f of fs) L.push(`- ${f.observed} [${f.lesson || "platform"}${f.locale ? `, ${f.locale}` : ""}${f.mode ? `, ${f.mode}` : ""}; ${f.source}; ${f.status}]${f.suggestedChange ? ` Suggested: ${f.suggestedChange}` : ""}`);
    L.push("");
  }
  L.push("## Open feedback reports", "");
  L.push(...(r.reports.length ? r.reports.map((x) => `- ${x.summary} [${x.lessonId || "platform"}${x.locale ? `, ${x.locale}` : ""}; ${x.status}]`) : ["None open."]), "", "## Open incidents", "");
  L.push(...(r.incidents.length ? r.incidents.map((x) => `- ${x.title} [${x.severity}; ${x.status}]`) : ["None open."]), "", "## Prioritised revision list", "");
  if (!r.revisions.length) L.push("Nothing to revise.");
  else {
    L.push("| Approved | # | Kind | Revision | Lessons |", "|---|---|---|---|---|");
    for (const it of r.revisions) L.push(`| ${approved?.ids.includes(it.id) ? "[x]" : "[ ]"} | ${it.rank} | ${it.kind} | ${cell(it.text)} | ${cell(it.lessons.join(", "))} |`);
  }
  if (approved) L.push("", `Approved by the creator${approved.by ? ` (${approved.by})` : ""}: ${approved.ids.length} of ${r.revisions.length} items.`);
  return `${L.join("\n")}\n`;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Print-friendly HTML: a self-contained page, no scripts. */
export function toHtml(r: PilotReport, approved?: { ids: string[]; by?: string }): string {
  const md = toMarkdown(r, approved).split("\n");
  const out: string[] = [];
  let list = false;
  let table = false;
  const close = () => {
    if (list) out.push("</ul>");
    if (table) out.push("</tbody></table>");
    list = table = false;
  };
  for (const line of md) {
    if (/^#{1,3} /.test(line)) {
      close();
      const lvl = line.match(/^#+/)![0].length;
      out.push(`<h${lvl}>${esc(line.slice(lvl + 1))}</h${lvl}>`);
    } else if (line.startsWith("- ")) {
      if (!list) out.push("<ul>");
      list = true;
      out.push(`<li>${esc(line.slice(2))}</li>`);
    } else if (line.startsWith("|")) {
      if (/^\|[-|]+\|$/.test(line)) continue;
      const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((c) => esc(c.trim().replace(/\\\|/g, "|")));
      if (!table) {
        close();
        out.push("<table><thead><tr>" + cells.map((c) => `<th>${c}</th>`).join("") + "</tr></thead><tbody>");
        table = true;
      } else out.push("<tr>" + cells.map((c) => `<td>${c.replace("[x]", "&#9745;").replace("[ ]", "&#9744;")}</td>`).join("") + "</tr>");
    } else if (line.trim()) {
      close();
      out.push(`<p>${esc(line)}</p>`);
    }
  }
  close();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Pilot report ${esc(r.from)} to ${esc(r.to)}</title><style>body{font:14px/1.5 system-ui,sans-serif;max-width:50rem;margin:2rem auto;padding:0 1rem}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:4px 8px;text-align:start;vertical-align:top}h3{break-after:avoid}tr{break-inside:avoid}@media print{body{margin:0;max-width:none}}</style></head><body>${out.join("\n")}</body></html>`;
}
