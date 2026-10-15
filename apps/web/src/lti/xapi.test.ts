// @vitest-environment node
/** xAPI statements: their shape, the anonymity guarantee, batching and the send-once-retry-once-drop rule. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signLtiSession } from "./config";
import { MAX_EVENTS, VERB, sanitiseEvents, sendStatements, toStatements, type Statement, type XapiEvent } from "./xapi";

process.env.PAYLOAD_SECRET ??= "test-secret-test-secret-test-secret-123";
process.env.APP_ORIGIN = "https://magazine.example.in";
const ORIGIN = "https://magazine.example.in";
const SID = "0b8f2a8e-5c1d-4b7e-9a3f-2d6c8e1f4a5b";
const ctx = { origin: ORIGIN, sessionId: SID, lessonId: "what-is-a-model", locale: "hi", mode: "personal" as const };

const afterCallbacks: (() => Promise<void>)[] = [];
const logged: unknown[] = [];
let lrs: { endpoint: string; key: string; secret: string } | null = null;
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (cb: () => Promise<void>) => void afterCallbacks.push(cb) }));
vi.mock("@/cms/client", () => ({ cmsClient: async () => ({}) }));
vi.mock("@/cms/events", () => ({ logEvent: async (_p: unknown, _r: unknown, e: unknown) => void logged.push(e) }));
vi.mock("@/lti/store", () => ({ lrsFor: async () => lrs, payloadPlatformStore: {} }));

const all: XapiEvent[] = [
  { type: "start" },
  { type: "act", blockId: "b-predict" },
  { type: "answer", blockId: "b-quiz", choice: "opt-2", correct: false },
  { type: "answer", blockId: "b-poll", choice: "opt-1" },
  { type: "post-check", itemId: "pc-1", correct: true },
  { type: "detour", detourId: "what-is-data" },
  { type: "complete" },
];

describe("xAPI statements", () => {
  it("use the four verbs, lesson activity IRIs under APP_ORIGIN and xAPI 1.0.3 structure", () => {
    const s = toStatements(all, ctx) as [Statement, Statement, Statement, Statement, Statement, Statement, Statement];
    expect(s.map((x) => x.verb.display["en-US"])).toEqual(["launched", "progressed", "answered", "answered", "answered", "progressed", "completed"]);
    expect(s.map((x) => x.verb.id)).toEqual([VERB.launched, VERB.progressed, VERB.answered, VERB.answered, VERB.answered, VERB.progressed, VERB.completed]);
    const lesson = `${ORIGIN}/lessons/what-is-a-model`;
    expect(s[0].object).toEqual({ objectType: "Activity", id: lesson, definition: { type: "http://adlnet.gov/expapi/activities/lesson" } });
    expect(s[2].object.id).toBe(`${lesson}/blocks/b-quiz`);
    expect(s[2].result).toEqual({ response: "opt-2", success: false });
    expect(s[3].result).toEqual({ response: "opt-1" });
    expect(s[4].object.id).toBe(`${lesson}/checks/pc-1`);
    expect(s[6].result).toEqual({ completion: true });
    for (const st of s) {
      expect(st.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(st.object.id.startsWith(`${ORIGIN}/`)).toBe(true);
      expect(st.context.language).toBe("hi");
      expect(st.context.extensions).toEqual({ [`${ORIGIN}/xapi/extensions/mode`]: "personal" });
      if (st.object.id !== lesson) expect(st.context.contextActivities?.parent[0]?.id).toBe(lesson);
      // No timestamp, registration, authority or version: the LRS adds what it needs.
      expect(Object.keys(st).sort()).toEqual(expect.arrayContaining(["actor", "context", "id", "object", "verb"]));
      for (const k of ["timestamp", "stored", "authority", "version"]) expect(st).not.toHaveProperty(k);
      expect(st.context).not.toHaveProperty("registration");
      expect(st.context).not.toHaveProperty("instructor");
      expect(st.context).not.toHaveProperty("team");
    }
  });

  it("always have an anonymous account actor: the site origin and a random per-launch id, nothing else", () => {
    for (const st of toStatements(all, ctx)) {
      expect(st.actor).toEqual({ objectType: "Agent", account: { homePage: ORIGIN, name: SID } });
      for (const k of ["name", "mbox", "mbox_sha1sum", "openid"]) expect(st.actor).not.toHaveProperty(k);
    }
    // Anything that is not a random UUID (an LMS id, an email) is refused as the actor.
    for (const bad of ["student-8842", "priya@school.example", ""]) expect(() => toStatements(all, { ...ctx, sessionId: bad })).toThrow(/random UUID/);
  });

  it("are built only from allow-listed fields: identity, free text and unknown events are dropped", () => {
    const raw = [
      { type: "start", sub: "student-8842", email: "priya@school.example" },
      { type: "answer", blockId: "b-1", choice: "my name is Priya Sharma", correct: true },
      { type: "answer", blockId: "b-1", choice: "priya@school.example" },
      { type: "act", blockId: "b-2", name: "Priya" },
      { type: "glossary", termId: "model" },
      { type: "explain", text: "Priya thinks models are magic" },
      { type: "post-check", itemId: "pc-1", correct: "yes" },
      null,
      "start",
    ];
    const ev = sanitiseEvents(raw);
    expect(ev).toEqual([{ type: "start" }, { type: "act", blockId: "b-2" }]);
    const json = JSON.stringify(toStatements(ev, ctx));
    for (const v of ["Priya", "student-8842", "school.example", "magic"]) expect(json).not.toContain(v);
    expect(sanitiseEvents(Array.from({ length: 500 }, () => ({ type: "start" })))).toHaveLength(MAX_EVENTS);
    expect(sanitiseEvents({ type: "start" })).toEqual([]);
  });
});

describe("sending to the LRS", () => {
  const target = { endpoint: "https://lrs.school.example/xapi", key: "k", secret: "s" };
  it("posts one batch with Basic auth and the xAPI version header", async () => {
    const f = vi.fn(async () => new Response(null, { status: 200 }));
    expect(await sendStatements(target, toStatements(all, ctx), f as unknown as typeof fetch)).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://lrs.school.example/xapi/statements");
    const h = init.headers as Record<string, string>;
    expect(h.authorization).toBe(`Basic ${Buffer.from("k:s").toString("base64")}`);
    expect(h["x-experience-api-version"]).toBe("1.0.3");
    expect(JSON.parse(String(init.body))).toHaveLength(all.length);
  });

  it("retries a failure once, then drops the batch", async () => {
    const fail = vi.fn(async () => new Response(null, { status: 503 }));
    expect(await sendStatements(target, toStatements(all, ctx), fail as unknown as typeof fetch)).toBe(false);
    expect(fail).toHaveBeenCalledTimes(2);
    const flaky = vi.fn().mockRejectedValueOnce(new Error("reset")).mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await sendStatements(target, toStatements(all, ctx), flaky as unknown as typeof fetch)).toBe(true);
    expect(flaky).toHaveBeenCalledTimes(2);
  });
});

describe("POST /api/lti/xapi", () => {
  beforeEach(() => {
    process.env.LTI_ENABLED = "1";
    process.env.XAPI_ENABLED = "1";
    afterCallbacks.length = 0;
    logged.length = 0;
    lrs = { endpoint: "https://lrs.school.example/xapi/", key: "k", secret: "s" };
  });
  afterEach(() => {
    delete process.env.LTI_ENABLED;
    delete process.env.XAPI_ENABLED;
    vi.unstubAllGlobals();
  });
  const token = (xapi = true) => signLtiSession({ platformId: "7", lessonId: "what-is-a-model", frameOrigins: ["https://lms.school.example"], xapi });
  const post = async (body: unknown, headers: Record<string, string> = {}) => {
    const { POST } = await import("@/app/api/lti/xapi/route");
    return POST(new Request("https://magazine.example.in/api/lti/xapi", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } }));
  };

  it("answers at once and sends after the response, to that platform's LRS only", async () => {
    const f = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", f);
    const res = await post({ t: await token(), sid: SID, locale: "en", mode: "classroom", e: all });
    expect(res.status).toBe(202);
    expect(f).not.toHaveBeenCalled();
    await Promise.all(afterCallbacks.map((cb) => cb()));
    expect(f).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(sent[0].actor).toEqual({ objectType: "Agent", account: { homePage: ORIGIN, name: SID } });
    expect(sent[0].object.id).toBe(`${ORIGIN}/lessons/what-is-a-model`);
  });

  it("logs a dropped batch with the platform and a count only", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
    await post({ t: await token(), sid: SID, locale: "en", mode: "personal", e: all });
    await Promise.all(afterCallbacks.map((cb) => cb()));
    expect(logged).toEqual([{ action: "xapi.dropped", target: "lti-platforms/7", data: { platformId: "7", statements: all.length } }]);
  });

  it("honours Global Privacy Control and Do Not Track", async () => {
    expect((await post({ t: await token(), sid: SID, locale: "en", mode: "personal", e: all }, { "sec-gpc": "1" })).status).toBe(204);
    expect((await post({ t: await token(), sid: SID, locale: "en", mode: "personal", e: all }, { dnt: "1" })).status).toBe(204);
    expect(afterCallbacks).toHaveLength(0);
  });

  it("is off unless XAPI_ENABLED=1, and refuses launches without xAPI or forged tokens", async () => {
    delete process.env.XAPI_ENABLED;
    expect((await post({ t: await token(), sid: SID, locale: "en", mode: "personal", e: all })).status).toBe(404);
    process.env.XAPI_ENABLED = "1";
    expect((await post({ t: await token(false), sid: SID, locale: "en", mode: "personal", e: all })).status).toBe(403);
    expect((await post({ t: "forged.token.here", sid: SID, locale: "en", mode: "personal", e: all })).status).toBe(403);
    expect((await post({ t: await token(), sid: SID, locale: "fr", mode: "personal", e: all })).status).toBe(400);
    expect(afterCallbacks).toHaveLength(0);
  });

  it("refuses any actor id that is not a random UUID", async () => {
    for (const sid of [undefined, "", "student-8842", "priya@school.example", "00000000-0000-0000-0000-000000000000"]) {
      expect((await post({ t: await token(), sid, locale: "en", mode: "personal", e: all })).status).toBe(400);
    }
    expect(afterCallbacks).toHaveLength(0);
  });
});
