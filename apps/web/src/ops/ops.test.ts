// @vitest-environment node
/**
 * Reliability and ownership: scrubbing, the zip writer, error monitoring,
 * problem reports, incidents and the full export. The integration part runs
 * against its own database (created beside TEST_DATABASE_URI) and is skipped
 * when that is not set.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import pg from "pg";
import type { Payload } from "payload";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { overdueIncidents } from "./incidents";
import { scrubRoute, scrubStack, scrubText } from "./scrub";
import { ZipWriter, crc32 } from "./zip";

vi.mock("next/headers", () => ({ headers: async () => new Headers(globalThis.__testCookie ? { cookie: globalThis.__testCookie } : {}) }));

// unstable_cache needs Next's runtime; the lesson list is the one thing the report route takes from it.
vi.mock("@/lib/content", () => ({ listLessonIds: async () => ["every-primitive"] }));

const BASE = process.env.TEST_DATABASE_URI;
const lessonDoc = () => JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../../../../content/lessons/every-primitive.json"), "utf8"));

/** Reads a zip written by ZipWriter (central directory), independently of the writer's code. */
function unzip(buf: Buffer): Map<string, Buffer> {
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const n = buf.readUInt16LE(end + 10);
  let p = buf.readUInt32LE(end + 16);
  const files = new Map<string, Buffer>();
  for (let i = 0; i < n; i++) {
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const off = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString("utf8");
    const dataStart = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
    const raw = buf.subarray(dataStart, dataStart + csize);
    const data = method === 8 ? inflateRawSync(raw) : Buffer.from(raw);
    expect(crc32(data)).toBe(crc);
    files.set(name, data);
    p += 46 + nameLen;
  }
  return files;
}

describe("scrubbing", () => {
  it("removes emails, numbers and query strings, and truncates", () => {
    const s = scrubText("Failed for asha.k@school.in with phone 98765 43210 at /lessons/x?token=abc123&name=Asha#frag");
    expect(s).not.toMatch(/asha|@|98765|abc123|Asha|frag/);
    expect(scrubText("word ".repeat(1000))).toHaveLength(200);
    expect(scrubText("a".repeat(40))).toBe("[token]");
    expect(scrubRoute("/en/lessons/abc?name=Asha#top")).toBe("/en/lessons/abc");
    expect(scrubStack("Error: x@y.com\n    at f (file.js:10:5)\n".repeat(20)).split("\n").length).toBeLessThanOrEqual(6);
  });
  it("flags only serious incidents overdue for the schools", () => {
    const old = new Date(Date.now() - 49 * 3600_000).toISOString();
    const recent = new Date(Date.now() - 3600_000).toISOString();
    const list = [
      { id: 1, title: "a", severity: "serious", createdAt: old },
      { id: 2, title: "b", severity: "serious", createdAt: recent },
      { id: 3, title: "c", severity: "minor", createdAt: old },
      { id: 4, title: "d", severity: "serious", createdAt: old, schoolsInformedAt: recent },
    ];
    expect(overdueIncidents(list).map((i) => i.id)).toEqual([1]);
  });
});

describe("zip writer", () => {
  it("round-trips files, including non-ASCII names and large content", () => {
    const z = new ZipWriter();
    const big = Buffer.from("नमस्ते ".repeat(5000));
    const out = Buffer.concat([z.file("a/b.json", Buffer.from('{"x":1}')), z.file("हिंदी.md", big), z.file("empty.txt", Buffer.alloc(0)), z.finish()]);
    const files = unzip(out);
    expect([...files.keys()]).toEqual(["a/b.json", "हिंदी.md", "empty.txt"]);
    expect(files.get("हिंदी.md")!.equals(big)).toBe(true);
    const dir = mkdtempSync(path.join(tmpdir(), "zip-"));
    writeFileSync(path.join(dir, "t.zip"), out);
    try {
      execFileSync("unzip", ["-tqq", path.join(dir, "t.zip")]);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; // unzip not installed: the independent reader above still checked it
    }
  });
});

