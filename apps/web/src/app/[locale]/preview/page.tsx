import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PreviewClient } from "@/components/LessonClient";
import { detourIdsOf, getDetours, getGlossary, getLesson, glossaryFor } from "@/lib/content";

const PREVIEW_LESSON = "every-primitive";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "preview" });
  return { title: t("title"), robots: { index: false } };
}

/**
 * Every component in personal and classroom mode, side by side, in the
 * current locale: the "story or preview page" each component ships with.
 */
export default async function Preview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("preview");
  const lesson = await getLesson(PREVIEW_LESSON);
  if (!lesson) return null;
  const [glossary, detours] = await Promise.all([getGlossary(), getDetours(detourIdsOf(lesson))]);
  const byType = new Map<string, string>();
  for (const s of lesson.stages) for (const b of s.blocks) if (!byType.has(b.type)) byType.set(b.type, b.id);
  const g = glossaryFor(glossary, locale);
  return (
    <div className="preview">
      <h1>{t("title")}</h1>
      <p className="lm-lead">{t("intro")}</p>
      <nav aria-labelledby="preview-contents">
        <h2 id="preview-contents" className="lm-eyebrow">{t("contents")}</h2>
        <ul className="preview__toc">
          {[...byType.keys()].map((type) => (
            <li key={type}><a href={`#c-${type}`}><code>{type}</code></a></li>
          ))}
        </ul>
      </nav>
      {[...byType.entries()].map(([type, blockId]) => (
        <section key={type} id={`c-${type}`} className="preview__component" aria-labelledby={`h-${type}`}>
          <h2 id={`h-${type}`}><code>{type}</code></h2>
          <div className="preview__pair">
            <div>
              <h3 className="lm-eyebrow">{t("personal")}</h3>
              <PreviewClient lesson={lesson} blockId={blockId} locale={locale} mode="personal" glossary={g} detours={detours} />
            </div>
            <div>
              <h3 className="lm-eyebrow">{t("classroom")}</h3>
              <PreviewClient lesson={lesson} blockId={blockId} locale={locale} mode="classroom" glossary={g} detours={detours} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
