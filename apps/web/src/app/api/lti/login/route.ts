import { NextResponse } from "next/server";
import { appOrigin, ltiEnabled, signState, stateCookieName } from "@/lti/config";
import { LtiError, initiateLogin } from "@/lti/launch";
import { launchErrorPage } from "@/lti/respond";
import { payloadPlatformStore } from "@/lti/store";
import { rateLimited } from "@/classroom/rate-limit";

export const dynamic = "force-dynamic";

/**
 * LTI 1.3 OIDC login initiation. Checks the platform is registered, keeps a
 * fresh state and nonce in a short-lived signed cookie, and sends the browser
 * back to the platform to authenticate. Nothing from the request is stored or
 * logged (login_hint is passed through untouched).
 */
async function handle(req: Request, params: Record<string, unknown>) {
  if (!ltiEnabled()) return launchErrorPage(req, "disabled");
  if (rateLimited(req, "lti-login", 120, 60)) return new Response(null, { status: 429 });
  try {
    const { redirect, state } = await initiateLogin(params, payloadPlatformStore, appOrigin());
    const res = NextResponse.redirect(redirect, 302);
    // The launch arrives as a cross-site POST inside the LMS frame: SameSite=None, partitioned per LMS (CHIPS).
    res.cookies.set(stateCookieName(state.state), await signState(state), { httpOnly: true, secure: true, sameSite: "none", partitioned: true, path: "/api/lti/launch", maxAge: 600 });
    res.headers.set("cache-control", "no-store");
    return res;
  } catch (e) {
    return launchErrorPage(req, e instanceof LtiError ? e.code : "bad-request");
  }
}

export async function GET(req: Request) {
  return handle(req, Object.fromEntries(new URL(req.url).searchParams));
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  return handle(req, form ? Object.fromEntries([...form].filter(([, v]) => typeof v === "string")) : {});
}
