import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { startRun } from "./actions";

/** Command channel (docs/10): instruct the Editor-in-Chief; watch each run's stage, agent and cost. */
export async function CommandView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  const runs = await req.payload.find({ collection: "pipeline-runs", sort: "-createdAt", limit: 15, overrideAccess: true, depth: 0 });
  const agentsOn = !!process.env.ANTHROPIC_API_KEY;
  return (
    <DefaultTemplate i18n={req.i18n} locale={locale} params={params} payload={req.payload} permissions={permissions} searchParams={searchParams} user={req.user ?? undefined} visibleEntities={visibleEntities}>
      <Gutter>
        <h1>Instruct the agents</h1>
        {!agentsOn && <p role="note">The agent pipeline is off: set ANTHROPIC_API_KEY on the server to run it. Requests wait in the queue until then.</p>}
        <form action={startRun} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
          <label>
            What should the team make or change?
            <textarea name="request" required rows={5} className="field-type" style={{ width: "100%" }} placeholder="Draft Module 2, 'Data decides', for classes 8–12, as one 30-minute lesson." />
          </label>
          <label>
            Existing lesson id (optional, to revise it)
            <input name="lessonId" className="field-type" pattern="[a-z0-9-]*" />
          </label>
          <label>
            <input type="checkbox" name="urgent" /> Urgent (may continue past the budget alert level)
          </label>
          <button type="submit" className="btn btn--style-primary">Send to the Editor-in-Chief</button>
        </form>
        <h2 style={{ marginTop: 32 }}>Recent requests</h2>
        <table>
          <thead>
            <tr><th>Request</th><th>Stage</th><th>Status</th><th>Agent</th><th>Cost</th></tr>
          </thead>
          <tbody>
            {runs.docs.map((r) => (
              <tr key={r.id}>
                <td><a href={`/console/collections/pipeline-runs/${r.id}`}>{r.title}</a></td>
                <td>{r.stage}</td>
                <td>{r.status}</td>
                <td>{r.currentAgent || "—"}</td>
                <td>${(r.costUsd ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Gutter>
    </DefaultTemplate>
  );
}
