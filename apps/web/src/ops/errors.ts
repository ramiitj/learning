import { createHash } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";
import { logEvent } from "@/cms/events";
import { scrubRoute, scrubStack, scrubText } from "./scrub";

export const SPIKE_COUNT = 20;
export const SPIKE_MINUTES = 10;

export interface ErrorInput {
  source: "server" | "client";
  message: unknown;
  stack?: unknown;
  route?: unknown;
}

/** Same bug, same fingerprint: source, scrubbed message and the first stack frame. */
export function fingerprintOf(source: string, message: string, stack: string): string {
  const frame = stack.split("\n").find((l) => /\bat\b|@/.test(l)) ?? "";
  return createHash("sha256").update(`${source}|${message}|${frame}`).digest("hex").slice(0, 32);
}

/** Tell the creator without sending learner data: only counts, a scrubbed message and the route. Optional. */
export async function sendAlert(text: string, fetcher: typeof fetch = fetch) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  await fetcher(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }), signal: AbortSignal.timeout(5000) }).catch(() => undefined);
}

/**
 * Record one occurrence. A new fingerprint, or 20 in a 10-minute window,
 * files an open "incident" decision for the creator and pings the optional
 * webhook. Occurrences are counted, not logged one by one; the first sighting
 * and each spike are in the event log.
 */
export async function recordError(payload: Payload, input: ErrorInput): Promise<{ fingerprint: string; isNew: boolean; spike: boolean }> {
  const source = input.source === "client" ? "client" : "server";
  const message = scrubText(input.message) || "(no message)";
  const stack = scrubStack(input.stack);
  const route = scrubRoute(input.route);
  const release = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
  const fingerprint = fingerprintOf(source, message, stack);
  const db = payload.db.drizzle;
  const rows = (await db.execute(sql`
    INSERT INTO errors (fingerprint, source, message, stack, route, release, count, first_seen, last_seen, window_start, window_count, updated_at, created_at)
    VALUES (${fingerprint}, ${source}, ${message}, ${stack}, ${route}, ${release}, 1, now(), now(), now(), 1, now(), now())
    ON CONFLICT (fingerprint) DO UPDATE SET
      count = errors.count + 1,
      last_seen = now(),
      release = EXCLUDED.release,
      window_count = CASE WHEN errors.window_start IS NULL OR now() - errors.window_start > make_interval(mins => ${SPIKE_MINUTES}::int) THEN 1 ELSE errors.window_count + 1 END,
      window_start = CASE WHEN errors.window_start IS NULL OR now() - errors.window_start > make_interval(mins => ${SPIKE_MINUTES}::int) THEN now() ELSE errors.window_start END,
      updated_at = now()
    RETURNING id, (xmax = 0) AS inserted, window_count`)) as unknown as { rows: { id: number; inserted: boolean; window_count: number }[] };
  const row = rows.rows[0]!;
  const isNew = row.inserted;
  let spike = false;
  if (!isNew && row.window_count >= SPIKE_COUNT) {
    // Claim the alert for this window atomically so concurrent instances raise it once.
    const claim = (await db.execute(sql`UPDATE errors SET spike_alerted_at = now() WHERE id = ${row.id} AND (spike_alerted_at IS NULL OR spike_alerted_at < window_start) RETURNING id`)) as unknown as { rows: unknown[] };
    spike = claim.rows.length > 0;
  }
  if (isNew || spike) {
    const title = isNew ? `New error: ${message.slice(0, 80)}` : `Error spike: ${message.slice(0, 70)} (${row.window_count} in ${SPIKE_MINUTES} minutes)`;
    await logEvent(payload, undefined, { action: isNew ? "error.new-fingerprint" : "error.spike", target: `errors/${row.id}`, data: { fingerprint, source, route, release, windowCount: row.window_count } });
    await payload.create({
      collection: "decisions",
      overrideAccess: true,
      context: { system: true },
      data: {
        title,
        kind: "incident",
        status: "open",
        summary: `${source} error on ${route || "(unknown route)"}${release ? `, release ${release.slice(0, 7)}` : ""}: ${message}\nSee Errors in the console for the trimmed stack. Decide whether to roll back, unpublish a lesson, or note it and move on.`,
        target: `errors/${row.id}`,
        requestedBy: "system",
      },
    });
    await sendAlert(`${title} on ${route || "unknown route"}. Open the Creator Console, Overview.`);
  }
  return { fingerprint, isNew, spike };
}
