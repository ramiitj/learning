import { cmsClient } from "@/cms/client";
import { createSession } from "@/classroom/server";
import { getLesson } from "@/lib/content";
import { routing } from "@/i18n/routing";
import { rateLimited } from "@/classroom/rate-limit";

export const dynamic = "force-dynamic";

/** A teacher starts a live session for a published lesson. No account needed; the teacher's screen keeps the host key. */
export async function POST(req: Request) {
  if (rateLimited(req, "create", 20, 3600)) return Response.json({ error: "Too many sessions from this network. Try again later." }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { lessonId?: string; locale?: string };
  const locale = (routing.locales as readonly string[]).includes(body.locale ?? "") ? body.locale! : routing.defaultLocale;
  const lesson = body.lessonId ? await getLesson(body.lessonId) : null;
  if (!lesson) return Response.json({ error: "No such lesson" }, { status: 404 });
  const { code, hostKey } = await createSession(await cmsClient(), lesson.id, locale);
  return Response.json({ code, hostKey }, { status: 201, headers: { "cache-control": "no-store" } });
}
