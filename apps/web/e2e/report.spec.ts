import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const [path, mode] of [
  ["en/lessons/every-primitive", "personal"],
  ["en/lessons/every-primitive/classroom", "classroom"],
] as const) {
  test(`report a problem: keyboard only, ${mode} mode`, async ({ page }) => {
    let posted: Record<string, unknown> | null = null;
    await page.route("**/api/report", async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto(`/${path}`);
    const toggle = page.getByRole("button", { name: "Report a problem" });
    await toggle.scrollIntoViewIfNeeded();
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Do not include your name or contact details.")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();
    expect(results.violations).toEqual([]);
    await page.getByLabel("I am a").selectOption("teacher");
    await page.getByLabel("What went wrong?").fill("The second question has a typo.");
    await page.getByRole("button", { name: "Send report" }).press("Enter");
    await expect(page.locator(".report__done")).toContainText("Thank you");
    expect(posted).toMatchObject({ role: "teacher", lessonId: "every-primitive", locale: "en", message: "The second question has a typo." });
  });
}

test("report a problem: a failed send says so and keeps the message", async ({ page }) => {
  await page.route("**/api/report", (route) => route.fulfill({ status: 429, contentType: "application/json", body: '{"error":"rate-limited"}' }));
  await page.goto("/hi/lessons/every-primitive");
  await page.getByRole("button", { name: "समस्या बताएँ" }).click();
  await page.getByLabel("क्या गड़बड़ हुई?").fill("test");
  await page.getByRole("button", { name: "रिपोर्ट भेजें" }).click();
  // Next.js adds an empty route-announcer alert of its own.
  await expect(page.getByRole("alert").filter({ hasText: "रिपोर्ट नहीं भेजी" })).toBeVisible();
  await expect(page.getByLabel("क्या गड़बड़ हुई?")).toHaveValue("test");
});
