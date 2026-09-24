import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateLesson } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { byHandThenAutomate } from "./index";
import type { ByHandConfig } from "./contract";

const strings = {
  intro: "A simple filter decides which mail is spam by counting suspicious words.",
  rule: "If a mail has {threshold} or more suspicious words, the filter calls it spam.",
  above: "Spam",
  below: "Not spam",
  automate: "The machine checked every mail the same way, one word count at a time.",
  m1: "Mail from an unknown sender: 6 suspicious words",
  m2: "Mail from a friend: 1 suspicious word",
  m3: "Mail with a prize offer: 8 suspicious words",
  m4: "Mail about homework: 0 suspicious words",
};

const config: ByHandConfig = {
  introKey: "intro",
  ruleKey: "rule",
  automateKey: "automate",
  process: { type: "threshold", threshold: 5, aboveKey: "above", belowKey: "below" },
  manualCount: 2,
  items: [
    { id: "m1", labelKey: "m1", value: 6 },
    { id: "m2", labelKey: "m2", value: 1 },
    { id: "m3", labelKey: "m3", value: 8 },
    { id: "m4", labelKey: "m4", value: 0 },
  ],
};

const block = { id: "b1", type: "by-hand-then-automate", config: config as unknown as Record<string, unknown> };

describe("by-hand-then-automate", () => {
  it("validates a sample config against its schema and declares its string keys", () => {
    const lesson = {
      id: "test-bhta",
      schemaVersion: "1.0",
      version: 1,
      status: "draft" as const,
      meta: { titleKey: "title", subject: "test", concepts: [], objectives: [], prerequisites: [], audiences: [], estimatedMinutes: 5 },
      stages: [{ stage: "manipulate" as const, blocks: [{ ...block, componentVersion: "1.0" }] }],
      checks: { pre: [], post: [] },
      strings: { en: { title: "Test", ...strings } },
      localeStatus: { en: "draft" as const },
    };
    const issues = validateLesson(lesson as never, { contracts: [byHandThenAutomate] });
    expect(issues.filter((i) => i.check === "config" || i.check === "component")).toEqual([]);
    expect(byHandThenAutomate.stringKeys(config as unknown as Record<string, unknown>)).toEqual(expect.arrayContaining(["intro", "rule", "automate", "above", "below", "m1", "m2", "m3", "m4"]));
  });

  it("walks through manual items one at a time, showing the working", async () => {
    renderBlock(byHandThenAutomate, block, strings);
    expect(screen.getByText(strings.m1)).toBeInTheDocument();
    expect(screen.queryByText(strings.m2)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Spam" }));
    expect(screen.getByText(/6 ≥ 5, so Spam/)).toBeInTheDocument();
    expect(screen.getByText(strings.m2)).toBeInTheDocument();
  });

  it("meets a differing manual answer with curiosity, never a verdict", async () => {
    renderBlock(byHandThenAutomate, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "Spam" }));
    // Second item (m2, value 1) is actually "Not spam"; answer "Spam" to make it differ.
    await userEvent.click(screen.getByRole("button", { name: "Spam" }));
    expect(document.body.textContent).not.toMatch(/incorrect|wrong/i);
    expect(screen.getByText(/Following the rule here gives Not spam/)).toBeInTheDocument();
  });

  it("automates the rest after the manual steps, showing a full results table", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderBlock(byHandThenAutomate, block, strings);
    await userEvent.setup({ delay: null }).click(screen.getByRole("button", { name: "Spam" }));
    await userEvent.setup({ delay: null }).click(screen.getByRole("button", { name: "Not spam" }));
    await userEvent.setup({ delay: null }).click(screen.getByRole("button", { name: "Now let the machine do all 4" }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(screen.getByText(strings.automate)).toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBe(5); // header + 4 items
    vi.useRealTimers();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(byHandThenAutomate, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });
});
