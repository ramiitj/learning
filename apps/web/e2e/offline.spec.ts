import { expect, test } from "@playwright/test";

/** Phase 1 acceptance: the lesson works offline after the first load. */
test("a lesson works offline after the first visit", async ({ page, context }) => {
  await page.goto("/en/lessons/every-primitive");
  await expect(page.locator("article[data-hydrated]")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Ready to use offline." })).toBeVisible({ timeout: 60_000 });

  // Make something, so we can check it survives the offline reload.
  await page.getByText("It gives each message a score from clues, and blocks it if the score is high enough.").click();
  await page.getByRole("radio", { name: "Fairly sure" }).click();
  await page.getByRole("button", { name: "Lock in my guess" }).click();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "How does a junk filter decide?" })).toBeVisible();
  await expect(page.locator("article[data-hydrated]")).toBeVisible();
  await expect(page.getByText("Your guess matches what happens.")).toBeVisible();

  // Still interactive offline: sort a message.
  const sort = page.locator("#block-b3");
  await sort.getByRole("button", { name: /Maths homework/ }).click();
  await sort.getByRole("group", { name: /Where does/ }).getByRole("button", { name: "Real" }).click();
  await expect(sort.getByRole("region", { name: "Not yet sorted" }).getByRole("button", { name: /Maths homework/ })).toHaveCount(0);
  await context.setOffline(false);
});

test("other locales of a visited lesson are available offline once visited", async ({ page, context }) => {
  for (const locale of ["hi", "te"]) {
    await page.goto(`/${locale}/lessons/every-primitive`);
    await expect(page.locator("article[data-hydrated]")).toBeVisible();
    await expect(page.locator(".site-offline[data-ready]")).toBeVisible({ timeout: 60_000 });
  }
  await context.setOffline(true);
  await page.goto("/hi/lessons/every-primitive");
  await expect(page.getByRole("heading", { level: 1, name: "जंक फ़िल्टर कैसे तय करता है?" })).toBeVisible();
  await page.goto("/te/lessons/every-primitive");
  await expect(page.getByRole("heading", { level: 1, name: "జంక్ ఫిల్టర్ ఎలా నిర్ణయిస్తుంది?" })).toBeVisible();
  await context.setOffline(false);
});
