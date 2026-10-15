import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { sort } from "@lm/primitives";
import { validateBlocks } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "@lm/primitives/test-utils";
import { trainClassifier } from "./index";
import type { TrainClassifierConfig } from "./contract";

const strings: Record<string, string> = {
  p: "Teach the machine which animals are small and which are big.",
  small: "Small",
  big: "Big",
  weight: "Weight",
  explain: "The machine copies what its nearest examples say.",
  mouse: "Mouse", hamster: "Hamster", gerbil: "Gerbil", horse: "Horse", cow: "Cow", camel: "Camel",
  rabbit: "Rabbit", elephant: "Elephant", sortPrompt: "Sort them", twin: "Twin",
};

const item = (id: string, w: number) => ({ id, labelKey: id, features: { weight: w } });
const config: TrainClassifierConfig = {
  promptKey: "p",
  groups: ["small", "big"],
  features: [{ id: "weight", labelKey: "weight" }],
  items: [item("mouse", 1), item("hamster", 2), item("gerbil", 1.5), item("horse", 10), item("cow", 9), item("camel", 11)],
  testItems: [item("rabbit", 3), item("elephant", 12)],
  explainKey: "explain",
};
const block = (c: object = config) => ({ id: "t1", type: "train-classifier", config: c as unknown as Record<string, unknown> });

async function labelAll(labels: Record<string, string>) {
  for (const [name, group] of Object.entries(labels)) {
    const g = screen.getByRole("group", { name: new RegExp(`Which group is ${name}\\?`) });
    await userEvent.click(within(g).getByLabelText(group));
  }
}
const standard = { Mouse: "Small", Hamster: "Small", Gerbil: "Small", Horse: "Big", Cow: "Big", Camel: "Big" };

