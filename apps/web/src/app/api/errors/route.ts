import { cmsClient } from "@/cms/client";
import { rateLimited } from "@/classroom/rate-limit";
import { recordError } from "@/ops/errors";

export const dynamic = "force-dynamic";

/**
 * Receives scrubbed errors from the browser reporter (src/instrumentation-client.ts).
 * Rate-limited; text is scrubbed again here; nothing about the sender is stored.
 */
export async function POST(req: Request) {
  if (rateLimited(req, "errors", 30, 60)) return new Response(null, { status: 204 });
  const raw = await req.text();
  if (raw.length > 4000) return new Response(null, { status: 413 });
  let body: { message?: unknown; stack?: unknown; route?: unknown } | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!body || typeof body.message !== "string" || !body.message) return new Response(null, { status: 400 });
  await recordError(await cmsClient(), { source: "client", message: body.message, stack: typeof body.stack === "string" ? body.stack : "", route: typeof body.route === "string" ? body.route : "" });
  return new Response(null, { status: 204 });
}
