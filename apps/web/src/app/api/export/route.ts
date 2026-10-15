import { headers } from "next/headers";
import type { PayloadRequest } from "payload";
import { actorOf, recentlyAuthenticated } from "@/cms/access";
import { cmsClient } from "@/cms/client";
import { logEvent } from "@/cms/events";
import { exportStream } from "@/ops/export";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/export: a zip of everything, for the creator only, and only within
 * five minutes of a passkey confirmation (docs/10). Agents and OAuth tokens
 * never reach it: the session is the creator's passkey cookie.
 */
export async function GET() {
  const payload = await cmsClient();
  const { user } = await payload.auth({ headers: await headers() });
  const req = { payload, user, context: {} } as unknown as PayloadRequest;
  if (actorOf(req).kind !== "creator") return Response.json({ error: "Only the creator can export." }, { status: 403 });
  if (!recentlyAuthenticated(req)) {
    await logEvent(payload, req, { action: "export.refused", target: "export", reason: "passkey confirmation older than five minutes" });
    return Response.json({ error: "Confirm with your passkey first." }, { status: 403 });
  }
  const day = new Date().toISOString().slice(0, 10);
  return new Response(exportStream(payload, req), {
    headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="learning-magazine-export-${day}.zip"`, "cache-control": "no-store" },
  });
}
