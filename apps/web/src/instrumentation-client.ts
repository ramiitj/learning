import { scrubRoute, scrubStack, scrubText } from "./ops/scrub";

/**
 * A tiny self-hosted error reporter (docs/12): no third-party tracker runs on
 * children's content. It sends a scrubbed message, a trimmed stack and the
 * page's pathname to our own /api/errors, at most five times per page load.
 * It never sends the query string, form values, cookies or any identifier.
 */
let sent = 0;
const seen = new Set<string>();

function report(message: unknown, stack: unknown) {
  try {
    const m = scrubText(message);
    if (!m || sent >= 5 || seen.has(m)) return;
    seen.add(m);
    sent++;
    const body = JSON.stringify({ source: "client", message: m, stack: scrubStack(stack), route: scrubRoute(location.pathname) });
    if (!navigator.sendBeacon?.("/api/errors", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/errors", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => undefined);
    }
  } catch {
    /* the reporter must never cause an error of its own */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => report(e.error?.message ?? e.message, e.error?.stack));
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason as { message?: unknown; stack?: unknown } | undefined;
    report(r?.message ?? r, r?.stack);
  });
}
