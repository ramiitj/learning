import type { Payload } from "payload";
import { overdueIncidents } from "../../ops/incidents";

/** Above the incidents list: serious incidents whose schools have not been told within 48 hours. */
export async function IncidentWarning({ payload }: { payload: Payload }) {
  const { docs } = await payload.find({ collection: "incidents", where: { and: [{ severity: { equals: "serious" } }, { schoolsInformedAt: { exists: false } }] }, limit: 100, overrideAccess: true, depth: 0 });
  const overdue = overdueIncidents(docs);
  if (!overdue.length) return null;
  return (
    <div role="alert" style={{ border: "2px solid var(--theme-error-500)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem" }}>
      <strong>Overdue: inform the affected schools.</strong>
      <ul>
        {overdue.map((i) => (
          <li key={i.id}>
            <a href={`/console/collections/incidents/${i.id}`}>{i.title}</a> (reported {new Date(i.createdAt).toISOString().slice(0, 16).replace("T", " ")} UTC; due within 48 hours)
          </li>
        ))}
      </ul>
    </div>
  );
}
