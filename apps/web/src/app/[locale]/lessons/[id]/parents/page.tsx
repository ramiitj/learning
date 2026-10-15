import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createLessonT } from "@lm/engine";
import { Link } from "@/i18n/navigation";
import { getLesson, getTeacherGuide } from "@/lib/content";
import type { LessonParams } from "../lesson-page";

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: LessonParams }): Promise<Metadata> {
  const { locale, id } = await params;
  const [lesson, t] = await Promise.all([getLesson(id), getTranslations({ locale, namespace: "parents" })]);
  if (!lesson) return {};
  return { title: t("title", { lesson: createLessonT(locale, lesson.strings, (_i, c) => c).text(lesson.meta.titleKey) }) };
}

/**
 * The parent page (docs/12): what the child explored and a conversation to
 * have at home. It needs, and collects, no data about the child.
 */
export default async function ParentsPage({ params }: { params: LessonParams }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [lesson, found, t] = await Promise.all([getLesson(id), getTeacherGuide(id, locale), getTranslations("parents")]);
  if (!lesson) notFound();
  const lt = createLessonT(locale, lesson.strings, (_i, c) => c);
  return (
    <article className="guide">
      <p className="guide__kicker">{t("kicker")}</p>
      <h1>{lt.text(lesson.meta.titleKey)}</h1>
      {lesson.meta.subtitleKey ? <p className="guide__lede">{lt.text(lesson.meta.subtitleKey)}</p> : null}
      <section aria-labelledby="p-explored">
        <h2 id="p-explored">{t("explored")}</h2>
        <ul>{lesson.meta.objectives.map((o) => <li key={o.id}>{lt.text(o.textKey)}</li>)}</ul>
        <p>{t("minutes", { minutes: lesson.meta.estimatedMinutes })}</p>
      </section>
      {found ? (
        <section aria-labelledby="p-home">
          <h2 id="p-home">{t("atHome")}</h2>
          {found.fallback ? <p className="guide__notice" role="note">{t("fallback")}</p> : null}
          <p lang={found.locale}>{found.guide.parentNote}</p>
        </section>
      ) : null}
      <section aria-labelledby="p-try">
        <h2 id="p-try">{t("tryIt")}</h2>
        <p>{t("tryItText")} <Link href={`/lessons/${id}`}>{t("open")}</Link></p>
      </section>
      <p className="guide__privacy">{t("privacy")}</p>
    </article>
  );
}