describe("train-classifier", () => {
  it("validates against its schema and rejects a bad config", () => {
    const issues = (c: object) => validateBlocks([{ ...block(c), componentVersion: "1.0" }] as never, { en: strings }, { contracts: [trainClassifier], locales: ["en"] }).filter((x) => x.check === "config" || x.check === "component");
    expect(issues(config)).toEqual([]);
    expect(issues({ ...config, groups: ["small"] }).length).toBeGreaterThan(0);
    expect(issues({ ...config, surprise: 1 }).length).toBeGreaterThan(0);
    expect(issues({ ...config, testItems: [] }).length).toBeGreaterThan(0);
    const { promptKey: _omit, ...noPrompt } = config;
    expect(issues(noPrompt).length).toBeGreaterThan(0);
    expect(trainClassifier.stringKeys(config as never)).toEqual(expect.arrayContaining(["p", "small", "big", "weight", "mouse", "rabbit", "explain"]));
    expect(trainClassifier.blockRefs?.({ ...config, fromBlock: "s1" } as never)).toEqual(["s1"]);
    expect(trainClassifier.blockRefs?.(config as never)).toEqual([]);
    const v = trainClassifier.vote!(config as never)!;
    expect(v.options.map((o) => o.id)).toEqual(["small", "big"]);
    expect(v.perItem!.map((o) => o.id)).toEqual(["rabbit", "elephant"]);
  });

  it("waits for labels, then shows labels with a number, words and the examples it relied on", async () => {
    renderBlock(trainClassifier, block(), strings);
    expect(screen.getByRole("button", { name: "Train the machine" })).toBeDisabled();
    await labelAll(standard);
    await userEvent.click(screen.getByRole("button", { name: "Train the machine" }));
    const rabbit = screen.getByRole("region", { name: "Rabbit" });
    expect(within(rabbit).getByText("The machine says: Small")).toBeInTheDocument();
    expect(within(rabbit).getByText(/3 of 3 neighbours agree \(100%\)/)).toBeInTheDocument();
    expect(within(rabbit).getByText(/very sure/)).toBeInTheDocument();
    expect(within(rabbit).getByText(/Hamster \(labelled Small/)).toBeInTheDocument();
    expect(screen.getByText(strings.explain!)).toBeInTheDocument();
  });

  it("says the machine is confused when examples disagree, and confidence drops", async () => {
    const c = { ...config, items: [...config.items, item("twin", 1)], testItems: [item("rabbit", 1.2), item("elephant", 12)] };
    renderBlock(trainClassifier, block(c), strings);
    await labelAll({ ...standard, Twin: "Big" });
    await userEvent.click(screen.getByRole("button", { name: "Train the machine" }));
    expect(screen.getByText(/The machine is confused because some examples disagree/)).toBeInTheDocument();
    const rabbit = screen.getByRole("region", { name: "Rabbit" });
    expect(within(rabbit).getByText(/2 of 3 neighbours agree \(67%\)/)).toBeInTheDocument();
    expect(within(rabbit).getByText(/two examples that look exactly the same/)).toBeInTheDocument();
  });

  it("flags results as out of date when labels change after training, and retrains", async () => {
    renderBlock(trainClassifier, block(), strings);
    await labelAll(standard);
    await userEvent.click(screen.getByRole("button", { name: "Train the machine" }));
    await labelAll({ Camel: "Small" });
    expect(screen.getByText(/labels have changed since the machine last trained/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Train again" }));
    expect(screen.queryByText(/labels have changed/)).not.toBeInTheDocument();
  });

  it("supports undo and reset from the engine", async () => {
    renderBlock(trainClassifier, block(), strings);
    await labelAll(standard);
    await userEvent.click(screen.getByRole("button", { name: "Train the machine" }));
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Train the machine" }));
    await userEvent.click(screen.getByRole("button", { name: "Start this part again" }));
    expect(screen.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Train the machine" })).toBeDisabled();
  });

  it("takes the learner's labels from an earlier sort block", async () => {
    const sortBlock = { id: "s1", type: "sort", config: { instructionKey: "sortPrompt", groups: ["small", "big"], items: config.items.map((i) => ({ id: i.id, labelKey: i.labelKey })) } };
    renderBlock(trainClassifier, block({ ...config, fromBlock: "s1" }), strings, { extraPlugins: [sort], before: [sortBlock as never] });
    expect(screen.getByRole("button", { name: "Train the machine" })).toBeDisabled();
    expect(screen.queryByRole("group", { name: /Which group is/ })).not.toBeInTheDocument();
    for (const [name, group] of Object.entries(standard)) {
      await userEvent.click(screen.getByRole("button", { name }));
      const quick = screen.getByRole("group", { name: `Where does ${name} go?` });
      await userEvent.click(within(quick).getByRole("button", { name: group! }));
    }
    await userEvent.click(screen.getByRole("button", { name: "Train the machine" }));
    expect(within(screen.getByRole("region", { name: "Elephant" })).getByText("The machine says: Big")).toBeInTheDocument();
  });

  it("classroom: the class guesses by show of hands before each reveal", async () => {
    renderBlock(trainClassifier, block(), strings, { mode: "classroom" });
    await labelAll(standard);
    await userEvent.click(screen.getByRole("button", { name: "Train the machine" }));
    expect(screen.getByText("New item 1 of 2")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Rabbit" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "One more for Small" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Small" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Big" }));
    await userEvent.click(screen.getByRole("button", { name: "Show what the machine chose" }));
    expect(screen.getByText("2 of 3 guessed it.")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Rabbit" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next item" }));
    expect(screen.getByText("New item 2 of 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "One more for Big" }));
    await userEvent.click(screen.getByRole("button", { name: "Show what the machine chose" }));
    await userEvent.click(screen.getByRole("button", { name: "Next item" }));
    expect(screen.getByText("The machine has labelled every new item.")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(2);
  });

  it("has first-use hint text and no accessibility violations in either mode, trained or not", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(trainClassifier, block(), strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      await labelAll(standard);
      await userEvent.click(screen.getByRole("button", { name: "Train the machine" }));
      if (mode === "classroom") await userEvent.click(screen.getByRole("button", { name: "Show what the machine chose" }));
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("renders in Hindi and Telugu from the locale tables", () => {
    for (const locale of ["hi", "te"]) {
      expect(Object.keys(trainClassifier.messages[locale]!).sort()).toEqual(Object.keys(trainClassifier.messages.en!).sort());
    }
  });
});
