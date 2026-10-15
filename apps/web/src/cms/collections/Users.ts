import type { CollectionConfig } from "payload";
import { creatorOnly, isCreator } from "../access";
import { auditHooks } from "../events";
import { passkeyStrategy } from "../../auth/strategy";

/**
 * People and agents. The creator signs in with a passkey only (decided
 * 2026-10-15): no passwords exist. Agents are users with role "agent"; they
 * never sign in, and the orchestrator acts as them so every permission check
 * applies to agents exactly as to people.
 */
export const Users: CollectionConfig = {
  slug: "users",
  admin: { useAsTitle: "name", group: "Access", defaultColumns: ["name", "role", "agentId"] },
  auth: { disableLocalStrategy: true, strategies: [passkeyStrategy] },
  access: {
    read: ({ req }) => isCreator(req) || (req.user ? { id: { equals: req.user.id } } : false),
    create: creatorOnly,
    update: creatorOnly,
    delete: creatorOnly,
    admin: ({ req }) => isCreator(req),
  },
  hooks: auditHooks("users"),
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email" },
    { name: "role", type: "select", required: true, defaultValue: "agent", options: ["creator", "agent", "reviewer"], access: { update: () => false } },
    { name: "agentId", type: "text", index: true, admin: { condition: (d) => d.role === "agent" } },
    { name: "reviewerLocales", type: "json", admin: { condition: (d) => d.role === "reviewer", description: "Locales a native-speaker reviewer may approve." } },
    {
      name: "passkeys",
      type: "array",
      access: { read: ({ req }) => isCreator(req), update: () => false },
      admin: { readOnly: true },
      fields: [
        { name: "credentialId", type: "text", required: true },
        { name: "publicKey", type: "text", required: true },
        { name: "counter", type: "number", required: true },
        { name: "transports", type: "json" },
        { name: "label", type: "text" },
      ],
    },
  ],
};
