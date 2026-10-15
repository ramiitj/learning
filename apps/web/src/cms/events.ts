import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload, PayloadRequest } from "payload";
import { actorOf } from "./access";

export interface EventInput {
  action: string;
  target?: string;
  reason?: string;
  data?: unknown;
}

/**
 * Every agent action and every creator action goes to the append-only event
 * log (CLAUDE.md). The table also refuses UPDATE and DELETE at the database
 * level (see onInit in payload.config.ts), so not even the creator can
 * rewrite history.
 */
export async function logEvent(payload: Payload, req: PayloadRequest | undefined, e: EventInput) {
  const actor = req ? actorOf(req) : { kind: "system" as const };
  await payload.create({
    collection: "events",
    overrideAccess: true,
    req: req ? { ...req, context: { ...req.context, eventLog: true } } : undefined,
    data: {
      actorKind: actor.kind,
      actorId: "id" in actor ? String(actor.id) : actor.kind,
      action: e.action,
      target: e.target ?? "",
      reason: e.reason ?? "",
      data: (e.data ?? null) as Record<string, unknown>,
    },
  });
}

/** Hooks that log every change to a collection. */
export function auditHooks(collection: string): { afterChange: CollectionAfterChangeHook[]; afterDelete: CollectionAfterDeleteHook[] } {
  return {
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const status = (doc as { _status?: string })._status;
        const wasStatus = (previousDoc as { _status?: string } | undefined)?._status;
        const action = operation === "create" ? "create" : status === "published" && wasStatus !== "published" ? "publish" : status === "draft" && wasStatus === "published" ? "unpublish" : "update";
        await logEvent(req.payload, req, { action: `${collection}.${action}`, target: `${collection}/${doc.id}`, reason: (req.context?.reason as string) ?? "", data: { status } });
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await logEvent(req.payload, req, { action: `${collection}.delete`, target: `${collection}/${doc.id}`, reason: (req.context?.reason as string) ?? "" });
        return doc;
      },
    ],
  };
}
