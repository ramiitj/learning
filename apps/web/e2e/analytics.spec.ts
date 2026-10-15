import { expect, test } from "@playwright/test";

/**
 * Anonymous analytics: a learner's session becomes daily counts, sent when the
 * page is hidden, with no cookie or identifier. Needs the database.
 */
test.skip(!process.env.DATABASE_URI, "analytics needs a database");

test("a lesson visit becomes anonymous counts, with no cookies set", async ({ page, context }) => {
  const sent: string[] = [];
  await page.route("**/api/analytics", async (route) => {
    sent.push(route.request().postDataBuffer()?.toString("utf8") ?? "");
    await route.continue();
  });
  await page.goto("/en/lessons/every-primitive");
  const b2 = page.locator("#block-b2");
  await b2.scrollIntoViewIfNeeded();
  await b2.getByRole("radio", { name: /banned words/ }).check({ force: true });
  await b2.getByRole("radio", { name: "Not sure" }).check({ force: true });
  await b2.getByRole("button", { name: "Lock in my guess" }).click();
  await page.goto("/en"); // leaving the lesson flushes its counts
  // A page may send more than one batch (each time it is hidden); together they hold the session's counts.
  const metrics = () => sent.filter(Boolean).flatMap((b) => JSON.parse(b).counts.map((c: [string, string, number]) => c[0]));
  await expect.poll(metrics).toEqual(expect.arrayContaining(["start", "reach", "act", "answer"]));
  const body = JSON.parse(sent.filter(Boolean)[0]!);
  expect(body.lessonId).toBe("every-primitive");
  // Nothing that could identify the learner travels or is stored.
  expect(Object.keys(body).sort()).toEqual(["counts", "lessonId", "locale", "mode"]);
  expect((await context.cookies()).map((c) => c.name)).not.toContain(expect.stringMatching(/analytics|id|track/i));
});

test("Do Not Track turns analytics off", async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { DNT: "1" } });
  await context.addInitScript(() => Object.defineProperty(navigator, "doNotTrack", { get: () => "1" }));
  const page = await context.newPage();
  const sent: string[] = [];
  page.on("request", (r) => r.url().endsWith("/api/analytics") && sent.push(r.url()));
  await page.goto("/en/lessons/every-primitive");
  await page.goto("/en");
  await page.waitForTimeout(1000);
  expect(sent).toEqual([]);
  await context.close();
});
