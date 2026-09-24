import { getTranslations, setRequestLocale } from "next-intl/server";
import { createLessonT } from "@lm/engine";
import { Link } from "@/i18n/navigation";
import { getLesson, listLessonIds } from "@/lib/content";

/** The home screen is the current issue's cover (docs/06, docs/12). */
export default async function Cover({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cover");
  const lessons = (await Promise.all((await listLessonIds()).map((id) => getLesson(id)))).filter((l) => l !== null);
  return (
    <div className="cover">
      <section className="cover__hero" aria-labelledby="cover-headline">
        <p className="lm-eyebrow">{t("issue")}</p>
        <h1 id="cover-headline" className="cover__headline">{t("headline")}</h1>
        <p className="cover__dek">{t("dek")}</p>
        <p className="cover__scripts">{t("scripts")}</p>
      </section>
      <ul className="cover__stories">
        {lessons.map((lesson) => {
          const lt = createLessonT(locale, lesson.strings, (_id, children) => children);
          return (
            <li key={lesson.id} className="cover__story">
              <article aria-labelledby={`story-${lesson.id}`}>
                <h2 id={`story-${lesson.id}`}>{lt.text(lesson.meta.titleKey)}</h2>
                {lesson.meta.subtitleKey ? <p>{lt.text(lesson.meta.subtitleKey)}</p> : null}
                <p className="lm-muted">{t("minutes", { n: lesson.meta.estimatedMinutes })}</p>
                <div className="lm-row">
                  <Link className="lm-btn lm-btn--primary" href={`/lessons/${lesson.id}`}>{t("open")}</Link>
                  <Link className="lm-btn lm-btn--quiet" href={`/lessons/${lesson.id}/classroom`}>{t("classroom")}</Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      <p><Link href="/preview">{t("preview")}</Link></p>
    </div>
  );
}
