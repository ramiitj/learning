import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Mode } from "@lm/engine";
import { createLessonT } from "@lm/engine";
import { LessonClient } from "@/components/LessonClient";
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
  return (
    <div data-mode={mode} className="lesson-page">
      <nav className="lesson-page__mode" aria-label={t("modeLabel")}>
        <Link href={`/lessons/${id}`} aria-current={mode === "personal" ? "page" : undefined}>{t("personal")}</Link>
        <Link href={`/lessons/${id}/classroom`} aria-current={mode === "classroom" ? "page" : undefined}>{t("classroom")}</Link>
      </nav>
      <LessonClient lesson={lesson} locale={locale} mode={mode} glossary={glossaryFor(glossary, locale)} detours={detours} />
    </div>
  );
}
