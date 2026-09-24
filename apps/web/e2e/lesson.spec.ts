import { expect, test, type Page } from "@playwright/test";

/** Phase 1 acceptance: the engine features, exercised through the real test lesson. */
const lesson = "/en/lessons/every-primitive";

async function open(page: Page, path = lesson) {
  await page.goto(path);
  await expect(page.locator("article[data-hydrated]")).toBeVisible();
}

test("detour opens with its own title and returns focus to where the learner was", async ({ page }) => {
  await open(page);
  const offer = page.locator("#block-b4").getByRole("button", { name: "New to this? Take a short detour: What is a threshold?" });
  await offer.click();
  const dialog = page.getByRole("dialog", { name: "What is a threshold?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Show the next idea" }).click();
  await expect(dialog.getByText("In the high jump, the bar is a threshold.")).toBeVisible();
  await dialog.getByRole("button", { name: "Back to where I was" }).click();
  await expect(dialog).toBeHidden();
  await expect(offer).toBeFocused();
});

test("glossary terms open in place and in the glossary", async ({ page }) => {
  await open(page);
  const chip = page.locator("#block-b4").getByRole("button", { name: "threshold", exact: true });
  await chip.click();
  await expect(chip).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#block-b4").getByText("a line a number has to reach", { exact: false })).toBeVisible();
  await page.getByRole("group", { name: "Lesson controls" }).getByRole("button", { name: "Glossary" }).click();
  const dialog = page.getByRole("dialog", { name: "Words in this lesson" });
  await expect(dialog.getByText("training", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("the depth dial reveals deeper layers, and one can be opened on its own", async ({ page }) => {
  await open(page);
  await expect(page.getByText("Real filters use hundreds of clues")).toBeHidden();
  await page.getByRole("button", { name: "Show the deeper idea" }).first().click();
  await expect(page.getByText("Real filters use hundreds of clues")).toBeVisible();
  await expect(page.getByText("Choosing the threshold is a trade-off.")).toBeHidden();
  await page.getByRole("button", { name: "Lesson tools" }).click();
  await page.getByRole("radio", { name: "Deepest" }).click();
  await expect(page.getByText("Choosing the threshold is a trade-off.")).toBeVisible();
});

test("undo reverses the last change, wherever it was", async ({ page }) => {
  await open(page);
  const choice = page.getByRole("radio", { name: "It gives each message a score from clues, and blocks it if the score is high enough." });
  await page.getByText("It gives each message a score from clues, and blocks it if the score is high enough.").click();
  await expect(choice).toBeChecked();
  await page.getByRole("group", { name: "Lesson controls" }).getByRole("button", { name: "Undo" }).click();
  await expect(choice).not.toBeChecked();
  await expect(page.getByRole("status").filter({ hasText: "Your last change was undone." })).toBeAttached();
});

test("progress survives a reload and a language switch, returning to the same place", async ({ page }) => {
  await open(page);
  // Work in block b3 (sort): place one message.
  const sort = page.locator("#block-b3");
  await sort.getByRole("button", { name: /Maths homework/ }).click();
  await sort.getByRole("button", { name: "Put it in Real" }).click();

  await page.reload();
  await expect(page.locator("article[data-hydrated]")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.locator("#block-b3").getByRole("region", { name: "Not yet sorted" }).getByRole("button", { name: /Maths homework/ })).toHaveCount(0);

  await page.getByRole("navigation", { name: "Language" }).getByRole("link", { name: "తెలుగు" }).click();
  await expect(page).toHaveURL(/\/te\/lessons\/every-primitive#resume$/);
  await expect(page.locator("article[data-hydrated]")).toBeVisible();
  await expect(page.locator("#block-b3")).toBeFocused();
  await expect(page.locator("#block-b3").getByRole("region", { name: "ఇంకా వర్గీకరించని వస్తువులు" }).getByRole("button", { name: /లెక్కల హోంవర్క్/ })).toHaveCount(0);
  await expect(page.getByRole("note").filter({ hasText: "ముసాయిదా" }).first()).toBeVisible();
});

test("the lesson ends with the post-checks and a labelled takeaway card", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("heading", { name: "See how far you've come" })).toBeVisible();
  const card = page.locator("#block-b15");
  await expect(card.getByText("My filter")).toBeVisible();
  await expect(card.getByText("Messages I wrote to fool it")).toBeVisible();
});

test("classroom mode shows the show-of-hands path and no personal data", async ({ page }) => {
  await open(page, "/en/lessons/every-primitive/classroom");
  const predict = page.locator("#block-b2");
  await predict.getByRole("button", { name: /One more for It gives each message a score/ }).click();
  await predict.getByRole("button", { name: /One more for It gives each message a score/ }).click();
  await expect(predict.getByText("2 votes in total")).toBeVisible();
  await predict.getByRole("button", { name: "Show what happens" }).click();
  await expect(predict.getByText(/It adds up clues into a/)).toBeVisible();
  // Nothing personal on the shared screen: no text inputs pre-filled and no identifiers shown.
  expect(await page.locator("input[type=text], input:not([type]), textarea").evaluateAll((els) => els.filter((e) => (e as HTMLInputElement).value).length)).toBe(0);
});
