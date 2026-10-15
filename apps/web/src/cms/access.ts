import type { Access, PayloadRequest } from "payload";
import permissions from "../../../../platform/config/permissions.json" with { type: "json" };

/**
 * Who may do what (docs/10, constitution Article 2). The creator may do
 * anything except bypass the always-ask gates; each agent may do only what
 * platform/config/permissions.json grants it; learners and the public may
 * read published content and nothing else.
 */
type AgentGrant = { read: string[]; write: string[]; actions: string[] };
const grants = permissions.agents as Record<string, AgentGrant>;

export type Actor = { kind: "creator"; id: string | number } | { kind: "agent"; id: string } | { kind: "reviewer"; id: string | number; locales: string[] } | { kind: "system" } | { kind: "public" };

export function actorOf(req: PayloadRequest): Actor {
  const u = req.user as { id: string | number; role?: string; agentId?: string; reviewerLocales?: unknown } | null | undefined;
  if (!u) return req.context?.system ? { kind: "system" } : { kind: "public" };
  if (u.role === "creator") return { kind: "creator", id: u.id };
  if (u.role === "reviewer") return { kind: "reviewer", id: u.id, locales: Array.isArray(u.reviewerLocales) ? (u.reviewerLocales as string[]) : [] };
  if (u.role === "agent" && u.agentId) return { kind: "agent", id: u.agentId };
  return { kind: "public" };
}

export const isCreator = (req: PayloadRequest) => actorOf(req).kind === "creator";

/** Whether an agent's grant covers a collection, optionally narrowed ("lessons:non-english-strings"). */
export function agentGrant(agentId: string, op: "read" | "write", collection: string): string[] {
  const g = grants[agentId];
  if (!g) return [];
  return g[op].filter((s) => s === "*" || s === collection || s.startsWith(`${collection}:`));
}

export const agentCan = (agentId: string, action: string) => grants[agentId]?.actions.includes(action) ?? false;

export const creatorOnly: Access = ({ req }) => isCreator(req);

/** Creator, or an agent whose grant covers this collection. */
export const staffRead =
  (collection: string): Access =>
  ({ req }) => {
    const a = actorOf(req);
    return a.kind === "creator" || (a.kind === "agent" && agentGrant(a.id, "read", collection).length > 0);
  };

export const staffWrite =
  (collection: string): Access =>
  ({ req }) => {
    const a = actorOf(req);
    return a.kind === "creator" || (a.kind === "agent" && agentGrant(a.id, "write", collection).length > 0);
  };

/** Learners see published versions only; staff see drafts too. */
export const publishedOrStaff =
  (collection: string): Access =>
  (args) => {
    if (staffRead(collection)(args)) return true;
    return { _status: { equals: "published" } };
  };

/** The creator signed in with their passkey within the last few minutes (required to publish). */
export function recentlyAuthenticated(req: PayloadRequest, minutes = 5): boolean {
  const authTime = (req.user as { authTime?: number } | null)?.authTime;
  return isCreator(req) && typeof authTime === "number" && Date.now() / 1000 - authTime < minutes * 60;
}
