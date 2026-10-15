import { SignJWT, jwtVerify } from "jose";
import { appOrigin as resolvedOrigin } from "@/auth/origin";

/**
 * LTI 1.3 and xAPI are OFF by default (docs/proposals/lti-xapi.md). They change
 * how data leaves the platform, so they stay off until the creator decides.
 */
export const ltiEnabled = () => process.env.LTI_ENABLED === "1";
export const xapiEnabled = () => ltiEnabled() && process.env.XAPI_ENABLED === "1";
export const appOrigin = () => resolvedOrigin();

/** Lesson ids follow schemas/lesson.schema.json (^[a-z0-9-]+$), with a length cap. */
export const LESSON_ID = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

/** The claims a launch may read. Everything else in the id_token (sub, name, email, picture, context, lis, ...) is discarded unread. */
export const CLAIM = {
  version: "https://purl.imsglobal.org/spec/lti/claim/version",
  messageType: "https://purl.imsglobal.org/spec/lti/claim/message_type",
  deploymentId: "https://purl.imsglobal.org/spec/lti/claim/deployment_id",
  roles: "https://purl.imsglobal.org/spec/lti/claim/roles",
  custom: "https://purl.imsglobal.org/spec/lti/claim/custom",
} as const;

export const INSTRUCTOR_ROLES = ["http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"];

const key = () => {
  const s = process.env.PAYLOAD_SECRET;
  if (!s || s.length < 32) throw new Error("PAYLOAD_SECRET must be set (32+ characters)");
  return new TextEncoder().encode(s);
};

/** The OIDC state and nonce, held in a short-lived signed cookie between login initiation and launch. */
export interface LoginState {
  state: string;
  nonce: string;
  platformId: string;
}
const STATE_AUD = "lm-lti-state";
export const stateCookieName = (state: string) => `lm-lti-${state}`;
export async function signState(s: LoginState) {
  return new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("10m").setAudience(STATE_AUD).sign(key());
}
export async function readState(token: string | undefined): Promise<LoginState | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { audience: STATE_AUD, algorithms: ["HS256"] });
    const { state, nonce, platformId } = payload as Record<string, unknown>;
    return typeof state === "string" && typeof nonce === "string" && typeof platformId === "string" ? { state, nonce, platformId } : null;
  } catch {
    return null;
  }
}

/**
 * What a launched lesson page knows about its launch. It holds no identity:
 * the platform record id, the lesson, the origins allowed to frame it and
 * whether xAPI is on for this launch. It travels in the lesson URL (and so
 * may appear in request logs), which is why it carries no per-learner id:
 * the anonymous xAPI actor id is made in the browser and sent only in
 * request bodies.
 */
export interface LtiSession {
  platformId: string;
  lessonId: string;
  frameOrigins: string[];
  xapi: boolean;
}
const SESSION_AUD = "lm-lti-session";
export const SESSION_HOURS = 6;
export async function signLtiSession(s: LtiSession) {
  return new SignJWT({ p: s.platformId, l: s.lessonId, f: s.frameOrigins, x: s.xapi }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_HOURS}h`).setAudience(SESSION_AUD).sign(key());
}
export async function readLtiSession(token: string | null | undefined): Promise<LtiSession | null> {
  if (!token || token.length > 4096) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { audience: SESSION_AUD, algorithms: ["HS256"] });
    const { p, l, f, x } = payload as Record<string, unknown>;
    if (typeof p !== "string" || typeof l !== "string" || !LESSON_ID.test(l) || !Array.isArray(f)) return null;
    return { platformId: p, lessonId: l, frameOrigins: f.filter((o): o is string => typeof o === "string" && isOrigin(o)), xapi: x === true };
  } catch {
    return null;
  }
}

/** An https origin (or http://localhost outside production), with nothing after it. */
export function isOrigin(o: string): boolean {
  try {
    const u = new URL(o);
    return u.origin === o && (u.protocol === "https:" || (process.env.NODE_ENV !== "production" && u.protocol === "http:" && u.hostname === "localhost"));
  } catch {
    return false;
  }
}

/** An https URL (or http://localhost outside production). */
export function isSecureUrl(s: unknown): s is string {
  if (typeof s !== "string" || s.length > 2048) return false;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || (process.env.NODE_ENV !== "production" && u.protocol === "http:" && u.hostname === "localhost");
  } catch {
    return false;
  }
}
