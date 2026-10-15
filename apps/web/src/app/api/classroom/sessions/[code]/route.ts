import { cmsClient } from "@/cms/client";
import { findSession, publicState } from "@/classroom/server";

export const dynamic = "force-dynamic";

/** The session's public state: what is on screen and the anonymous vote counts. Polling fallback for SSE. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const payload = await cmsClient();
  const s = await findSession(payload, (await params).code);
  if (!s) return Response.json({ error: "No session with that code" }, { status: 404 });
  return Response.json(await publicState(payload, s), { headers: { "cache-control": "no-store" } });
}
