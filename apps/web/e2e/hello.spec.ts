import { expect, test } from "@playwright/test";

/**
 * Phase 0 acceptance: a "hello" page in all three locales with Indic fonts
 * rendering correctly.
 */
const expected = {
  en: { headline: "Can a machine learn from you?", font: "Noto Sans", sample: "Can" },
  hi: { headline: "क्या कोई मशीन आपसे सीख सकती है?", font: "Noto Sans Devanagari", sample: "मशीन" },
  te: { headline: "ఒక యంత్రం మీ నుండి నేర్చుకోగలదా?", font: "Noto Sans Telugu", sample: "యంత్రం" },
} as const;

test("the root redirects to a locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(en|hi|te)$/);
});

for (const [locale, e] of Object.entries(expected)) {
  test(`cover renders in ${locale} with the ${e.font} font`, async ({ page }, info) => {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    const headline = page.getByRole("heading", { level: 1 });
    await expect(headline).toHaveText(e.headline);

    // The script's Noto face must actually be loaded and used for the glyphs (not a system fallback).
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
    });
    const family = e.font.replace(/ /g, "_");
    expect(loaded.some((f) => f.includes(family) || f.includes(e.font)), `loaded fonts: ${loaded.join(", ")}`).toBe(true);
    expect(await page.evaluate(([sample]) => document.fonts.check(`16px ${getComputedStyle(document.querySelector("h1")!).fontFamily}`, sample), [e.sample])).toBe(true);

    await info.attach(`cover-${locale}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
}

test("language switcher keeps the page and moves between locales", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("navigation", { name: "Language" }).getByRole("link", { name: "తెలుగు" }).click();
  await expect(page).toHaveURL(/\/te$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(expected.te.headline);
});
