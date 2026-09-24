import { defineRouting } from "next-intl/routing";
import locales from "../../../../platform/config/locales.json" with { type: "json" };

/** Launch locales come from platform/config/locales.json: adding a locale is configuration plus content. */
export const localeConfig = locales.locales;

export const routing = defineRouting({
  locales: localeConfig.map((l) => l.code),
  defaultLocale: locales.default,
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
