import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateLesson } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { analogy } from "./index";
import { analogyContract } from "./contract";

const strings = {
  source: "A child learns what a dog is by seeing many dogs, not by reading a definition.",
  m1s: "Seeing lots of dogs of different sizes and colours",
  m1t: "Training examples",
  m2s: "Guessing 'dog' for a new animal that looks similar",
  m2t: "The model's prediction",
  brk: "Unlike a child, the model cannot ask 'what is this?' when it is unsure.",
  fade1: "A child pointing at a dog on a walk.",
  fade2: "A child sorting photos into 'dog' and 'not dog'.",
  fade3: "A function that maps pixels to a label.",
};

// The m1 exemplar's analogy block (b5): no fading, no titleKey.
const block = {
  id: "b5",
  type: "analogy",
  config: {
    bankId: "child-learns-dog",
    concept: "learning-from-examples",
    sourceKey: "source",
    mappings: [
      { sourceKey: "m1s", targetKey: "m1t" },
      { sourceKey: "m2s", targetKey: "m2t" },
    ],
    breakPointKey: "brk",
  },
};

const fadingBlock = {
  id: "b5f",
  type: "analogy",
  config: { ...block.config, fading: ["fade1", "fade2", "fade3"] },
};

describe("analogy", () => {
  it("highlights a chosen mapping's source and target together (not by colour alone)", async () => {
    renderBlock(analogy, block, strings);
    const sourceButton = screen.getByRole("button", { name: new RegExp(strings.m1s) });
    expect(sourceButton).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(sourceButton);
    expect(sourceButton).toHaveAttribute("aria-pressed", "true");
    expect(sourceButton).toHaveAttribute("aria-describedby");
    const describedBy = sourceButton.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)?.textContent).toContain(strings.m1t);
  });

  it("reveals where the comparison breaks down, on request", async () => {
    renderBlock(analogy, block, strings);
    expect(screen.queryByText(strings.brk)).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Where does this comparison stop working?" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(strings.brk)).toBeInTheDocument();
  });

  it("steps through a fading representation from everyday to formal", async () => {
    renderBlock(analogy, fadingBlock, strings);
    expect(screen.getByText(strings.fade1)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Forward a step" }));
    expect(screen.getByText(strings.fade2)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back a step" })).not.toBeDisabled();
  });

  it("can be undone", async () => {
    renderBlock(analogy, block, strings);
    const toggle = screen.getByRole("button", { name: "Where does this comparison stop working?" });
    await userEvent.click(toggle);
    expect(screen.getByText(strings.brk)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByText(strings.brk)).not.toBeInTheDocument();
  });

  it("classroom: the teacher steps through pairs with a 'Next pair' control", async () => {
    renderBlock(analogy, block, strings, { mode: "classroom" });
    const next = screen.getByRole("button", { name: "Next pair" });
    await userEvent.click(next);
    const firstSource = screen.getByRole("button", { name: new RegExp(strings.m1s) });
    expect(firstSource).toHaveAttribute("aria-pressed", "true");
  });

  it("has no accessibility violations in either mode, with and without fading", async () => {
    for (const b of [block, fadingBlock]) {
      for (const mode of ["personal", "classroom"] as const) {
        const { container, unmount } = renderBlock(analogy, b, strings, { mode });
        expect(await a11yViolations(container)).toEqual([]);
        unmount();
      }
    }
  });

  it("validates the config against the JSON Schema contract, matching the m1 exemplar's analogy block", () => {
    const lesson = (config: Record<string, unknown>) => ({
      id: "contract-test",
      schemaVersion: "1.0",
      version: 1,
      status: "draft" as const,
      meta: { titleKey: "source", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "source" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
      stages: [
        { stage: "hook" as const, blocks: [{ id: "f1", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "predict" as const, blocks: [{ id: "f2", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "manipulate" as const, blocks: [{ id: "f3", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "explain" as const, blocks: [{ id: "b5", type: "analogy", componentVersion: "1.0", config }] },
        { stage: "break-it" as const, blocks: [{ id: "f4", type: "filler", componentVersion: "1.0", config: {} }] },
        { stage: "transfer-reflect" as const, blocks: [{ id: "f5", type: "filler", componentVersion: "1.0", config: {} }] },
      ],
      checks: {
        pre: [{ id: "pre1", objective: "o1", promptKey: "source", options: ["m1s", "m2s"], answer: "m1s" }],
        post: [{ id: "post1", objective: "o1", promptKey: "source", options: ["m1s", "m2s"], answer: "m1s" }],
      },
      strings: { en: strings },
      localeStatus: { en: "draft" as const },
    });

    const ok = validateLesson(lesson(block.config), { contracts: [analogyContract] });
    expect(ok.filter((i) => i.check === "config")).toEqual([]);

    const bad = validateLesson(lesson({ ...block.config, extra: true }), { contracts: [analogyContract] });
    expect(bad.some((i) => i.check === "config")).toBe(true);

    expect(new Set(analogyContract.stringKeys(block.config))).toEqual(new Set(["source", "m1s", "m1t", "m2s", "m2t", "brk"]));
  });
  it("states where the comparison breaks once every pair has been explored (Article 7)", async () => {
    renderBlock(analogy, block, strings);
    expect(screen.queryByText(strings.brk)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Seeing lots of dogs/ }));
    await userEvent.click(screen.getByRole("button", { name: /Guessing 'dog'/ }));
    expect(screen.getByText(strings.brk)).toBeInTheDocument();
  });
});
