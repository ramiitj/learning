import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Use the preinstalled Chromium when present (cloud dev environments); CI installs its own.
const localChromium = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const launchOptions = existsSync(localChromium) && !process.env.CI ? { executablePath: localChromium } : {};

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions }, testIgnore: /low-end/ },
    // A low-end Android phone: small screen, touch, 4x slower CPU, slow 3G (see low-end.spec.ts).
    { name: "low-end-android", use: { ...devices["Moto G4"], launchOptions }, testMatch: /low-end|offline/ },
  ],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000/en",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
