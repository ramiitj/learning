import type { CollectionConfig } from "payload";
import { creatorOnly } from "../access";
import { auditHooks } from "../events";

/**
 * Connections to the MCP authoring connector (claude.ai, Claude Code). Each
 * grant the creator approved is listed here; deleting one revokes it at once.
 * Only hashes of tokens are stored.
 */
export const OAuthGrants: CollectionConfig = {
  slug: "oauth-grants",
  admin: { useAsTitle: "clientName", defaultColumns: ["clientName", "kind", "expiresAt", "createdAt"], group: "Access", description: "Apps connected to the authoring connector. Delete a row to disconnect it." },
  access: { read: creatorOnly, create: () => false, update: () => false, delete: creatorOnly },
  hooks: auditHooks("oauth-grants"),
  fields: [
    { name: "kind", type: "select", required: true, options: ["refresh-token", "used-code"], index: true },
    { name: "clientName", type: "text" },
    { name: "clientId", type: "text", index: true },
    { name: "tokenHash", type: "text", required: true, unique: true, admin: { hidden: true } },
    { name: "userId", type: "text" },
    { name: "expiresAt", type: "date", required: true },
  ],
};
