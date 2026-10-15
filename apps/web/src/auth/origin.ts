/**
 * The site's public origin, in one place (docs/runbooks/deploy.md, gap 2).
 * Passkeys (WebAuthn origin and rpID), the MCP connector's OAuth metadata,
 * LTI, preview links and invitation links are all bound to it, so every
 * caller must agree on it and none may guess.
 *
 * Order:
 *   1. APP_ORIGIN, if set (must be https, or http://localhost when set explicitly).
 *   2. On a Vercel preview deployment (VERCEL_ENV=preview): https://VERCEL_BRANCH_URL,
 *      else https://VERCEL_URL. The branch URL is stable across pushes, so a
 *      passkey registered on a preview keeps working for that branch.
 *   3. In development and tests (NODE_ENV is not "production"): http://localhost:3000.
 *   4. Otherwise none: production fails closed. Passkey ceremonies, OAuth
 *      metadata and links refuse with OriginUnavailableError rather than
 *      binding to localhost.
 */
export class OriginUnavailableError extends Error {
  constructor(detail: string) {
    super(`The site's public address is not configured (${detail}). Set APP_ORIGIN to the https origin, e.g. https://learn.example.in. Passkey sign-in and the MCP connector stay off until it is set.`);
    this.name = "OriginUnavailableError";
  }
}

export type OriginSource = "APP_ORIGIN" | "vercel-preview" | "development";
export interface ResolvedOrigin {
  origin: string;
  /** The WebAuthn relying party id: the origin's hostname. */
  rpID: string;
  source: OriginSource;
}

type Env = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
/** A bare host name as Vercel provides it (no scheme, path, port or credentials). */
const HOST = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function fromUrl(raw: string, label: string): string {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new OriginUnavailableError(`${label} is not a URL`);
  }
  // http is accepted only for an explicitly configured localhost (a secure context for WebAuthn), e.g. `next start` in CI.
  // It is never a default in production, and a real deployment with it simply fails: browsers elsewhere cannot match it.
  if (u.protocol !== "https:" && !(u.protocol === "http:" && LOCAL_HOSTS.has(u.hostname))) throw new OriginUnavailableError(`${label} must use https`);
  if (u.username || u.password || (u.pathname !== "/" && u.pathname !== "") || u.search || u.hash) throw new OriginUnavailableError(`${label} must be an origin only, with no path, query or credentials`);
  return u.origin;
}

/** Works out the origin from an environment; throws OriginUnavailableError when it cannot do so safely. */
export function resolveOrigin(env: Env = process.env): ResolvedOrigin {
  const production = env.NODE_ENV === "production";
  const done = (origin: string, source: OriginSource): ResolvedOrigin => ({ origin, rpID: new URL(origin).hostname, source });

  const configured = env.APP_ORIGIN?.trim();
  if (configured) return done(fromUrl(configured, "APP_ORIGIN"), "APP_ORIGIN");

  if (env.VERCEL_ENV === "preview") {
    const host = (env.VERCEL_BRANCH_URL || env.VERCEL_URL || "").trim();
    if (!HOST.test(host)) throw new OriginUnavailableError("on a Vercel preview without a valid VERCEL_BRANCH_URL or VERCEL_URL");
    return done(fromUrl(`https://${host}`, "the Vercel preview URL"), "vercel-preview");
  }

  if (!production) return done("http://localhost:3000", "development");
  throw new OriginUnavailableError("APP_ORIGIN is not set in production");
}

/** The origin, or a thrown OriginUnavailableError (use where binding to the wrong origin would be a security fault). */
export const appOrigin = (): string => resolveOrigin().origin;

/** The origin, or null when it is not configured (use for optional links that can simply be left out). */
export function appOriginOrNull(): string | null {
  try {
    return appOrigin();
  } catch (e) {
    if (e instanceof OriginUnavailableError) return null;
    throw e;
  }
}

/** A 503 that explains the misconfiguration, for routes that need the origin. */
export function originUnavailableResponse(e: OriginUnavailableError): Response {
  return Response.json({ error: e.message }, { status: 503 });
}
