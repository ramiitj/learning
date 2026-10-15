import { getTranslations, setRequestLocale } from "next-intl/server";
import { createLessonT } from "@lm/engine";
import { catalogue as contracts } from "@lm/catalogue";
import { allBlocks } from "@lm/schema";
import { cmsClient } from "@/cms/client";
import { findSession, normaliseCode } from "@/classroom/server";
import { JoinForm, PhoneVote, type Question } from "@/components/PhoneVote";
import { getLesson } from "@/lib/content";

export const dynamic = "force-dynamic";

/**
 * A student's phone in a live class. It receives only what it needs to vote:
 * each votable question's text and options in the phone's language. The
 * lesson itself stays on the shared screen.
 */
export default async function JoinCode({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("join");
  const session = process.env.DATABASE_URI ? await findSession(await cmsClient(), code) : null;
  const lesson = session ? await getLesson(session.lessonId) : null;
  if (!session || !lesson) {
    return (
      <main className="join">
        <h1>{t("title")}</h1>
        <p role="alert">{t("notFound")}</p>
        <JoinForm locale={locale} />
      </main>
    );
  }
  // The phone's own language (docs/07: students' phones can use their own), falling back to English.
  const lt = createLessonT(locale, lesson.strings, (_i, c) => c);
  const questions: Record<string, Question> = {};
  for (const { block } of allBlocks(lesson)) {
    const v = contracts.find((c) => c.type === block.type)?.vote?.({ ...block.config, ...(block.classroom ?? {}) });
    if (!v) continue;
    questions[block.id] = {
      prompt: v.promptKey ? lt.text(v.promptKey) : "",
      options: v.options.map((o) => ({ id: o.id, label: lt.text(o.labelKey) })),
      items: v.perItem ? Object.fromEntries(v.perItem.map((i) => [i.id, lt.text(i.labelKey)])) : undefined,
    };
  }
  return (
    <main className="join">
      <PhoneVote code={normaliseCode(code)} questions={questions} />
      <p className="join__privacy">{t("privacy")}</p>
    </main>
  );
}
