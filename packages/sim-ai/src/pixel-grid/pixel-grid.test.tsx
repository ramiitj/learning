import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateLesson } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "@lm/primitives/test-utils";
import { pixelGrid } from "./index";
import { pixelGridContract } from "./contract";
import { messages } from "./messages";

const strings = { p: "Draw a 1.", one: "A digit 1", same: "Mostly the same", diff: "Very different", ex: "Why did the numbers change?" };
const rows = [[0, 9, 0], [0, 9, 0], [0, 9, 0]];
const config = { promptKey: "p", size: 8, presets: [{ labelKey: "one", rows }], explainKey: "ex", sameKey: "same", differentKey: "diff" };
const block = { id: "px", type: "pixel-grid", config };

const cell = (r: number, c: number) => screen.getByRole("gridcell", { name: new RegExp(`^Row ${r}, column ${c},`) });

describe("pixel-grid", () => {
  it("draws by pointer and shows the numbers", () => {
    renderBlock(pixelGrid, block, strings);
    fireEvent.pointerDown(cell(1, 1), { pointerType: "touch" });
    fireEvent.pointerMove(cell(1, 2), { pointerType: "touch" });
    fireEvent.pointerUp(cell(1, 2));
    expect(cell(1, 1)).toHaveAccessibleName("Row 1, column 1, value 9");
    expect(cell(1, 2)).toHaveAccessibleName("Row 1, column 2, value 9");
    expect(screen.getByText("2 squares are filled in.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Numbers" }));
    expect(cell(1, 1)).toHaveTextContent("9");
    expect(cell(5, 5)).toHaveTextContent("0");
  });

  it("draws by keyboard and announces the value", async () => {
    renderBlock(pixelGrid, block, strings);
    cell(1, 1).focus();
    await userEvent.keyboard("{ArrowRight}{ArrowDown} ");
    expect(cell(2, 2)).toHaveFocus();
    expect(cell(2, 2)).toHaveAccessibleName("Row 2, column 2, value 9");
    expect(screen.getByText("Row 2, column 2 is now 9")).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(cell(2, 2)).toHaveAccessibleName("Row 2, column 2, value 0");
    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    expect(cell(1, 1)).toHaveFocus();
  });

  it("erases with the erase tool", async () => {
    renderBlock(pixelGrid, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "A digit 1" }));
    expect(cell(4, 4)).toHaveAccessibleName("Row 4, column 4, value 9");
    await userEvent.click(screen.getByRole("button", { name: "Erase" }));
    fireEvent.pointerDown(cell(4, 4), { pointerType: "touch" });
    fireEvent.pointerUp(cell(4, 4));
    expect(cell(4, 4)).toHaveAccessibleName("Row 4, column 4, value 0");
  });

  it("blurs and shifts, and says how many numbers changed", async () => {
    renderBlock(pixelGrid, block, strings);
    expect(screen.getByRole("button", { name: "Blur" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "A digit 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Blur" }));
    expect(cell(4, 4)).toHaveAccessibleName("Row 4, column 4, value 3");
    expect(cell(2, 4)).toHaveAccessibleName("Row 2, column 4, value 1");
    await userEvent.click(screen.getByRole("button", { name: "A digit 1" }));
    await userEvent.click(screen.getByLabelText("Very different"));
    await userEvent.click(screen.getByRole("button", { name: "Right" }));
    expect(cell(4, 4)).toHaveAccessibleName("Row 4, column 4, value 0");
    expect(cell(4, 5)).toHaveAccessibleName("Row 4, column 5, value 9");
    expect(screen.getByText("Shift: 6 of 64 squares changed.")).toBeInTheDocument();
    expect(screen.getByText("You predicted: Very different.")).toBeInTheDocument();
    expect(screen.getByText(/To the computer, the numbers are different/)).toBeInTheDocument();
    expect(screen.getByText("Why did the numbers change?")).toBeInTheDocument();
  });

  it("offers only the configured tools", () => {
    renderBlock(pixelGrid, { ...block, config: { promptKey: "p", tools: ["draw", "blur"] } }, strings);
    expect(screen.queryByRole("button", { name: "Erase" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Left" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Blur" })).toBeInTheDocument();
  });

  it("resets and undoes through the engine", async () => {
    renderBlock(pixelGrid, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "A digit 1" }));
    await userEvent.click(screen.getByLabelText("Mostly the same"));
    await userEvent.click(screen.getByRole("button", { name: "Right" }));
    expect(cell(4, 5)).toHaveAccessibleName("Row 4, column 5, value 9");
    await userEvent.click(screen.getByRole("button", { name: /^Undo/ }));
    expect(cell(4, 4)).toHaveAccessibleName("Row 4, column 4, value 9");
    await userEvent.click(screen.getByRole("button", { name: /^Start this part again/ }));
    expect(cell(4, 4)).toHaveAccessibleName("Row 4, column 4, value 0");
  });

  it("coalesces a stroke into one undo step", () => {
    renderBlock(pixelGrid, block, strings);
    fireEvent.pointerDown(cell(1, 1), { pointerType: "touch" });
    for (const c of [2, 3, 4]) fireEvent.pointerMove(cell(1, c), { pointerType: "touch" });
    fireEvent.pointerUp(cell(1, 4));
    fireEvent.click(screen.getByRole("button", { name: /^Undo/ }));
    expect(cell(1, 4)).toHaveAccessibleName("Row 1, column 4, value 0");
    expect(cell(1, 1)).toHaveAccessibleName("Row 1, column 1, value 0");
  });

  it("classroom: the class predicts by show of hands before the teacher shifts", async () => {
    renderBlock(pixelGrid, block, strings, { mode: "classroom" });
    expect(screen.getByText("If we move this drawing one square to the right, will the computer get mostly the same numbers or very different ones?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "One more for Very different" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "One more for Very different" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Mostly the same" }));
    expect(screen.getByText("2 votes in total")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "A digit 1" }));
    // The shift buttons stay locked until the class result is on screen.
    expect(screen.getByRole("button", { name: "Down" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
    expect(screen.getByRole("button", { name: "Down" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Down" }));
    expect(screen.getByText(/Shift: \d+ of 64 squares changed\./)).toBeInTheDocument();
  });

  it("personal: shifting waits for a prediction, and the 0 to 9 simplification is stated", async () => {
    renderBlock(pixelGrid, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "A digit 1" }));
    expect(screen.getByRole("button", { name: "Right" })).toBeDisabled();
    expect(screen.getByText(/Real photos use 0 to 255, and three numbers per square for colour/)).toBeInTheDocument();
    expect(screen.getByText(/Use Undo \(in the toolbar\)/)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Mostly the same"));
    expect(screen.getByRole("button", { name: "Right" })).toBeEnabled();
  });

  it("personal: uses built-in prediction options when the lesson gives no vote keys", async () => {
    renderBlock(pixelGrid, { ...block, config: { promptKey: "p", presets: config.presets } }, strings);
    expect(screen.getByLabelText("Very different numbers")).toBeInTheDocument();
  });

  it("classroom without vote keys shows no tally", () => {
    renderBlock(pixelGrid, { ...block, config: { promptKey: "p" } }, strings, { mode: "classroom" });
    expect(screen.queryByText(/votes in total/)).not.toBeInTheDocument();
  });

  it("has no accessibility violations in either mode, drawn or empty, in numbers view", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(pixelGrid, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      await userEvent.click(screen.getByRole("button", { name: "A digit 1" }));
      await userEvent.click(screen.getByRole("button", { name: "Numbers" }));
      await userEvent.click(screen.getByRole("button", { name: "Blur" }));
      expect(await a11yViolations(container)).toEqual([]);
      if (mode === "personal") await userEvent.click(screen.getByLabelText("Mostly the same"));
      else await userEvent.click(screen.getByRole("button", { name: "One more for Very different" }));
      if (mode === "classroom") await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
      await userEvent.click(screen.getByRole("button", { name: "Left" }));
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  }, 30000);
});

describe("pixel-grid contract", () => {
  /** Run the real validator (what `pnpm validate:content` uses) on a lesson holding this config; true when the config is accepted. */
  const validate = (cfg: object) => {
    const f = (id: string) => ({ id, type: "filler", componentVersion: "1.0", config: {} });
    const doc = {
      id: "contract-test", schemaVersion: "1.0", version: 1, status: "draft",
      meta: { titleKey: "title", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "title" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
      stages: [
        { stage: "hook", blocks: [f("f1")] }, { stage: "predict", blocks: [f("f2")] },
        { stage: "manipulate", blocks: [{ id: "px", type: "pixel-grid", componentVersion: "1.0", config: cfg }] },
        { stage: "explain", blocks: [f("f3")] }, { stage: "break-it", blocks: [f("f4")] }, { stage: "transfer-reflect", blocks: [f("f5")] },
      ],
      checks: { pre: [{ id: "a", objective: "o1", promptKey: "title", options: ["x", "y"], answer: "x" }], post: [{ id: "b", objective: "o1", promptKey: "title", options: ["x", "y"], answer: "x" }] },
      strings: { en: { title: "T" } },
      localeStatus: { en: "draft" },
    };
    return validateLesson(doc, { contracts: [pixelGridContract] }).filter((i) => i.check === "config").length === 0;
  };

  it("accepts a valid config and rejects invalid ones", () => {
    expect(validate({ promptKey: "p", size: 8, tools: ["draw"] })).toBe(true);
    expect(validate(config)).toBe(true);
    expect(validate({ promptKey: "p", size: 40 })).toBe(false);
    expect(validate({ promptKey: "p", tools: ["paint"] })).toBe(false);
    expect(validate({ promptKey: "p", extra: 1 })).toBe(false);
    expect(validate({ promptKey: "p", sameKey: "same" })).toBe(false);
    expect(validate({ promptKey: "p", presets: [{ labelKey: "one", rows: [[10]] }] })).toBe(false);
  });

  it("votes only when both keys are present, and lists string keys", () => {
    expect(pixelGridContract.vote!({ promptKey: "p" })).toBeNull();
    expect(pixelGridContract.vote!(config)!.options.map((o) => o.id)).toEqual(["same", "diff"]);
    expect(pixelGridContract.stringKeys(config).sort()).toEqual(["diff", "ex", "one", "p", "same"]);
    expect(pixelGridContract.blockRefs!(config)).toEqual([]);
  });

  it("has the same message keys in en, hi and te", () => {
    expect(Object.keys(messages.hi).sort()).toEqual(Object.keys(messages.en).sort());
    expect(Object.keys(messages.te).sort()).toEqual(Object.keys(messages.en).sort());
  });
});
