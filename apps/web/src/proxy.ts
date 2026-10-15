import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except API routes, the Creator Console, Next internals and files with an extension (sw.js, icons, manifest).
  matcher: "/((?!api|console|_next|_vercel|.*\\..*).*)",
};
