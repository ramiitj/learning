// @vitest-environment node
import { describe, expect, it } from "vitest";
import { OriginUnavailableError, resolveOrigin } from "./origin";

const prod = { NODE_ENV: "production" };

describe("resolveOrigin (one origin for passkeys, OAuth, MCP, LTI and links)", () => {
  it("uses APP_ORIGIN when set, normalised to an origin, with the rpID as its hostname", () => {
    expect(resolveOrigin({ ...prod, APP_ORIGIN: "https://learn.example.in/" })).toEqual({ origin: "https://learn.example.in", rpID: "learn.example.in", source: "APP_ORIGIN" });
  });

  it("prefers APP_ORIGIN over the Vercel preview URL", () => {
    expect(resolveOrigin({ ...prod, APP_ORIGIN: "https://learn.example.in", VERCEL_ENV: "preview", VERCEL_URL: "x.vercel.app" }).origin).toBe("https://learn.example.in");
  });

  it("on a Vercel preview uses the stable branch URL, else the deployment URL, always https", () => {
    expect(resolveOrigin({ ...prod, VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "lm-git-feat-x.vercel.app", VERCEL_URL: "lm-abc123.vercel.app" })).toEqual({ origin: "https://lm-git-feat-x.vercel.app", rpID: "lm-git-feat-x.vercel.app", source: "vercel-preview" });
    expect(resolveOrigin({ ...prod, VERCEL_ENV: "preview", VERCEL_URL: "lm-abc123.vercel.app" }).origin).toBe("https://lm-abc123.vercel.app");
  });

  it("never uses VERCEL_URL outside a preview: production without APP_ORIGIN fails closed", () => {
    expect(() => resolveOrigin({ ...prod, VERCEL_ENV: "production", VERCEL_URL: "lm-abc123.vercel.app" })).toThrow(OriginUnavailableError);
    expect(() => resolveOrigin(prod)).toThrow(/APP_ORIGIN is not set in production/);
  });

  it("refuses a malformed preview host rather than building an origin from it", () => {
    for (const bad of ["evil.com/path", "https://x.vercel.app", "a@b.vercel.app", "x.vercel.app:8443", "localhost", ""]) {
      expect(() => resolveOrigin({ ...prod, VERCEL_ENV: "preview", VERCEL_URL: bad })).toThrow(OriginUnavailableError);
    }
  });

  it("falls back to localhost only outside production", () => {
    expect(resolveOrigin({ NODE_ENV: "development" })).toEqual({ origin: "http://localhost:3000", rpID: "localhost", source: "development" });
    expect(resolveOrigin({ NODE_ENV: "test" }).origin).toBe("http://localhost:3000");
    expect(resolveOrigin({}).origin).toBe("http://localhost:3000");
  });

  it("rejects an APP_ORIGIN that is http (except an explicit localhost) or carries a path, query or credentials", () => {
    expect(() => resolveOrigin({ ...prod, APP_ORIGIN: "http://learn.example.in" })).toThrow(/https/);
    expect(() => resolveOrigin({ ...prod, APP_ORIGIN: "http://10.0.0.5:3000" })).toThrow(/https/);
    // `next start` in CI sets APP_ORIGIN=http://localhost:3000 explicitly; that is allowed, never defaulted.
    expect(resolveOrigin({ ...prod, APP_ORIGIN: "http://localhost:3000" }).origin).toBe("http://localhost:3000");
    expect(() => resolveOrigin({ ...prod, APP_ORIGIN: "https://learn.example.in/console" })).toThrow(/origin only/);
    expect(() => resolveOrigin({ ...prod, APP_ORIGIN: "https://learn.example.in?x=1" })).toThrow(/origin only/);
    expect(() => resolveOrigin({ ...prod, APP_ORIGIN: "https://u:p@learn.example.in" })).toThrow(/origin only/);
    expect(() => resolveOrigin({ ...prod, APP_ORIGIN: "not a url" })).toThrow(/not a URL/);
    expect(resolveOrigin({ NODE_ENV: "development", APP_ORIGIN: "http://localhost:3100" }).origin).toBe("http://localhost:3100");
  });
});
