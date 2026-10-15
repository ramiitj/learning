// @vitest-environment node
import { describe, expect, it } from "vitest";
import { cleanName, FRESH_SECONDS, isFresh, remove, rename, summarise, type StoredPasskey } from "./passkeys";

const key = (id: string, label = id): StoredPasskey => ({ id, credentialId: `CRED-${id}`, publicKey: `PUB-${id}`, counter: 3, label, addedAt: "2026-10-01T00:00:00.000Z", lastUsedAt: null });
const now = 1_800_000_000;

describe("passkey rules", () => {
  it("lists name and dates only, never the credential id, public key or counter", () => {
    const out = summarise([key("a", "Phone"), { ...key("b"), label: null, addedAt: null }]);
    expect(out).toEqual([
      { id: "a", name: "Phone", createdAt: "2026-10-01T00:00:00.000Z", lastUsedAt: null },
      { id: "b", name: "Passkey", createdAt: null, lastUsedAt: null },
    ]);
    expect(JSON.stringify(out)).not.toMatch(/CRED-|PUB-|counter/);
  });

  it("counts a confirmation as fresh for five minutes only", () => {
    expect(isFresh(now - 10, now)).toBe(true);
    expect(isFresh(now - FRESH_SECONDS, now)).toBe(false);
    expect(isFresh(now + 60, now)).toBe(false);
    expect(isFresh(undefined, now)).toBe(false);
  });

  it("cleans names: trims, removes control and bidi characters, caps the length, refuses empty", () => {
    expect(cleanName("  YubiKey\t5C  ")).toBe("YubiKey 5C");
    expect(cleanName("a‮gnp.exe")).toBe("agnp.exe");
    expect(cleanName("x".repeat(100))).toHaveLength(60);
    expect(cleanName("   ")).toBeNull();
    expect(cleanName(42)).toBeNull();
  });

  it("renames without needing a fresh confirmation, and only an existing passkey", () => {
    const r = rename([key("a"), key("b")], "b", "Laptop");
    expect(r.ok && r.passkeys.map((k) => k.label)).toEqual(["a", "Laptop"]);
    expect(rename([key("a")], "zz", "x")).toMatchObject({ ok: false, status: 404 });
    expect(rename([key("a")], "a", "")).toMatchObject({ ok: false, status: 400 });
  });

  it("removes only with a confirmation from the last five minutes", () => {
    expect(remove([key("a"), key("b")], "a", now - FRESH_SECONDS - 1, now)).toMatchObject({ ok: false, status: 403 });
    expect(remove([key("a"), key("b")], "a", undefined, now)).toMatchObject({ ok: false, status: 403 });
    const r = remove([key("a"), key("b")], "a", now - 5, now);
    expect(r.ok && r.passkeys.map((k) => k.id)).toEqual(["b"]);
  });

  it("never removes the last passkey", () => {
    expect(remove([key("a")], "a", now - 5, now)).toMatchObject({ ok: false, status: 409 });
  });
});
