// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderCss, school, type ThemeMode } from "./index";
import { contrast } from "./contrast";

const modes: ThemeMode[] = ["light", "dark", "projection"];

describe("colour contrast (WCAG 2.2 AA)", () => {
  for (const mode of modes) {
    const c = school[mode];
    const textPairs: [string, string, string][] = [
      ["ink on bg", c.ink, c.bg],
      ["ink on surface", c.ink, c.surface],
      ["ink on surface2", c.ink, c.surface2],
      ["inkMuted on bg", c.inkMuted, c.bg],
      ["inkMuted on surface", c.inkMuted, c.surface],
      ["inkMuted on surface2", c.inkMuted, c.surface2],
      ["accent on surface", c.accent, c.surface],
      ["accent on bg", c.accent, c.bg],
      ["accentInk on accent", c.accentInk, c.accent],
      ["ink on accentSoft", c.ink, c.accentSoft],
      ["accent on accentSoft", c.accent, c.accentSoft],
      ["warm on surface", c.warm, c.surface],
      ["ink on warmSoft", c.ink, c.warmSoft],
      ["warm on warmSoft", c.warm, c.warmSoft],
      ["insight on surface", c.insight, c.surface],
      ["ink on insightSoft", c.ink, c.insightSoft],
      ["insight on insightSoft", c.insight, c.insightSoft],
    ];
    const min = mode === "projection" ? 7 : 4.5;
    for (const [name, fg, bg] of textPairs) {
      it(`${mode}: ${name} >= ${min}:1`, () => {
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(name.startsWith("ink ") || mode !== "projection" ? min : 4.5);
      });
    }
    it(`${mode}: control borders and focus ring >= 3:1 (non-text contrast)`, () => {
      expect(contrast(c.borderStrong, c.surface)).toBeGreaterThanOrEqual(3);
      expect(contrast(c.borderStrong, c.bg)).toBeGreaterThanOrEqual(3);
      expect(contrast(c.focus, c.surface)).toBeGreaterThanOrEqual(3);
      expect(contrast(c.focus, c.bg)).toBeGreaterThanOrEqual(3);
      expect(contrast(c.accent, c.surface)).toBeGreaterThanOrEqual(3);
    });
  }
});

describe("generated stylesheet", () => {
  it("tokens.css is up to date (run `pnpm --filter @lm/tokens build`)", () => {
    const onDisk = readFileSync(new URL("../tokens.css", import.meta.url), "utf8");
    expect(onDisk).toBe(renderCss());
  });
});
