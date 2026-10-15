import { ltiEnabled, readLtiSession } from "./config";

/**
 * The Content-Security-Policy for a lesson page opened by an LTI launch: only
 * the launching platform's origins may frame it. Every other page keeps the
 * site's default (X-Frame-Options: SAMEORIGIN, from next.config.ts); browsers
 * follow frame-ancestors instead of X-Frame-Options when both are present.
 * Returns null whenever the default should stand.
 */
export async function ltiFramePolicy(pathname: string, token: string | null, locales: readonly string[]): Promise<string | null> {
  if (!ltiEnabled() || !token) return null;
  const m = /^\/([a-z]{2,3})\/lessons\/([a-z0-9-]+)(?:\/classroom)?\/?$/.exec(pathname);
  if (!m?.[1] || !m[2] || !locales.includes(m[1])) return null;
  const s = await readLtiSession(token);
  // Only the lesson this launch was for, and only origins the creator registered.
  if (!s || s.lessonId !== m[2] || !s.frameOrigins.length) return null;
  return `frame-ancestors ${s.frameOrigins.join(" ")}`;
}
