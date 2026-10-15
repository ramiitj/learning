import { getTranslations, setRequestLocale } from "next-intl/server";
import { JoinForm } from "@/components/PhoneVote";

export default async function Join({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("join");
  return (
    <main className="join">
      <h1>{t("title")}</h1>
      <JoinForm locale={locale} />
      <p className="join__privacy">{t("privacy")}</p>
    </main>
  );
}
