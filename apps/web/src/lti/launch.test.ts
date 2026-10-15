// @vitest-environment node
/**
 * LTI 1.3 launch against a fake platform: a key pair made here, its JWKS
 * served through a stubbed fetch. Covers the security checks and the data
 * minimisation guarantee (no identity claim is ever stored or logged).
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT, exportJWK, generateKeyPair, type CryptoKey, type JWTPayload } from "jose";
import { CLAIM, readLtiSession, readState, signState, type LoginState } from "./config";
import { LtiError, clearJwksCache, frameOriginsOf, initiateLogin, minimiseClaims, verifyLaunch, type Platform, type PlatformStore } from "./launch";

process.env.PAYLOAD_SECRET ??= "test-secret-test-secret-test-secret-123";
const ORIGIN = "https://magazine.example.in";
const ISS = "https://lms.school.example";
const JWKS_URL = `${ISS}/.well-known/jwks.json`;
const platform: Platform = { id: "7", issuer: ISS, clientId: "client-abc", deploymentIds: ["dep-1"], authLoginUrl: `${ISS}/auth?x=1`, jwksUrl: JWKS_URL, frameOrigins: [], hasLrs: true };

/** Identity claims a real platform sends; none may survive. */
const IDENTITY = {
  sub: "student-8842-sub",
  name: "Priya Sharma",
  given_name: "Priya",
  family_name: "Sharma",
  email: "priya.sharma@school.example",
  picture: "https://lms.school.example/u/8842.png",
  "https://purl.imsglobal.org/spec/lti/claim/context": { id: "ctx-9", title: "Class 9B Artificial Intelligence" },
  "https://purl.imsglobal.org/spec/lti/claim/resource_link": { id: "rl-1", title: "Week 3 lesson" },
  "https://purl.imsglobal.org/spec/lti/claim/lis": { person_sourcedid: "SIS-12345" },
};
const IDENTITY_VALUES = ["student-8842-sub", "Priya", "Sharma", "priya.sharma@school.example", "8842.png", "Class 9B", "SIS-12345", "Week 3 lesson"];

function memoryStore(): PlatformStore & { nonces: Set<string> } {
  const nonces = new Set<string>();
  return {
    nonces,
    findByIssuer: async (iss, clientId) => (iss === platform.issuer && (!clientId || clientId === platform.clientId) ? [platform] : []),
    findById: async (id) => (id === platform.id ? platform : null),
    consumeNonce: async (h) => (nonces.has(h) ? false : (nonces.add(h), true)),
  };
}

let privateKey: CryptoKey;
let otherKey: CryptoKey;
let fetchStub: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  const kp = await generateKeyPair("RS256");
  privateKey = kp.privateKey;
  otherKey = (await generateKeyPair("RS256")).privateKey;
  const jwk = { ...(await exportJWK(kp.publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  fetchStub = vi.fn(async (url: string | URL) => (String(url) === JWKS_URL ? new Response(JSON.stringify({ keys: [jwk] }), { headers: { "content-type": "application/json" } }) : new Response("no", { status: 404 })));
});
beforeEach(() => {
  clearJwksCache();
  vi.stubGlobal("fetch", fetchStub);
});
afterEach(() => vi.unstubAllGlobals());

async function idToken(over: JWTPayload = {}, opts: { key?: CryptoKey; exp?: string | number; iat?: number } = {}) {
  const claims: JWTPayload = {
    nonce: "nonce-1",
    azp: platform.clientId,
    [CLAIM.version]: "1.3.0",
    [CLAIM.messageType]: "LtiResourceLinkRequest",
    [CLAIM.deploymentId]: "dep-1",
    [CLAIM.roles]: ["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"],
    [CLAIM.custom]: { lesson: "what-is-a-model" },
    ...IDENTITY,
    ...over,
  };
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer((over.iss as string) ?? ISS)
    .setAudience((over.aud as string) ?? platform.clientId)
    .setIssuedAt(opts.iat ?? Math.floor(Date.now() / 1000))
    .setExpirationTime(opts.exp ?? "5m")
    .sign(opts.key ?? privateKey);
}

const cookieState: LoginState = { state: "state-123456789012345678901234", nonce: "nonce-1", platformId: "7" };
const launch = (token: string, store: PlatformStore = memoryStore(), cs: LoginState | null = cookieState, state = cookieState.state) =>
  verifyLaunch({ idToken: token, state, cookieState: cs, store, locales: ["en", "hi", "te"], defaultLocale: "en" });
const code = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof LtiError ? e.code : `unexpected: ${e}`));

