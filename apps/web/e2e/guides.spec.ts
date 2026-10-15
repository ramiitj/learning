import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("teacher guide: a 40-minute plan, misconceptions and a no-device path", async ({ page }) => {
  await page.goto("/en/lessons/every-primitive/teach");
  await expect(page.getByRole("heading", { level: 2, name: /minute plan/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What students may say, and a good response" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No projector or no devices?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open classroom mode" })).toHaveAttribute("href", "/en/lessons/every-primitive/classroom");
});

test("an untranslated guide says so and is marked as English", async ({ page }) => {
  await page.goto("/hi/lessons/every-primitive/teach");
  await expect(page.getByRole("note")).toContainText("अंग्रेज़ी");
  await expect(page.locator('div[lang="en"]')).toBeVisible();
});

test("parent page: what the child explored, in the parent's language, and nothing collected", async ({ page }) => {
  await page.goto("/te/lessons/every-primitive/parents");
  await expect(page.getByRole("heading", { name: "మీ పిల్లలు ఏమి అన్వేషించారు" })).toBeVisible();
  await expect(page.getByText("ఈ పేజీ మీ గురించి గానీ")).toBeVisible();
  await expect(page.locator("form, input")).toHaveCount(0);
});

for (const p of ["en/lessons/every-primitive/teach", "hi/lessons/every-primitive/parents"]) {
  test(`axe: /${p}`, async ({ page }) => {
    await page.goto(`/${p}`);
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
