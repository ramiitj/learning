import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { OfflineReady } from "@/components/OfflineReady";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import "@lm/tokens/tokens.css";
import "@lm/engine/styles.css";
import "@lm/primitives/styles.css";
import "@lm/sim-ai/styles.css";
import "../site.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg" },
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])) },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F2" },
    { media: "(prefers-color-scheme: dark)", color: "#16151C" },
  ],
};

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("site");
  const f = await getTranslations("footer");
  return (
    <html lang={locale} className={fontVariables}>
      <body>
        <NextIntlClientProvider>
          <a className="site-skip" href="#main">{t("skip")}</a>
          <header className="site-header">
            <Link href="/" className="site-brand">
              <svg aria-hidden="true" viewBox="0 0 32 32" width="28" height="28">
                <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
                <circle cx="16" cy="14" r="6.5" fill="none" stroke="var(--color-accent-ink)" strokeWidth="2.6" />
                <path d="M16 20.5v5" stroke="var(--color-accent-ink)" strokeWidth="2.6" strokeLinecap="round" />
                <circle cx="16" cy="14" r="2.2" fill="var(--stage-hook)" />
              </svg>
              <span>{t("name")}</span>
            </Link>
            <LanguageSwitcher />
          </header>
          <main id="main" tabIndex={-1}>{children}</main>
          <footer className="site-footer">
            <p>{f("transparency")}</p>
            <p>{f("privacy")}</p>
            <OfflineReady label={f("offline")} />
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