describe("LTI login initiation", () => {
  it("redirects to the platform with the standard OIDC parameters and a fresh state and nonce", async () => {
    const { redirect, state } = await initiateLogin({ iss: ISS, login_hint: "opaque-hint", target_link_uri: `${ORIGIN}/api/lti/launch`, client_id: "client-abc", lti_message_hint: "m" }, memoryStore(), ORIGIN);
    const u = new URL(redirect);
    expect(u.origin + u.pathname).toBe(`${ISS}/auth`);
    expect(u.searchParams.get("x")).toBe("1");
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ scope: "openid", response_type: "id_token", response_mode: "form_post", prompt: "none", client_id: "client-abc", redirect_uri: `${ORIGIN}/api/lti/launch`, login_hint: "opaque-hint", lti_message_hint: "m", state: state.state, nonce: state.nonce });
    expect(state.state).not.toBe(state.nonce);
    expect(state.state.length).toBeGreaterThanOrEqual(40);
    // The state cookie round-trips and holds no request data.
    const signed = await signState(state);
    expect(await readState(signed)).toEqual(state);
    expect(signed).not.toContain("opaque-hint");
  });

  it("refuses unregistered platforms, unknown deployments and foreign targets", async () => {
    const base = { iss: ISS, login_hint: "h", target_link_uri: `${ORIGIN}/x` };
    expect(await code(initiateLogin({ ...base, iss: "https://evil.example" }, memoryStore(), ORIGIN))).toBe("unknown-platform");
    expect(await code(initiateLogin({ ...base, client_id: "other" }, memoryStore(), ORIGIN))).toBe("unknown-platform");
    expect(await code(initiateLogin({ ...base, lti_deployment_id: "dep-9" }, memoryStore(), ORIGIN))).toBe("unknown-deployment");
    expect(await code(initiateLogin({ ...base, target_link_uri: "https://evil.example/x" }, memoryStore(), ORIGIN))).toBe("bad-target");
    expect(await code(initiateLogin({ iss: ISS }, memoryStore(), ORIGIN))).toBe("bad-request");
  });
});

describe("LTI launch", () => {
  it("accepts a valid launch and opens the lesson named by the custom parameter", async () => {
    const r = await launch(await idToken());
    expect(r).toMatchObject({ lessonId: "what-is-a-model", mode: "personal", locale: "en" });
    expect(r.platform.id).toBe("7");
    expect(fetchStub).toHaveBeenCalled();
  });

  it("opens classroom mode for instructors, and honours mode and locale custom parameters", async () => {
    const instr = await launch(await idToken({ [CLAIM.roles]: ["http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"] }));
    expect(instr.mode).toBe("classroom");
    const personal = await launch(await idToken({ [CLAIM.roles]: ["http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"], [CLAIM.custom]: { lesson: "what-is-a-model", mode: "personal", locale: "te" } }));
    expect(personal).toMatchObject({ mode: "personal", locale: "te" });
    const learnerClass = await launch(await idToken({ [CLAIM.custom]: { lesson: "what-is-a-model", mode: "classroom" } }));
    expect(learnerClass.mode).toBe("classroom");
  });

  it("validates the custom parameters strictly", async () => {
    for (const custom of [{}, { lesson: "../console" }, { lesson: "What-Is" }, { lesson: "a b" }, { lesson: "x".repeat(200) }, { lesson: "ok", mode: "admin" }, { lesson: "ok", locale: "fr" }]) {
      expect(await code(launch(await idToken({ [CLAIM.custom]: custom })))).toBe("bad-lesson");
    }
  });

  it("refuses a replayed launch: each nonce is single-use", async () => {
    const store = memoryStore();
    const token = await idToken();
    expect(await code(launch(token, store))).toBe("ok");
    expect(await code(launch(token, store))).toBe("nonce-replayed");
  });

  it("refuses a token whose nonce is not the one this browser was given", async () => {
    expect(await code(launch(await idToken({ nonce: "nonce-from-another-login" })))).toBe("nonce-mismatch");
  });

  it("refuses a missing or mismatched state cookie", async () => {
    const t = await idToken();
    expect(await code(launch(t, memoryStore(), null))).toBe("state-mismatch");
    expect(await code(launch(t, memoryStore(), cookieState, "state-other-00000000000000000"))).toBe("state-mismatch");
  });

  it("refuses the wrong audience, and a foreign azp", async () => {
    expect(await code(launch(await idToken({ aud: "someone-else" })))).toBe("bad-token");
    expect(await code(launch(await idToken({ azp: "someone-else" })))).toBe("bad-token");
  });

  it("refuses multiple audiences without azp", async () => {
    const t = await new SignJWT({ nonce: "nonce-1", [CLAIM.version]: "1.3.0", [CLAIM.messageType]: "LtiResourceLinkRequest", [CLAIM.deploymentId]: "dep-1", [CLAIM.custom]: { lesson: "x" } })
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(ISS)
      .setAudience([platform.clientId, "other"])
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
    expect(await code(launch(t))).toBe("bad-token");
  });

  it("refuses the wrong issuer and a signature from another key", async () => {
    expect(await code(launch(await idToken({ iss: "https://evil.example" })))).toBe("bad-token");
    expect(await code(launch(await idToken({}, { key: otherKey })))).toBe("bad-token");
  });

  it("refuses an unregistered deployment", async () => {
    expect(await code(launch(await idToken({ [CLAIM.deploymentId]: "dep-unknown" })))).toBe("unknown-deployment");
  });

  it("refuses an expired token", async () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    expect(await code(launch(await idToken({}, { iat: past - 60, exp: past })))).toBe("bad-token");
  });

  it("refuses other message types and versions", async () => {
    expect(await code(launch(await idToken({ [CLAIM.messageType]: "LtiDeepLinkingRequest" })))).toBe("wrong-message");
    expect(await code(launch(await idToken({ [CLAIM.version]: "1.1" })))).toBe("wrong-message");
  });

  it("does not consume the nonce when a launch is refused", async () => {
    const store = memoryStore();
    await code(launch(await idToken({ [CLAIM.deploymentId]: "dep-unknown" }), store));
    expect(store.nonces.size).toBe(0);
  });
});

