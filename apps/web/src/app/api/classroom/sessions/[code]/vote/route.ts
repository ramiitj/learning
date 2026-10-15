import { cmsClient } from "@/cms/client";
import { findSession, hash, updateSession } from "@/classroom/server";
import { rateLimited } from "@/classroom/rate-limit";

export const dynamic = "force-dynamic";

/**
 * A phone votes on what is on the shared screen. One vote per phone per
 * question; voting again changes the vote. The phone sends a random token it
 * made for this session; only a hash is stored, linked to nothing else.
 */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code;
  const body = (await req.json().catch(() => ({}))) as { token?: string; blockId?: string; itemId?: string; choice?: string };
  if (typeof body.token !== "string" || body.token.length < 16 || typeof body.choice !== "string" || body.choice.length > 200) return Response.json({ error: "Bad vote" }, { status: 400 });
  // Per phone and per class, never per address: a whole class often shares one school network address.
  if (rateLimited(req, "vote-phone", 30, 60, `${code}:${body.token}`) || rateLimited(req, "vote-class", 3000, 60, code)) return Response.json({ error: "Slow down" }, { status: 429 });
  const payload = await cmsClient();
  const s = await findSession(payload, code);
  if (!s) return Response.json({ error: "No session with that code" }, { status: 404 });
  if (s.endedAt || !s.votingOpen || body.blockId !== s.blockId || (body.itemId ?? "") !== (s.itemId ?? "")) return Response.json({ error: "Voting on this question has closed" }, { status: 409 });

  const participant = hash(`${s.code}:${body.token}`);
  const itemId = body.itemId ?? "";
  const existing = await payload.find({ collection: "classroom-votes", where: { and: [{ session: { equals: s.id } }, { blockId: { equals: s.blockId } }, { itemId: { equals: itemId } }, { participant: { equals: participant } }] }, limit: 1, depth: 0, overrideAccess: true });
  if (existing.docs[0]) {
    if (existing.docs[0].choice === body.choice) return Response.json({ ok: true });
    await payload.update({ collection: "classroom-votes", id: existing.docs[0].id, data: { choice: body.choice }, overrideAccess: true });
  } else {
    await payload.create({ collection: "classroom-votes", data: { session: Number(s.id), blockId: s.blockId!, itemId, choice: body.choice, participant }, overrideAccess: true });
  }
  await updateSession(payload, s, {});
  return Response.json({ ok: true });
}
