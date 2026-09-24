"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeConfig } from "@/i18n/routing";

/**
 * Switch language without losing your place: on a lesson page the link
 * carries #resume, and the lesson scrolls back to the last block touched.
 */
export function LanguageSwitcher() {
  const t = useTranslations("site");
  const locale = useLocale();
  const pathname = usePathname();
  const hash = pathname.includes("/lessons/") ? "#resume" : "";
  return (
    <nav aria-label={t("language")} className="site-lang">
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
  );
}
