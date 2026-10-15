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
const guess = (w: string) => userEvent.click(screen.getByRole("radio", { name: w }));
const reveal = () => userEvent.click(screen.getByRole("button", { name: "Show what the model picks" }));

describe("next-word-model", () => {
  it("trains on starter sentences and shows vocabulary and counts for a word", async () => {
    renderBlock(nextWordModel, block, strings);
    expect(screen.getByText("4 sentences read. 10 different words and marks seen.")).toBeInTheDocument();
    await pickWord("the");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await guess("cat");
    await reveal();
    const table = screen.getByRole("table", { name: "What followed “the”" });
    const row = within(table).getByRole("row", { name: /cat/ });
    expect(within(row).getByText("3 of 7")).toBeInTheDocument();
    expect(screen.getByText(/does not understand these sentences and does not want anything/)).toBeInTheDocument();
  });

  it("hides the counts and the note about intention until the learner has committed and looked", async () => {
    renderBlock(nextWordModel, block, strings);
    await pickWord("the");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/does not understand these sentences/)).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Show what the model picks" });
    expect(button).toBeDisabled();
    expect(screen.getByText(/Choose a word first/)).toBeInTheDocument();
    await guess("mat");
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(screen.getByText("You guessed “mat”. The model picked “cat” because “cat” followed “the” 3 of 7 times, at least as often as any other word.")).toBeInTheDocument();
    expect(screen.getByText(/does not understand these sentences/)).toBeInTheDocument();
  });

  it("offers the top candidates in an order that does not depend on their counts", async () => {
    const order = () => screen.getAllByRole("radio").map((r) => r.getAttribute("value"));
    const first = renderBlock(nextWordModel, block, strings);
    await pickWord("the");
    const a = order();
    expect([...a].sort()).toEqual(["cat", "fish", "mat"]);
    first.unmount();
    renderBlock(nextWordModel, block, strings);
    await pickWord("the");
    expect(order()).toEqual(a);
  });

  it("lists the sentences it learned from, open by default", () => {
    const { container } = renderBlock(nextWordModel, block, strings);
    expect(container.querySelector("details")).toHaveAttribute("open");
  });

  it("asks for a guess first, then shows the pick with its working", async () => {
    renderBlock(nextWordModel, block, strings);
    await pickWord("the");
    expect(screen.getByText(/which word do you think came next most often after “the”/)).toBeInTheDocument();
    expect(screen.queryByText(/The model picks/)).not.toBeInTheDocument();
    await guess("cat");
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
    await guess("दूध");
    await reveal();
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
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show what the model picks" }));
    expect(screen.getByText(/The model picks “cat”/)).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("classroom: says everything is on the big screen, and gently warns about a likely name", async () => {
    renderBlock(nextWordModel, block, strings, { mode: "classroom" });
    expect(screen.getByText("Use made-up names or none. Everything typed here is on the big screen.")).toBeInTheDocument();
    expect(screen.queryByText(/stay on this device/)).not.toBeInTheDocument();
    const input = screen.getByLabelText("Type a sentence the class suggests");
    await userEvent.type(input, "Today we saw Priya at school");
    expect(screen.getByText(/“Priya” starts with a capital letter in the middle of the sentence/)).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, "Today we saw a bird. It sang.");
    expect(screen.queryByText(/starts with a capital letter/)).not.toBeInTheDocument();
  });

  it("classroom: the options are shuffled, not in count order", async () => {
    renderBlock(nextWordModel, block, strings, { mode: "classroom" });
    await pickWord("the");
    const names = screen.getAllByRole("button", { name: /^One more for / }).map((b) => b.getAttribute("aria-label")!.replace("One more for ", ""));
    expect([...names].sort()).toEqual(["cat", "fish", "mat"]);
  });

  it("personal mode shows the personal privacy note and no name warning", async () => {
    renderBlock(nextWordModel, block, strings);
    expect(screen.getByText(/stay on this device/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Add a sentence"), "We met Priya today");
    expect(screen.queryByText(/starts with a capital letter/)).not.toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(nextWordModel, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      await pickWord("the");
      expect(await a11yViolations(container)).toEqual([]);
      if (mode === "personal") await guess("cat");
      await userEvent.click(screen.getByRole("button", { name: "Show what the model picks" }));
      await userEvent.click(screen.getByRole("button", { name: "Write a sentence from “the”" }));
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  }, 30000);
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
