import { after } from "next/server";
import { cmsClient } from "@/cms/client";
import { logEvent } from "@/cms/events";
import { routing } from "@/i18n/routing";
import { rateLimited } from "@/classroom/rate-limit";
import { appOrigin, readLtiSession, xapiEnabled } from "@/lti/config";
import { lrsFor } from "@/lti/store";
import { ANON_ID, sanitiseEvents, sendStatements, toStatements } from "@/lti/xapi";

export const dynamic = "force-dynamic";

/**
 * Receives a launched lesson's learning moments and forwards them as xAPI
 * statements to the LRS of the platform that launched it. Off unless
 * XAPI_ENABLED=1 and LTI_ENABLED=1, and only for launches whose platform has
 * an LRS. Answers at once; sending happens after the response, so the
 * learner never waits. Nothing is stored here, and nothing identifying is
 * accepted: no cookie, no identity, no free text.
 */
export async function POST(req: Request) {
  if (!xapiEnabled()) return new Response(null, { status: 404 });
  // The browser already checks Do Not Track and Global Privacy Control; the server honours them too.
  if (req.headers.get("sec-gpc") === "1" || req.headers.get("dnt") === "1") return new Response(null, { status: 204 });
  if (rateLimited(req, "lti-xapi", 600, 60)) return new Response(null, { status: 204 });
  const text = await req.text().catch(() => "");
  if (text.length > 64_000) return new Response(null, { status: 413 });
  let body: { t?: unknown; sid?: unknown; locale?: unknown; mode?: unknown; e?: unknown } | null = null;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const session = await readLtiSession(typeof body?.t === "string" ? body.t : null);
  if (!session?.xapi) return new Response(null, { status: 403 });
  const locale = typeof body?.locale === "string" && (routing.locales as readonly string[]).includes(body.locale) ? body.locale : null;
  const mode = body?.mode === "personal" || body?.mode === "classroom" ? body.mode : null;
  // The anonymous actor: a random UUID the browser made for this tab session. Anything else is refused.
  const sid = typeof body?.sid === "string" && ANON_ID.test(body.sid) ? body.sid : null;
  if (!locale || !mode || !sid) return new Response(null, { status: 400 });
  const events = sanitiseEvents(body?.e);
  if (!events.length) return new Response(null, { status: 204 });
  const statements = toStatements(events, { origin: appOrigin(), sessionId: sid, lessonId: session.lessonId, locale, mode });

  after(async () => {
    const lrs = await lrsFor(session.platformId).catch(() => null);
    if (!lrs) return;
    if (!(await sendStatements(lrs, statements))) {
      await logEvent(await cmsClient(), undefined, { action: "xapi.dropped", target: `lti-platforms/${session.platformId}`, data: { platformId: session.platformId, statements: statements.length } }).catch(() => undefined);
    }
  });
  return new Response(null, { status: 202 });
}
