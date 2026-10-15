import type { Payload } from "payload";

/**
 * Rules for the creator's passkeys (docs/10: passkey or hardware-key sign-in,
 * re-authentication for high-impact actions). Kept apart from the route so
 * they can be tested directly.
 */
export interface StoredPasskey {
  /** Payload's array row id: an opaque handle, not key material. */
  id?: string | null;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: unknown;
  label?: string | null;
  addedAt?: string | null;
  lastUsedAt?: string | null;
}

/** What the console may see of a passkey: never the credential id or public key. */
export interface PasskeySummary {
  id: string;
  name: string;
  createdAt: string | null;
  lastUsedAt: string | null;
}

/** Adding or removing a passkey needs a passkey confirmation this recent (the same window as publishing). */
export const FRESH_SECONDS = 300;
export const isFresh = (authTime: number | undefined, now = Date.now() / 1000) => typeof authTime === "number" && now - authTime >= 0 && now - authTime < FRESH_SECONDS;

export const NAME_MAX = 60;
/** A passkey name: trimmed, control characters removed, 1 to 60 characters. Returns null if nothing usable is left. */
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  // Control and format characters (zero-width, bidi overrides) are removed so a name cannot disguise itself.
  const s = raw.replace(/\s+/g, " ").replace(/[\p{Cc}\p{Cf}]/gu, "").trim();
  return s ? [...s].slice(0, NAME_MAX).join("") : null;
}

export function summarise(keys: StoredPasskey[] | null | undefined): PasskeySummary[] {
  return (keys ?? []).map((k, i) => ({ id: String(k.id ?? `#${i}`), name: k.label || "Passkey", createdAt: k.addedAt ?? null, lastUsedAt: k.lastUsedAt ?? null }));
}

export type Change = { ok: true; passkeys: StoredPasskey[]; name: string } | { ok: false; status: number; error: string };

export function rename(keys: StoredPasskey[], id: unknown, rawName: unknown): Change {
  const name = cleanName(rawName);
  if (!name) return { ok: false, status: 400, error: `Give the passkey a name (up to ${NAME_MAX} characters).` };
  const i = keys.findIndex((k) => String(k.id) === String(id));
  if (i < 0) return { ok: false, status: 404, error: "That passkey was not found." };
  return { ok: true, name, passkeys: keys.map((k, j) => (j === i ? { ...k, label: name } : k)) };
}

/** Removing needs a fresh confirmation, and the last passkey can never be removed (that would lock the creator out). */
export function remove(keys: StoredPasskey[], id: unknown, authTime: number | undefined, now = Date.now() / 1000): Change {
  if (!isFresh(authTime, now)) return { ok: false, status: 403, error: "Removing a passkey is a sensitive action: confirm with your passkey first, then try again within five minutes." };
  const i = keys.findIndex((k) => String(k.id) === String(id));
  if (i < 0) return { ok: false, status: 404, error: "That passkey was not found." };
  if (keys.length <= 1) return { ok: false, status: 409, error: "This is your only passkey. Add another one before removing it, so you cannot be locked out." };
  return { ok: true, name: keys[i]!.label || "Passkey", passkeys: keys.filter((_, j) => j !== i) };
}

/**
 * Whether the one-time creator setup is closed for good. It closes as soon as
 * a creator account exists, and stays closed even if that account were
 * deleted, because the append-only event log still records
 * `auth.creator-created`. CREATOR_SETUP_TOKEN in the environment makes no
 * difference once this is true.
 */
export async function setupClosed(payload: Payload): Promise<boolean> {
  const creators = await payload.count({ collection: "users", where: { role: { equals: "creator" } }, overrideAccess: true });
  if (creators.totalDocs > 0) return true;
  const created = await payload.count({ collection: "events", where: { action: { equals: "auth.creator-created" } }, overrideAccess: true });
  return created.totalDocs > 0;
}
