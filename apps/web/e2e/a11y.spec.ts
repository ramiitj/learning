import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** WCAG 2.2 AA automated checks on every page type, in every locale and both modes. */
const pages = ["", "/lessons/every-primitive", "/lessons/every-primitive/classroom", "/preview"];
const locales = ["en", "hi", "te"];
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const locale of locales) {
  for (const p of pages) {
    test(`axe: /${locale}${p}`, async ({ page }) => {
      await page.goto(`/${locale}${p}`);
      if (p.includes("lessons")) await expect(page.locator("article[data-hydrated]")).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(tags).analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n  ")}`);
      expect(summary, summary.join("\n")).toEqual([]);
    });
  }
}

test("axe: dark mode lesson", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en/lessons/every-primitive");
  await expect(page.locator("article[data-hydrated]")).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test("keyboard: skip link, then every control is reachable with a visible focus ring", async ({ page }) => {
  await page.goto("/en/lessons/every-primitive");
  await expect(page.locator("article[data-hydrated]")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to the main content" })).toBeFocused();
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return "none";
      const s = getComputedStyle(el);
      const target = el.closest(".lm-pill, .lm-choice") ?? el;
      const t = getComputedStyle(target);
      return s.outlineStyle !== "none" ? s.outlineStyle : t.outlineStyle;
    });
    expect(outline, `focus ring missing at tab stop ${i}`).not.toBe("none");
  }
});

test("classroom projection: every piece of text is at least 28px at 1080p (docs/06)", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const locale of ["en", "te"]) {
    await page.goto(`/${locale}/lessons/every-primitive/classroom`);
    await expect(page.locator("article[data-hydrated]")).toBeVisible();
    const small = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(".lm-lesson *")) {
        const hasText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
        if (!hasText || el.offsetParent === null || el.closest(".lm-sr-only")) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 28) out.push(`${size}px ${el.tagName.toLowerCase()}.${el.className} "${el.textContent!.trim().slice(0, 40)}"`);
      }
      return out;
    });
    expect(small, small.join("\n")).toEqual([]);
  }
});
