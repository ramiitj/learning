import { APIError, type CollectionBeforeChangeHook, type CollectionConfig, type FieldHook } from "payload";
import { creatorOnly, recentlyAuthenticated } from "../access";
import { auditHooks } from "../events";
import { isOrigin, isSecureUrl } from "../../lti/config";
import { encryptSecret, isEncrypted } from "../../lti/secret";

/**
 * School learning management systems allowed to launch lessons over LTI 1.3
 * (docs/03 "Interoperability", docs/proposals/lti-xapi.md). Registered by the
 * creator only, in the console. Agents can neither read nor change it: a
 * registration decides where data may flow, which is always-ask (docs/10).
 */
const requirePasskey: CollectionBeforeChangeHook = ({ data, req }) => {
  if (!req.context?.system && !recentlyAuthenticated(req)) throw new APIError("Registering or changing an LMS changes where data may flow: confirm with your passkey first.", 403);
  return data;
};

const url = (v: unknown) => v == null || v === "" || isSecureUrl(v) || "Use an https:// address.";
const requiredUrl = (v: unknown) => isSecureUrl(v) || "Use an https:// address.";

/** Stores only the encrypted form; an empty value on save keeps the secret already stored. */
const encryptLrsSecret: FieldHook = ({ value, originalDoc }) => {
  if (typeof value !== "string" || value === "") return (originalDoc as { lrsSecret?: string } | undefined)?.lrsSecret ?? null;
  return isEncrypted(value) ? value : encryptSecret(value);
};

export const LtiPlatforms: CollectionConfig = {
  slug: "lti-platforms",
  admin: {
    useAsTitle: "name",
    group: "Access",
    defaultColumns: ["name", "issuer", "clientId", "enabled"],
    description: "LMS platforms allowed to launch lessons (LTI 1.3). Off unless LTI_ENABLED=1. Read docs/proposals/lti-xapi.md before enabling one.",
  },
  access: { read: creatorOnly, create: creatorOnly, update: creatorOnly, delete: creatorOnly },
  indexes: [{ fields: ["issuer", "clientId"], unique: true }],
  hooks: { beforeChange: [requirePasskey], ...auditHooks("lti-platforms") },
  fields: [
    { name: "name", type: "text", required: true, admin: { description: "For you: which school or LMS this is." } },
    { name: "enabled", type: "checkbox", defaultValue: false },
    { name: "issuer", type: "text", required: true, index: true, validate: requiredUrl, admin: { description: "The platform's issuer (iss), exactly as it sends it." } },
    { name: "clientId", type: "text", required: true, admin: { description: "The client id the platform issued for this tool." } },
    { name: "deploymentIds", type: "text", hasMany: true, required: true, admin: { description: "Deployment ids allowed to launch. Launches from any other deployment are refused." } },
    { name: "authLoginUrl", type: "text", required: true, validate: requiredUrl, admin: { description: "OIDC authentication request URL." } },
    { name: "authTokenUrl", type: "text", validate: url, admin: { description: "OAuth2 token URL (unused for now: no LTI services are called)." } },
    { name: "jwksUrl", type: "text", required: true, validate: requiredUrl, admin: { description: "Where the platform publishes its signing keys." } },
    {
      name: "frameOrigins",
      type: "text",
      hasMany: true,
      validate: (v: unknown) => v == null || (Array.isArray(v) && v.every((o) => typeof o === "string" && isOrigin(o))) || "Each entry must be an origin such as https://lms.school.in",
      admin: { description: "Origins allowed to show lessons in a frame. Empty: the issuer's and login URL's origins." },
    },
    {
      type: "collapsible",
      label: "xAPI (Learning Record Store)",
      admin: { initCollapsed: true, description: "Only used when XAPI_ENABLED=1, and only for launches from this platform. Requires the school's written agreement (see the proposal)." },
      fields: [
        { name: "lrsEndpoint", type: "text", validate: url, admin: { description: "The LRS xAPI endpoint, e.g. https://lrs.school.in/xapi/" } },
        { name: "lrsKey", type: "text" },
        {
          name: "lrsSecret",
          type: "text",
          // Never sent to the browser, not even to the creator: stored encrypted, write-only.
          access: { read: () => false },
          hooks: { beforeChange: [encryptLrsSecret] },
          admin: { description: "Write-only. Leave empty to keep the stored secret." },
        },
      ],
    },
  ],
};

/** Nonces of accepted LTI launches, so no id_token can be used twice. System use only; rows expire after 20 minutes. */
export const LtiNonces: CollectionConfig = {
  slug: "lti-nonces",
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: "nonceHash", type: "text", required: true, unique: true },
    { name: "expiresAt", type: "date", required: true, index: true },
  ],
};
