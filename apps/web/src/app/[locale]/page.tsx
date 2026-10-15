import { getTranslations, setRequestLocale } from "next-intl/server";
import { createLessonT } from "@lm/engine";
import { CoverArt } from "@/components/CoverArt";
import { Link } from "@/i18n/navigation";
import { localeConfig } from "@/i18n/routing";
import { getLesson, listLessonIds } from "@/lib/content";

/**
 * The home screen is the current issue's cover (docs/06, docs/12): a cover
 * story you want to open, not a course catalogue. The call to action sits
 * where a thumb reaches on a phone.
 */
export default async function Cover({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cover");
  const s = await getTranslations("lesson");
  const lessons = (await Promise.all((await listLessonIds()).map((id) => getLesson(id)))).filter((l) => l !== null);
  const story = lessons[0];
  const lt = story ? createLessonT(locale, story.strings, (_id, children) => children) : null;
  const stages = await getTranslations("stages");
  return (
    <div className="cover">
      <section className="cover__hero" aria-labelledby="cover-headline">
        <div className="cover__text">
          <p className="cover__issue">{t("issue")}</p>
          <h1 id="cover-headline" className="cover__headline">{t("headline")}</h1>
          <p className="cover__dek">{t("dek")}</p>
          {story && lt ? (
            <div className="cover__cta">
              <Link className="lm-btn lm-btn--primary cover__open" href={`/lessons/${story.id}`}>
                {t("open")}
                <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <p className="cover__meta">
                {lt.text(story.meta.titleKey)} · {t("minutes", { n: story.meta.estimatedMinutes })}
              </p>
            </div>
          ) : null}
        </div>
        <CoverArt />
      </section>

      {story && lt ? (
        <section className="cover__inside" aria-labelledby="inside-h">
          <h2 id="inside-h" className="cover__section-title">{t("inside")}</h2>
          <article className="cover__story" aria-labelledby={`story-${story.id}`}>
            <h3 id={`story-${story.id}`}>{lt.text(story.meta.titleKey)}</h3>
            {story.meta.subtitleKey ? <p className="cover__story-dek">{lt.text(story.meta.subtitleKey)}</p> : null}
            <ol className="cover__parts">
              {story.stages.map((st, i) => (
                <li key={`${st.stage}-${i}`} style={{ ["--stage" as string]: `var(--stage-${st.stage})`, ["--stage-soft" as string]: `var(--stage-${st.stage}-soft)` }}>
                  <span aria-hidden="true">{i + 1}</span>
                  {stages(st.stage)}
                </li>
              ))}
            </ol>
            <div className="lm-row">
              <Link className="lm-btn lm-btn--primary" href={`/lessons/${story.id}`}>{t("open")}</Link>
              <Link className="lm-btn lm-btn--secondary" href={`/lessons/${story.id}/classroom`}>{t("classroom")}</Link>
            </div>
            <p className="cover__langs">
              {t("availableIn")}{" "}
              {localeConfig.map((l, i) => (
                <span key={l.code} lang={l.code}>{i > 0 ? " · " : ""}{l.name}</span>
              ))}
            </p>
          </article>
        </section>
      ) : null}

      <p className="cover__preview">
        <Link href="/preview">{t("preview")}</Link> · {s("teaching")}{" "}
        {story ? <Link href={`/lessons/${story.id}/classroom`}>{s("openClassroom")}</Link> : null}
      </p>
    </div>
  );
}
