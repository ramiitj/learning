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
  const [lesson, t] = await Promise.all([getLesson(id), getTranslations({ locale, namespace: "guide" })]);
  if (!lesson) return {};
  return { title: t("title", { lesson: createLessonT(locale, lesson.strings, (_i, c) => c).text(lesson.meta.titleKey) }) };
}

/** The teacher guide (docs/12): one page a teacher can read before a 40-minute period. */
export default async function TeachPage({ params }: { params: LessonParams }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [lesson, found, t] = await Promise.all([getLesson(id), getTeacherGuide(id, locale), getTranslations("guide")]);
  if (!lesson || !found) notFound();
  const { guide: g } = found;
  const title = createLessonT(locale, lesson.strings, (_i, c) => c).text(lesson.meta.titleKey);
  const total = g.timing.reduce((n, s) => n + s.minutes, 0);
  return (
    <article className="guide">
      <p className="guide__kicker">{t("kicker")}</p>
      <h1>{title}</h1>
      <p className="guide__links">
        <Link href={`/lessons/${id}/classroom`}>{t("openClassroom")}</Link> · <Link href={`/lessons/${id}`}>{t("openPersonal")}</Link> · <Link href={`/lessons/${id}/parents`}>{t("parentPage")}</Link>
      </p>
      {found.fallback ? <p className="guide__notice" role="note">{t("fallback")}</p> : null}
      <div lang={found.locale}>
        <section aria-labelledby="g-obj">
          <h2 id="g-obj">{t("objectives")}</h2>
          <ul>{g.objectivesPlain.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </section>
        {g.before.length ? (
          <section aria-labelledby="g-before">
            <h2 id="g-before">{t("before")}</h2>
            <ul>{g.before.map((o, i) => <li key={i}>{o}</li>)}</ul>
          </section>
        ) : null}
        <section aria-labelledby="g-timing">
          <h2 id="g-timing">{t("timing", { minutes: total })}</h2>
          <div className="guide__table-wrap">
            <table className="guide__table">
              <thead>
                <tr><th scope="col">{t("segment")}</th><th scope="col">{t("minutes")}</th><th scope="col">{t("teacherDoes")}</th><th scope="col">{t("studentsDo")}</th></tr>
              </thead>
              <tbody>
                {g.timing.map((s, i) => (
                  <tr key={i}><th scope="row">{s.segment}</th><td>{s.minutes}</td><td>{s.teacherDoes}</td><td>{s.studentsDo}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p><strong>{t("short")}</strong> {g.ifShortOfTime}</p>
        </section>
        <section aria-labelledby="g-mis">
          <h2 id="g-mis">{t("misconceptions")}</h2>
          <dl className="guide__pairs">
            {g.misconceptions.map((m, i) => (
              <div key={i}><dt>{m.studentsSay}</dt><dd>{m.goodResponse}</dd></div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="g-disc">
          <h2 id="g-disc">{t("discussion")}</h2>
          <ul>{g.discussionPrompts.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </section>
        <section aria-labelledby="g-nodev">
          <h2 id="g-nodev">{t("noDevice")}</h2>
          <p>{g.noDeviceAlternative}</p>
        </section>
        <section aria-labelledby="g-idk">
          <h2 id="g-idk">{t("dontKnow")}</h2>
          <p>{g.ifYouDontKnow}</p>
        </section>
      </div>
    </article>
  );
}
