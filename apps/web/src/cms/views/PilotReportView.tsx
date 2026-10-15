import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { loadPilotReport, rangeOf } from "../pilot-data";
import { K } from "../pilot";
import { PilotApprove } from "./PilotApprove";

/** Pilot report (Phase 6): the evidence and the prioritised revision list the creator signs off. */
export async function PilotReportView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const q = await searchParams;
  const range = rangeOf(q?.from, q?.to);
  const report = await loadPilotReport(req.payload, range);
  const qs = `from=${range.from}&to=${range.to}`;
  const th = { textAlign: "start", paddingInlineEnd: 16 } as const;
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <h1>Pilot report</h1>
        <p>Built from anonymous daily totals (counts under {K} are held back), your usability findings, and open reports and incidents. Add findings under Oversight, Usability findings. Do not record names.</p>
        <form style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <label>From <input type="date" name="from" defaultValue={range.from} /></label>
          <label>To <input type="date" name="to" defaultValue={range.to} /></label>
          <button type="submit" className="btn btn--style-secondary btn--size-small">Show</button>
        </form>
        <p>
          <a href={`/api/pilot-report?${qs}&format=md`} download>Download Markdown</a> · <a href={`/api/pilot-report?${qs}&format=html`} target="_blank" rel="noreferrer">Print-friendly page</a>
        </p>

        <h2>Per lesson and language</h2>
        {!report.slices.length ? <p>No lesson was opened in this period.</p> : (
          <table>
            <thead><tr>{["Lesson", "Lang", "Opens", "Completion", "Biggest drop-off", "Misconceptions", "Learning gain", "Help used"].map((h) => <th key={h} scope="col" style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {report.slices.map((s) => (
                <tr key={`${s.lessonId}:${s.locale}`}>
                  <td style={th}>{s.title}</td><td style={th}>{s.locale}</td><td style={th}>{s.starts}</td>
                  <td style={th}>{s.completion === null ? "not enough data" : `${s.completion}%`}</td>
                  <td style={th}>{s.dropOff ? `${s.dropOff.blockId} (${s.dropOff.lostShare}%)` : "—"}</td>
                  <td style={th}>{s.misconceptions.length ? s.misconceptions.map((m) => `${m.blockId}: ${m.label} ${m.share}%`).join("; ") : "—"}</td>
                  <td style={th}>{s.gains.length ? s.gains.map((g) => `${g.objective}: ${g.gain === null ? `n/a (${g.why})` : `${g.gain >= 0 ? "+" : ""}${g.gain} pts`}`).join("; ") : "—"}</td>
                  <td style={th}>{s.help.detour + s.help.glossary + s.help.depth + s.help.expand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2>Usability findings</h2>
        {(["blocker", "major", "minor"] as const).map((sev) => (
          <div key={sev}>
            <h3>{sev} ({report.findings.filter((f) => f.severity === sev).length})</h3>
            <ul>{report.findings.filter((f) => f.severity === sev).map((f) => <li key={f.id}>{f.observed} [{f.lesson || "platform"}{f.locale ? `, ${f.locale}` : ""}; {f.source}; {f.status}]</li>)}</ul>
          </div>
        ))}

        <h2>Open feedback reports ({report.reports.length}) and incidents ({report.incidents.length})</h2>
        <ul>
          {report.reports.map((r) => <li key={`r${r.id}`}>Report: {r.summary} [{r.lessonId || "platform"}; {r.status}]</li>)}
          {report.incidents.map((i) => <li key={`i${i.id}`}>Incident: {i.title} [{i.severity}; {i.status}]</li>)}
        </ul>

        <h2>Prioritised revision list</h2>
        <p>Blockers first, then major findings by the number of lessons affected, then analytics items by learners affected, then minor findings. Ticking and approving is your sign-off and needs a recent passkey confirmation.</p>
        <PilotApprove from={range.from} to={range.to} items={report.revisions.map((r) => ({ id: r.id, rank: r.rank, kind: r.kind, text: r.text, lessons: r.lessons.join(", ") }))} />
      </Gutter>
    </DefaultTemplate>
  );
}
