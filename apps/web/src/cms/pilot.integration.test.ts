// @vitest-environment node
/**
 * Pilot report against a real Postgres database (own database, wiped first).
 * Run with TEST_DATABASE_URI=postgres://lm:lm@localhost/lm_pilot; skipped otherwise.
 */
import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import type { Payload } from "payload";
import { readFileSync } from "node:fs";
import path from "node:path";

const DB = process.env.TEST_DATABASE_URI;
const lessonDoc = () => JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../../../../content/lessons/every-primitive.json"), "utf8"));

describe.skipIf(!DB)("pilot report", () => {
  let payload: Payload;
  let creator: Record<string, unknown>;
  const fresh = () => ({ ...creator, authTime: Math.floor(Date.now() / 1000) });
  const stale = () => ({ ...creator, authTime: Math.floor(Date.now() / 1000) - 3600 });
  const reqOf = (user: unknown) => ({ payload, user, context: {} }) as never;
  const today = new Date().toISOString().slice(0, 10);
  const range = { from: "2020-01-01", to: today };

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
    await payload.create({ collection: "lessons", data: { lessonId: "every-primitive", doc: lessonDoc(), _status: "draft" }, user: creator as never, overrideAccess: false, draft: true });
    const day = today;
    const seed = async (metric: string, key: string, count: number) => payload.db.drizzle.execute((await import("@payloadcms/db-postgres")).sql`INSERT INTO analytics_daily (day, lesson_id, locale, mode, metric, key, count, updated_at, created_at) VALUES (${day}, 'every-primitive', 'en', 'personal', ${metric}, ${key}, ${count}, now(), now())`);
    await seed("start", "", 40);
    await seed("complete", "", 12);
    await seed("pre", "pre1:1", 4);
    await seed("pre", "pre1:0", 16);
    await seed("post", "post1:1", 15);
    await seed("post", "post1:0", 5);
    await seed("post", "post2:1", 2);
    await payload.create({ collection: "usability-findings", data: { lesson: "every-primitive", locale: "en", mode: "personal", observed: "Learner could not find the Check button. Mail me at a@b.com", severity: "blocker", source: "usability-session", suggestedChange: "Make it larger", status: "open" }, user: creator as never, overrideAccess: false });
    await payload.create({ collection: "usability-findings", data: { observed: "Text small on phones", severity: "major", source: "teacher-report", status: "open" }, user: creator as never, overrideAccess: false });
  }, 120_000);

  it("computes the gain only where both sides have 5 answers, and prioritises", async () => {
    const { loadPilotReport } = await import("./pilot-data");
    const report = await loadPilotReport(payload, range);
    const s = report.slices.find((x) => x.lessonId === "every-primitive" && x.locale === "en")!;
    expect(s.starts).toBe(40);
    expect(s.completion).toBe(30);
    const o1 = s.gains.find((g) => g.objective === "o1")!;
    expect(o1.gain).toBe(75 - 20);
    expect(s.gains.find((g) => g.objective === "o2")?.gain).toBeNull();
    expect(report.revisions[0]?.kind).toBe("blocker");
    expect(report.revisions[1]?.kind).toBe("major");
    expect(report.findings.find((f) => f.severity === "blocker")?.observed).toContain("[email removed]");
  });

  it("audits findings", async () => {
    const ev = await payload.find({ collection: "events", where: { action: { equals: "usability-findings.create" } }, overrideAccess: true });
    expect(ev.totalDocs).toBe(2);
  });

  it("refuses approval without a recent passkey confirmation, and logs the refusal", async () => {
    const { approvePilotList } = await import("./pilot-approve");
    const { loadPilotReport } = await import("./pilot-data");
    const ids = (await loadPilotReport(payload, range)).revisions.map((r) => r.id);
    expect((await approvePilotList(payload, reqOf(stale()), { ...range, ids })).error).toMatch(/passkey/);
    expect((await approvePilotList(payload, reqOf(null), { ...range, ids })).error).toMatch(/Only the creator/);
    const refused = await payload.find({ collection: "events", where: { action: { equals: "pilot-report.refused" } }, overrideAccess: true });
    expect(refused.totalDocs).toBe(2);
    const approved0 = await payload.find({ collection: "events", where: { action: { equals: "pilot-report.approved" } }, overrideAccess: true });
    expect(approved0.totalDocs).toBe(0);
  });

  it("logs pilot-report.approved with the creator's id, ignoring unknown items", async () => {
    const { approvePilotList } = await import("./pilot-approve");
    const { loadPilotReport } = await import("./pilot-data");
    const ids = (await loadPilotReport(payload, range)).revisions.map((r) => r.id);
    const out = await approvePilotList(payload, reqOf(fresh()), { ...range, ids: [ids[0]!, "bogus"] });
    expect(out.ok).toMatch(/Approved 1 of/);
    const ev = await payload.find({ collection: "events", where: { action: { equals: "pilot-report.approved" } }, overrideAccess: true });
    expect(ev.docs[0]).toMatchObject({ actorKind: "creator", actorId: String(creator.id) });
    expect((ev.docs[0]!.data as { creatorId: string; approved: string[] }).approved).toEqual([ids[0]]);
  });
});
