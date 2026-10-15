import type { CollectionConfig } from "payload";
import { creatorOnly } from "../access";
import { auditHooks } from "../events";

/**
 * The creator's notes from usability sessions, teacher reports and reviews
 * (Phase 6 pilot). Feeds the pilot report. No personal data: the text is
 * scrubbed of contact details, and the description warns against names.
 */
export const UsabilityFindings: CollectionConfig = {
  slug: "usability-findings",
  admin: {
    useAsTitle: "observed",
    group: "Oversight",
    defaultColumns: ["observed", "lesson", "locale", "severity", "status", "source"],
    description: "What was seen in a usability session or reported by a teacher. Describe what happened, never who: do not record names, schools or anything that identifies a learner.",
  },
  access: { read: creatorOnly, create: creatorOnly, update: creatorOnly, delete: creatorOnly },
  hooks: {
    ...auditHooks("usability-findings"),
    beforeChange: [
      ({ data }) => {
        for (const f of ["observed", "suggestedChange"] as const) if (typeof data[f] === "string") data[f] = data[f].replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email removed]").replace(/\+?\d[\d\s-]{7,}\d/g, "[number removed]").slice(0, 2000);
        return data;
      },
    ],
  },
  fields: [
    { name: "lesson", type: "text", index: true, admin: { description: "Lesson id. Leave empty for a platform-wide finding." } },
    { name: "locale", type: "select", options: ["en", "hi", "te"] },
    { name: "mode", type: "select", options: ["personal", "classroom"] },
    { name: "observed", type: "textarea", required: true, admin: { description: "What was observed. No names or other personal data." } },
    { name: "severity", type: "select", required: true, defaultValue: "minor", index: true, options: ["blocker", "major", "minor"] },
    { name: "source", type: "select", required: true, options: [{ label: "Usability session", value: "usability-session" }, { label: "Teacher report", value: "teacher-report" }, { label: "Analytics", value: "analytics" }, { label: "Review", value: "review" }] },
    { name: "suggestedChange", type: "textarea" },
    { name: "status", type: "select", required: true, defaultValue: "open", index: true, options: ["open", "planned", "fixed", "wont-fix"] },
  ],
};
