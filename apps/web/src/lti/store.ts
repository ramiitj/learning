import { cmsClient } from "@/cms/client";
import { decryptSecret } from "./secret";
import type { Platform, PlatformStore } from "./launch";

type Row = {
  id: string | number;
  enabled?: boolean | null;
  issuer: string;
  clientId: string;
  deploymentIds?: string[] | null;
  authLoginUrl: string;
  jwksUrl: string;
  frameOrigins?: string[] | null;
  lrsEndpoint?: string | null;
  lrsKey?: string | null;
  lrsSecret?: string | null;
};

const toPlatform = (r: Row): Platform => ({
  id: String(r.id),
  issuer: r.issuer,
  clientId: r.clientId,
  deploymentIds: r.deploymentIds ?? [],
  authLoginUrl: r.authLoginUrl,
  jwksUrl: r.jwksUrl,
  frameOrigins: r.frameOrigins ?? [],
  hasLrs: !!(r.lrsEndpoint && r.lrsKey && r.lrsSecret),
});

const SYSTEM = { overrideAccess: true, context: { system: true }, depth: 0 } as const;

/** Registered platforms and used nonces, from the CMS database (Mumbai). */
export const payloadPlatformStore: PlatformStore = {
  async findByIssuer(issuer, clientId) {
    const payload = await cmsClient();
    const { docs } = await payload.find({
      collection: "lti-platforms" as never,
      where: { and: [{ issuer: { equals: issuer } }, { enabled: { equals: true } }, ...(clientId ? [{ clientId: { equals: clientId } }] : [])] },
      limit: 2,
      ...SYSTEM,
    });
    return (docs as unknown as Row[]).map(toPlatform);
  },
  async findById(id) {
    const payload = await cmsClient();
    const r = (await payload.findByID({ collection: "lti-platforms" as never, id, disableErrors: true, ...SYSTEM })) as unknown as Row | null;
    return r && r.enabled ? toPlatform(r) : null;
  },
  async consumeNonce(nonceHash, expiresAt) {
    const payload = await cmsClient();
    // Expired nonces are useless to an attacker (the tokens they belonged to have expired too).
    await payload.delete({ collection: "lti-nonces" as never, where: { expiresAt: { less_than: new Date().toISOString() } }, ...SYSTEM }).catch(() => undefined);
    try {
      await payload.create({ collection: "lti-nonces" as never, data: { nonceHash, expiresAt: expiresAt.toISOString() } as never, ...SYSTEM });
      return true;
    } catch {
      // The unique index refused it: this nonce was used before.
      return false;
    }
  },
};

/** The LRS of an enabled platform, with its secret decrypted, for sending statements only. */
export async function lrsFor(platformId: string): Promise<{ endpoint: string; key: string; secret: string } | null> {
  const payload = await cmsClient();
  const r = (await payload.findByID({ collection: "lti-platforms" as never, id: platformId, disableErrors: true, ...SYSTEM })) as unknown as Row | null;
  if (!r?.enabled || !r.lrsEndpoint || !r.lrsKey || !r.lrsSecret) return null;
  const secret = decryptSecret(r.lrsSecret);
  return secret ? { endpoint: r.lrsEndpoint, key: r.lrsKey, secret } : null;
}
