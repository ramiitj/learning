import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * LRS secrets are stored encrypted (AES-256-GCM) with a key derived from
 * PAYLOAD_SECRET, so a database dump alone does not reveal them. Rotating
 * PAYLOAD_SECRET means re-entering each LRS secret in the console.
 */
const PREFIX = "enc:v1:";
const key = () => {
  const s = process.env.PAYLOAD_SECRET;
  if (!s || s.length < 32) throw new Error("PAYLOAD_SECRET must be set (32+ characters)");
  return Buffer.from(hkdfSync("sha256", s, "lm-lti", "lrs-secret", 32));
};

export const isEncrypted = (v: unknown): v is string => typeof v === "string" && v.startsWith(PREFIX);

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `${PREFIX}${iv.toString("base64url")}:${c.getAuthTag().toString("base64url")}:${ct.toString("base64url")}`;
}

export function decryptSecret(stored: string): string | null {
  if (!isEncrypted(stored)) return null;
  try {
    const [iv, tag, ct] = stored.slice(PREFIX.length).split(":").map((p) => Buffer.from(p, "base64url"));
    if (!iv || !tag || !ct) return null;
    const d = createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
