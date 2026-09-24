import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateLesson } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { breakIt } from "./index";
import { breakItContract } from "./contract";

const strings = {
  challenge: "Try to make the sorter call a mango a rock.",
  reflect: "What did you learn about where it struggles?",
  a1l: "Show it a blurry photo",
  a1r: "It still guessed mango, just less surely.",
  a2l: "Show it something it has never seen",
  a2r: "It guessed confidently and got it wrong.",
};
const block = {
  id: "b6",
  type: "break-it",
  config: {
    challengeKey: "challenge",
    reflectKey: "reflect",
    attempts: [
      { id: "a1", labelKey: "a1l", resultKey: "a1r", breaks: false },
      { id: "a2", labelKey: "a2l", resultKey: "a2r", breaks: true },
    ],
  },
};

// The m1 exemplar's break-it block: no attempts configured, points at a simulation.
const m1Config = { challengeKey: "challenge", target: "b4", allowRelabel: true, reflectKey: "reflect" };

describe("break-it", () => {
  it("shows a result card for each tried attempt, marked with text (not colour alone)", async () => {
    const { container } = renderBlock(breakIt, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "Try: Show it a blurry photo" }));
    expect(screen.getByText("It held up")).toBeInTheDocument();
    expect(screen.getByText(strings.a1r)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try: Show it something it has never seen" }));
    expect(screen.getByText("It broke")).toBeInTheDocument();
    expect(container.textContent).toMatch(/1.*out of 2|found 1/i);
  });

  it("lets the learner note something else they tried and reflect, without penalty language", async () => {
    const { container } = renderBlock(breakIt, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "Try: Show it a blurry photo" }));
    const note = screen.getByLabelText("Something else I tried");
    await userEvent.type(note, "I tried rotating the picture");
    expect(note).toHaveValue("I tried rotating the picture");
    const reflect = screen.getByLabelText(strings.reflect);
    await userEvent.type(reflect, "It struggles with things it has not seen before");
    expect(reflect).toHaveValue("It struggles with things it has not seen before");
    expect(container.textContent).not.toMatch(/incorrect|wrong/i);
  });

  it("points at the system to break when there are no configured attempts", () => {
    const before = [{ id: "b4", type: "reveal", componentVersion: "1.0", config: { textKey: "challenge" } }];
    renderBlock(breakIt, { ...block, config: m1Config }, strings, { before, extraPlugins: [] });
    expect(screen.getByText("The system you are trying to break is shown above.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to the system above" })).toBeInTheDocument();
  });

  it("can be undone", async () => {
    renderBlock(breakIt, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "Try: Show it a blurry photo" }));
    expect(screen.getByText("It held up")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByText("It held up")).not.toBeInTheDocument();
  });

  it("classroom: the reflection becomes a pair-discussion prompt, no typing needed", async () => {
    renderBlock(breakIt, block, strings, { mode: "classroom" });
    await userEvent.click(screen.getByRole("button", { name: "Try: Show it something it has never seen" }));
    expect(screen.getByText("It broke")).toBeInTheDocument();
    expect(screen.getByText(strings.reflect)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(breakIt, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("validates the config against the JSON Schema contract, including the m1 exemplar's target-only shape", () => {
    const lesson = (config: Record<string, unknown>) => ({
      id: "contract-test",
      schemaVersion: "1.0",
      version: 1,
      status: "draft" as const,
      meta: { titleKey: "challenge", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "challenge" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
      stages: [
        { stage: "hook" as const, blocks: [{ id: "f1", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "predict" as const, blocks: [{ id: "f2", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "manipulate" as const, blocks: [{ id: "b4", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "explain" as const, blocks: [{ id: "f3", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "break-it" as const, blocks: [{ id: "b6", type: "break-it", componentVersion: "1.0", config }] },
        { stage: "transfer-reflect" as const, blocks: [{ id: "f5", type: "filler", componentVersion: "1.0", config: {} }] },
      ],
      checks: {
        pre: [{ id: "pre1", objective: "o1", promptKey: "challenge", options: ["a1l", "a2l"], answer: "a1l" }],
        post: [{ id: "post1", objective: "o1", promptKey: "challenge", options: ["a1l", "a2l"], answer: "a1l" }],
      },
      strings: { en: strings },
      localeStatus: { en: "draft" as const },
    });

    const ok1 = validateLesson(lesson(block.config), { contracts: [breakItContract] });
    expect(ok1.filter((i) => i.check === "config")).toEqual([]);

    const ok2 = validateLesson(lesson(m1Config), { contracts: [breakItContract] });
    expect(ok2.filter((i) => i.check === "config")).toEqual([]);

    const bad = validateLesson(lesson({ ...block.config, extra: true }), { contracts: [breakItContract] });
    expect(bad.some((i) => i.check === "config")).toBe(true);

    expect(breakItContract.blockRefs?.(m1Config)).toEqual(["b4"]);
    expect(breakItContract.blockRefs?.(block.config)).toEqual([]);
    expect(new Set(breakItContract.stringKeys(block.config))).toEqual(new Set(["challenge", "a1l", "a1r", "a2l", "a2r", "reflect"]));
  });
});
