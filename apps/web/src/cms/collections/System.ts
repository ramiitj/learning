import type { CollectionConfig } from "payload";
import { creatorOnly, isCreator, staffRead } from "../access";
import { auditHooks } from "../events";

/** Append-only. The database refuses UPDATE and DELETE on this table (payload.config.ts onInit). */
export const Events: CollectionConfig = {
  slug: "events",
  admin: { useAsTitle: "action", defaultColumns: ["createdAt", "actorKind", "actorId", "action", "target"], group: "Oversight", description: "Audit log: every agent and human action. Nothing here can be edited or deleted." },
  access: { read: creatorOnly, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: "actorKind", type: "select", required: true, options: ["creator", "agent", "system", "public", "reviewer"], index: true },
    { name: "actorId", type: "text", required: true, index: true },
    { name: "action", type: "text", required: true, index: true },
    { name: "target", type: "text", index: true },
    { name: "reason", type: "textarea" },
    { name: "data", type: "json" },
  ],
};

/**
 * The creator's decision queue (docs/10): publishes, conflicts the priority
 * order does not settle, new components and agents, permission changes and
 * amendments. Each item states both positions; overriding a reviewer shows
 * the dissent first and records the creator's reason.
 */
export const Decisions: CollectionConfig = {
  slug: "decisions",
  admin: { useAsTitle: "title", defaultColumns: ["title", "kind", "status", "createdAt"], group: "Oversight" },
  access: { read: staffRead("decisions"), create: ({ req }) => !!req.user, update: creatorOnly, delete: () => false },
  hooks: {
    ...auditHooks("decisions"),
    beforeChange: [
      ({ data, originalDoc, req }) => {
        // Only the creator decides; deciding needs a reason, and an override needs the dissent acknowledged.
        if (originalDoc && data.status && data.status !== originalDoc.status) {
          if (!isCreator(req)) throw new Error("Only the creator decides.");
          if (!data.decisionReason?.trim()) throw new Error("Record a short reason for the decision.");
          if (originalDoc.dissent && !data.dissentAcknowledged) throw new Error("Read the dissenting agent's reasoning before overriding.");
          data.decidedAt = new Date().toISOString();
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "kind", type: "select", required: true, options: ["publish", "conflict", "new-component", "new-agent", "permission-change", "amendment", "schema-change", "learner-data", "budget", "other"], index: true },
    { name: "status", type: "select", required: true, defaultValue: "open", options: ["open", "approved", "rejected", "withdrawn"], index: true },
    { name: "summary", type: "textarea", required: true },
    { name: "positions", type: "json", admin: { description: "Both positions, each with the agent and the priority it serves." } },
    { name: "options", type: "json", admin: { description: "At most three options." } },
    { name: "target", type: "text", admin: { description: "What the decision is about, e.g. lessons/12." } },
    { name: "requestedBy", type: "text" },
    { name: "dissent", type: "textarea", admin: { description: "A reviewer's reasoning that approving would override." } },
    { name: "dissentAcknowledged", type: "checkbox" },
    { name: "decisionReason", type: "textarea" },
    { name: "decidedAt", type: "date", admin: { readOnly: true } },
  ],
};

export const PipelineRuns: CollectionConfig = {
  slug: "pipeline-runs",
  admin: { useAsTitle: "title", defaultColumns: ["title", "stage", "status", "costUsd", "updatedAt"], group: "Oversight", description: "Every lesson in progress, its stage, the agent working on it, and its cost so far." },
  access: { read: staffRead("pipeline-runs"), create: ({ req }) => !!req.user, update: ({ req }) => !!req.user, delete: () => false },
  hooks: auditHooks("pipeline-runs"),
  fields: [
    { name: "title", type: "text", required: true },
    { name: "request", type: "textarea", required: true },
    { name: "lesson", type: "relationship", relationTo: "lessons" },
    { name: "stage", type: "select", required: true, defaultValue: "plan", options: ["plan", "draft", "enrich", "localise", "review", "revise", "validate", "teacher-guide", "creator-preview", "done", "paused", "failed"] },
    { name: "currentAgent", type: "text" },
    { name: "status", type: "select", required: true, defaultValue: "queued", options: ["queued", "running", "waiting-for-creator", "done", "failed", "paused"] },
    { name: "costUsd", type: "number", defaultValue: 0 },
    { name: "usage", type: "json" },
    { name: "steps", type: "json", admin: { description: "Each agent step: input, output, violations, attempts, usage." } },
    { name: "flags", type: "json", admin: { description: "Reviewer flags and how each was resolved or escalated." } },
  ],
};

export const Agents: CollectionConfig = {
  slug: "agents",
  admin: { useAsTitle: "agentId", defaultColumns: ["agentId", "enabled", "tier", "benchmark"], group: "Platform", description: "The agent registry: profiles and permissions live in platform/; switching an agent off takes effect immediately." },
  access: { read: staffRead("agents"), create: creatorOnly, update: creatorOnly, delete: () => false },
  hooks: auditHooks("agents"),
  fields: [
    { name: "agentId", type: "text", required: true, unique: true },
    { name: "enabled", type: "checkbox", defaultValue: true },
    { name: "tier", type: "text", admin: { readOnly: true } },
    { name: "benchmark", type: "json", admin: { readOnly: true, description: "Latest scorecard from benchmarks/." } },
    { name: "costUsd", type: "number", defaultValue: 0, admin: { readOnly: true } },
  ],
};

export const Feedback: CollectionConfig = {
  slug: "feedback",
  admin: { useAsTitle: "summary", group: "Oversight", description: "Reports from learners and teachers. No personal data is collected." },
  access: { read: creatorOnly, create: () => true, update: creatorOnly, delete: creatorOnly },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Anyone may report; strip anything that looks like contact details before it is stored.
        if (operation === "create" && typeof data.message === "string") {
          data.message = data.message.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email removed]").replace(/\+?\d[\d\s-]{7,}\d/g, "[number removed]").slice(0, 2000);
          data.summary = data.message.slice(0, 80);
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "summary", type: "text", admin: { readOnly: true } },
    { name: "message", type: "textarea", required: true },
    { name: "lessonId", type: "text" },
    { name: "locale", type: "text" },
    { name: "role", type: "select", options: ["learner", "teacher", "other"] },
    { name: "status", type: "select", defaultValue: "new", options: ["new", "triaged", "fixed", "wont-fix"], access: { create: () => false } },
  ],
};
