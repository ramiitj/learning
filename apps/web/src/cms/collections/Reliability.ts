import type { CollectionConfig } from "payload";
import { creatorOnly } from "../access";
import { auditHooks } from "../events";

/**
 * Self-hosted error monitoring (docs/12). One row per fingerprint, written by
 * src/ops/errors.ts; nobody edits rows, and the creator may clear them.
 * Messages are scrubbed of emails and numbers and never hold learner input.
 */
export const Errors: CollectionConfig = {
  slug: "errors",
  admin: { useAsTitle: "message", defaultColumns: ["message", "source", "count", "lastSeen", "release"], group: "Oversight", description: "Errors from the site, grouped by fingerprint. No learner data is recorded." },
  access: { read: creatorOnly, create: () => false, update: () => false, delete: creatorOnly },
  hooks: { afterDelete: auditHooks("errors").afterDelete },
  fields: [
    { name: "fingerprint", type: "text", required: true, unique: true, index: true },
    { name: "source", type: "select", required: true, options: ["server", "client"] },
    { name: "message", type: "text", required: true },
    { name: "stack", type: "textarea" },
    { name: "route", type: "text" },
    { name: "release", type: "text", admin: { description: "VERCEL_GIT_COMMIT_SHA of the deployment that saw it last." } },
    { name: "count", type: "number", required: true, defaultValue: 1 },
    { name: "firstSeen", type: "date", required: true },
    { name: "lastSeen", type: "date", required: true, index: true },
    { name: "windowStart", type: "date", admin: { description: "Start of the current 10-minute spike window." } },
    { name: "windowCount", type: "number", defaultValue: 0 },
    { name: "spikeAlertedAt", type: "date" },
  ],
};

/**
 * A problem with a lesson or the platform (docs/11): what happened, the
 * cause, the step that prevents it happening again, and, for serious ones,
 * when the pilot schools were told (due within 48 hours).
 */
export const Incidents: CollectionConfig = {
  slug: "incidents",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "severity", "status", "schoolsInformedAt", "createdAt"],
    group: "Oversight",
    description: "Every incident gets a short review. Serious ones (safety, privacy, significant factual error): inform affected pilot schools within 48 hours.",
    components: { beforeListTable: ["/cms/components/IncidentWarning#IncidentWarning"] },
  },
  access: { read: creatorOnly, create: creatorOnly, update: creatorOnly, delete: () => false },
  hooks: auditHooks("incidents"),
  fields: [
    { name: "title", type: "text", required: true },
    { name: "severity", type: "select", required: true, defaultValue: "minor", options: ["minor", "serious"], index: true },
    { name: "status", type: "select", required: true, defaultValue: "open", options: ["open", "mitigated", "reviewed", "closed"], index: true },
    { name: "lessonIds", type: "text", hasMany: true, admin: { description: "Lessons affected (lesson ids)." } },
    { name: "feedback", type: "relationship", relationTo: "feedback", hasMany: true },
    { name: "whatHappened", type: "textarea", required: true },
    { name: "cause", type: "textarea" },
    { name: "preventionStep", type: "textarea" },
    { name: "schoolsInformedAt", type: "date", admin: { description: "When affected pilot schools were told. Required within 48 hours of the incident for serious ones." } },
  ],
};
