import { sql } from "@payloadcms/db-postgres";
import { cmsClient } from "@/cms/client";
import { rateLimited } from "@/classroom/rate-limit";
import { listLessonIds } from "@/lib/content";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const METRICS = new Set(["start", "return", "reach", "act", "answer", "post", "depth", "expand", "detour", "glossary", "complete"]);
const KEY = /^[\w.:-]{0,120}$/;

/**
 * Receives a page's learning moments and adds them to anonymous daily totals.
 * Nothing that identifies a learner is accepted, stored or logged: no cookie,
 * no identifier, no address (the rate limiter keeps a count in memory only).
 */
export async function POST(req: Request) {
  if (rateLimited(req, "analytics", 2000, 60)) return new Response(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { lessonId?: string; locale?: string; mode?: string; counts?: [string, string, number][] } | null;
  if (!body || typeof body.lessonId !== "string" || !Array.isArray(body.counts)) return new Response(null, { status: 400 });
  if (!(routing.locales as readonly string[]).includes(body.locale ?? "") || !["personal", "classroom"].includes(body.mode ?? "")) return new Response(null, { status: 400 });
  if (!(await listLessonIds()).includes(body.lessonId)) return new Response(null, { status: 404 });
  const rows = body.counts
    .filter(([m, k, n]) => METRICS.has(m) && typeof k === "string" && KEY.test(k) && Number.isInteger(n) && n > 0 && n <= 50)
    .slice(0, 300);
  if (!rows.length) return new Response(null, { status: 204 });
  const day = new Date().toISOString().slice(0, 10);
  const payload = await cmsClient();
  const values = rows.map(([m, k, n]) => sql`(${day}, ${body.lessonId}, ${body.locale}, ${body.mode}, ${m}, ${k}, ${n}, now(), now())`);
  await payload.db.drizzle.execute(sql`
    INSERT INTO analytics_daily (day, lesson_id, locale, mode, metric, key, count, updated_at, created_at)
    VALUES ${sql.join(values, sql`, `)}
    ON CONFLICT (day, lesson_id, locale, mode, metric, key) DO UPDATE SET count = analytics_daily.count + EXCLUDED.count, updated_at = now()`);
  return new Response(null, { status: 204 });
}