describe.skipIf(!BASE)("reliability against a real database", () => {
  let payload: Payload;
  let creator: { id: number | string } & Record<string, unknown>;
  let adminUrl: string;
  const dbName = "lm_ops_test";
  let cookie = "";
  const SECRET = { cred: "CRED-SECRET-ID-123", pub: "PUBKEY-SECRET-456", refresh: "REFRESH-HASH-789", votePart: "PARTICIPANT-HASH-321" };

  beforeAll(async () => {
    const u = new URL(BASE!);
    u.pathname = "/postgres";
    adminUrl = u.toString();
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${dbName}`);
    await admin.end();
    u.pathname = `/${dbName}`;
    process.env.DATABASE_URI = u.toString();
    process.env.PAYLOAD_SECRET ??= "test-secret-test-secret-test-secret-123";
    const { getPayload } = await import("payload");
    const { default: config } = await import("@payload-config");
    payload = await getPayload({ config });
    const sys = { overrideAccess: true, context: { system: true } } as const;
    creator = { ...(await payload.create({ collection: "users", data: { name: "Creator", role: "creator", passkeys: [{ credentialId: SECRET.cred, publicKey: SECRET.pub, counter: 1 }] }, ...sys })) } as never;
    const fresh = { ...creator, collection: "users", authTime: Math.floor(Date.now() / 1000) } as never;
    const l = await payload.create({ collection: "lessons", data: { lessonId: "every-primitive", doc: lessonDoc(), _status: "draft" }, user: fresh, overrideAccess: false, draft: true });
    await payload.update({ collection: "lessons", id: l.id, data: { _status: "published" }, user: fresh, overrideAccess: false });
    await payload.create({ collection: "oauth-grants", data: { kind: "refresh-token", tokenHash: SECRET.refresh, expiresAt: new Date(Date.now() + 1e9).toISOString() }, ...sys });
    const session = await payload.create({ collection: "classroom-sessions", data: { code: "ABC123", lessonId: "every-primitive", locale: "en", hostKeyHash: "hh", revision: 0, expiresAt: new Date(Date.now() + 1e9).toISOString() }, ...sys });
    await payload.create({ collection: "classroom-votes", data: { session: session.id, blockId: "b", choice: "a", participant: SECRET.votePart }, ...sys });
    await payload.create({ collection: "glossary", data: { termId: "model", locale: "en", term: "Model", definition: "d", _status: "draft" }, ...sys });
    const { signSession } = await import("@/auth/session");
    globalThis.__testCookie = "";
    cookie = `lm-creator=${await signSession(creator.id)}`;
  }, 180_000);

  // The Payload pool stays open until the process ends, so the database is dropped at the start of the next run instead.

  async function readStream(s: ReadableStream<Uint8Array>) {
    const chunks: Buffer[] = [];
    const r = s.getReader();
    for (;;) {
      const { done, value } = await r.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }

  it("exports everything in open formats, with a checksummed manifest, and no secrets", async () => {
    const { exportStream } = await import("@/ops/export");
    const req = { payload, user: { ...creator, collection: "users" }, context: {} } as never;
    const files = unzip(await readStream(exportStream(payload, req)));
    const names = [...files.keys()];
    for (const expected of ["manifest.json", "collections/lessons/latest-0001.json", "collections/lessons/published-0001.json", "collections/lessons/versions-0001.json", "collections/glossary/latest-0001.json", "collections/events/latest-0001.json", "collections/feedback/latest-0001.json", "collections/decisions/latest-0001.json", "collections/pipeline-runs/latest-0001.json", "collections/agents/latest-0001.json", "collections/media/latest-0001.json", "collections/concepts/latest-0001.json", "collections/teacher-guides/latest-0001.json", "collections/analogies/latest-0001.json", "collections/detours/latest-0001.json", "collections/incidents/latest-0001.json", "collections/errors/latest-0001.json", "globals/constitution.json", "globals/autonomy.json", "globals/budget.json", "repository/docs/12-operations.md", "repository/platform/constitution.md"]) expect(names, expected).toContain(expected);
    // Nothing from the excluded collections, and no credential material anywhere.
    expect(names.some((n) => /oauth-grants|classroom-sessions|classroom-votes/.test(n))).toBe(false);
    const all = Buffer.concat([...files.values()]).toString("utf8");
    for (const secret of Object.values(SECRET)) expect(all).not.toContain(secret);
    expect(all).not.toMatch(/publicKey|credentialId|tokenHash|refresh-token|hostKeyHash/);
    // The creator is exported without credentials.
    const users = JSON.parse(files.get("collections/users/latest-0001.json")!.toString());
    expect(users[0]).toMatchObject({ name: "Creator", role: "creator" });
    expect(users[0].passkeys).toBeUndefined();
    // The manifest lists every other file with a correct sha256.
    const manifest = JSON.parse(files.get("manifest.json")!.toString());
    expect(manifest.files).toHaveLength(names.length - 1);
    for (const f of manifest.files) expect(createHash("sha256").update(files.get(f.path)!).digest("hex")).toBe(f.sha256);
    expect(manifest.counts.lessons).toBeGreaterThan(0);
    // And the export is in the event log.
    const ev = await payload.find({ collection: "events", where: { action: { equals: "export.created" } }, overrideAccess: true });
    expect(ev.totalDocs).toBe(1);
    expect(ev.docs[0]!.actorKind).toBe("creator");
  }, 120_000);

  it("GET /api/export refuses the public, agents and a stale passkey confirmation, and serves the creator", async () => {
    const { GET } = await import("@/app/api/export/route");
    const { signSession } = await import("@/auth/session");
    globalThis.__testCookie = "";
    expect((await GET()).status).toBe(403);
    const agent = await payload.create({ collection: "users", data: { name: "A", role: "agent", agentId: "editor-in-chief" }, overrideAccess: true, context: { system: true } });
    globalThis.__testCookie = `lm-creator=${await signSession(agent.id)}`;
    expect((await GET()).status).toBe(403);
    globalThis.__testCookie = `lm-creator=${await signSession(creator.id, Math.floor(Date.now() / 1000) - 3600)}`;
    const stale = await GET();
    expect(stale.status).toBe(403);
    expect((await payload.find({ collection: "events", where: { action: { equals: "export.refused" } }, overrideAccess: true })).totalDocs).toBe(1);
    globalThis.__testCookie = cookie;
    const ok = await GET();
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("application/zip");
    expect(unzip(await readStream(ok.body!)).has("manifest.json")).toBe(true);
  }, 120_000);

  it("groups errors by fingerprint, files an incident decision for a new one and for a spike, and alerts without learner data", async () => {
    const { recordError } = await import("@/ops/errors");
    const hook = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", hook);
    process.env.ALERT_WEBHOOK_URL = "https://alerts.example/hook";
    const err = { source: "client" as const, message: "TypeError: x is undefined for kid@school.in on page 12", stack: "TypeError\n    at f (a.js:1:2)", route: "/en/lessons/x?name=Asha" };
    const first = await recordError(payload, err);
    expect(first.isNew).toBe(true);
    const decisions = () => payload.find({ collection: "decisions", where: { kind: { equals: "incident" } }, overrideAccess: true });
    expect((await decisions()).totalDocs).toBe(1);
    expect(hook).toHaveBeenCalledTimes(1);
    const body = String((hook.mock.calls[0] as unknown[])[1] ? ((hook.mock.calls[0] as unknown[])[1] as { body: string }).body : "");
    expect(body).not.toMatch(/kid@|Asha|school\.in/);
    for (let i = 0; i < 25; i++) await recordError(payload, err);
    const rows = await payload.find({ collection: "errors", overrideAccess: true });
    expect(rows.totalDocs).toBe(1);
    expect(rows.docs[0]!.count).toBe(26);
    expect(rows.docs[0]!.route).toBe("/en/lessons/x");
    expect(rows.docs[0]!.message).not.toMatch(/kid@|\d/);
    const d = await decisions();
    expect(d.totalDocs).toBe(2); // the first sighting, and one spike (not one per occurrence)
    expect(d.docs.every((x) => x.status === "open")).toBe(true);
    const ev = await payload.find({ collection: "events", where: { action: { in: ["error.new-fingerprint", "error.spike"] } }, overrideAccess: true });
    expect(ev.docs.map((e) => e.action).sort()).toEqual(["error.new-fingerprint", "error.spike"]);
    vi.unstubAllGlobals();
    delete process.env.ALERT_WEBHOOK_URL;
  });

  it("POST /api/errors stores a scrubbed client error and rejects oversize or malformed bodies", async () => {
    const { POST } = await import("@/app/api/errors/route");
    const mk = (body: string) => new Request("http://x/api/errors", { method: "POST", body, headers: { "x-forwarded-for": "9.9.9.9" } });
    expect((await POST(mk("not json"))).status).toBe(400);
    expect((await POST(mk("x".repeat(5000)))).status).toBe(413);
    expect((await POST(mk(JSON.stringify({ source: "client", message: "Boom at 4242", stack: "", route: "/hi?x=1" })))).status).toBe(204);
    const r = await payload.find({ collection: "errors", where: { message: { contains: "Boom" } }, overrideAccess: true });
    expect(r.docs[0]).toMatchObject({ message: "Boom at #", route: "/hi", source: "client" });
  });

  it("POST /api/report creates a scrubbed feedback document, logs it, and rate-limits", async () => {
    const { POST } = await import("@/app/api/report/route");
    const mk = (over: Record<string, unknown> = {}, ip = "1.1.1.1") => new Request("http://x/api/report", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify({ role: "teacher", message: "Typo. Call me on 98765 43210 or a@b.in", lessonId: "every-primitive", locale: "en", ...over }) });
    const ok = await POST(mk());
    expect(ok.status).toBe(201);
    const fb = await payload.find({ collection: "feedback", overrideAccess: true });
    expect(fb.docs[0]!.message).not.toMatch(/98765|a@b\.in/);
    const ev = await payload.find({ collection: "events", where: { action: { equals: "feedback.create" } }, overrideAccess: true });
    expect(ev.totalDocs).toBe(1);
    for (let i = 0; i < 4; i++) await POST(mk());
    expect((await POST(mk())).status).toBe(429);
    expect((await POST(mk({ role: "x" }, "2.2.2.2"))).status).toBe(400);
    expect((await POST(mk({ lessonId: "nope" }, "3.3.3.3"))).status).toBe(404);
  });

  it("unpublishes a lesson in one update (Payload's built-in Unpublish), logged, and learners stop seeing it", async () => {
    const user = { ...creator, collection: "users", authTime: Math.floor(Date.now() / 1000) } as never;
    const live = () => payload.find({ collection: "lessons", where: { lessonId: { equals: "every-primitive" } }, overrideAccess: false, user: null as never });
    expect((await live()).totalDocs).toBe(1);
    const l = (await live()).docs[0]!;
    await payload.update({ collection: "lessons", id: l.id, data: { _status: "draft" }, user, overrideAccess: false });
    expect((await live()).totalDocs).toBe(0);
    const ev = await payload.find({ collection: "events", where: { action: { equals: "lessons.unpublish" } }, overrideAccess: true });
    expect(ev.totalDocs).toBe(1);
  });

  it("keeps incidents and errors away from everyone but the creator", async () => {
    const asAgent = { id: 0, role: "agent", agentId: "editor-in-chief", collection: "users" } as never;
    await expect(payload.find({ collection: "incidents", user: asAgent, overrideAccess: false })).rejects.toThrow();
    await expect(payload.find({ collection: "errors", user: null as never, overrideAccess: false })).rejects.toThrow();
    const inc = await payload.create({ collection: "incidents", data: { title: "Wrong fact", severity: "serious", status: "open", whatHappened: "x" }, user: { ...creator, collection: "users" } as never, overrideAccess: false });
    const ev = await payload.find({ collection: "events", where: { action: { equals: "incidents.create" } }, overrideAccess: true });
    expect(ev.docs.some((e) => e.target === `incidents/${inc.id}`)).toBe(true);
  });
});

declare global {
  var __testCookie: string | undefined;
}
