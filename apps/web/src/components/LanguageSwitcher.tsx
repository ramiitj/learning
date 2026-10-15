"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeConfig } from "@/i18n/routing";

/**
 * One compact language menu instead of a row of pills, so the first phone
 * screen belongs to the story. A native <details> disclosure: it works before
 * JavaScript loads and on any device. On a lesson page the links carry
 * #resume, so the learner lands back on the block they were working on.
 */
export function LanguageSwitcher() {
  const t = useTranslations("site");
  const locale = useLocale();
  const pathname = usePathname();
  const hash = pathname.includes("/lessons/") ? "#resume" : "";
  const current = localeConfig.find((l) => l.code === locale) ?? localeConfig[0]!;
  return (
    <details className="site-lang">
      <summary aria-label={`${t("language")}: ${current.name}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
        <span lang={current.code}>{current.name}</span>
      </summary>
      <nav aria-label={t("language")}>
        <ul>
          {localeConfig.map((l) => (
            <li key={l.code}>
              <Link href={`${pathname}${hash}`} locale={l.code} lang={l.code} hrefLang={l.code} aria-current={l.code === locale ? "true" : undefined}>
                {l.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
