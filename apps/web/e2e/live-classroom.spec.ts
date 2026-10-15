import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Phase 2 acceptance: a simulated class of 40 devices completes the test
 * lesson's votes live. Five phones are real browsers using the join page; 35
 * more vote through the same API. The shared screen shows only counts.
 * Needs the server to run with a database (DATABASE_URI); skipped otherwise.
 */
test.skip(!process.env.DATABASE_URI, "live classroom needs a database");
test.describe.configure({ mode: "serial" });

const BROWSER_PHONES = 5;
const API_PHONES = 35;
type State = { blockId: string | null; itemId: string | null; votingOpen: boolean; votes: Record<string, Record<string, Record<string, number>>>; voters: number };

async function state(request: APIRequestContext, code: string): Promise<State> {
  return (await request.get(`/api/classroom/sessions/${code}`)).json();
}

async function showBlock(projector: Page, request: APIRequestContext, code: string, blockId: string) {
  await projector.locator(`#block-${blockId}`).evaluate((el) => el.scrollIntoView({ block: "start" }));
  await expect.poll(async () => (await state(request, code)).blockId, { timeout: 15_000 }).toBe(blockId);
}

async function apiVotes(request: APIRequestContext, code: string, blockId: string, choices: string[], itemId?: string) {
  await Promise.all(
    Array.from({ length: API_PHONES }, (_, i) =>
      request.post(`/api/classroom/sessions/${code}/vote`, { data: { token: `simulated-phone-${i}-0123456789`, blockId, itemId, choice: choices[i % choices.length] } }).then((r) => expect(r.ok()).toBe(true)),
    ),
  );
}

test("a class of 40 devices votes live through the test lesson", async ({ browser, request }) => {
  test.setTimeout(240_000);
  const projector = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await projector.goto("/en/lessons/every-primitive/classroom");
  await projector.getByRole("button", { name: "Start live voting" }).click();
  const code = (await projector.locator(".live-panel__code").textContent())!.trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);

  const phones = await Promise.all(
    Array.from({ length: BROWSER_PHONES }, async () => {
      const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });
      const p = await ctx.newPage();
      await p.goto(`/en/join/${code}`);
      return p;
    }),
  );
  await expect(phones[0]!.getByText(/Look at the board/)).toBeVisible();

  // 1. The prediction (b2): browser phones tap, simulated phones post.
  await showBlock(projector, request, code, "b2");
  for (const [i, p] of phones.entries()) await p.locator(".join__option").nth(i % 2).click();
  for (const p of phones) await expect(p.getByText(/Your vote is in/)).toBeVisible();
  await apiVotes(request, code, "b2", ["predict.c1", "predict.c2", "predict.c3"]);
  const b2 = projector.locator("#block-b2");
  await expect(b2.getByText("40 votes in total")).toBeVisible();
  await expect(b2.getByText("40 from phones")).toBeVisible();

  // A phone can change its vote; the total stays 40.
  await phones[0]!.locator(".join__option").nth(2).click();
  await expect.poll(async () => Object.values((await state(request, code)).votes.b2?.[""] ?? {}).reduce((a, b) => a + b, 0)).toBe(40);

  // 2. The sort (b3): the class votes item by item; the teacher places each where most votes went.
  await showBlock(projector, request, code, "b3");
  const b3 = projector.locator("#block-b3");
  for (let n = 0; n < 8; n++) {
    await expect.poll(async () => (await state(request, code)).itemId, { timeout: 15_000 }).not.toBeNull();
    const { itemId } = await state(request, code);
    // Each phone waits until it shows the item on the board, as a student would.
    for (const p of phones) {
      await expect(p.locator(".join__item")).toBeVisible();
      await expect(p.locator(".join__option").first()).toHaveAttribute("aria-pressed", "false");
      await p.locator(".join__option").first().click();
      await expect(p.getByText(/Your vote is in/)).toBeVisible();
    }
    await apiVotes(request, code, "b3", ["sort.g1", "sort.g2"], itemId!);
    await expect(b3.getByText("40 votes in total")).toBeVisible();
    await b3.getByRole("button", { name: "Show the class result" }).click();
    await b3.getByRole("button", { name: "Place it where most hands went" }).click();
  }
  await expect(b3.getByRole("heading", { name: "How it was sorted" })).toBeVisible();
  // Moving on keeps each earlier block's result.
  await expect(b2.getByText("40 votes in total")).toBeVisible();

  // Nothing personal on the shared screen: no tokens, only counts.
  expect(await projector.content()).not.toContain("simulated-phone");
  const s = await state(request, code);
  expect(JSON.stringify(s)).not.toContain("simulated-phone");

  // 3. The teacher ends the session; phones are told.
  await projector.getByRole("button", { name: "End live voting" }).click();
  await expect(phones[1]!.getByText(/session has ended/)).toBeVisible();
});

test("the no-device path still works: hands only, no session", async ({ page }) => {
  await page.goto("/en/lessons/every-primitive/classroom");
  const b2 = page.locator("#block-b2");
  await b2.getByRole("button", { name: /One more for/ }).first().click();
  await b2.getByRole("button", { name: /One more for/ }).first().click();
  await expect(b2.getByText("2 votes in total")).toBeVisible();
});
