import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAnonymousAnalytics } from "./analytics";

let beacon: ReturnType<typeof vi.fn>;
beforeEach(() => {
  beacon = vi.fn(() => true);
  Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
});
afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(navigator, "doNotTrack", { value: "0", configurable: true });
});

const read = (b: Blob) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsText(b); });
const sent = async () => JSON.parse(await read(beacon.mock.calls[0]![1] as Blob)) as { counts: [string, string, number][] };

describe("anonymous analytics for pre-checks", () => {
  it("counts a pre-check as an anonymous right/wrong tally", async () => {
    const { result, unmount } = renderHook(() => useAnonymousAnalytics({ lessonId: "l", locale: "en", mode: "personal", enabled: true }));
    result.current({ type: "pre-check", itemId: "pre1", correct: true });
    unmount();
    expect((await sent()).counts).toEqual([["pre", "pre1:1", 1]]);
  });

  it("sends nothing when Do Not Track is on", () => {
    Object.defineProperty(navigator, "doNotTrack", { value: "1", configurable: true });
    const { result, unmount } = renderHook(() => useAnonymousAnalytics({ lessonId: "l", locale: "en", mode: "personal", enabled: true }));
    result.current({ type: "pre-check", itemId: "pre1", correct: false });
    unmount();
    expect(beacon).not.toHaveBeenCalled();
  });
});
