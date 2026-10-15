import type { CollectionConfig } from "payload";
import { creatorOnly } from "../access";

/**
 * Live classroom sessions (docs/03, decided 2026-10-15: Postgres with
 * Server-Sent Events; kept 30 days). Nothing personal is stored: no names, no
 * accounts, no device identifiers. A phone holds a random token for one
 * session so it can vote once per question; only a hash of it is stored.
 * Learners and teachers never reach these collections directly, only through
 * the classroom API, which checks the teacher's session key.
 */
export const ClassroomSessions: CollectionConfig = {
  slug: "classroom-sessions",
  admin: { useAsTitle: "code", defaultColumns: ["code", "lessonId", "locale", "createdAt", "expiresAt"], group: "Classroom" },
  access: { read: creatorOnly, create: () => false, update: () => false, delete: creatorOnly },
  fields: [
    { name: "code", type: "text", required: true, unique: true, index: true },
    { name: "lessonId", type: "text", required: true },
    { name: "locale", type: "text", required: true },
    { name: "hostKeyHash", type: "text", required: true, admin: { hidden: true } },
    { name: "blockId", type: "text", admin: { description: "The block on the shared screen." } },
    { name: "revision", type: "number", required: true, defaultValue: 0 },
    { name: "votingOpen", type: "checkbox", defaultValue: false },
    { name: "hands", type: "json", admin: { description: "Show-of-hands counts entered by the teacher, by block." } },
    { name: "endedAt", type: "date" },
    { name: "expiresAt", type: "date", required: true, index: true },
  ],
};

export const ClassroomVotes: CollectionConfig = {
  slug: "classroom-votes",
  admin: { group: "Classroom", defaultColumns: ["session", "blockId", "itemId", "choice", "createdAt"] },
  access: { read: creatorOnly, create: () => false, update: () => false, delete: creatorOnly },
  indexes: [{ fields: ["session", "blockId", "itemId", "participant"], unique: true }],
  fields: [
    { name: "session", type: "relationship", relationTo: "classroom-sessions", required: true, index: true },
    { name: "blockId", type: "text", required: true },
    { name: "itemId", type: "text", required: true, defaultValue: "" },
    { name: "choice", type: "text", required: true },
    { name: "participant", type: "text", required: true, admin: { description: "Hash of a random per-session token. Not linked to any person or device." } },
  ],
};
