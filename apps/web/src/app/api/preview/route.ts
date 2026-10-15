import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { readPreview } from "@/auth/session";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

/** Opens a lesson's latest draft. The link is signed and expires; it never reveals other drafts. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lessonId = await readPreview(url.searchParams.get("token"));
  if (!lessonId) return new Response("This preview link has expired or is not valid.", { status: 403 });
  const locale = (routing.locales as readonly string[]).includes(url.searchParams.get("locale") ?? "") ? url.searchParams.get("locale")! : routing.defaultLocale;
  const mode = url.searchParams.get("mode") === "classroom" ? "/classroom" : "";
  (await draftMode()).enable();
  // Draft mode is site-wide in Next.js; this cookie narrows it to the one lesson the link was made for.
  (await cookies()).set("lm-preview", url.searchParams.get("token")!, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 72 * 3600 });
  redirect(`/${locale}/lessons/${lessonId}${mode}`);
}
