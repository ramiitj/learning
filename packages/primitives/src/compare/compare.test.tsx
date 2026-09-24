import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateLesson } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { compare } from "./index";
import type { CompareConfig } from "./contract";

const strings = {
  p: "Two spam filters use different rules. Which one flags more mail as spam?",
  aLabel: "Strict filter",
  bLabel: "Loose filter",
  predict: "Which one will flag more mail?",
  explain: "The strict filter reacts to a lower number of suspicious words.",
  wordCount: "Suspicious words",
};

const config: CompareConfig = {
  promptKey: "p",
  predictKey: "predict",
  explainKey: "explain",
  variants: [
    { id: "strict", labelKey: "aLabel", overrides: { threshold_shift: 0 } },
    { id: "loose", labelKey: "bLabel", overrides: { threshold_shift: 5 } },
  ],
  model: {
    type: "linear",
    bias: 0,
    inputs: [
      { id: "wordCount", labelKey: "wordCount", initial: 3, weight: 1, min: 0, max: 10, step: 1 },
      { id: "threshold_shift", labelKey: "wordCount", initial: 0, weight: -1, min: 0, max: 5, step: 1 },
    ],
    output: { labelKey: "wordCount", min: -5, max: 10 },
  },
};

const block = { id: "c1", type: "compare", config: config as unknown as Record<string, unknown> };

describe("compare", () => {
  it("validates a sample config against its schema and declares its string keys", () => {
    const lesson = {
      id: "test-compare",
      schemaVersion: "1.0",
      version: 1,
      status: "draft" as const,
      meta: { titleKey: "title", subject: "test", concepts: [], objectives: [], prerequisites: [], audiences: [], estimatedMinutes: 5 },
      stages: [{ stage: "manipulate" as const, blocks: [{ ...block, componentVersion: "1.0" }] }],
      checks: { pre: [], post: [] },
      strings: { en: { title: "Test", ...strings } },
      localeStatus: { en: "draft" as const },
    };
    const issues = validateLesson(lesson as never, { contracts: [compare] });
    expect(issues.filter((i) => i.check === "config" || i.check === "component")).toEqual([]);
    expect(compare.stringKeys(config as unknown as Record<string, unknown>)).toEqual(expect.arrayContaining(["p", "aLabel", "bLabel", "predict", "explain", "wordCount"]));
  });

  it("commits a prediction, runs both, and shows each variant's working", async () => {
    renderBlock(compare, block, strings);
    await userEvent.click(screen.getByLabelText("Strict filter"));
    await userEvent.click(screen.getByRole("button", { name: "Run both" }));
    expect(screen.getByText(strings.explain)).toBeInTheDocument();
    expect(screen.getAllByText(/1 × 3/).length).toBeGreaterThan(0);
    expect(screen.getByText(/The other version came out higher|The version you picked did come out higher/)).toBeInTheDocument();
  });

  it("requires a prediction before running when predictKey is set", async () => {
    renderBlock(compare, block, strings);
    expect(screen.getByRole("button", { name: "Run both" })).toBeDisabled();
  });

  it("can be reset", async () => {
    renderBlock(compare, block, strings);
    await userEvent.click(screen.getByLabelText("Strict filter"));
    await userEvent.click(screen.getByRole("button", { name: "Run both" }));
    expect(screen.getByText(strings.explain)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start this part again" }));
    expect(screen.queryByText(strings.explain)).not.toBeInTheDocument();
  });

  it("classroom: votes by show of hands, then runs and compares", async () => {
    renderBlock(compare, block, strings, { mode: "classroom" });
    await userEvent.click(screen.getByRole("button", { name: "One more for Strict filter" }));
    await userEvent.click(screen.getByRole("button", { name: "Run both" }));
    expect(screen.getByText(strings.explain)).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(compare, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });
});
