import { headers } from "next/headers";
import type { PayloadRequest } from "payload";
import { actorOf } from "@/cms/access";
import { cmsClient } from "@/cms/client";
import { logEvent } from "@/cms/events";
import { loadPilotReport, rangeOf } from "@/cms/pilot-data";
import { toHtml, toMarkdown } from "@/cms/pilot";

export const dynamic = "force-dynamic";

/** GET /api/pilot-report?from=&to=&format=md|html&approved=id,id : the creator's report, as a Markdown download or print-friendly HTML. */
export async function GET(request: Request) {
  const payload = await cmsClient();
  const { user } = await payload.auth({ headers: await headers() });
  const req = { payload, user, context: {} } as unknown as PayloadRequest;
  if (actorOf(req).kind !== "creator") return Response.json({ error: "Only the creator can read the pilot report." }, { status: 403 });
  const q = new URL(request.url).searchParams;
  const range = rangeOf(q.get("from"), q.get("to"));
  const report = await loadPilotReport(payload, range);
  const html = q.get("format") === "html";
  await logEvent(payload, req, { action: "pilot-report.exported", target: `pilot-report/${range.from}..${range.to}`, data: { format: html ? "html" : "md" } });
  const approved = q.get("approved") ? { ids: q.get("approved")!.split(",") } : undefined;
  return new Response(html ? toHtml(report, approved) : toMarkdown(report, approved), {
    headers: { "content-type": html ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8", ...(html ? {} : { "content-disposition": `attachment; filename="pilot-report-${range.from}-${range.to}.md"` }), "cache-control": "no-store" },
  });
}
