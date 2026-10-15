import { cmsClient } from "@/cms/client";
import { findSession, publicState } from "@/classroom/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const POLL_MS = 700;
const LIFETIME_MS = 55_000; // the browser's EventSource reconnects on its own after this

/**
 * Server-Sent Events: sends the session state whenever its revision changes.
 * Each connection polls one indexed row; a class of 40 phones and a projector
 * is about 60 small queries a second, well within a single Postgres.
 */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code;
  const payload = await cmsClient();
  if (!(await findSession(payload, code))) return new Response("No session with that code", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let last = -1;
      let lastBeat = Date.now();
      const started = Date.now();
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      send(`retry: 1500\n\n`);
      while (!req.signal.aborted && Date.now() - started < LIFETIME_MS) {
        const s = await findSession(payload, code).catch(() => null);
        if (!s) {
          send(`event: ended\ndata: {}\n\n`);
          break;
        }
        if (s.revision !== last) {
          last = s.revision;
          send(`data: ${JSON.stringify(await publicState(payload, s))}\n\n`);
        } else if (Date.now() - lastBeat > 15_000) {
          send(`: keep-alive\n\n`);
          lastBeat = Date.now();
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-store, no-transform", connection: "keep-alive", "x-accel-buffering": "no" } });
}
