// @vitest-environment node
/**
 * The passkey API rules against a real database (created beside
 * TEST_DATABASE_URI as lm_auth_test; skipped when that is not set):
 * the setup token is closed for good once a creator exists, adding and
 * removing a passkey need a fresh confirmation, the last passkey cannot be
 * removed, no key material is listed, every action and refusal is logged,
 * and production without an origin refuses ceremonies.
 */
import pg from "pg";
import type { Payload } from "payload";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// The ceremony route keeps its challenge and session in cookies through next/headers.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n)! } : undefined),
    set: (n: string, v: string) => void jar.set(n, v),
    delete: (n: string) => void jar.delete(n),
  }),
  headers: async () => new Headers(),
}));

const BASE = process.env.TEST_DATABASE_URI;
const dbName = "lm_auth_test";
const SECRET = { cred: "CRED-SECRET-AUTH-1", pub: "PUBKEY-SECRET-AUTH-1", cred2: "CRED-SECRET-AUTH-2", pub2: "PUBKEY-SECRET-AUTH-2" };
const ORIGIN = "http://localhost:3000";

describe.skipIf(!BASE)("passkey API rules (integration)", () => {
  let payload: Payload;
  let ceremony: (action: string, body: unknown) => Promise<Response>;
  let api: { GET: (r: Request) => Promise<Response>; PATCH: (r: Request) => Promise<Response>; DELETE: (r: Request) => Promise<Response> };
  let signSession: (id: string | number, authTime?: number) => Promise<string>;

  const events = async (action: string) => (await payload.find({ collection: "events", where: { action: { equals: action } }, limit: 100, overrideAccess: true })).docs;
  const now = () => Math.floor(Date.now() / 1000);
  const asCookie = async (id: string | number, authTime: number) => {
    jar.clear();
    jar.set("lm-creator", await signSession(id, authTime));
  };
  const req = (method: string, body?: unknown, headers: Record<string, string> = {}) =>
    new Request(`${ORIGIN}/api/auth/passkeys`, { method, headers: { cookie: `lm-creator=${jar.get("lm-creator") ?? ""}`, ...(body ? { "content-type": "application/json", origin: ORIGIN } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });

  beforeAll(async () => {
    const u = new URL(BASE!);
    u.pathname = "/postgres";
    const admin = new pg.Client({ connectionString: u.toString() });
    await admin.connect();
    await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${dbName}`);
    await admin.end();
    u.pathname = `/${dbName}`;
    process.env.DATABASE_URI = u.toString();
    process.env.PAYLOAD_SECRET ??= "test-secret-test-secret-test-secret-123";
    delete process.env.APP_ORIGIN;
    const { getPayload } = await import("payload");
    const { default: config } = await import("@payload-config");
    payload = await getPayload({ config });
    const route = await import("@/app/api/auth/passkey/[action]/route");
    ceremony = (action, body) => route.POST(new Request(`${ORIGIN}/api/auth/passkey/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ action }) });
    api = (await import("@/app/api/auth/passkeys/route")) as never;
    ({ signSession } = await import("@/auth/session"));
  }, 180_000);

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts the setup token while no creator exists", async () => {
    vi.stubEnv("CREATOR_SETUP_TOKEN", "a-very-long-one-time-setup-token-xyz");
    jar.clear();
    const res = await ceremony("register-options", { setupToken: "a-very-long-one-time-setup-token-xyz", name: "Creator" });
    expect(res.status).toBe(200);
    expect((await res.json()).rp.id).toBe("localhost");
  });

  it("refuses the setup token for good once a creator exists, whatever the environment, and logs auth.setup-refused", async () => {
    const creator = await payload.create({ collection: "users", data: { name: "Creator", role: "creator", passkeys: [{ credentialId: SECRET.cred, publicKey: SECRET.pub, counter: 1, label: "Phone", addedAt: new Date().toISOString() }] } as never, overrideAccess: true, context: { system: true } });
    const { logEvent } = await import("@/cms/events");
    await logEvent(payload, undefined, { action: "auth.creator-created", target: `users/${creator.id}` });
    jar.clear();
    const before = (await events("auth.setup-refused")).length;

    vi.stubEnv("CREATOR_SETUP_TOKEN", "a-very-long-one-time-setup-token-xyz");
    for (const action of ["register-options", "register"]) {
      const res = await ceremony(action, { setupToken: "a-very-long-one-time-setup-token-xyz", name: "Intruder" });
      expect(res.status).toBe(403);
      expect((await res.json()).error).toMatch(/Setup is closed/);
    }
    vi.stubEnv("CREATOR_SETUP_TOKEN", "");
    expect((await ceremony("register-options", { setupToken: "anything" })).status).toBe(403);
    expect((await events("auth.setup-refused")).length).toBe(before + 3);

    // Even if the creator's account row were deleted, the append-only log keeps setup closed.
    await payload.db.drizzle.execute(`UPDATE users SET role = 'reviewer' WHERE id = ${Number(creator.id)}`);
    vi.stubEnv("CREATOR_SETUP_TOKEN", "a-very-long-one-time-setup-token-xyz");
    expect((await ceremony("register-options", { setupToken: "a-very-long-one-time-setup-token-xyz" })).status).toBe(403);
    await payload.db.drizzle.execute(`UPDATE users SET role = 'creator' WHERE id = ${Number(creator.id)}`);
    expect((await payload.count({ collection: "users", where: { role: { equals: "creator" } }, overrideAccess: true })).totalDocs).toBe(1);
  });

  it("lets a signed-in creator start adding a passkey only within five minutes of confirming, and logs refusals", async () => {
    const creator = (await payload.find({ collection: "users", where: { role: { equals: "creator" } }, overrideAccess: true })).docs[0]!;
    const before = (await events("auth.passkey-add-refused")).length;
    await asCookie(creator.id, now() - 600);
    const stale = await ceremony("register-options", { label: "YubiKey" });
    expect(stale.status).toBe(403);
    expect((await stale.json()).error).toMatch(/five minutes/);
    const staleRegister = await ceremony("register", { label: "YubiKey", response: {} });
    // No challenge cookie yet: refused before any verification.
    expect(staleRegister.status).toBe(400);
    expect((await events("auth.passkey-add-refused")).length).toBe(before + 1);

    await asCookie(creator.id, now() - 600);
    jar.set("lm-webauthn", await (await import("@/auth/session")).signChallenge("abc", "register"));
    expect((await ceremony("register", { label: "YubiKey", response: {} })).status).toBe(403);
    expect((await events("auth.passkey-add-refused")).length).toBe(before + 2);

    await asCookie(creator.id, now() - 30);
    const fresh = await ceremony("register-options", { label: "YubiKey" });
    expect(fresh.status).toBe(200);
    const opts = await fresh.json();
    expect(opts.excludeCredentials.map((c: { id: string }) => c.id)).toEqual([SECRET.cred]);
  });

  it("lists passkeys without key material, renames, and removes only when fresh and never the last one, logging each", async () => {
    const creator = (await payload.find({ collection: "users", where: { role: { equals: "creator" } }, overrideAccess: true, showHiddenFields: true })).docs[0]! as unknown as { id: number; passkeys: Record<string, unknown>[] };
    await payload.update({ collection: "users", id: creator.id, data: { passkeys: [...creator.passkeys, { credentialId: SECRET.cred2, publicKey: SECRET.pub2, counter: 0, label: "YubiKey" }] } as never, overrideAccess: true, context: { system: true } });

    jar.clear();
    expect((await api.GET(req("GET"))).status).toBe(401);

    await asCookie(creator.id, now() - 3600);
    const listed = await api.GET(req("GET"));
    const text = await listed.text();
    expect(listed.status).toBe(200);
    expect(text).not.toMatch(/CRED-SECRET|PUBKEY-SECRET|counter|credentialId|publicKey/);
    const keys = JSON.parse(text).passkeys as { id: string; name: string; createdAt: string | null }[];
    expect(keys.map((k) => k.name)).toEqual(["Phone", "YubiKey"]);
    expect(keys[0]!.createdAt).toBeTruthy();

    // Rename: a stale session is enough; cross-site requests are refused.
    expect((await api.PATCH(req("PATCH", { id: keys[1]!.id, name: "Backup key" }, { origin: "https://evil.example" }))).status).toBe(403);
    expect((await api.PATCH(new Request(`${ORIGIN}/api/auth/passkeys`, { method: "PATCH", headers: { cookie: `lm-creator=${jar.get("lm-creator")}`, "content-type": "application/x-www-form-urlencoded" }, body: "id=1&name=x" }))).status).toBe(403);
    const renamed = await api.PATCH(req("PATCH", { id: keys[1]!.id, name: "  Backup key " }));
    expect(renamed.status).toBe(200);
    expect((await renamed.json()).passkeys.map((k: { name: string }) => k.name)).toEqual(["Phone", "Backup key"]);
    expect((await events("auth.passkey-renamed")).at(-1)).toMatchObject({ actorKind: "creator", target: `users/${creator.id}` });

    // Remove: stale is refused and logged.
    const stale = await api.DELETE(req("DELETE", { id: keys[0]!.id }));
    expect(stale.status).toBe(403);
    expect((await events("auth.passkey-remove-refused")).length).toBe(1);

    await asCookie(creator.id, now() - 10);
    const removed = await api.DELETE(req("DELETE", { id: keys[0]!.id }));
    expect(removed.status).toBe(200);
    expect((await removed.json()).passkeys.map((k: { name: string }) => k.name)).toEqual(["Backup key"]);
    expect((await events("auth.passkey-removed")).at(-1)).toMatchObject({ actorKind: "creator", data: { name: "Phone", remaining: 1 } });

    const last = await api.DELETE(req("DELETE", { id: keys[1]!.id }));
    expect(last.status).toBe(409);
    expect((await events("auth.passkey-remove-refused")).length).toBe(2);
    const after = (await payload.findByID({ collection: "users", id: creator.id, overrideAccess: true, showHiddenFields: true })) as unknown as { passkeys: { credentialId: string }[] };
    expect(after.passkeys.map((p) => p.credentialId)).toEqual([SECRET.cred2]);
  });

  it("does not let a reviewer manage passkeys here", async () => {
    const reviewer = await payload.create({ collection: "users", data: { name: "R", role: "reviewer", reviewerLocales: ["hi"] } as never, overrideAccess: true, context: { system: true } });
    await asCookie(reviewer.id, now());
    expect((await api.GET(req("GET"))).status).toBe(401);
    expect((await api.DELETE(req("DELETE", { id: "x" }))).status).toBe(401);
  });

  it("refuses every passkey ceremony in production when no origin is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ORIGIN", "");
    jar.clear();
    const res = await ceremony("login-options", {});
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/APP_ORIGIN/);
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_BRANCH_URL", "lm-git-pr-7.vercel.app");
    const preview = await ceremony("login-options", {});
    expect(preview.status).toBe(200);
    expect((await preview.json()).rpId).toBe("lm-git-pr-7.vercel.app");
  });
});
