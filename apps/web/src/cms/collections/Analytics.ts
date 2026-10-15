import type { CollectionConfig } from "payload";
import { creatorOnly } from "../access";

/**
 * Anonymous daily totals (docs/11, docs/12). One row per day, lesson, locale,
 * mode, metric and key, holding only a count: no identifier, no time of day,
 * no address. Rows can never be linked to a learner or to each other.
 */
export const AnalyticsDaily: CollectionConfig = {
  slug: "analytics-daily",
  admin: { group: "Oversight", defaultColumns: ["day", "lessonId", "locale", "mode", "metric", "key", "count"], description: "Anonymous daily counts. See the Analytics view for the report." },
  access: { read: creatorOnly, create: () => false, update: () => false, delete: creatorOnly },
  indexes: [{ fields: ["day", "lessonId", "locale", "mode", "metric", "key"], unique: true }],
  fields: [
    { name: "day", type: "text", required: true, index: true },
    { name: "lessonId", type: "text", required: true, index: true },
    { name: "locale", type: "text", required: true },
    { name: "mode", type: "text", required: true },
    { name: "metric", type: "text", required: true },
    { name: "key", type: "text", required: true, defaultValue: "" },
    { name: "count", type: "number", required: true, defaultValue: 0 },
  ],
};
