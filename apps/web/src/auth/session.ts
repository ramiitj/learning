import { SignJWT, jwtVerify } from "jose";

/**
 * The creator's session after a passkey sign-in: a short-lived signed cookie.
 * `authTime` records when the passkey was last used, so publishing and other
 * high-impact actions can require a fresh confirmation (docs/10).
 */
export const SESSION_COOKIE = "lm-creator";
const SESSION_HOURS = 8;

const key = () => {
  const s = process.env.PAYLOAD_SECRET;
  if (!s || s.length < 32) throw new Error("PAYLOAD_SECRET must be set (32+ characters)");
  return new TextEncoder().encode(s);
};

export async function signSession(userId: string | number, authTime = Math.floor(Date.now() / 1000)) {
  return new SignJWT({ authTime })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .setAudience("lm-console")
    .sign(key());
}

export async function readSession(token: string | undefined): Promise<{ userId: string; authTime: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { audience: "lm-console" });
    return { userId: String(payload.sub), authTime: Number(payload.authTime) };
  } catch {
    return null;
  }
}

export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
});

/** A short-lived signed challenge for a WebAuthn ceremony, held in a cookie. */
export const CHALLENGE_COOKIE = "lm-webauthn";
export async function signChallenge(challenge: string, purpose: string) {
  return new SignJWT({ challenge, purpose }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("5m").setAudience("lm-webauthn").sign(key());
}
export async function readChallenge(token: string | undefined, purpose: string): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { audience: "lm-webauthn" });
    return payload.purpose === purpose ? String(payload.challenge) : null;
  } catch {
    return null;
  }
}

export function relyingParty() {
  const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
  return { origin, rpID: new URL(origin).hostname, rpName: "Learning Magazine" };
}
