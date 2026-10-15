import { ltiEnabled } from "@/lti/config";
import { toolJwks } from "@/lti/tool-key";

export const dynamic = "force-dynamic";

/** The tool's public key set (LTI 1.3 core §6.3), for future LTI services. Public keys only. */
export async function GET() {
  if (!ltiEnabled()) return new Response(null, { status: 404 });
  try {
    return Response.json(await toolJwks(), { headers: { "cache-control": "public, max-age=3600" } });
  } catch {
    // A malformed LTI_PRIVATE_KEY: say nothing about it publicly.
    return Response.json({ keys: [] }, { status: 500 });
  }
}
