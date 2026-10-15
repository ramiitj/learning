import { origin } from "@/auth/oauth";
import { OriginUnavailableError, originUnavailableResponse } from "@/auth/origin";

/** RFC 8414 metadata for the connector's authorization server. */
export function GET() {
  let o: string;
  try {
    o = origin();
  } catch (e) {
    if (e instanceof OriginUnavailableError) return originUnavailableResponse(e);
    throw e;
  }
  return Response.json({
    issuer: o,
    authorization_endpoint: `${o}/oauth/authorize`,
    token_endpoint: `${o}/api/oauth/token`,
    registration_endpoint: `${o}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["author"],
  });
}
