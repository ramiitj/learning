"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { cmsClient } from "../client";
import { actorOf, recentlyAuthenticated } from "../access";
import { logEvent } from "../events";
import { signInvite } from "@/auth/session";
import type { PayloadRequest } from "payload";

async function me() {
  const payload = await cmsClient();
  const { user } = await payload.auth({ headers: await headers() });
  const req = { payload, user, context: {} } as unknown as PayloadRequest;
  return { payload, user, req, actor: actorOf(req) };
}

const hashText = (s: string) => createHash("sha256").update(s).digest("base64url").slice(0, 16);

/** Command channel: the creator's instruction becomes a pipeline run for the Editor-in-Chief. */
export async function startRun(form: FormData) {
  const { payload, user, actor } = await me();
  if (actor.kind !== "creator") throw new Error("Only the creator can instruct the agents.");
  const request = String(form.get("request") ?? "").trim();
  if (request.length < 10) throw new Error("Say a little more about what you want.");
  const lessonId = String(form.get("lessonId") ?? "").trim() || undefined;
  const lesson = lessonId ? (await payload.find({ collection: "lessons", where: { lessonId: { equals: lessonId } }, limit: 1, draft: true, overrideAccess: true })).docs[0] : undefined;
  await payload.create({ collection: "pipeline-runs", data: { title: request.slice(0, 80), request, lesson: lesson?.id, lessonSlug: lessonId, stage: "plan", status: "queued", urgent: form.get("urgent") === "on" }, user: user as never, overrideAccess: false });
  // Start the first step now rather than waiting for the minute's tick.
  after(() => kick());
  revalidatePath("/console/command");
}

export async function kick() {
  const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
  if (process.env.CRON_SECRET) await fetch(`${origin}/api/pipeline/tick`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }).catch(() => undefined);
}

/** Invite a native-speaker reviewer for some locales; returns a link they open to create their passkey. */
export async function inviteReviewer(_prev: unknown, form: FormData): Promise<{ link?: string; error?: string }> {
  const { payload, req, actor } = await me();
  if (actor.kind !== "creator") return { error: "Only the creator can invite reviewers." };
  if (!recentlyAuthenticated(req)) return { error: "Inviting someone is a permission change: confirm with your passkey first (top right)." };
  const name = String(form.get("name") ?? "").trim();
  const locales = form.getAll("locales").map(String).filter((l) => ["hi", "te"].includes(l));
  if (!name || !locales.length) return { error: "Give a name and at least one language." };
  const user = await payload.create({ collection: "users", data: { name, role: "reviewer", reviewerLocales: locales }, overrideAccess: true, context: { system: true } });
  await logEvent(payload, req, { action: "access.reviewer-invited", target: `users/${user.id}`, data: { locales } });
  return { link: `${process.env.APP_ORIGIN ?? ""}/console/login?invite=${encodeURIComponent(await signInvite(user.id))}` };
}

/**
 * A reviewer corrects and approves strings in their own language. Approval is
 * recorded per string, against the exact text approved; when every string in
 * a locale has a current approval, the locale becomes "reviewed".
 */
export async function reviewStrings(form: FormData) {
  const { payload, req, actor } = await me();
  const locale = String(form.get("locale"));
  const allowed = actor.kind === "creator" || (actor.kind === "reviewer" && actor.locales.includes(locale));
  if (!allowed || locale === "en") throw new Error("You can review only the languages you were invited for.");
  const lessonDocId = Number(form.get("lesson"));
  const doc = await payload.findByID({ collection: "lessons", id: lessonDocId, draft: true, overrideAccess: true });
  const lesson = structuredClone(doc.doc) as { strings: Record<string, Record<string, string>>; localeStatus: Record<string, string> };
  const reviews = structuredClone((doc.reviews as Record<string, Record<string, { by: string; at: string; hash: string }>>) ?? {});
  const table = (lesson.strings[locale] ??= {});
  const who = actor.kind === "creator" ? "creator" : `reviewer:${actor.kind === "reviewer" ? actor.id : ""}`;
  for (const key of Object.keys(lesson.strings.en ?? {})) {
    const text = form.get(`s:${key}`);
    if (typeof text === "string" && text.trim() && text !== table[key]) table[key] = text.trim();
    if (form.get(`ok:${key}`) === "on" && table[key]) (reviews[locale] ??= {})[key] = { by: who, at: new Date().toISOString(), hash: hashText(`${lesson.strings.en?.[key]}\u0000${table[key]}`) };
  }
  // A locale is reviewed only when every English string has an approved translation that has not changed since.
  const complete = Object.keys(lesson.strings.en ?? {}).every((k) => table[k] && reviews[locale]?.[k]?.hash === hashText(`${lesson.strings.en?.[k]}\u0000${table[k]}`));
  lesson.localeStatus = { ...lesson.localeStatus, [locale]: complete ? "reviewed" : lesson.localeStatus[locale] === "missing" ? "missing" : "draft" };
  await payload.update({ collection: "lessons", id: lessonDocId, data: { doc: lesson as never, reviews: reviews as never, _status: "draft" }, draft: true, overrideAccess: true, context: { translationReview: true, reason: `translation review (${locale})` }, req });
  await logEvent(payload, req, { action: complete ? "translation.locale-reviewed" : "translation.strings-reviewed", target: `lessons/${lessonDocId}`, data: { locale } });
  revalidatePath("/console/translations");
}
