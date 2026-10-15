import type { Payload, PayloadRequest } from "payload";
import { getPayload } from "payload";
import config from "@payload-config";
import { logEvent } from "@/cms/events";
import { SESSION_COOKIE, readSession } from "@/auth/session";
import { cookie } from "@/auth/strategy";
import { appOriginOrNull } from "@/auth/origin";
import { remove, rename, summarise, type StoredPasskey } from "@/auth/passkeys";

export const dynamic = "force-dynamic";

/**
 * "Your passkeys" (console, /console/passkeys): the creator lists, renames and
 * removes their passkeys. Adding one goes through the passkey ceremony
 * (/api/auth/passkey/register-options), which needs a confirmation from the
 * last five minutes. Removing needs the same, and the last passkey can never
 * be removed. Every change and every refusal is logged. No key material
 * (credential id, public key, counter) ever leaves the server.
 *
 *   GET                       list
 *   PATCH  { id, name }       rename
 *   DELETE { id }             remove
 */
const fail = (status: number, error: string) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

interface Creator {
  id: string | number;
  role?: string;
  passkeys?: StoredPasskey[];
}

async function signedInCreator(req: Request, payload: Payload): Promise<{ creator: Creator; authTime: number } | null> {
  const session = await readSession(cookie(req.headers, SESSION_COOKIE));
  if (!session) return null;
  const user = (await payload.findByID({ collection: "users", id: session.userId, depth: 0, overrideAccess: true, showHiddenFields: true }).catch(() => null)) as Creator | null;
  return user?.role === "creator" ? { creator: user, authTime: session.authTime } : null;
}

/** Changes must be JSON from this site: a cross-site form post or a request from another origin is refused. */
function sameSite(req: Request): boolean {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return false;
  const from = req.headers.get("origin");
  return !from || from === appOriginOrNull();
}

const asReq = (payload: Payload, creator: Creator) => ({ payload, user: { ...creator, collection: "users" }, context: {} }) as unknown as PayloadRequest;

export async function GET(req: Request) {
  const payload = await getPayload({ config });
  const me = await signedInCreator(req, payload);
  if (!me) return fail(401, "Sign in with your passkey first.");
  return Response.json({ passkeys: summarise(me.creator.passkeys) }, { headers: { "cache-control": "no-store" } });
}

async function change(req: Request, kind: "rename" | "remove") {
  const payload = await getPayload({ config });
  const me = await signedInCreator(req, payload);
  if (!me) return fail(401, "Sign in with your passkey first.");
  if (!sameSite(req)) return fail(403, "Not allowed.");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const keys = me.creator.passkeys ?? [];
  const result = kind === "rename" ? rename(keys, body.id, body.name) : remove(keys, body.id, me.authTime);
  const r = asReq(payload, me.creator);
  const target = `users/${me.creator.id}`;
  if (!result.ok) {
    await logEvent(payload, r, { action: `auth.passkey-${kind === "rename" ? "rename" : "remove"}-refused`, target, reason: result.error });
    return fail(result.status, result.error);
  }
  await payload.update({ collection: "users", id: me.creator.id, data: { passkeys: result.passkeys } as never, overrideAccess: true, context: { system: true, reason: `passkey ${kind === "rename" ? "renamed" : "removed"} by the creator` } });
  await logEvent(payload, r, { action: kind === "rename" ? "auth.passkey-renamed" : "auth.passkey-removed", target, data: { name: result.name, remaining: result.passkeys.length } });
  return Response.json({ passkeys: summarise(result.passkeys) }, { headers: { "cache-control": "no-store" } });
}

export const PATCH = (req: Request) => change(req, "rename");
export const DELETE = (req: Request) => change(req, "remove");
