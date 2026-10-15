import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { ltiFramePolicy } from "./lti/frame";

const intl = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
  const res = intl(req);
  // LTI launches only (off unless LTI_ENABLED=1): let the launching LMS frame this one lesson. Everything else keeps the default framing policy.
  const policy = await ltiFramePolicy(req.nextUrl.pathname, req.nextUrl.searchParams.get("lti"), routing.locales);
  if (policy) res.headers.set("Content-Security-Policy", policy);
  return res;
}

export const config = {
  // Everything except API routes, the Creator Console, the connector consent screen, Next internals and files with an extension (sw.js, icons, manifest).
  matcher: "/((?!api|console|oauth|_next|_vercel|.*\\..*).*)",
};
