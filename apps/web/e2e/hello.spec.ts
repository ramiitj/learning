import { expect, test } from "@playwright/test";

/**
 * Phase 0 acceptance: a "hello" page in all three locales with Indic fonts
 * rendering correctly.
 */
const expected = {
  en: { headline: "Can a machine learn from you?", fonts: ["Noto Sans"] },
  hi: { headline: "क्या कोई मशीन आपसे सीख सकती है?", fonts: ["Noto Sans"] },
  te: { headline: "ఒక యంత్రం మీ నుండి నేర్చుకోగలదా?", fonts: ["Noto Sans Telugu", "Noto Sans"] },
} as const;

test("the root redirects to a locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(en|hi|te)$/);
});

for (const [locale, e] of Object.entries(expected)) {
  test(`cover renders in ${locale} with self-hosted Noto fonts (${e.fonts.join(", ")})`, async ({ page }, info) => {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    const headline = page.getByRole("heading", { level: 1 });
    await expect(headline).toHaveText(e.headline);

    // Every glyph of the headline must be drawn by a self-hosted Noto face, never a system fallback.
    await page.evaluate(() => document.fonts.ready);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: "h1" });
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    const summary = fonts.map((f) => `${f.familyName} (${f.isCustomFont ? "web font" : "system"}, ${f.glyphCount} glyphs)`).join("; ");
    expect(fonts.every((f) => f.isCustomFont && (e.fonts as readonly string[]).includes(f.familyName)), summary).toBe(true);
    // The script's own face must carry the bulk of the glyphs (spaces and "?" may come from Latin).
    const main = fonts.reduce((a, b) => (b.glyphCount > a.glyphCount ? b : a));
    expect(main.familyName, summary).toBe(e.fonts[0]);

    await info.attach(`cover-${locale}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
}

test("language switcher keeps the page and moves between locales", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("navigation", { name: "Language" }).getByRole("link", { name: "తెలుగు" }).click();
  await expect(page).toHaveURL(/\/te$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(expected.te.headline);
});
