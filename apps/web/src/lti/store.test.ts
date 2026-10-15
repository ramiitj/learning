// @vitest-environment node
/**
 * The LTI collections against a real Postgres database. Run with
 * TEST_DATABASE_URI set (CI provides one); skipped otherwise. The database is
 * wiped first.
 */
import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import type { Payload } from "payload";

const DB = process.env.TEST_DATABASE_URI;

describe.skipIf(!DB)("LTI platform store", () => {
  let payload: Payload;
  let creator: Record<string, unknown>;
  let platformId: string;
  const fresh = () => ({ ...creator, authTime: Math.floor(Date.now() / 1000) }) as never;

  beforeAll(async () => {
    const c = new pg.Client({ connectionString: DB });
    await c.connect();
    await c.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    await c.end();
    process.env.DATABASE_URI = DB;
    process.env.PAYLOAD_SECRET ??= "test-secret-test-secret-test-secret-123";
    const { getPayload } = await import("payload");
    const { default: config } = await import("@payload-config");
    payload = await getPayload({ config });
    creator = { ...(await payload.create({ collection: "users", data: { name: "Creator", role: "creator" }, overrideAccess: true, context: { system: true } })), collection: "users" };
    const p = await payload.create({
      collection: "lti-platforms" as never,
      data: { name: "Test school", enabled: true, issuer: "https://lms.school.example", clientId: "c1", deploymentIds: ["d1"], authLoginUrl: "https://lms.school.example/auth", jwksUrl: "https://lms.school.example/jwks", lrsEndpoint: "https://lrs.school.example/xapi/", lrsKey: "key", lrsSecret: "lrs-password" } as never,
      user: fresh(),
      overrideAccess: false,
    });
    platformId = String((p as { id: string | number }).id);
  }, 120_000);

  it("never returns the LRS secret through the API, even to the creator, and stores it encrypted", async () => {
    const asCreator = await payload.findByID({ collection: "lti-platforms" as never, id: platformId, user: fresh(), overrideAccess: false });
    expect(asCreator).not.toHaveProperty("lrsSecret");
    const c = new pg.Client({ connectionString: DB });
    await c.connect();
    const { rows } = await c.query("SELECT lrs_secret FROM lti_platforms WHERE id = $1", [platformId]);
    await c.end();
    expect(rows[0].lrs_secret).toMatch(/^enc:v1:/);
    expect(rows[0].lrs_secret).not.toContain("lrs-password");
    const { lrsFor } = await import("./store");
    expect(await lrsFor(platformId)).toEqual({ endpoint: "https://lrs.school.example/xapi/", key: "key", secret: "lrs-password" });
  });

  it("finds enabled platforms and accepts each nonce once", async () => {
    const { payloadPlatformStore: s } = await import("./store");
    expect((await s.findByIssuer("https://lms.school.example"))[0]).toMatchObject({ id: platformId, clientId: "c1", deploymentIds: ["d1"], hasLrs: true });
    expect(await s.findByIssuer("https://lms.school.example", "other")).toEqual([]);
    const exp = new Date(Date.now() + 60_000);
    expect(await s.consumeNonce("hash-1", exp)).toBe(true);
    expect(await s.consumeNonce("hash-1", exp)).toBe(false);
    expect(await s.consumeNonce("hash-2", exp)).toBe(true);
  });

  it("stops launching from a platform the moment it is disabled", async () => {
    await payload.update({ collection: "lti-platforms" as never, id: platformId, data: { enabled: false } as never, user: fresh(), overrideAccess: false });
    const { payloadPlatformStore: s, lrsFor } = await import("./store");
    expect(await s.findById(platformId)).toBeNull();
    expect(await s.findByIssuer("https://lms.school.example")).toEqual([]);
    expect(await lrsFor(platformId)).toBeNull();
  });

  it("logs registrations to the event log without secrets", async () => {
    const { docs } = await payload.find({ collection: "events", where: { action: { like: "lti-platforms." } }, overrideAccess: true });
    expect(docs.map((d) => d.action)).toEqual(expect.arrayContaining(["lti-platforms.create", "lti-platforms.update"]));
    expect(JSON.stringify(docs)).not.toContain("lrs-password");
  });
});
