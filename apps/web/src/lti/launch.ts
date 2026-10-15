import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, customFetch, jwtVerify, type JWTPayload } from "jose";
import { CLAIM, INSTRUCTOR_ROLES, LESSON_ID, isOrigin, type LoginState } from "./config";

/** A registered LMS, as the launch code sees it (the LRS secret is never loaded here). */
export interface Platform {
  id: string;
  issuer: string;
  clientId: string;
  deploymentIds: string[];
  authLoginUrl: string;
  jwksUrl: string;
  frameOrigins: string[];
  hasLrs: boolean;
}

export interface PlatformStore {
  /** Enabled platforms with this issuer (and client id, when the platform sent one). */
  findByIssuer(issuer: string, clientId?: string): Promise<Platform[]>;
  findById(id: string): Promise<Platform | null>;
  /** Records a nonce as used; false if it was already used. */
  consumeNonce(nonceHash: string, expiresAt: Date): Promise<boolean>;
}

export type LaunchError =
  | "disabled"
  | "bad-request"
  | "unknown-platform"
  | "bad-target"
  | "unknown-deployment"
  | "state-mismatch"
  | "bad-token"
  | "nonce-mismatch"
  | "nonce-replayed"
  | "wrong-message"
  | "bad-lesson";

export class LtiError extends Error {
  constructor(public readonly code: LaunchError) {
    super(code);
  }
}

const random = () => randomBytes(32).toString("base64url");
const str = (v: unknown, max = 2048) => (typeof v === "string" && v.length > 0 && v.length <= max ? v : undefined);

/** OIDC third-party login initiation (LTI 1.3 core §5.1.1). Returns the platform redirect and the state to remember. */
export async function initiateLogin(params: Record<string, unknown>, store: PlatformStore, origin: string): Promise<{ redirect: string; state: LoginState }> {
  const iss = str(params.iss);
  const loginHint = str(params.login_hint);
  const target = str(params.target_link_uri);
  const clientId = str(params.client_id, 512);
  const deploymentId = str(params.lti_deployment_id, 512);
  const messageHint = str(params.lti_message_hint, 4096);
  if (!iss || !loginHint || !target) throw new LtiError("bad-request");
  let targetOrigin: string;
  try {
    targetOrigin = new URL(target).origin;
  } catch {
    throw new LtiError("bad-target");
  }
  if (targetOrigin !== origin) throw new LtiError("bad-target");
  const found = await store.findByIssuer(iss, clientId);
  const platform = found.length === 1 ? found[0] : undefined;
  if (!platform) throw new LtiError("unknown-platform");
  if (deploymentId && !platform.deploymentIds.includes(deploymentId)) throw new LtiError("unknown-deployment");

  const state: LoginState = { state: random(), nonce: random(), platformId: platform.id };
  const url = new URL(platform.authLoginUrl);
  const q: Record<string, string> = {
    scope: "openid",
    response_type: "id_token",
    response_mode: "form_post",
    prompt: "none",
    client_id: platform.clientId,
    redirect_uri: `${origin}/api/lti/launch`,
    // Passed through untouched, never stored or logged: the platform uses it to find its own session.
    login_hint: loginHint,
    state: state.state,
    nonce: state.nonce,
  };
  if (messageHint) q.lti_message_hint = messageHint;
  for (const [k, v] of Object.entries(q)) url.searchParams.set(k, v);
  return { redirect: url.toString(), state };
}

/** What a launch is allowed to know. Built field by field from the allow-list; nothing else from the token survives. */
export interface MinimalClaims {
  iss: string;
  aud: string[];
  azp?: string;
  nonce?: string;
  version?: string;
  messageType?: string;
  deploymentId?: string;
  roles: string[];
  custom: { lesson?: string; mode?: string; locale?: string };
}

