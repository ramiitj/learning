import { mcpResource, origin } from "@/auth/oauth";

/** RFC 9728: tells MCP clients where to get a token for the authoring connector. */
export function GET() {
  return Response.json({ resource: mcpResource(), authorization_servers: [origin()], bearer_methods_supported: ["header"], scopes_supported: ["author"] });
}
