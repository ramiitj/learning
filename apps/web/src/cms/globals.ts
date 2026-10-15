import { APIError, type GlobalBeforeChangeHook, type GlobalConfig } from "payload";
import { creatorOnly, recentlyAuthenticated, staffRead } from "./access";
import { logEvent } from "./events";

/** Amending the constitution or autonomy settings is always-ask: a fresh passkey confirmation is required. */
const requirePasskey: GlobalBeforeChangeHook = ({ data, req }) => {
  if (!req.context?.system && !recentlyAuthenticated(req)) throw new APIError("Confirm with your passkey first.", 403);
  return data;
};

export const Constitution: GlobalConfig = {
  slug: "constitution",
  admin: { group: "Platform", description: "Only the creator amends the constitution. Each amendment is versioned, dated, logged, and triggers a benchmark run (docs/02, docs/09)." },
  versions: { max: 500 },
  access: { read: staffRead("constitution"), update: creatorOnly },
  hooks: { beforeChange: [requirePasskey], afterChange: [async ({ doc, req }) => (await logEvent(req.payload, req, { action: "constitution.amend", target: "constitution", reason: doc.amendmentReason }), doc)] },
  fields: [
    { name: "text", type: "textarea", required: true, admin: { rows: 40 } },
    { name: "amendmentReason", type: "text", required: true },
  ],
};

export const Autonomy: GlobalConfig = {
  slug: "autonomy",
  admin: { group: "Platform", description: "Which actions always ask, act and notify, or run autonomously (platform/config/autonomy.json)." },
  versions: { max: 200 },
  access: { read: staffRead("autonomy"), update: creatorOnly },
  hooks: { beforeChange: [requirePasskey], afterChange: [async ({ req, doc }) => (await logEvent(req.payload, req, { action: "autonomy.change", target: "autonomy" }), doc)] },
  fields: [{ name: "settings", type: "json", required: true }],
};

export const Budget: GlobalConfig = {
  slug: "budget",
  admin: { group: "Oversight", description: "Monthly limit for model spend. The orchestrator pauses non-urgent work and alerts you at the alert level." },
  access: { read: staffRead("budget"), update: creatorOnly },
  hooks: { afterChange: [async ({ req, doc }) => (await logEvent(req.payload, req, { action: "budget.change", target: "budget", data: { monthlyLimitUsd: doc.monthlyLimitUsd } }), doc)] },
  fields: [
    { name: "monthlyLimitUsd", type: "number", required: true, defaultValue: 200 },
    { name: "alertAt", type: "number", required: true, defaultValue: 0.8, min: 0.1, max: 1 },
  ],
};
