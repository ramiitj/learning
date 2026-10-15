import { ACCESS_TOKEN_SECONDS, REFRESH_TOKEN_DAYS, issueAccessToken, pkceOk, randomToken, readClient, readCode, sha256 } from "@/auth/oauth";
import { cmsClient } from "@/cms/client";
import { logEvent } from "@/cms/events";

const err = (error: string, description: string, status = 400) => Response.json({ error, error_description: description }, { status, headers: { "cache-control": "no-store" } });

async function form(req: Request): Promise<URLSearchParams> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return new URLSearchParams((await req.json()) as Record<string, string>);
  return new URLSearchParams(await req.text());
}

/** Exchanges an authorization code (with its PKCE verifier) or a refresh token for an access token. */
export async function POST(req: Request) {
  const p = await form(req);
  const payload = await cmsClient();
  const clientId = p.get("client_id") ?? "";
  const client = await readClient(clientId);
  if (!client) return err("invalid_client", "Unknown client");

  let userId: string;
  if (p.get("grant_type") === "authorization_code") {
    let code;
    try {
      code = await readCode(p.get("code") ?? "");
    } catch {
      return err("invalid_grant", "The code is invalid or expired");
    }
    if (code.clientHash !== sha256(clientId) || code.redirectUri !== p.get("redirect_uri")) return err("invalid_grant", "The code was issued to another client");
    if (!pkceOk(p.get("code_verifier") ?? "", code.codeChallenge)) return err("invalid_grant", "PKCE verification failed");
    // A code works once.
    const used = await payload.find({ collection: "oauth-grants", where: { tokenHash: { equals: sha256(code.jti) } }, limit: 1, overrideAccess: true });
    if (used.docs.length) return err("invalid_grant", "The code was already used");
    await payload.create({ collection: "oauth-grants", data: { kind: "used-code", tokenHash: sha256(code.jti), expiresAt: new Date(code.exp * 1000).toISOString(), clientName: client.client_name }, overrideAccess: true, context: { system: true } });
    userId = code.userId;
  } else if (p.get("grant_type") === "refresh_token") {
    const hash = sha256(p.get("refresh_token") ?? "");
    const found = await payload.find({ collection: "oauth-grants", where: { and: [{ tokenHash: { equals: hash } }, { kind: { equals: "refresh-token" } }] }, limit: 1, overrideAccess: true });
    const grant = found.docs[0];
    if (!grant || grant.clientId !== sha256(clientId) || new Date(grant.expiresAt) < new Date()) return err("invalid_grant", "The refresh token is invalid, expired or revoked");
    // Rotate: the old refresh token stops working.
    await payload.delete({ collection: "oauth-grants", id: grant.id, overrideAccess: true, context: { system: true } });
    userId = String(grant.userId);
  } else {
    return err("unsupported_grant_type", "Use authorization_code or refresh_token");
  }

  const refresh = randomToken();
  await payload.create({ collection: "oauth-grants", data: { kind: "refresh-token", clientName: client.client_name, clientId: sha256(clientId), tokenHash: sha256(refresh), userId, expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 86400_000).toISOString() }, overrideAccess: true, context: { system: true } });
  await logEvent(payload, undefined, { action: "mcp.token-issued", target: `oauth/${client.client_name}`, data: { grant: p.get("grant_type") } });
  return Response.json({ access_token: await issueAccessToken(userId, clientId, "author"), token_type: "Bearer", expires_in: ACCESS_TOKEN_SECONDS, refresh_token: refresh, scope: "author" }, { headers: { "cache-control": "no-store" } });
}
