import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { yourData } from "@lm/primitives";
import { validateLesson } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "@lm/primitives/test-utils";
import { nextWordModel } from "./index";
import { nextWordModelContract } from "./contract";
import { messages } from "./messages";

const strings = {
  p: "Teach the model with your sentences.",
  starter: "The cat sat on the mat.|The cat ate the fish.|The cat sat down.|The dog sat on the mat.",
  ex: "It only counts.",
  ask: "Type sentences.",
};
const config = { promptKey: "p", starterSentencesKey: "starter", explainKey: "ex" };
const block = { id: "nw", type: "next-word-model", config };

const pickWord = (w: string) => userEvent.selectOptions(screen.getByLabelText("Current word"), w);

describe("next-word-model", () => {
  it("trains on starter sentences and shows vocabulary and counts for a word", async () => {
    renderBlock(nextWordModel, block, strings);
    expect(screen.getByText("4 sentences read. 10 different words and marks known.")).toBeInTheDocument();
    await pickWord("the");
    const table = screen.getByRole("table", { name: "What followed “the”" });
    const row = within(table).getByRole("row", { name: /cat/ });
    expect(within(row).getByText("3 of 7")).toBeInTheDocument();
    expect(screen.getByText(/does not understand these sentences and does not want anything/)).toBeInTheDocument();
  });

  it("asks for a guess first, then shows the pick with its working", async () => {
    renderBlock(nextWordModel, block, strings);
    await pickWord("the");
    expect(screen.getByText(/which word do you think came next most often after “the”/)).toBeInTheDocument();
    expect(screen.queryByText(/The model picks/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show what the model picks" }));
    expect(screen.getByText("The model picks “cat”: 3 of the 7 times “the” was followed by “cat” (about 43%).")).toBeInTheDocument();
  });

  it("writes a sentence deterministically, with its steps", async () => {
    renderBlock(nextWordModel, block, strings);
    await pickWord("dog");
    await userEvent.click(screen.getByRole("button", { name: "Write a sentence from “dog”" }));
    expect(screen.getByText("dog sat on the cat sat on the cat sat on the")).toBeInTheDocument();
    expect(screen.getByText("After “dog”, “sat” won (1 of 1).")).toBeInTheDocument();
    expect(screen.getByText(/There is no plan behind it/)).toBeInTheDocument();
    expect(screen.getByText("It only counts.")).toBeInTheDocument();
  });

  it("learns from the learner's own sentences, in Hindi too, and keeps them on the device", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderBlock(nextWordModel, { ...block, config: { promptKey: "p" } }, strings, { locale: "en" });
    expect(screen.getByText(/nothing to count yet/)).toBeInTheDocument();
    const input = screen.getByLabelText("Add a sentence");
    await userEvent.type(input, "बिल्ली दूध पीती है।{Enter}");
    await userEvent.type(input, "बिल्ली दूध पीती है।{Enter}");
    expect(screen.getByText("The model already has that sentence.")).not.toBeEmptyDOMElement();
    expect(screen.getByLabelText("Current word")).toHaveValue("बिल्ली");
    expect(screen.getByRole("table")).toHaveTextContent("1 of 1");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("reads the learner's sentences from an earlier your-data block", async () => {
    const before = [{ id: "yd", type: "your-data", componentVersion: "1.0", config: { promptKey: "ask", kind: "list" } }];
    renderBlock(nextWordModel, { ...block, config: { promptKey: "p", fromBlock: "yd", starterSentencesKey: "starter" } }, strings, { extraPlugins: [yourData], before });
    expect(screen.getByText(/4 sentences read/)).toBeInTheDocument(); // falls back to starters until the learner types
    await userEvent.type(screen.getByLabelText("Type one item"), "I like tea{Enter}");
    expect(screen.getByText(/1 sentences read/)).toBeInTheDocument();
    expect(screen.getByLabelText("Current word")).toHaveValue("i");
  });

  it("respects maxSentences", async () => {
    renderBlock(nextWordModel, { ...block, config: { promptKey: "p", starterSentencesKey: "starter", maxSentences: 4 } }, strings);
    await userEvent.type(screen.getByLabelText("Add a sentence"), "One more.{Enter}");
    expect(screen.getByText("That is enough for now (up to 4 sentences).")).toBeInTheDocument();
  });

  it("reset and undo come from the engine", async () => {
    renderBlock(nextWordModel, { ...block, config: { promptKey: "p" } }, strings);
    await userEvent.type(screen.getByLabelText("Add a sentence"), "a b c.{Enter}");
    expect(screen.getByText(/1 sentences read/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Undo/ }));
    expect(screen.queryByText(/sentences read/)).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Add a sentence"), "x y.{Enter}");
    await userEvent.click(screen.getByRole("button", { name: /^Start this part again/ }));
    expect(screen.queryByText(/sentences read/)).not.toBeInTheDocument();
  });

  it("classroom: the class contributes sentences and guesses among the top three by show of hands", async () => {
    renderBlock(nextWordModel, block, strings, { mode: "classroom" });
    await pickWord("the");
    expect(screen.getByLabelText("Type a sentence the class suggests")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "One more for cat" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for mat" }));
    expect(screen.getByRole("button", { name: "One more for fish" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "One more for dog" })).not.toBeInTheDocument();
    expect(screen.getByText("2 votes in total")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show what the model picks" }));
    expect(screen.getByText(/The model picks “cat”/)).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(nextWordModel, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      await pickWord("the");
      await userEvent.click(screen.getByRole("button", { name: "Show what the model picks" }));
      await userEvent.click(screen.getByRole("button", { name: "Write a sentence from “the”" }));
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });
});

describe("next-word-model contract", () => {
  const validate = (cfg: object) => {
    const f = (id: string) => ({ id, type: "filler", componentVersion: "1.0", config: {} });
    const doc = {
      id: "contract-test", schemaVersion: "1.0", version: 1, status: "draft",
      meta: { titleKey: "title", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "title" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
      stages: [
        { stage: "hook", blocks: [f("f1")] }, { stage: "predict", blocks: [f("f2")] },
        { stage: "manipulate", blocks: [{ id: "nw", type: "next-word-model", componentVersion: "1.0", config: cfg }] },
        { stage: "explain", blocks: [f("f3")] }, { stage: "break-it", blocks: [f("f4")] }, { stage: "transfer-reflect", blocks: [f("f5")] },
      ],
      checks: { pre: [{ id: "a", objective: "o1", promptKey: "title", options: ["x", "y"], answer: "x" }], post: [{ id: "b", objective: "o1", promptKey: "title", options: ["x", "y"], answer: "x" }] },
      strings: { en: { title: "T" } },
      localeStatus: { en: "draft" },
    };
    return validateLesson(doc, { contracts: [nextWordModelContract] }).filter((i) => i.check === "config").length === 0;
  };

  it("accepts a valid config and rejects invalid ones", () => {
    expect(validate({ promptKey: "p", fromBlock: "b1", maxSentences: 8 })).toBe(true);
    expect(validate(config)).toBe(true);
    expect(validate({ promptKey: "p", maxSentences: 0 })).toBe(false);
    expect(validate({ promptKey: "p", extra: 1 })).toBe(false);
    expect(validate({})).toBe(false);
  });

  it("declares string keys, block refs and no fixed vote", () => {
    expect(nextWordModelContract.stringKeys({ ...config, fromBlock: "yd" }).sort()).toEqual(["ex", "p", "starter"]);
    expect(nextWordModelContract.blockRefs!({ ...config, fromBlock: "yd" })).toEqual(["yd"]);
    expect(nextWordModelContract.blockRefs!(config)).toEqual([]);
    expect(nextWordModelContract.vote!(config)).toBeNull();
  });

  it("has the same message keys in en, hi and te", () => {
    expect(Object.keys(messages.hi).sort()).toEqual(Object.keys(messages.en).sort());
    expect(Object.keys(messages.te).sort()).toEqual(Object.keys(messages.en).sort());
  });
});
