import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Mode } from "@lm/engine";
import { createLessonT } from "@lm/engine";
import { LessonClient } from "@/components/LessonClient";
import { LiveClassroom } from "@/components/LiveClassroom";
import { Link } from "@/i18n/navigation";
import { detourIdsOf, getDetours, getGlossary, getLesson, glossaryFor, listLessonIds } from "@/lib/content";

export type LessonParams = Promise<{ locale: string; id: string }>;

export async function lessonStaticParams() {
  return (await listLessonIds()).map((id) => ({ id }));
}

export async function lessonMetadata(params: LessonParams): Promise<Metadata> {
  const { locale, id } = await params;
  const lesson = await getLesson(id);
  if (!lesson) return {};
  const t = createLessonT(locale, lesson.strings, (_i, c) => c);
  return { title: t.text(lesson.meta.titleKey), description: lesson.meta.subtitleKey ? t.text(lesson.meta.subtitleKey) : undefined };
}

/** Shared by the personal and classroom routes; both are fully static. */
export async function LessonPage({ params, mode }: { params: LessonParams; mode: Mode }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const lesson = await getLesson(id);
  if (!lesson) notFound();
  const [glossary, detours, t] = await Promise.all([getGlossary(), getDetours(detourIdsOf(lesson)), getTranslations("lesson")]);
  // Anonymous counts only where there is a server to count them, and never for the creator's draft previews.
  const analytics = !!process.env.DATABASE_URI && !(await draftMode()).isEnabled;
  return (
    <div data-mode={mode} className="lesson-page">
      {mode === "classroom" ? (
        <p className="lesson-page__exit">
          <Link href={`/lessons/${id}`}>{t("leaveClassroom")}</Link>
        </p>
      ) : null}
      {mode === "classroom" && process.env.DATABASE_URI ? (
        // Live voting needs the server; offline packs and file-only builds keep show-of-hands only.
        <LiveClassroom lessonId={id} locale={locale}>
          <LessonClient lesson={lesson} locale={locale} mode={mode} glossary={glossaryFor(glossary, locale)} detours={detours} analytics={analytics} />
        </LiveClassroom>
      ) : (
        <LessonClient lesson={lesson} locale={locale} mode={mode} glossary={glossaryFor(glossary, locale)} detours={detours} analytics={analytics} />
      )}
      {mode === "personal" ? (
        <aside className="lesson-page__after">
          <p>
            {t("teaching")} <Link href={`/lessons/${id}/classroom`}>{t("openClassroom")}</Link>
          </p>
          <p>
            <Link href="/">{t("moreStories")}</Link>
          </p>
        </aside>
      ) : null}
    </div>
  );
}
