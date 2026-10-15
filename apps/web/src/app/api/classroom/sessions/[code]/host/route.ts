import { cmsClient } from "@/cms/client";
import { findSession, hostKeyOk, updateSession } from "@/classroom/server";

export const dynamic = "force-dynamic";

type Body = { hostKey?: string; action?: "show" | "open" | "close" | "end"; blockId?: string | null; itemId?: string | null };

/** The teacher's screen (or a phone used as a remote) controls what is on screen and when voting is open. */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const payload = await cmsClient();
  const s = await findSession(payload, (await params).code);
  if (!s) return Response.json({ error: "No session with that code" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!hostKeyOk(s, body.hostKey)) return Response.json({ error: "Only the teacher's screen can do that" }, { status: 403 });
  switch (body.action) {
    case "show":
      if (s.blockId === (body.blockId ?? null) && (s.itemId ?? null) === (body.itemId ?? null)) return Response.json({ ok: true });
      await updateSession(payload, s, { blockId: body.blockId ?? null, itemId: body.itemId ?? null, votingOpen: !!body.blockId });
      break;
    case "open":
      await updateSession(payload, s, { votingOpen: true });
      break;
    case "close":
      await updateSession(payload, s, { votingOpen: false });
      break;
    case "end":
      await updateSession(payload, s, { votingOpen: false, endedAt: new Date().toISOString() });
      break;
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
