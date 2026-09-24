"use client";
import { useEffect, useState } from "react";

/**
 * Registers the service worker and asks it to keep every file this page
 * loaded, so the lesson works offline after the first visit.
 */
export function OfflineReady({ label }: { label: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    let cancelled = false;
    const cacheThisPage = async () => {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const worker = reg.active ?? navigator.serviceWorker.controller;
      const urls = [location.href, ...performance.getEntriesByType("resource").map((e) => e.name)].filter((u) => new URL(u).origin === location.origin);
      const done = new Promise<void>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => resolve();
        worker?.postMessage({ type: "CACHE_URLS", urls }, [channel.port2]);
        setTimeout(resolve, 15000);
      });
      await done;
      if (!cancelled) setReady(true);
    };
    const start = () => void cacheThisPage().catch(() => {});
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <p className="site-offline" role="status" data-ready={ready || undefined}>
      {ready ? label : null}
    </p>
  );
}
