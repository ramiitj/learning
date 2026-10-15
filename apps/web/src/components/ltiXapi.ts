"use client";
import { useCallback, useEffect, useRef } from "react";
import type { LessonEvent } from "@lm/engine";

/** Same opt-out rule as the anonymous analytics (./analytics.ts): Do Not Track or Global Privacy Control means nothing is sent. */
export const optedOut = () => typeof navigator !== "undefined" && (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true);

const STORE = "lm-lti";
const SID = "lm-lti-sid";

/** The anonymous xAPI actor id: random, made in this browser tab, kept only for this tab session. */
export function anonymousSessionId(): string {
  let sid = window.sessionStorage.getItem(SID);
  if (!sid || !/^[0-9a-f-]{36}$/.test(sid)) {
    sid = crypto.randomUUID();
    window.sessionStorage.setItem(SID, sid);
  }
  return sid;
}
const BATCH = 20;

type Out = { type: string; [k: string]: unknown };

/** Reads the launch token from the URL (kept for this tab only, so in-frame navigation keeps it). Only the claims the page needs are decoded. */
export function launchToken(lessonId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lti");
    if (fromUrl) window.sessionStorage.setItem(STORE, fromUrl);
    const t = fromUrl ?? window.sessionStorage.getItem(STORE);
    if (!t) return null;
    const claims = JSON.parse(atob((t.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/"))) as { l?: string; x?: boolean; exp?: number };
    return claims.x === true && claims.l === lessonId && (claims.exp ?? 0) * 1000 > Date.now() ? t : null;
  } catch {
    return null;
  }
}

/**
 * For lessons launched from a school LMS with xAPI switched on: forwards the
 * page's learning moments, in batches, to /api/lti/xapi, which sends them to
 * that school's LRS under an anonymous per-launch id. Does nothing otherwise.
 * Sends only ids from the lesson and whether an answer was right, never
 * anything a learner typed.
 */
export function useLtiXapi(opts: { lessonId: string; locale: string; mode: "personal" | "classroom" }) {
  // Read on first use: the engine's first events can arrive before this component's effects run.
  const token = useRef<string | null | undefined>(undefined);
  const tok = useCallback(() => (token.current === undefined ? (token.current = launchToken(opts.lessonId)) : token.current), [opts.lessonId]);
  const queue = useRef<Out[]>([]);
  const started = useRef(false);

  const flush = useCallback(() => {
    const t = tok();
    if (!t || !queue.current.length) return;
    const e = queue.current;
    queue.current = [];
    if (optedOut()) return;
    const body = JSON.stringify({ t, sid: anonymousSessionId(), locale: opts.locale, mode: opts.mode, e });
    if (!navigator.sendBeacon?.("/api/lti/xapi", new Blob([body], { type: "application/json" }))) fetch("/api/lti/xapi", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => undefined);
  }, [opts.locale, opts.mode, tok]);

  const push = useCallback(
    (e: Out) => {
      if (!tok()) return;
      queue.current.push(e);
      if (queue.current.length >= BATCH) flush();
    },
    [flush, tok],
  );

  useEffect(() => {
    if (!tok()) return;
    // Completion: the last block of the lesson has been seen (as the analytics count it).
    const last = [...document.querySelectorAll<HTMLElement>(".lm-lesson .lm-block[data-block-id]")].at(-1);
    let done = false;
    const io =
      last && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              if (!done && entries.some((x) => x.isIntersecting)) {
                done = true;
                push({ type: "complete" });
              }
            },
            { threshold: 0.5 },
          )
        : null;
    if (last) io?.observe(last);
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [tok, flush, push]);

  return useCallback(
    (e: LessonEvent) => {
      if (!tok()) return;
      switch (e.type) {
        case "start":
          if (started.current) return;
          started.current = true;
          return push({ type: "start" });
        case "act":
          return push({ type: "act", blockId: e.blockId });
        case "answer":
          return push({ type: "answer", blockId: e.blockId, choice: e.choice, ...(e.correct === undefined ? {} : { correct: e.correct }) });
        case "post-check":
          return e.firstTry ? push({ type: "post-check", itemId: e.itemId, correct: e.correct }) : undefined;
        case "detour":
          return push({ type: "detour", detourId: e.detourId });
      }
    },
    [push, tok],
  );
}
