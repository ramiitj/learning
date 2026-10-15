import type { Payload, PayloadRequest } from "payload";
import { actorOf, recentlyAuthenticated } from "./access";
import { logEvent } from "./events";
import { loadPilotReport, rangeOf } from "./pilot-data";

/**
 * Records the creator's approval of a pilot revision list. Only the creator,
 * and only within five minutes of a passkey confirmation; refusals are logged.
 * The ticked ids are checked against the list as it stands now.
 */
export async function approvePilotList(payload: Payload, req: PayloadRequest, input: { from: string; to: string; ids: string[] }): Promise<{ ok?: string; error?: string }> {
  const actor = actorOf(req);
  if (actor.kind !== "creator") {
    await logEvent(payload, req, { action: "pilot-report.refused", target: "pilot-report", reason: "not the creator" });
    return { error: "Only the creator can approve the revision list." };
  }
  if (!recentlyAuthenticated(req)) {
    await logEvent(payload, req, { action: "pilot-report.refused", target: "pilot-report", reason: "passkey confirmation older than five minutes" });
    return { error: "Approving is a sign-off: confirm with your passkey first (top right), then try again." };
  }
  const range = rangeOf(input.from, input.to);
  const report = await loadPilotReport(payload, range);
  const valid = new Set(report.revisions.map((r) => r.id));
  const ids = [...new Set(input.ids)].filter((i) => valid.has(i));
  if (!ids.length) return { error: "Tick at least one item in the list first." };
  await logEvent(payload, req, { action: "pilot-report.approved", target: `pilot-report/${range.from}..${range.to}`, data: { creatorId: String(actor.id), from: range.from, to: range.to, approved: ids, of: report.revisions.length } });
  return { ok: `Approved ${ids.length} of ${report.revisions.length} items.` };
}
