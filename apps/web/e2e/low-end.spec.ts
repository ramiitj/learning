import { expect, test } from "@playwright/test";

/**
 * Phase 1 acceptance (emulated): usable on a low-end Android phone on slow 3G.
 * Emulation: Moto G4 viewport and touch, CPU slowed 4x, and Lighthouse's
 * "slow 3G" profile (400 ms RTT, 400 kbps down/up). This does not replace a
 * check on a real low-end device; it guards against regressions in CI.
 */
const BUDGET = {
  /** Time until the first interaction on the page responds. */
  interactiveMs: 20_000,
  /** Compressed JavaScript transferred for a lesson page. */
  jsKb: 350,
};

test("lesson becomes usable within budget on emulated slow 3G and a slow CPU", async ({ page }, info) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: (400 * 1024) / 8, uploadThroughput: (400 * 1024) / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  let jsBytes = 0;
  const jsRequests = new Map<string, boolean>();
  cdp.on("Network.responseReceived", (e) => jsRequests.set(e.requestId, e.type === "Script"));
  cdp.on("Network.loadingFinished", (e) => {
    if (jsRequests.get(e.requestId)) jsBytes += e.encodedDataLength;
  });

  const start = Date.now();
  await page.goto("/en/lessons/every-primitive", { waitUntil: "commit" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 60_000 });
  const firstContentMs = Date.now() - start;
  await expect(page.locator("article[data-hydrated]")).toBeVisible({ timeout: 60_000 });
  await page.getByText("It gives each message a score from clues, and blocks it if the score is high enough.").tap();
  await expect(page.getByRole("radio", { name: "It gives each message a score from clues, and blocks it if the score is high enough." })).toBeChecked();
  const interactiveMs = Date.now() - start;

  const report = { firstContentMs, interactiveMs, jsKb: Math.round(jsBytes / 1024) };
  await info.attach("performance", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
  console.log("low-end-android slow-3G:", report);
  expect(interactiveMs).toBeLessThan(BUDGET.interactiveMs);
  expect(report.jsKb).toBeLessThan(BUDGET.jsKb);
});

test("layout fits a 360px screen without horizontal scrolling, in every locale", async ({ page }) => {
  for (const locale of ["en", "hi", "te"]) {
    await page.goto(`/${locale}/lessons/every-primitive`);
    await expect(page.locator("article[data-hydrated]")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${locale} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
  }
});
