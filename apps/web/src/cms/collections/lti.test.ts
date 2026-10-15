// @vitest-environment node
/**
 * Registering an LMS decides where data may flow, so it is the creator's
 * alone (always-ask: learner-data-change, permission-change). These checks
 * are the tool-level enforcement: agents, reviewers and the public are
 * refused by the collection's access rules, and the creator must have
 * confirmed with a passkey in the last few minutes to create or change one.
 */
import { describe, expect, it } from "vitest";
import type { CollectionBeforeChangeHook, FieldHook } from "payload";
import permissions from "../../../../../platform/config/permissions.json" with { type: "json" };
import { LtiNonces, LtiPlatforms } from "./Lti";
import { decryptSecret, isEncrypted } from "../../lti/secret";

process.env.PAYLOAD_SECRET ??= "test-secret-test-secret-test-secret-123";
const now = () => Math.floor(Date.now() / 1000);
const req = (user: Record<string, unknown> | null) => ({ user, context: {} }) as never;
const creatorFresh = { id: 1, role: "creator", authTime: now() };
const creatorStale = { id: 1, role: "creator", authTime: now() - 3600 };
const agents = Object.keys(permissions.agents);
const ops = ["read", "create", "update", "delete"] as const;
const call = (fn: unknown, user: Record<string, unknown> | null) => (fn as (a: { req: never }) => unknown)({ req: req(user) });

describe("lti-platforms access", () => {
  it("refuses every agent, reviewers and the public, for every operation", () => {
    expect(agents.length).toBeGreaterThan(0);
    for (const op of ops) {
      for (const agentId of agents) expect(call(LtiPlatforms.access![op], { id: 0, role: "agent", agentId }), `${agentId} ${op}`).toBe(false);
      expect(call(LtiPlatforms.access![op], { id: 2, role: "reviewer", reviewerLocales: ["hi"] })).toBe(false);
      expect(call(LtiPlatforms.access![op], null)).toBe(false);
      expect(call(LtiPlatforms.access![op], creatorFresh)).toBe(true);
    }
  });

  it("makes the creator confirm with a passkey before registering or changing a platform", async () => {
    const hook = LtiPlatforms.hooks!.beforeChange![0] as CollectionBeforeChangeHook;
    const run = (user: Record<string, unknown>) => Promise.resolve().then(() => hook({ data: { name: "x" }, req: req(user), operation: "create" } as never));
    await expect(run(creatorStale)).rejects.toThrow(/passkey/);
    await expect(run({ id: 0, role: "agent", agentId: agents[0] })).rejects.toThrow(/passkey/);
    await expect(run(creatorFresh)).resolves.toEqual({ name: "x" });
  });

  it("never lets anyone read the LRS secret, and stores it encrypted", () => {
    const fields = JSON.stringify(LtiPlatforms.fields, (_k, v) => (typeof v === "function" ? "fn" : v));
    expect(fields).toContain("lrsSecret");
    const collapsible = LtiPlatforms.fields.find((f) => f.type === "collapsible") as { fields: { name?: string; access?: { read?: () => boolean }; hooks?: { beforeChange?: FieldHook[] } }[] };
    const secret = collapsible.fields.find((f) => f.name === "lrsSecret")!;
    expect(secret.access?.read?.()).toBe(false);
    const encrypt = secret.hooks!.beforeChange![0]!;
    const stored = encrypt({ value: "lrs-password", originalDoc: {} } as never) as string;
    expect(isEncrypted(stored)).toBe(true);
    expect(stored).not.toContain("lrs-password");
    expect(decryptSecret(stored)).toBe("lrs-password");
    // An empty value keeps what is stored.
    expect(encrypt({ value: "", originalDoc: { lrsSecret: stored } } as never)).toBe(stored);
  });

  it("is off by default when registered", () => {
    const enabled = LtiPlatforms.fields.find((f) => "name" in f && f.name === "enabled") as { defaultValue?: unknown };
    expect(enabled.defaultValue).toBe(false);
  });

  it("keeps used nonces out of everyone's reach", () => {
    for (const op of ops) expect(call(LtiNonces.access![op], creatorFresh)).toBe(false);
  });
});
