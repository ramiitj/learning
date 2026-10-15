import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { origin, readAccessToken } from "@/auth/oauth";
import { cmsClient } from "@/cms/client";
import { buildMcpServer } from "@/mcp/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const unauthorized = () =>
  new Response(JSON.stringify({ error: "invalid_token" }), {
    status: 401,
    headers: { "content-type": "application/json", "www-authenticate": `Bearer resource_metadata="${origin()}/.well-known/oauth-protected-resource/api/mcp"` },
  });

/** The MCP authoring connector: OAuth-protected, stateless Streamable HTTP. */
async function handle(req: Request): Promise<Response> {
  const bearer = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!bearer) return unauthorized();
  let token;
  try {
    token = await readAccessToken(bearer);
  } catch {
    return unauthorized();
  }
  const payload = await cmsClient();
  const user = await payload.findByID({ collection: "users", id: token.userId, overrideAccess: true, depth: 0 }).catch(() => null);
  if (!user || user.role !== "creator") return unauthorized();
  const server = buildMcpServer(payload, { ...user, collection: "users" });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
