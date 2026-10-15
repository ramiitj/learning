import { mcpResource, origin } from "@/auth/oauth";
import { OriginUnavailableError, originUnavailableResponse } from "@/auth/origin";

/** RFC 9728: tells MCP clients where to get a token for the authoring connector. */
export function GET() {
  try {
    return Response.json({ resource: mcpResource(), authorization_servers: [origin()], bearer_methods_supported: ["header"], scopes_supported: ["author"] });
  } catch (e) {
    if (e instanceof OriginUnavailableError) return originUnavailableResponse(e);
    throw e;
  }
}
