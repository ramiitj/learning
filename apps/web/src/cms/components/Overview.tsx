import type { Payload } from "payload";

/** The console's front page: what needs the creator now, what is in progress, and what it costs. */
export async function Overview({ payload }: { payload: Payload }) {
  const [decisions, runs, events, budget, errors] = await Promise.all([
    payload.find({ collection: "decisions", where: { status: { equals: "open" } }, limit: 10, sort: "-createdAt", overrideAccess: true, depth: 0 }),
    payload.find({ collection: "pipeline-runs", where: { status: { not_in: ["done"] } }, limit: 10, sort: "-updatedAt", overrideAccess: true, depth: 0 }),
    payload.find({ collection: "events", limit: 8, sort: "-createdAt", overrideAccess: true, depth: 0 }),
    payload.findGlobal({ slug: "budget", overrideAccess: true }),
    payload.find({ collection: "errors", limit: 5, sort: "-lastSeen", overrideAccess: true, depth: 0 }).catch(() => ({ docs: [] as { id: number | string; message: string; count?: number | null; route?: string | null }[] })),
  ]);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const spent = (await payload.find({ collection: "pipeline-runs", where: { createdAt: { greater_than_equal: monthStart.toISOString() } }, limit: 1000, overrideAccess: true, depth: 0 })).docs.reduce((n, r) => n + (r.costUsd ?? 0), 0);
  const limit = budget.monthlyLimitUsd ?? 0;

  const card: React.CSSProperties = { border: "1px solid var(--theme-elevation-150)", borderRadius: 8, padding: "1rem" };
  return (
    <section aria-label="Overview" style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginBottom: "2rem" }}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Waiting for you</h2>
        {decisions.docs.length === 0 ? <p>Nothing to decide.</p> : (
          <ul>{decisions.docs.map((d) => <li key={d.id}><a href={`/console/collections/decisions/${d.id}`}>{d.title}</a> <small>({d.kind})</small></li>)}</ul>
        )}
      </div>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>In progress</h2>
        {runs.docs.length === 0 ? <p>No lessons in the pipeline.</p> : (
          <ul>{runs.docs.map((x) => <li key={x.id}><a href={`/console/collections/pipeline-runs/${x.id}`}>{x.title}</a>: {x.stage}{x.currentAgent ? `, ${x.currentAgent}` : ""} (${(x.costUsd ?? 0).toFixed(2)})</li>)}</ul>
        )}
      </div>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Budget this month</h2>
        <p style={{ fontSize: "1.5rem", margin: 0 }}>${spent.toFixed(2)} <small>of ${limit.toFixed(0)}</small></p>
        {limit > 0 && spent / limit >= (budget.alertAt ?? 0.8) && <p role="alert">Over the alert level: non-urgent agent work is paused.</p>}
      </div>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Latest activity</h2>
        <ul>{events.docs.map((x) => <li key={x.id}><small>{x.actorId}</small> {x.action} {x.target}</li>)}</ul>
        <a href="/console/collections/events">Full audit log</a>
      </div>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Recent errors</h2>
        {errors.docs.length === 0 ? <p>No errors recorded.</p> : (
          <ul>{errors.docs.map((e) => <li key={e.id}><a href={`/console/collections/errors/${e.id}`}>{e.message.slice(0, 70)}</a> <small>x{e.count ?? 1}{e.route ? `, ${e.route}` : ""}</small></li>)}</ul>
        )}
        <a href="/console/collections/errors">All errors</a>
      </div>
    </section>
  );
}
