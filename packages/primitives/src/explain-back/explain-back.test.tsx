import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateLesson } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { explainBack } from "./index";
import { explainBackContract } from "./contract";

const strings = {
  prompt: "Which explanation best matches what the model does?",
  o1t: "It memorises every example.",
  o1f: "A model that only memorised would fail on anything new.",
  o2t: "It finds a pattern that also works on new examples.",
  o2f: "That is the idea behind generalisation.",
  brk: "Where does your comparison stop working?",
  model: "A model is like a rule of thumb built from many examples.",
};

const chooseBlock = {
  id: "eb1",
  type: "explain-back",
  config: {
    mode: "choose",
    promptKey: "prompt",
    options: [
      { id: "o1", textKey: "o1t", feedbackKey: "o1f" },
      { id: "o2", textKey: "o2t", feedbackKey: "o2f", best: true },
    ],
  },
};

// The m1 exemplar's explain-back block (b7): own-analogy mode, no options.
const ownAnalogyBlock = {
  id: "b7",
  type: "explain-back",
  config: { mode: "own-analogy", promptKey: "prompt", breakPointPromptKey: "brk" },
};

const ownWordsBlock = {
  id: "eb3",
  type: "explain-back",
  config: { mode: "own-words", promptKey: "prompt", modelAnswerKey: "model" },
};

describe("explain-back", () => {
  it("choose mode: shows feedback for the chosen option without grading language, and allows changing", async () => {
    const { container } = renderBlock(explainBack, chooseBlock, strings);
    await userEvent.click(screen.getByLabelText(strings.o1t));
    expect(screen.getByText(strings.o1f)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/incorrect|wrong/i);
    await userEvent.click(screen.getByLabelText(strings.o2t));
    expect(screen.getByText(strings.o2f)).toBeInTheDocument();
  });

  it("own-analogy mode: takes a comparison and its break point, then keeps and shows the model answer", async () => {
    renderBlock(explainBack, ownAnalogyBlock, strings);
    const compare = screen.getByLabelText("Your comparison");
    await userEvent.type(compare, "A model is like a student who studies examples");
    const keep = screen.getByRole("button", { name: "Keep my explanation" });
    expect(keep).toBeDisabled();
    const breakField = screen.getByLabelText(strings.brk);
    await userEvent.type(breakField, "It stops working for something totally new");
    expect(keep).not.toBeDisabled();
    await userEvent.click(keep);
    expect(screen.getByRole("button", { name: "Change my explanation" })).toBeInTheDocument();
  });

  it("own-words mode: keeps a single explanation and shows the model answer for comparison", async () => {
    renderBlock(explainBack, ownWordsBlock, strings);
    await userEvent.type(screen.getByLabelText("Your explanation"), "It learns a pattern from examples.");
    await userEvent.click(screen.getByRole("button", { name: "Keep my explanation" }));
    expect(screen.getByText(strings.model)).toBeInTheDocument();
  });

  it("can be undone", async () => {
    renderBlock(explainBack, ownWordsBlock, strings);
    await userEvent.type(screen.getByLabelText("Your explanation"), "It learns a pattern.");
    await userEvent.click(screen.getByRole("button", { name: "Keep my explanation" }));
    expect(screen.getByText(strings.model)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByText(strings.model)).not.toBeInTheDocument();
  });

  it("classroom (choose mode): tallies votes, then reveals the strongest explanation", async () => {
    renderBlock(explainBack, chooseBlock, strings, { mode: "classroom" });
    expect(screen.getByText("Discuss this with a partner.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: `One more for ${strings.o2t}` }));
    await userEvent.click(screen.getByRole("button", { name: "Show the strongest explanation" }));
    expect(screen.getByText(strings.o2f)).toBeInTheDocument();
  });

  it("classroom (own-words mode): projects the prompt as a pair-discussion, no typing", () => {
    renderBlock(explainBack, ownWordsBlock, strings, { mode: "classroom" });
    expect(screen.getByText(strings.prompt)).toBeInTheDocument();
    expect(screen.getByText("Discuss this with a partner.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("has no accessibility violations in either mode, across all three configured modes", async () => {
    for (const block of [chooseBlock, ownAnalogyBlock, ownWordsBlock]) {
      for (const mode of ["personal", "classroom"] as const) {
        const { container, unmount } = renderBlock(explainBack, block, strings, { mode });
        expect(await a11yViolations(container)).toEqual([]);
        unmount();
      }
    }
  });

  it("validates the config against the JSON Schema contract, requiring options only when mode is 'choose'", () => {
    const lesson = (config: Record<string, unknown>) => ({
      id: "contract-test",
      schemaVersion: "1.0",
      version: 1,
      status: "draft" as const,
      meta: { titleKey: "prompt", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "prompt" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
      stages: [
        { stage: "hook" as const, blocks: [{ id: "f1", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "predict" as const, blocks: [{ id: "f2", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "manipulate" as const, blocks: [{ id: "f3", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "explain" as const, blocks: [{ id: "f4", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "break-it" as const, blocks: [{ id: "f5", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "transfer-reflect" as const, blocks: [{ id: "b7", type: "explain-back", componentVersion: "1.0", config }] },
      ],
      checks: {
        pre: [{ id: "pre1", objective: "o1", promptKey: "prompt", options: ["o1t", "o2t"], answer: "o2t" }],
        post: [{ id: "post1", objective: "o1", promptKey: "prompt", options: ["o1t", "o2t"], answer: "o2t" }],
      },
      strings: { en: strings },
      localeStatus: { en: "draft" as const },
    });

    const ok1 = validateLesson(lesson(chooseBlock.config), { contracts: [explainBackContract] });
    expect(ok1.filter((i) => i.check === "config")).toEqual([]);

    const ok2 = validateLesson(lesson(ownAnalogyBlock.config), { contracts: [explainBackContract] });
    expect(ok2.filter((i) => i.check === "config")).toEqual([]);

    const missingOptions = validateLesson(lesson({ mode: "choose", promptKey: "prompt" }), { contracts: [explainBackContract] });
    expect(missingOptions.some((i) => i.check === "config")).toBe(true);

    expect(new Set(explainBackContract.stringKeys(chooseBlock.config))).toEqual(new Set(["prompt", "o1t", "o1f", "o2t", "o2f"]));
    expect(new Set(explainBackContract.stringKeys(ownAnalogyBlock.config))).toEqual(new Set(["prompt", "brk"]));
  });
});
