import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { allBlocks } from "@lm/schema";
import { learningGains, type Row } from "../pilot";

/** Counts below this are shown as "fewer than 5", so no small group can be singled out. */
const K = 5;
const fmt = (n: number) => (n === 0 ? "0" : n < K ? `<${K}` : String(n));
/** The first day of the report window (30 days back), as YYYY-MM-DD. */
const windowStart = () => new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
const pct = (a: number, b: number) => (b >= K && a >= K ? `${Math.round((100 * a) / b)}%` : "—");

/**
 * Analytics (docs/10, docs/12): learning gains, misconceptions, completion,
 * drop-off, detours, depth and glossary use, per lesson and locale, over the
 * last 30 days. Built only from anonymous daily totals.
 */
export async function AnalyticsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const q = await searchParams;
  const since = windowStart();
  const lessons = await req.payload.find({ collection: "lessons", limit: 500, depth: 0, overrideAccess: true });
  const lesson = lessons.docs.find((l) => l.lessonId === q?.lesson) ?? lessons.docs[0];
  const lang = typeof q?.locale === "string" ? q.locale : "all";

  const rows = lesson
    ? (await req.payload.find({ collection: "analytics-daily", where: { and: [{ lessonId: { equals: lesson.lessonId } }, { day: { greater_than_equal: since } }, ...(lang !== "all" ? [{ locale: { equals: lang } }] : [])] }, limit: 50_000, pagination: false, overrideAccess: true, depth: 0 })).docs
    : [];
  const sum = (metric: string, key?: string | ((k: string) => boolean)) => rows.filter((r) => r.metric === metric && (key === undefined || (typeof key === "string" ? r.key === key : key(r.key)))).reduce((n, r) => n + (r.count ?? 0), 0);
  const starts = sum("start") + sum("return");
  const doc = lesson?.doc as Parameters<typeof allBlocks>[0] & { strings: Record<string, Record<string, string>>; checks: { pre: { id: string }[]; post: { id: string; promptKey: string }[] } } | undefined;
  const en = doc?.strings.en ?? {};
  const blocks = doc ? [...allBlocks(doc)].map((b) => b.block) : [];
  const answerBlocks = blocks.filter((b) => rows.some((r) => r.metric === "answer" && r.key.startsWith(`${b.id}:`)));

  const gains = learningGains(doc?.checks as Parameters<typeof learningGains>[0], rows as unknown as Row[]);
  const hasPre = rows.some((r) => r.metric === "pre");
  const th: React.CSSProperties = { textAlign: "start", paddingInlineEnd: 16 };
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <h1>Analytics</h1>
        <p>Anonymous daily totals over the last 30 days. No learner can be identified: there are no accounts, identifiers or times, and counts under {K} are hidden.</p>
        <form style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <label>
            Lesson{" "}
            <select name="lesson" defaultValue={lesson?.lessonId}>
              {lessons.docs.map((l) => <option key={l.id} value={l.lessonId}>{l.title}</option>)}
            </select>
          </label>
          <label>
            Language{" "}
            <select name="locale" defaultValue={lang}>
              <option value="all">All</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
            </select>
          </label>
          <button type="submit" className="btn btn--style-secondary btn--size-small">Show</button>
        </form>
        {!lesson ? <p>No published lessons yet.</p> : (
          <>
            <h2>Reach and completion</h2>
            <p>
              Opened {fmt(starts)} times ({fmt(sum("return"))} by returning learners); reached the end {fmt(sum("complete"))} times ({pct(sum("complete"), starts)}). Personal {fmt(rows.filter((r) => r.mode === "personal" && (r.metric === "start" || r.metric === "return")).reduce((n, r) => n + r.count, 0))}, classroom {fmt(rows.filter((r) => r.mode === "classroom" && (r.metric === "start" || r.metric === "return")).reduce((n, r) => n + r.count, 0))}.
            </p>
            <h3>Where learners stop (drop-off)</h3>
            <table>
              <thead><tr><th style={th}>Block</th><th style={th}>Seen</th><th style={th}>Of opens</th><th style={th}>Acted on</th></tr></thead>
              <tbody>
                {blocks.filter((b) => (b.depth ?? "core") === "core").map((b) => (
                  <tr key={b.id}><td style={th}><code>{b.id}</code> {b.type}</td><td style={th}>{fmt(sum("reach", b.id))}</td><td style={th}>{pct(sum("reach", b.id), starts)}</td><td style={th}>{fmt(sum("act", b.id))}</td></tr>
                ))}
              </tbody>
            </table>

            <h2>Misconceptions: first answers</h2>
            {answerBlocks.length === 0 ? <p>No answers yet.</p> : answerBlocks.map((b) => {
              const options = new Map<string, { n: number; correct: string }>();
              for (const r of rows.filter((r) => r.metric === "answer" && r.key.startsWith(`${b.id}:`))) {
                const [, choice = "", correct = "-"] = r.key.split(":");
                const o = options.get(choice) ?? { n: 0, correct };
                o.n += r.count;
                options.set(choice, o);
              }
              const total = [...options.values()].reduce((n, o) => n + o.n, 0);
              return (
                <div key={b.id} style={{ marginBottom: 16 }}>
                  <h3 style={{ marginBottom: 4 }}><code>{b.id}</code> {b.type}</h3>
                  <ul>
                    {[...options].sort((a, b2) => b2[1].n - a[1].n).map(([choice, o]) => (
                      <li key={choice}>{en[choice] ?? choice}: {fmt(o.n)} ({pct(o.n, total)}){o.correct === "1" ? " — matches what happens" : o.correct === "0" ? " — a misconception to watch" : ""}</li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <h2>Learning: post-checks on the first try</h2>
            <ul>
              {(doc?.checks.post ?? []).map((c) => {
                const right = sum("post", `${c.id}:1`);
                const all = right + sum("post", `${c.id}:0`);
                return <li key={c.id}>{en[c.promptKey] ?? c.id}: {pct(right, all)} right first time ({fmt(all)} answers)</li>;
              })}
            </ul>
            <h3>Learning gain</h3>
            {gains.length === 0 ? <p>This lesson has no checks.</p> : (
              <ul>
                {gains.map((g) => (
                  <li key={g.objective}>
                    Objective <code>{g.objective}</code>: {g.gain === null ? `cannot be computed yet (${g.why})` : `${g.gain >= 0 ? "+" : ""}${g.gain} percentage points (pre-checks ${pct(g.pre.right, g.pre.all)} right, post-checks ${pct(g.post.right, g.post.all)} right first time)`}
                  </li>
                ))}
              </ul>
            )}
            {hasPre ? null : (
              <p>
                <strong>Learning gain</strong> compares pre-checks with post-checks. Pre-checks are not shown to learners yet (decision pending; DECISIONS 2026-09-24, deferred item 2), so this report cannot compute gains until you decide.
              </p>
            )}

            <h2>Help used</h2>
            <ul>
              <li>Detours opened: {fmt(sum("detour"))}</li>
              <li>Deeper layers: depth changed {fmt(sum("depth"))} times; single layers opened {fmt(sum("expand"))} times</li>
              <li>Glossary opened: {fmt(sum("glossary"))}</li>
            </ul>
          </>
        )}
      </Gutter>
    </DefaultTemplate>
  );
}
