import { APIError, type CollectionBeforeChangeHook, type CollectionConfig } from "payload";
import { actorOf, agentGrant, publishedOrStaff, recentlyAuthenticated, staffWrite, creatorOnly } from "../access";
import { auditHooks } from "../events";
import { validateWithCms } from "../validation";
import { revalidateLesson } from "../revalidate";
import { contracts } from "@lm/primitives/contracts";

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
  if (JSON.stringify(view((originalDoc?.doc ?? {}) as LessonDoc)) !== JSON.stringify(view((data.doc ?? {}) as LessonDoc))) {
    throw new APIError(`${actor.id} may only change ${scopes.join(", ")}`, 403);
  }
  return data;
};

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
  if (!recentlyAuthenticated(req)) throw new APIError("Publishing needs the creator to confirm with their passkey first.", 403);
  if (!(data.validation as { passed?: boolean } | undefined)?.passed) throw new APIError("This lesson has validation errors and cannot be published.", 400);
  return data;
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
    beforeChange: [guardAgentScope, runValidation, publishGate],
    afterChange: [...auditHooks("lessons").afterChange, async ({ doc }) => (revalidateLesson((doc as { lessonId: string }).lessonId), doc)],
    afterDelete: auditHooks("lessons").afterDelete,
  },
  fields: [
    { name: "lessonId", type: "text", required: true, unique: true, index: true, admin: { description: "Lowercase letters, digits and hyphens; used in the URL." }, validate: (v: unknown) => (typeof v === "string" && /^[a-z0-9-]+$/.test(v)) || "Use lowercase letters, digits and hyphens" },
    { name: "title", type: "text", admin: { readOnly: true } },
    { name: "doc", type: "json", required: true, admin: { description: "The lesson document (schemas/lesson.schema.json). Content is data: no code." } },
    { name: "validation", type: "json", admin: { readOnly: true, description: "Validation report from the last save." } },
  ],
};
