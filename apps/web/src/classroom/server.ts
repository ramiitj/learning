import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

/**
 * Live classroom sessions (Phase 2). Postgres holds the state; screens learn
 * of changes through Server-Sent Events (decided 2026-10-15). Nothing
 * personal is stored. Sessions and their votes are deleted after 30 days.
 */
export const RETENTION_DAYS = 30;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L: codes are read off a projector
export const hash = (s: string) => createHash("sha256").update(s).digest("base64url");

export function newCode(): string {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}
export const normaliseCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

export interface PublicState {
  code: string;
  lessonId: string;
  locale: string;
  blockId: string | null;
  itemId: string | null;
  votingOpen: boolean;
  revision: number;
  ended: boolean;
  /** Phone votes for every block so far: block, then item ("" for whole-block votes), then option. Counts only. */
  votes: Record<string, Record<string, Record<string, number>>>;
  voters: number;
}

type SessionDoc = { id: number | string; code: string; lessonId: string; locale: string; hostKeyHash: string; blockId?: string | null; itemId?: string | null; revision: number; votingOpen?: boolean | null; hands?: unknown; endedAt?: string | null; expiresAt: string };

export async function findSession(payload: Payload, code: string): Promise<SessionDoc | null> {
  const { docs } = await payload.find({ collection: "classroom-sessions", where: { code: { equals: normaliseCode(code) } }, limit: 1, depth: 0, overrideAccess: true });
  const s = docs[0] as SessionDoc | undefined;
  if (!s || new Date(s.expiresAt) < new Date()) return null;
  return s;
}

export async function createSession(payload: Payload, lessonId: string, locale: string) {
  const hostKey = randomBytes(24).toString("base64url");
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    try {
      await payload.create({
        collection: "classroom-sessions",
        data: { code, lessonId, locale, hostKeyHash: hash(hostKey), revision: 0, votingOpen: false, expiresAt: new Date(Date.now() + RETENTION_DAYS * 86400_000).toISOString() },
        overrideAccess: true,
      });
      return { code, hostKey };
    } catch {
      // code collision: try another
    }
  }
  throw new Error("Could not create a session code");
}

export function hostKeyOk(s: SessionDoc, key: unknown): boolean {
  if (typeof key !== "string") return false;
  const a = Buffer.from(hash(key));
  const b = Buffer.from(s.hostKeyHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Changes only the given columns and bumps the revision, in one statement, so
 * concurrent votes and teacher actions never overwrite each other (a
 * read-then-write update would put back a stale question).
 */
export async function updateSession(payload: Payload, s: SessionDoc, data: { blockId?: string | null; itemId?: string | null; votingOpen?: boolean; endedAt?: string }) {
  const sets = [sql`revision = revision + 1`, sql`updated_at = now()`];
  if ("blockId" in data) sets.push(sql`block_id = ${data.blockId ?? null}`);
  if ("itemId" in data) sets.push(sql`item_id = ${data.itemId ?? null}`);
  if ("votingOpen" in data) sets.push(sql`voting_open = ${!!data.votingOpen}`);
  if ("endedAt" in data) sets.push(sql`ended_at = ${data.endedAt ?? null}`);
  await payload.db.drizzle.execute(sql`UPDATE classroom_sessions SET ${sql.join(sets, sql`, `)} WHERE id = ${s.id}`);
}

export async function publicState(payload: Payload, s: SessionDoc): Promise<PublicState> {
  const votes: PublicState["votes"] = {};
  const voters = new Set<string>();
  const { docs } = await payload.find({ collection: "classroom-votes", where: { session: { equals: s.id } }, limit: 20_000, depth: 0, overrideAccess: true, pagination: false, select: { blockId: true, itemId: true, choice: true, participant: true } });
  for (const v of docs) {
    const item = ((votes[v.blockId] ??= {})[v.itemId ?? ""] ??= {});
    item[v.choice] = (item[v.choice] ?? 0) + 1;
    voters.add(v.participant);
  }
  return { code: s.code, lessonId: s.lessonId, locale: s.locale, blockId: s.blockId ?? null, itemId: s.itemId ?? null, votingOpen: !!s.votingOpen, revision: s.revision, ended: !!s.endedAt, votes, voters: voters.size };
}

/** Deletes sessions (and their votes) past the retention period. Run daily by the scheduler. */
export async function purgeExpired(payload: Payload): Promise<number> {
  const now = new Date().toISOString();
  const { docs } = await payload.find({ collection: "classroom-sessions", where: { expiresAt: { less_than: now } }, limit: 1000, depth: 0, overrideAccess: true });
  for (const s of docs) {
    await payload.delete({ collection: "classroom-votes", where: { session: { equals: s.id } }, overrideAccess: true });
    await payload.delete({ collection: "classroom-sessions", id: s.id, overrideAccess: true });
  }
  return docs.length;
}