export function minimiseClaims(p: JWTPayload): MinimalClaims {
  const custom = (p[CLAIM.custom] ?? {}) as Record<string, unknown>;
  const roles = p[CLAIM.roles];
  return {
    iss: String(p.iss ?? ""),
    aud: Array.isArray(p.aud) ? p.aud.map(String) : p.aud ? [String(p.aud)] : [],
    azp: str(p.azp, 512),
    nonce: str(p.nonce, 512),
    version: str(p[CLAIM.version], 32),
    messageType: str(p[CLAIM.messageType], 64),
    deploymentId: str(p[CLAIM.deploymentId], 512),
    roles: Array.isArray(roles) ? roles.filter((r): r is string => typeof r === "string").slice(0, 50) : [],
    custom: { lesson: str(custom.lesson, 128), mode: str(custom.mode, 32), locale: str(custom.locale, 16) },
  };
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
/** The platform's signing keys, fetched and cached by jose (cooldown and max age per its defaults). */
export function platformJwks(url: string, fetchImpl?: typeof fetch) {
  const k = url;
  let set = jwksCache.get(k);
  if (!set) {
    set = createRemoteJWKSet(new URL(url), fetchImpl ? { [customFetch]: fetchImpl } : {});
    jwksCache.set(k, set);
  }
  return set;
}
export const clearJwksCache = () => jwksCache.clear();

export interface LaunchResult {
  platform: Platform;
  lessonId: string;
  mode: "personal" | "classroom";
  locale: string;
}

/**
 * Verifies an LTI 1.3 resource link launch (LTI 1.3 core §5.1.2, §5.3; IMS
 * Security Framework §5.1.3). The returned value carries no identity claim.
 */
export async function verifyLaunch(input: {
  idToken: unknown;
  state: unknown;
  cookieState: LoginState | null;
  store: PlatformStore;
  locales: readonly string[];
  defaultLocale: string;
  fetchImpl?: typeof fetch;
}): Promise<LaunchResult> {
  const idToken = str(input.idToken, 16_384);
  const state = str(input.state, 256);
  if (!idToken || !state) throw new LtiError("bad-request");
  const cs = input.cookieState;
  if (!cs || cs.state !== state) throw new LtiError("state-mismatch");
  const platform = await input.store.findById(cs.platformId);
  if (!platform) throw new LtiError("unknown-platform");

  let claims: MinimalClaims;
  try {
    const { payload } = await jwtVerify(idToken, platformJwks(platform.jwksUrl, input.fetchImpl), {
      issuer: platform.issuer,
      audience: platform.clientId,
      algorithms: ["RS256", "RS384", "RS512", "ES256", "ES384"],
      requiredClaims: ["exp", "iat", "nonce"],
      maxTokenAge: "10m",
      clockTolerance: 30,
    });
    // Identity claims are dropped here, before anything else can see them.
    claims = minimiseClaims(payload);
  } catch {
    // jose errors can carry the token's claims: never pass them on.
    throw new LtiError("bad-token");
  }
  if (claims.aud.length > 1 && claims.azp === undefined) throw new LtiError("bad-token");
  if (claims.azp !== undefined && claims.azp !== platform.clientId) throw new LtiError("bad-token");
  if (claims.nonce !== cs.nonce) throw new LtiError("nonce-mismatch");
  if (claims.version !== "1.3.0" || claims.messageType !== "LtiResourceLinkRequest") throw new LtiError("wrong-message");
  if (!claims.deploymentId || !platform.deploymentIds.includes(claims.deploymentId)) throw new LtiError("unknown-deployment");

  const lessonId = claims.custom.lesson;
  if (!lessonId || !LESSON_ID.test(lessonId)) throw new LtiError("bad-lesson");
  const m = claims.custom.mode;
  if (m !== undefined && m !== "classroom" && m !== "personal") throw new LtiError("bad-lesson");
  const l = claims.custom.locale;
  if (l !== undefined && !input.locales.includes(l)) throw new LtiError("bad-lesson");
  const instructor = claims.roles.some((r) => INSTRUCTOR_ROLES.includes(r));
  const mode = m ?? (instructor ? "classroom" : "personal");

  // Single use: the first valid launch with this nonce wins; any replay is refused.
  const nonceHash = createHash("sha256").update(`${platform.id}\u0000${cs.nonce}`).digest("base64url");
  if (!(await input.store.consumeNonce(nonceHash, new Date(Date.now() + 20 * 60_000)))) throw new LtiError("nonce-replayed");

  return { platform, lessonId, mode, locale: l ?? input.defaultLocale };
}

/** Origins allowed to frame a launched lesson: the creator's list, else the platform's own origins. */
export function frameOriginsOf(p: Pick<Platform, "frameOrigins" | "issuer" | "authLoginUrl">): string[] {
  const list = p.frameOrigins.length ? p.frameOrigins : [p.issuer, p.authLoginUrl].map((u) => {
    try {
      return new URL(u).origin;
    } catch {
      return "";
    }
  });
  return [...new Set(list.filter(isOrigin))];
}
