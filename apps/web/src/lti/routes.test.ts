// @vitest-environment node
/**
 * The LTI route handlers end to end, with the CMS mocked: what is logged,
 * where the browser goes, which cookies are set, and that everything is off
 * unless LTI_ENABLED=1.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT, exportJWK, exportPKCS8, generateKeyPair, type CryptoKey } from "jose";
import { CLAIM, readLtiSession, readState } from "./config";
import { clearJwksCache, type Platform } from "./launch";
import { ltiFramePolicy } from "./frame";

process.env.PAYLOAD_SECRET ??= "test-secret-test-secret-test-secret-123";
process.env.APP_ORIGIN = "https://magazine.example.in";
const ISS = "https://lms.school.example";
const platform: Platform = { id: "7", issuer: ISS, clientId: "client-abc", deploymentIds: ["dep-1"], authLoginUrl: `${ISS}/auth`, jwksUrl: `${ISS}/jwks`, frameOrigins: [], hasLrs: true };

const logged: unknown[] = [];
const nonces = new Set<string>();
vi.mock("@/cms/client", () => ({ cmsClient: async () => ({}) }));
vi.mock("@/cms/events", () => ({ logEvent: async (_p: unknown, _r: unknown, e: unknown) => void logged.push(e) }));
// next-intl's middleware does not resolve under vitest's ESM loader; a pass-through stands in for it (only the LTI header logic is under test).
vi.mock("next-intl/middleware", async () => {
  const { NextResponse } = await import("next/server");
  return { default: () => () => NextResponse.next() };
});
vi.mock("@/lib/content", () => ({ listLessonIds: async () => ["what-is-a-model"] }));
vi.mock("@/lti/store", () => ({
  payloadPlatformStore: {
    findByIssuer: async (iss: string) => (iss === ISS ? [platform] : []),
    findById: async (id: string) => (id === "7" ? platform : null),
    consumeNonce: async (h: string) => (nonces.has(h) ? false : (nonces.add(h), true)),
  },
  lrsFor: async () => null,
}));

let key: CryptoKey;
beforeAll(async () => {
  const kp = await generateKeyPair("RS256", { extractable: true });
  key = kp.privateKey;
  const jwk = { ...(await exportJWK(kp.publicKey)), kid: "k1", alg: "RS256" };
  vi.stubGlobal("fetch", async () => Response.json({ keys: [jwk] }));
  process.env.LTI_PRIVATE_KEY = await exportPKCS8(kp.privateKey);
});
beforeEach(() => {
  process.env.LTI_ENABLED = "1";
  process.env.XAPI_ENABLED = "1";
  logged.length = 0;
  clearJwksCache();
});
afterEach(() => {
  delete process.env.LTI_ENABLED;
  delete process.env.XAPI_ENABLED;
});

const login = async () => {
  const { GET } = await import("@/app/api/lti/login/route");
  const q = new URLSearchParams({ iss: ISS, login_hint: "hint-student-8842", target_link_uri: "https://magazine.example.in/api/lti/launch" });
  return GET(new NextRequest(`https://magazine.example.in/api/lti/login?${q}`));
};

async function launchWith(over: Record<string, unknown> = {}) {
  const res = await login();
  const loc = new URL(res.headers.get("location")!);
  const state = loc.searchParams.get("state")!;
  const setCookie = res.headers.get("set-cookie")!;
  const cookie = setCookie.split(";")[0] ?? "";
  const idToken = await new SignJWT({
    nonce: loc.searchParams.get("nonce"),
    [CLAIM.version]: "1.3.0",
    [CLAIM.messageType]: "LtiResourceLinkRequest",
    [CLAIM.deploymentId]: "dep-1",
    [CLAIM.roles]: ["http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"],
    [CLAIM.custom]: { lesson: "what-is-a-model" },
    sub: "student-8842-sub",
    name: "Priya Sharma",
    email: "priya.sharma@school.example",
    "https://purl.imsglobal.org/spec/lti/claim/context": { title: "Class 9B" },
    ...over,
  })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(ISS)
    .setAudience("client-abc")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
  const { POST } = await import("@/app/api/lti/launch/route");
  const body = new URLSearchParams({ id_token: idToken, state });
  return { res: await POST(new NextRequest("https://magazine.example.in/api/lti/launch", { method: "POST", body, headers: { cookie, "content-type": "application/x-www-form-urlencoded" } })), setCookie, idToken, state, cookie };
}

describe("LTI routes", () => {
  it("are all off unless LTI_ENABLED=1", async () => {
    delete process.env.LTI_ENABLED;
    expect((await login()).status).toBe(404);
    const { POST } = await import("@/app/api/lti/launch/route");
    expect((await POST(new NextRequest("https://magazine.example.in/api/lti/launch", { method: "POST" }))).status).toBe(404);
    const { GET } = await import("@/app/api/lti/jwks/route");
    expect((await GET()).status).toBe(404);
    const x = await import("@/app/api/lti/xapi/route");
    expect((await x.POST(new Request("https://magazine.example.in/api/lti/xapi", { method: "POST", body: "{}" }))).status).toBe(404);
    expect(await ltiFramePolicy("/en/lessons/what-is-a-model", "anything", ["en"])).toBeNull();
  });

  it("login sets a short-lived, partitioned, signed state cookie scoped to the launch path", async () => {
    const res = await login();
    expect(res.status).toBe(302);
    const c = res.headers.get("set-cookie")!;
    expect(c).toMatch(/^lm-lti-[\w-]+=/);
    expect(c).toMatch(/HttpOnly/i);
    expect(c).toMatch(/Secure/i);
    expect(c).toMatch(/SameSite=none/i);
    expect(c).toMatch(/Partitioned/i);
    expect(c).toMatch(/Path=\/api\/lti\/launch/);
    expect(c).toMatch(/Max-Age=600/);
    expect(c).not.toContain("hint-student-8842");
    expect(await readState(c.split(";")[0]?.split("=")[1])).toMatchObject({ platformId: "7" });
  });

  it("a valid launch logs only the platform and lesson, and opens the lesson with no identity anywhere", async () => {
    const { res } = await launchWith();
    expect(res.status).toBe(303);
    const to = new URL(res.headers.get("location")!);
    // Instructors open classroom mode by default.
    expect(to.pathname).toBe("/en/lessons/what-is-a-model/classroom");
    const s = await readLtiSession(to.searchParams.get("lti"));
    expect(s).toMatchObject({ platformId: "7", lessonId: "what-is-a-model", frameOrigins: [ISS], xapi: true });
    // The token travels in a URL (request logs), so it carries no per-learner id at all.
    expect(Object.keys(JSON.parse(Buffer.from(to.searchParams.get("lti")!.split(".")[1] ?? "", "base64url").toString())).sort()).toEqual(["aud", "exp", "f", "iat", "l", "p", "x"]);
    expect(logged).toEqual([{ action: "lti.launch", target: "lti-platforms/7", data: { platformId: "7", lessonId: "what-is-a-model" } }]);
    const everything = JSON.stringify(logged) + res.headers.get("location") + JSON.stringify([...res.headers]) + Buffer.from(to.searchParams.get("lti")!.split(".")[1] ?? "", "base64url").toString();
    for (const v of ["student-8842", "Priya", "Sharma", "priya.sharma", "Class 9B", "hint-student"]) expect(everything).not.toContain(v);
    // The state cookie is cleared.
    expect(res.headers.get("set-cookie")).toMatch(/Max-Age=0/);
  });

  it("a replayed launch is refused and logged with a reason code only", async () => {
    const { res, idToken, state, cookie } = await launchWith();
    expect(res.status).toBe(303);
    logged.length = 0;
    const { POST } = await import("@/app/api/lti/launch/route");
    const again = await POST(new NextRequest("https://magazine.example.in/api/lti/launch", { method: "POST", body: new URLSearchParams({ id_token: idToken, state }), headers: { cookie, "content-type": "application/x-www-form-urlencoded" } }));
    expect(again.status).toBe(403);
    expect(logged).toEqual([{ action: "lti.launch-refused", target: "lti-platforms/7", data: { code: "nonce-replayed" } }]);
    // The refusal page is localisable static text and echoes nothing from the request.
    const html = await again.text();
    expect(html).toContain("This lesson could not open");
    expect(html).not.toContain("student-8842");
  });

  it("refuses a lesson that does not exist", async () => {
    const { res } = await launchWith({ [CLAIM.custom]: { lesson: "no-such-lesson" } });
    expect(res.status).toBe(400);
    expect(logged).toEqual([{ action: "lti.launch-refused", target: "lti-platforms/7", data: { code: "bad-lesson" } }]);
  });

  it("serves only the public half of the tool key", async () => {
    const { GET } = await import("@/app/api/lti/jwks/route");
    const { keys } = (await (await GET()).json()) as { keys: Record<string, unknown>[] };
    expect(keys).toHaveLength(1);
    const k0 = keys[0]!;
    expect(k0).toMatchObject({ kty: "RSA", alg: "RS256", use: "sig" });
    for (const k of ["d", "p", "q", "dp", "dq", "qi"]) expect(k0[k]).toBeUndefined();
    expect(k0.kid).toBeTruthy();
  });
});

describe("framing on LTI launches only", () => {
  it("sets frame-ancestors for the launched lesson, and nothing for anything else", async () => {
    const { res } = await launchWith();
    const token = new URL(res.headers.get("location")!).searchParams.get("lti");
    expect(await ltiFramePolicy("/en/lessons/what-is-a-model", token, ["en", "hi", "te"])).toBe(`frame-ancestors ${ISS}`);
    expect(await ltiFramePolicy("/hi/lessons/what-is-a-model/classroom", token, ["en", "hi", "te"])).toBe(`frame-ancestors ${ISS}`);
    expect(await ltiFramePolicy("/en/lessons/another-lesson", token, ["en", "hi", "te"])).toBeNull();
    expect(await ltiFramePolicy("/en", token, ["en", "hi", "te"])).toBeNull();
    expect(await ltiFramePolicy("/en/lessons/what-is-a-model/teach", token, ["en", "hi", "te"])).toBeNull();
    expect(await ltiFramePolicy("/en/lessons/what-is-a-model", null, ["en", "hi", "te"])).toBeNull();
    expect(await ltiFramePolicy("/en/lessons/what-is-a-model", `${token}x`, ["en", "hi", "te"])).toBeNull();
  });

  it("the proxy adds the policy on launches and leaves other responses alone", async () => {
    const { res } = await launchWith();
    const token = new URL(res.headers.get("location")!).searchParams.get("lti")!;
    const { default: proxy } = await import("@/proxy");
    const framed = await proxy(new NextRequest(`https://magazine.example.in/en/lessons/what-is-a-model?lti=${encodeURIComponent(token)}`));
    expect(framed.headers.get("content-security-policy")).toBe(`frame-ancestors ${ISS}`);
    const plain = await proxy(new NextRequest("https://magazine.example.in/en/lessons/what-is-a-model"));
    expect(plain.headers.get("content-security-policy")).toBeNull();
    delete process.env.LTI_ENABLED;
    const off = await proxy(new NextRequest(`https://magazine.example.in/en/lessons/what-is-a-model?lti=${encodeURIComponent(token)}`));
    expect(off.headers.get("content-security-policy")).toBeNull();
  });
});
