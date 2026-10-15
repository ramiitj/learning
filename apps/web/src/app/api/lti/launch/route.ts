import { NextResponse, type NextRequest } from "next/server";
import { cmsClient } from "@/cms/client";
import { logEvent } from "@/cms/events";
import { routing } from "@/i18n/routing";
import { listLessonIds } from "@/lib/content";
import { rateLimited } from "@/classroom/rate-limit";
import { appOrigin, ltiEnabled, readState, signLtiSession, stateCookieName, xapiEnabled } from "@/lti/config";
import { LtiError, frameOriginsOf, verifyLaunch } from "@/lti/launch";
import { launchErrorPage } from "@/lti/respond";
import { payloadPlatformStore } from "@/lti/store";

export const dynamic = "force-dynamic";

/**
 * LTI 1.3 resource link launch. Verifies the platform's id_token, then opens
 * the lesson named by the link's custom parameters. Only iss, aud, azp,
 * nonce, version, message type, deployment id, roles and custom parameters
 * are read; identity claims (sub, name, email, picture, context, ...) are
 * dropped unread, and the event log records only the platform and lesson.
 */
export async function POST(req: NextRequest) {
  if (!ltiEnabled()) return launchErrorPage(req, "disabled");
  if (rateLimited(req, "lti-launch", 120, 60)) return new Response(null, { status: 429 });
  const form = await req.formData().catch(() => null);
  const state = form?.get("state");
  const cookieName = typeof state === "string" && /^[\w-]{20,128}$/.test(state) ? stateCookieName(state) : null;
  let platformId: string | undefined;
  try {
    const cookieState = cookieName ? await readState(req.cookies.get(cookieName)?.value) : null;
    platformId = cookieState?.platformId;
    const launch = await verifyLaunch({ idToken: form?.get("id_token"), state, cookieState, store: payloadPlatformStore, locales: routing.locales, defaultLocale: routing.defaultLocale });
    if (!(await listLessonIds()).includes(launch.lessonId)) throw new LtiError("bad-lesson");

    const token = await signLtiSession({
      platformId: launch.platform.id,
      lessonId: launch.lessonId,
      frameOrigins: frameOriginsOf(launch.platform),
      xapi: xapiEnabled() && launch.platform.hasLrs,
    });
    await logEvent(await cmsClient(), undefined, { action: "lti.launch", target: `lti-platforms/${launch.platform.id}`, data: { platformId: launch.platform.id, lessonId: launch.lessonId } });

    const to = new URL(`/${launch.locale}/lessons/${launch.lessonId}${launch.mode === "classroom" ? "/classroom" : ""}`, appOrigin());
    to.searchParams.set("lti", token);
    const res = NextResponse.redirect(to, 303);
    if (cookieName) res.cookies.set(cookieName, "", { httpOnly: true, secure: true, sameSite: "none", partitioned: true, path: "/api/lti/launch", maxAge: 0 });
    res.headers.set("cache-control", "no-store");
    return res;
  } catch (e) {
    const code = e instanceof LtiError ? e.code : "bad-request";
    // A refused launch is logged with the reason code only: never the token or its claims.
    await logEvent(await cmsClient(), undefined, { action: "lti.launch-refused", target: platformId ? `lti-platforms/${platformId}` : "", data: { code } }).catch(() => undefined);
    return launchErrorPage(req, code);
  }
}
