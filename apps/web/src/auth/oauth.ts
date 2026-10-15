import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

/**
 * A small OAuth 2.1 authorization server for the MCP connector (docs/03):
 * dynamic client registration, authorization code with PKCE (S256 only),
 * short-lived access tokens and rotating refresh tokens. Only the creator can
 * approve a client, after a passkey sign-in.
 */
const key = () => new TextEncoder().encode(process.env.PAYLOAD_SECRET ?? "");
export const origin = () => process.env.APP_ORIGIN ?? "http://localhost:3000";
export const mcpResource = () => `${origin()}/api/mcp`;
export const ACCESS_TOKEN_SECONDS = 3600;
export const REFRESH_TOKEN_DAYS = 30;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("base64url");
export const randomToken = () => randomBytes(32).toString("base64url");

export interface Client {
  client_name: string;
  redirect_uris: string[];
}

function redirectAllowed(uri: string): boolean {
  try {
    const u = new URL(uri);
    return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname));
  } catch {
    return false;
  }
}

/** Clients are stateless: the client_id is a signed record of the client's name and redirect URIs. */
export async function registerClient(input: Partial<Client>): Promise<string> {
  const redirect_uris = (input.redirect_uris ?? []).filter(redirectAllowed);
  if (!redirect_uris.length) throw new Error("redirect_uris must be https (or http on localhost)");
  return new SignJWT({ client_name: String(input.client_name ?? "MCP client").slice(0, 100), redirect_uris }).setProtectedHeader({ alg: "HS256" }).setAudience("lm-oauth-client").setIssuedAt().sign(key());
}

export async function readClient(clientId: string | null): Promise<Client | null> {
  if (!clientId) return null;
  try {
    const { payload } = await jwtVerify(clientId, key(), { audience: "lm-oauth-client" });
    return { client_name: String(payload.client_name), redirect_uris: payload.redirect_uris as string[] };
  } catch {
    return null;
  }
}

export async function issueCode(c: { clientId: string; redirectUri: string; codeChallenge: string; userId: string; scope: string }) {
  return new SignJWT({ cid: sha256(c.clientId), ru: c.redirectUri, cc: c.codeChallenge, scope: c.scope }).setProtectedHeader({ alg: "HS256" }).setSubject(c.userId).setJti(randomToken()).setAudience("lm-oauth-code").setExpirationTime("2m").sign(key());
}

export async function readCode(code: string) {
  const { payload } = await jwtVerify(code, key(), { audience: "lm-oauth-code" });
  return { clientHash: String(payload.cid), redirectUri: String(payload.ru), codeChallenge: String(payload.cc), userId: String(payload.sub), jti: String(payload.jti), scope: String(payload.scope), exp: Number(payload.exp) };
}

export async function issueAccessToken(userId: string, clientId: string, scope: string) {
  return new SignJWT({ scope, cid: sha256(clientId) }).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setAudience(mcpResource()).setIssuer(origin()).setExpirationTime(`${ACCESS_TOKEN_SECONDS}s`).sign(key());
}

export async function readAccessToken(token: string) {
  const { payload } = await jwtVerify(token, key(), { audience: mcpResource(), issuer: origin() });
  return { userId: String(payload.sub), scope: String(payload.scope), clientHash: String(payload.cid) };
}

export const pkceOk = (verifier: string, challenge: string) => sha256(verifier) === challenge;
export { redirectAllowed };