describe("data minimisation", () => {
  it("keeps only the allow-listed claims", async () => {
    const m = minimiseClaims({ iss: ISS, aud: "client-abc", ...IDENTITY, [CLAIM.custom]: { lesson: "l", mode: "classroom", locale: "hi", student_name: "Priya" } });
    expect(Object.keys(m).sort()).toEqual(["aud", "azp", "custom", "deploymentId", "iss", "messageType", "nonce", "roles", "version"]);
    expect(Object.keys(m.custom).sort()).toEqual(["lesson", "locale", "mode"]);
    for (const v of IDENTITY_VALUES) expect(JSON.stringify(m)).not.toContain(v);
  });

  it("never lets an identity claim reach the result, the session token or any log", async () => {
    const logs = (["log", "info", "warn", "error", "debug"] as const).map((k) => vi.spyOn(console, k).mockImplementation(() => undefined));
    const r = await launch(await idToken());
    const { signLtiSession } = await import("./config");
    const token = await signLtiSession({ platformId: r.platform.id, lessonId: r.lessonId, frameOrigins: frameOriginsOf(r.platform), xapi: true });
    const decoded = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
    expect(Object.keys(decoded).sort()).toEqual(["aud", "exp", "f", "iat", "l", "p", "x"]);
    const everything = JSON.stringify(r) + JSON.stringify(decoded) + JSON.stringify(logs.map((s) => s.mock.calls));
    for (const v of IDENTITY_VALUES) expect(everything).not.toContain(v);
    expect(logs.every((s) => s.mock.calls.length === 0)).toBe(true);
    expect((await readLtiSession(token))?.lessonId).toBe("what-is-a-model");
    logs.forEach((s) => s.mockRestore());
  });

  it("does not leak claims through errors", async () => {
    const err = await launch(await idToken({ aud: "someone-else" })).catch((e) => e);
    expect(err).toBeInstanceOf(LtiError);
    const dump = JSON.stringify(err) + String(err.message) + String(err.stack) + JSON.stringify(Object.entries(err));
    for (const v of IDENTITY_VALUES) expect(dump).not.toContain(v);
    expect(err.cause).toBeUndefined();
  });

  it("allows framing only from the platform's own https origins", () => {
    expect(frameOriginsOf(platform)).toEqual([ISS]);
    expect(frameOriginsOf({ ...platform, frameOrigins: ["https://school.instructure.com"] })).toEqual(["https://school.instructure.com"]);
    expect(frameOriginsOf({ ...platform, frameOrigins: ["javascript:alert(1)", "https://ok.example/path"] })).toEqual([]);
  });
});
