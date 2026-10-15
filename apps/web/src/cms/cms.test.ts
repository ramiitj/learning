// @vitest-environment node
/**
 * Integration tests for the CMS's rules, against a real Postgres database.
 * Run with TEST_DATABASE_URI set (CI provides one); skipped otherwise.
 * The database is wiped first.
 */
import { beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import type { Payload } from "payload";
import { readFileSync } from "node:fs";
import path from "node:path";

const DB = process.env.TEST_DATABASE_URI;
const lessonDoc = () => JSON.parse(readFileSync(path.resolve(import.meta.dirname, "../../../../content/lessons/every-primitive.json"), "utf8"));

describe.skipIf(!DB)("CMS rules", () => {
  let payload: Payload;
  let creator: Record<string, unknown>;
  const agent = (agentId: string) => ({ id: 0, role: "agent", agentId, collection: "users" }) as never;
  const fresh = () => ({ ...creator, authTime: Math.floor(Date.now() / 1000) }) as never;
  const stale = () => ({ ...creator, authTime: Math.floor(Date.now() / 1000) - 3600 }) as never;
  let lessonId: number | string;

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
    const l = await payload.create({ collection: "lessons", data: { lessonId: "every-primitive", doc: lessonDoc(), _status: "draft" }, user: creator as never, overrideAccess: false, draft: true });
    lessonId = l.id;
  }, 120_000);

  it("validates every save and stores the report", async () => {
    const l = await payload.findByID({ collection: "lessons", id: lessonId, draft: true, overrideAccess: true });
    expect((l.validation as { passed: boolean }).passed).toBe(true);
  });

  it("lets the Localisation Specialist change Hindi strings, and nothing else", async () => {
    const doc = lessonDoc();
    doc.strings.hi.title = "नया शीर्षक";
    await expect(payload.update({ collection: "lessons", id: lessonId, data: { doc }, user: agent("localisation-specialist"), overrideAccess: false, draft: true })).resolves.toBeTruthy();
    doc.strings.en.title = "A new English title";
    await expect(payload.update({ collection: "lessons", id: lessonId, data: { doc }, user: agent("localisation-specialist"), overrideAccess: false, draft: true })).rejects.toThrow(/may only change/);
  });

  it("never lets a reviewer agent write", async () => {
    await expect(payload.update({ collection: "lessons", id: lessonId, data: { doc: lessonDoc() }, user: agent("accuracy-safety-reviewer"), overrideAccess: false, draft: true })).rejects.toThrow();
  });

  it("never lets an agent publish, and makes the creator confirm with a passkey first", async () => {
    await expect(payload.update({ collection: "lessons", id: lessonId, data: { _status: "published" }, user: agent("editor-in-chief"), overrideAccess: false })).rejects.toThrow(/passkey/);
    await expect(payload.update({ collection: "lessons", id: lessonId, data: { _status: "published" }, user: stale(), overrideAccess: false })).rejects.toThrow(/passkey/);
    const ok = await payload.update({ collection: "lessons", id: lessonId, data: { _status: "published" }, user: fresh(), overrideAccess: false });
    expect(ok._status).toBe("published");
  });

  it("never lets an agent unpublish, though it may save drafts beside the published lesson", async () => {
    await expect(payload.update({ collection: "lessons", id: lessonId, data: { _status: "draft" }, user: agent("learning-experience-designer"), overrideAccess: false })).rejects.toThrow(/Only the creator/);
    await payload.update({ collection: "lessons", id: lessonId, data: { doc: lessonDoc(), _status: "draft" }, user: agent("learning-experience-designer"), overrideAccess: false, draft: true });
    const { docs } = await payload.find({ collection: "lessons", overrideAccess: false, user: null as never });
    expect(docs.map((d) => d.lessonId)).toContain("every-primitive");
  });

  it("refuses to publish a lesson that fails validation", async () => {
    const broken = lessonDoc();
    broken.stages = broken.stages.filter((s: { stage: string }) => s.stage !== "break-it");
    await expect(payload.update({ collection: "lessons", id: lessonId, data: { doc: broken, _status: "published" }, user: fresh(), overrideAccess: false })).rejects.toThrow(/validation/);
  });

  it("shows learners published content only", async () => {
    const { docs } = await payload.find({ collection: "lessons", overrideAccess: false, user: null as never });
    expect(docs.every((d) => d._status === "published")).toBe(true);
  });

  it("keeps an append-only event log the database itself protects", async () => {
    const { totalDocs } = await payload.count({ collection: "events", overrideAccess: true });
    expect(totalDocs).toBeGreaterThan(0);
    const c = new pg.Client({ connectionString: DB });
    await c.connect();
    await expect(c.query("UPDATE events SET action = 'tampered'")).rejects.toThrow(/append-only/);
    await expect(c.query("DELETE FROM events")).rejects.toThrow(/append-only/);
    await c.end();
  });

  it("lets only the creator decide, with a reason, after reading any dissent", async () => {
    const d = await payload.create({ collection: "decisions", data: { title: "Override", kind: "conflict", status: "approved", summary: "s", dissent: "The reviewer says this is false." }, user: agent("editor-in-chief"), overrideAccess: false });
    await expect(payload.update({ collection: "decisions", id: d.id, data: { status: "approved", decisionReason: "fine" }, user: agent("editor-in-chief"), overrideAccess: false })).rejects.toThrow();
    await expect(payload.update({ collection: "decisions", id: d.id, data: { status: "approved", decisionReason: "fine" }, user: fresh(), overrideAccess: false })).rejects.toThrow(/dissent/);
    const ok = await payload.update({ collection: "decisions", id: d.id, data: { status: "approved", decisionReason: "fine", dissentAcknowledged: true }, user: fresh(), overrideAccess: false });
    expect(ok.status).toBe("approved");
  });

  it("publishes a requested draft only when the creator approves it with a fresh passkey", async () => {
    const draftDoc = lessonDoc();
    draftDoc.strings.en["hook.q"] = "A changed question?";
    await payload.update({ collection: "lessons", id: lessonId, data: { doc: draftDoc, _status: "draft" }, user: fresh(), overrideAccess: false, draft: true });
    const d = await payload.create({ collection: "decisions", data: { title: "Publish", kind: "publish", status: "open", summary: "s", target: `lessons/${lessonId}` }, user: agent("editor-in-chief"), overrideAccess: false });
    await expect(payload.update({ collection: "decisions", id: d.id, data: { status: "approved", decisionReason: "ok" }, user: stale(), overrideAccess: false })).rejects.toThrow(/passkey/);
    const live = () => payload.find({ collection: "lessons", where: { lessonId: { equals: "every-primitive" } }, overrideAccess: false, user: null as never });
    expect(((await live()).docs[0]!.doc as { strings: { en: Record<string, string> } }).strings.en["hook.q"]).not.toBe("A changed question?");
    await payload.update({ collection: "decisions", id: d.id, data: { status: "approved", decisionReason: "ok" }, user: fresh(), overrideAccess: false });
    expect(((await live()).docs[0]!.doc as { strings: { en: Record<string, string> } }).strings.en["hook.q"]).toBe("A changed question?");
  });

  it("runs the agent pipeline through the CMS, each agent within its own permissions", async () => {
    const { advance } = await import("@lm/orchestrator");
    const { fakeClient } = await import("@lm/orchestrator/testing");
    const { cmsPipelineStore, runFromDoc } = await import("@/pipeline/store");
    for (const agentId of ["editor-in-chief", "curriculum-instructional-designer", "learning-experience-designer", "analogy-specialist", "localisation-specialist", "educator-enablement", "accuracy-safety-reviewer", "novice-learner-panel"]) {
      await payload.create({ collection: "users", data: { name: agentId, role: "agent", agentId }, overrideAccess: true, context: { system: true } });
      await payload.create({ collection: "agents", data: { agentId, enabled: true }, overrideAccess: true, context: { system: true } });
    }
    await payload.create({ collection: "audiences", data: { audienceId: "school-13-17", label: "School", profile: { id: "school-13-17", maxSentenceWords: 18 } }, overrideAccess: true, context: { system: true } });
    const doc = await payload.create({ collection: "pipeline-runs", data: { title: "Pipeline test", request: "A lesson on how a junk filter decides", stage: "plan", status: "queued" }, user: fresh(), overrideAccess: false });
    const store = cmsPipelineStore(payload, doc.id);
    let run = runFromDoc({ ...doc, id: doc.id } as never);
    const calls: string[] = [];
    for (let i = 0; i < 30 && !["waiting-for-creator", "failed", "paused"].includes(run.status); i++) run = await advance(run, { store, client: fakeClient({}, calls) });
    expect(run.steps.filter((s) => s.agent === "orchestrator")).toEqual([]);
    expect(run.status).toBe("waiting-for-creator");

    // Learners still see the version the creator published in the previous test...
    const live = await payload.find({ collection: "lessons", where: { lessonId: { equals: "every-primitive" } }, overrideAccess: false, user: null as never });
    expect((live.docs[0]!.doc as { strings: { en: Record<string, string> } }).strings.en["hook.q"]).toBe("A changed question?");
    // ...while the agents' work waits as a draft, with machine-drafted Hindi and Telugu.
    const latest = await payload.findByID({ collection: "lessons", id: live.docs[0]!.id, draft: true, overrideAccess: true });
    expect(latest._status).toBe("draft");
    expect((latest.doc as { strings: { en: Record<string, string>; hi: Record<string, string> } }).strings.en["hook.q"]).not.toBe("A changed question?");
    expect((latest.doc as { strings: { hi: Record<string, string> } }).strings.hi["hook.q"]).toContain("अनुवाद");
    const decisions = await payload.find({ collection: "decisions", where: { kind: { equals: "publish" }, requestedBy: { equals: "editor-in-chief" } }, overrideAccess: true });
    expect(decisions.totalDocs).toBe(1);
    const agentEvents = await payload.find({ collection: "events", where: { actorKind: { equals: "agent" } }, limit: 500, overrideAccess: true });
    expect(new Set(agentEvents.docs.map((e) => e.actorId))).toEqual(new Set(["editor-in-chief", "curriculum-instructional-designer", "analogy-specialist", "learning-experience-designer", "localisation-specialist", "accuracy-safety-reviewer", "novice-learner-panel", "educator-enablement"]));
    const saved = await payload.findByID({ collection: "pipeline-runs", id: doc.id, overrideAccess: true });
    expect(saved.status).toBe("waiting-for-creator");
    expect(saved.costUsd).toBeGreaterThan(0);
  });
});
