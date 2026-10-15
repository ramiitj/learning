"use client";
import { useCallback, useEffect, useRef } from "react";
import type { LessonEvent } from "@lm/engine";

type Counts = Map<string, number>;

/**
 * Turns a page's learning moments into anonymous counts and sends them when
 * the page is hidden. No cookie, no identifier, no timestamps; nothing is
 * kept between pages. Honours Do Not Track and Global Privacy Control.
 */
export function useAnonymousAnalytics(opts: { lessonId: string; locale: string; mode: "personal" | "classroom"; enabled: boolean }) {
  const counts = useRef<Counts>(new Map());
  const reached = useRef(new Set<string>());
  const add = useCallback((metric: string, key = "") => {
    const k = `${metric}\u0000${key}`;
    counts.current.set(k, (counts.current.get(k) ?? 0) + 1);
  }, []);

  const optedOut = () => typeof navigator !== "undefined" && (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true);

  // Drop-off: which blocks were actually seen, once each; completion: the last one.
  useEffect(() => {
    if (!opts.enabled) return;
    const blocks = [...document.querySelectorAll<HTMLElement>(".lm-lesson .lm-block[data-block-id]")];
    const lastId = blocks.at(-1)?.dataset.blockId;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.blockId;
          if (!e.isIntersecting || !id || reached.current.has(id)) continue;
          reached.current.add(id);
          add("reach", id);
          if (id === lastId) add("complete");
        }
      },
      { threshold: 0.5 },
    );
    blocks.forEach((b) => io.observe(b));
    return () => io.disconnect();
  }, [opts.enabled, add]);

  useEffect(() => {
    if (!opts.enabled) return;
    const flush = () => {
      if (!counts.current.size || optedOut()) return;
      const body = JSON.stringify({ lessonId: opts.lessonId, locale: opts.locale, mode: opts.mode, counts: [...counts.current].map(([k, n]) => [...k.split("\u0000"), n]) });
      counts.current = new Map();
      if (!navigator.sendBeacon?.("/api/analytics", new Blob([body], { type: "application/json" }))) fetch("/api/analytics", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => undefined);
    };
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [opts.enabled, opts.lessonId, opts.locale, opts.mode]);

  return useCallback(
    (e: LessonEvent) => {
      if (!opts.enabled) return;
      switch (e.type) {
        case "start":
          return add(e.returning ? "return" : "start");
        case "act":
          return add("act", e.blockId);
        case "answer":
          return add("answer", `${e.blockId}:${e.choice}:${e.correct === undefined ? "-" : e.correct ? "1" : "0"}`);
        case "post-check":
          return e.firstTry ? add("post", `${e.itemId}:${e.correct ? "1" : "0"}`) : undefined;
        case "pre-check":
          return add("pre", `${e.itemId}:${e.correct ? "1" : "0"}`);
        case "depth":
          return add("depth", e.depth);
        case "expand":
          return add("expand", e.blockId);
        case "detour":
          return add("detour", e.detourId);
        case "glossary":
          return add("glossary", e.termId ?? "");
      }
    },
    [opts.enabled, add],
  );
}
