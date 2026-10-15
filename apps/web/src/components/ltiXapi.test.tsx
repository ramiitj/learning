import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { launchToken, useLtiXapi } from "./ltiXapi";

const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const fakeToken = (claims: Record<string, unknown>) => `${b64({ alg: "HS256" })}.${b64({ l: "what-is-a-model", x: true, exp: Math.floor(Date.now() / 1000) + 3600, ...claims })}.sig`;

let beacon: ReturnType<typeof vi.fn>;
let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  sessionStorage.clear();
  beacon = vi.fn(() => true);
  fetchSpy = vi.fn(async () => new Response(null));
  Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
  Object.defineProperty(navigator, "doNotTrack", { value: "0", configurable: true });
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

// jsdom's Blob has no text(); FileReader reads it.
const readBlob = (b: Blob) => new Promise<string>((res) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result));
  r.readAsText(b);
});
const sentBodies = async () => Promise.all(beacon.mock.calls.map(([, blob]) => readBlob(blob as Blob).then(JSON.parse)));

describe("useLtiXapi", () => {
  it("does nothing at all for lessons not launched from an LMS", () => {
    const { result, unmount } = renderHook(() => useLtiXapi({ lessonId: "what-is-a-model", locale: "en", mode: "personal" }));
    result.current({ type: "start", returning: false });
    result.current({ type: "answer", blockId: "b", component: "choice", choice: "o1", correct: true });
    unmount();
    window.dispatchEvent(new Event("pagehide"));
    expect(beacon).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("ignores tokens for another lesson, without xAPI, or expired", () => {
    window.history.replaceState(null, "", `/en/lessons/what-is-a-model?lti=${fakeToken({ l: "other" })}`);
    expect(launchToken("what-is-a-model")).toBeNull();
    window.history.replaceState(null, "", `/en/lessons/what-is-a-model?lti=${fakeToken({ x: false })}`);
    expect(launchToken("what-is-a-model")).toBeNull();
    window.history.replaceState(null, "", `/en/lessons/what-is-a-model?lti=${fakeToken({ exp: 1 })}`);
    expect(launchToken("what-is-a-model")).toBeNull();
  });

  it("batches the launch's moments with ids only, including events that arrive before its own effects run", async () => {
    const t = fakeToken({});
    window.history.replaceState(null, "", `/en/lessons/what-is-a-model?lti=${t}`);
    const { result, unmount } = renderHook(() => useLtiXapi({ lessonId: "what-is-a-model", locale: "hi", mode: "classroom" }));
    result.current({ type: "start", returning: false });
    result.current({ type: "start", returning: true });
    result.current({ type: "act", blockId: "b1", component: "knob" });
    result.current({ type: "answer", blockId: "b2", component: "choice", choice: "o1", correct: false });
    result.current({ type: "post-check", itemId: "pc", correct: true, firstTry: false });
    result.current({ type: "glossary", termId: "model" });
    unmount();
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0]?.[0]).toBe("/api/lti/xapi");
    const [body] = await sentBodies();
    expect(body.sid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(body.sid).toBe(sessionStorage.getItem("lm-lti-sid"));
    expect(body).toEqual({ t, sid: body.sid, locale: "hi", mode: "classroom", e: [{ type: "start" }, { type: "act", blockId: "b1" }, { type: "answer", blockId: "b2", choice: "o1", correct: false }] });
    // The token stays in this tab only, so in-frame navigation keeps it.
    expect(sessionStorage.getItem("lm-lti")).toBe(t);
  });

  it("sends nothing when Do Not Track or Global Privacy Control is on", () => {
    window.history.replaceState(null, "", `/en/lessons/what-is-a-model?lti=${fakeToken({})}`);
    Object.defineProperty(navigator, "doNotTrack", { value: "1", configurable: true });
    const { result, unmount } = renderHook(() => useLtiXapi({ lessonId: "what-is-a-model", locale: "en", mode: "personal" }));
    result.current({ type: "start", returning: false });
    unmount();
    expect(beacon).not.toHaveBeenCalled();
    Object.defineProperty(navigator, "doNotTrack", { value: "0", configurable: true });
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true });
    const second = renderHook(() => useLtiXapi({ lessonId: "what-is-a-model", locale: "en", mode: "personal" }));
    second.result.current({ type: "start", returning: false });
    second.unmount();
    expect(beacon).not.toHaveBeenCalled();
    Object.defineProperty(navigator, "globalPrivacyControl", { value: false, configurable: true });
  });
});
