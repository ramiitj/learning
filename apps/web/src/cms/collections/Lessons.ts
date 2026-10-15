import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeOperationHook, type CollectionConfig } from "payload";
import { actorOf, agentGrant, isCreator, publishedOrStaff, recentlyAuthenticated, staffWrite, creatorOnly } from "../access";
import { auditHooks } from "../events";
import { validateWithCms } from "../validation";
import { revalidateLesson } from "../revalidate";
import { catalogue as contracts } from "@lm/catalogue";

type LessonDoc = { id: string; strings?: Record<string, Record<string, string>>; stages?: unknown[]; meta?: { titleKey?: string } };

/**
 * An agent may only change what its grant covers. The Localisation
 * Specialist, for example, may change Hindi and Telugu strings and nothing
 * else; the Analogy Specialist only analogy blocks. Enforced here, at the
 * tool level, whatever the agent was told.
 */
const guardAgentScope: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const actor = actorOf(req);
  if (actor.kind !== "agent") return data;
  const scopes = agentGrant(actor.id, "write", "lessons");
  if (scopes.includes("lessons")) return data;
  const view = scopedView(scopes);
  if (canonical(view((originalDoc?.doc ?? {}) as LessonDoc)) !== canonical(view((data.doc ?? {}) as LessonDoc))) {
    throw new APIError(`${actor.id} may only change ${scopes.join(", ")}`, 403);
  }
  return data;
};

/** JSON with sorted keys: Postgres jsonb does not keep key order, so plain JSON.stringify would see changes that are not there. */
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v) ?? "null";
}

/** The part of a lesson an agent with these scopes may NOT change. */
function scopedView(scopes: string[]) {
  const nonEnglish = scopes.includes("lessons:non-english-strings");
  const analogies = scopes.includes("lessons:analogy-blocks");
  return (d: LessonDoc) => {
    const blocks = (d.stages ?? []).flatMap((s) => (s as { blocks: { type: string; config: Record<string, unknown> }[] }).blocks);
    const analogyBlocks = blocks.filter((b) => b.type === "analogy");
    const analogyKeys = new Set(analogyBlocks.flatMap((b) => contracts.find((c) => c.type === "analogy")?.stringKeys(b.config) ?? []));
    const strings = Object.fromEntries(
      Object.entries(d.strings ?? {})
        .filter(([locale]) => !(nonEnglish && locale !== "en"))
        .map(([locale, t]) => [locale, analogies ? Object.fromEntries(Object.entries(t).filter(([k]) => !analogyKeys.has(k))) : t]),
    );
    const stages = analogies ? (d.stages ?? []).map((s) => ({ ...(s as object), blocks: (s as { blocks: { type: string }[] }).blocks.map((b) => (b.type === "analogy" ? { type: "analogy" } : b)) })) : d.stages;
    return { ...d, strings, stages };
  };
}

/**
 * Only a human reviewer marks a locale as reviewed (docs/07): agents, the
 * import, and the connector cannot. The translation review view sets it,
 * per locale, once every string has a current approval.
 */
const onlyHumansReview: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const before = ((originalDoc?.doc ?? {}) as { localeStatus?: Record<string, string> }).localeStatus ?? {};
  const after = ((data.doc ?? {}) as { localeStatus?: Record<string, string> }).localeStatus ?? {};
  const newlyReviewed = Object.entries(after).filter(([l, s]) => s === "reviewed" && before[l] !== "reviewed").map(([l]) => l);
  if (newlyReviewed.length && !req.context?.translationReview && actorOf(req).kind !== "creator") {
    throw new APIError(`Only a native-speaker reviewer can mark ${newlyReviewed.join(", ")} as reviewed.`, 403);
  }
  return data;
};

/** Every save is validated; the report is stored with the draft and returned to whoever saved. */
const runValidation: CollectionBeforeChangeHook = async ({ data, req }) => {
  const report = await validateWithCms(req.payload, data.doc);
  data.validation = report;
  data.lessonId ??= (data.doc as LessonDoc | undefined)?.id;
  const titleKey = (data.doc as LessonDoc | undefined)?.meta?.titleKey;
  data.title = (titleKey && (data.doc as LessonDoc).strings?.en?.[titleKey]) || data.lessonId;
  return data;
};

/**
 * Publishing is always-ask (docs/10): only the creator, signed in with their
 * passkey in the last five minutes, may publish, and only a lesson that
 * passes validation. There is no other path to a published lesson.
 */
const publishGate: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const publishing = data._status === "published" && (originalDoc?._status !== "published" || JSON.stringify(originalDoc?.doc) !== JSON.stringify(data.doc));
  if (!publishing) return data;
  // Server-side code the creator runs themselves (the repository import with PUBLISH=1) carries the system context.
  if (!req.context?.system && !recentlyAuthenticated(req)) throw new APIError("Publishing needs the creator to confirm with their passkey first.", 403);
  if (!(data.validation as { passed?: boolean } | undefined)?.passed) throw new APIError("This lesson has validation errors and cannot be published.", 400);
  return data;
};

/**
 * Unpublishing (a non-draft save that sets the status back to draft) takes a
 * lesson away from learners, so only the creator, or server code the creator
 * runs, may do it. Agents' saves are drafts beside the published version.
 */
const unpublishGate: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== "update" && operation !== "updateByID") return args;
  const status = (args.data as { _status?: string } | undefined)?._status;
  if (status === "draft" && !args.draft && !req.context?.system && !isCreator(req)) throw new APIError("Only the creator can unpublish a lesson.", 403);
  return args;
};

export const Lessons: CollectionConfig = {
  slug: "lessons",
  admin: { useAsTitle: "title", defaultColumns: ["title", "lessonId", "_status", "updatedAt"], group: "Content" },
  versions: { drafts: true, maxPerDoc: 200 },
  access: {
    read: publishedOrStaff("lessons"),
    create: staffWrite("lessons"),
    update: staffWrite("lessons"),
    delete: creatorOnly,
  },
  hooks: {
    beforeOperation: [unpublishGate],
    beforeChange: [guardAgentScope, onlyHumansReview, runValidation, publishGate],
    afterChange: [...auditHooks("lessons").afterChange, async ({ doc }) => (revalidateLesson((doc as { lessonId: string }).lessonId), doc)],
    afterDelete: auditHooks("lessons").afterDelete,
  },
  fields: [
    { name: "lessonId", type: "text", required: true, unique: true, index: true, admin: { description: "Lowercase letters, digits and hyphens; used in the URL." }, validate: (v: unknown) => (typeof v === "string" && /^[a-z0-9-]+$/.test(v)) || "Use lowercase letters, digits and hyphens" },
    { name: "title", type: "text", admin: { readOnly: true } },
    { name: "doc", type: "json", required: true, admin: { description: "The lesson document (schemas/lesson.schema.json). Content is data: no code." } },
    { name: "validation", type: "json", admin: { readOnly: true, description: "Validation report from the last save." } },
    { name: "reviews", type: "json", admin: { readOnly: true, description: "Native-speaker approvals, per locale and string: who approved which exact text, and when." } },
  ],
};
