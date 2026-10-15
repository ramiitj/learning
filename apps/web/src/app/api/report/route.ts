import { createHash, randomBytes } from "node:crypto";
import { cmsClient } from "@/cms/client";
import { logEvent } from "@/cms/events";
import { rateLimited } from "@/classroom/rate-limit";
import { routing } from "@/i18n/routing";
import { listLessonIds } from "@/lib/content";

export const dynamic = "force-dynamic";

/** The address is hashed with a salt that exists only in this process's memory, so the limiter never holds an address and the hash cannot be reversed or linked across restarts. */
const SALT = randomBytes(16);
const ipHash = (req: Request) => createHash("sha256").update(SALT).update(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local").digest("base64url").slice(0, 22);

/**
 * "Report a problem" from any lesson (docs/11). Creates a feedback document;
 * the collection scrubs email addresses and phone numbers. Nothing identifying
 * is stored: not the address, not a cookie.
 */
export async function POST(req: Request) {
  if (rateLimited(req, "report", 5, 3600, ipHash(req))) return Response.json({ error: "rate-limited" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { role?: unknown; message?: unknown; lessonId?: unknown; locale?: unknown } | null;
  if (!body || typeof body.message !== "string" || !body.message.trim() || body.message.length > 1000) return Response.json({ error: "invalid" }, { status: 400 });
  if (!["learner", "teacher", "other"].includes(String(body.role)) || !(routing.locales as readonly string[]).includes(String(body.locale))) return Response.json({ error: "invalid" }, { status: 400 });
  if (typeof body.lessonId !== "string" || !(await listLessonIds()).includes(body.lessonId)) return Response.json({ error: "unknown lesson" }, { status: 404 });
  const payload = await cmsClient();
  const doc = await payload.create({ collection: "feedback", overrideAccess: true, data: { message: body.message, lessonId: body.lessonId, locale: String(body.locale), role: body.role as "learner" | "teacher" | "other" } });
  await logEvent(payload, undefined, { action: "feedback.create", target: `feedback/${doc.id}`, data: { lessonId: body.lessonId, locale: body.locale, role: body.role } });
  return Response.json({ ok: true }, { status: 201 });
}
