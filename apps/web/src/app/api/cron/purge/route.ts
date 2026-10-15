import { cmsClient } from "@/cms/client";
import { logEvent } from "@/cms/events";
import { purgeExpired } from "@/classroom/server";

export const dynamic = "force-dynamic";

/** Daily: delete classroom sessions older than 30 days. Called by the scheduler with CRON_SECRET. */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Forbidden", { status: 403 });
  const payload = await cmsClient();
  const n = await purgeExpired(payload);
  await logEvent(payload, undefined, { action: "retention.classroom-purge", data: { sessions: n } });
  return Response.json({ deleted: n });
}
