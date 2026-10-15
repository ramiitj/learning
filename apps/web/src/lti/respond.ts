import { NextResponse } from "next/server";
import en from "../../messages/en.json" with { type: "json" };
import hi from "../../messages/hi.json" with { type: "json" };
import te from "../../messages/te.json" with { type: "json" };
import { routing } from "@/i18n/routing";
import type { LaunchError } from "./launch";

type LtiMessages = { title: string; body: string; disabled: string };
const all = { en, hi, te } as unknown as Record<string, { lti?: LtiMessages }>;

function pickLocale(req: Request): string {
  const accepted = (req.headers.get("accept-language") ?? "").split(",").map((p) => (p.split(";")[0] ?? "").trim().slice(0, 2).toLowerCase());
  return accepted.find((l) => (routing.locales as readonly string[]).includes(l)) ?? routing.defaultLocale;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * The page a learner or teacher sees inside the LMS frame when a launch is
 * refused. It says what to do next and never echoes anything from the request.
 */
export function launchErrorPage(req: Request, code: LaunchError): NextResponse {
  const locale = pickLocale(req);
  const m = all[locale]?.lti ?? (en as unknown as { lti: LtiMessages }).lti;
  const body = code === "disabled" ? m.disabled : m.body;
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.title)}</title></head><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:2rem auto;padding:0 1rem;line-height:1.6"><h1 style="font-size:1.4rem">${esc(m.title)}</h1><p>${esc(body)}</p></body></html>`;
  const status = code === "disabled" ? 404 : code === "bad-request" || code === "bad-lesson" || code === "bad-target" ? 400 : 403;
  return new NextResponse(html, { status, headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      // Shown inside the LMS frame. Static text with nothing to click, so any frame may show it (frame-ancestors overrides X-Frame-Options).
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors *",
    },
  });
}
