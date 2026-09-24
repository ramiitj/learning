import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Ajv2020 from "ajv/dist/2020.js";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { yourData } from "./index";

const listStrings = {
  prompt: "List three things a good friend does.",
  ex1: "Listens",
  ex2: "Keeps promises",
};

const listBlock = {
  id: "b5",
  type: "your-data",
  config: { promptKey: "prompt", kind: "list" as const, minItems: 1, maxItems: 3, exampleKeys: ["ex1", "ex2"] },
};

const textStrings = { prompt: "Describe your morning." };
const textBlock = { id: "b6", type: "your-data", config: { promptKey: "prompt", kind: "text" as const, maxLength: 20 } };

describe("your-data (list)", () => {
  it("adds items, ignores empty input, and blocks duplicates kindly", async () => {
    renderBlock(yourData, listBlock, listStrings);
    const input = screen.getByRole("textbox");
    const add = screen.getByRole("button", { name: "Add it" });
    await userEvent.click(add);
    expect(screen.getByText("Type something first.")).toBeInTheDocument();
    await userEvent.type(input, "Shares snacks");
    await userEvent.click(add);
    expect(screen.getByText("Shares snacks")).toBeInTheDocument();
    await userEvent.type(input, "Shares snacks");
    await userEvent.click(add);
    expect(screen.getByText("That is already on your list.")).toBeInTheDocument();
  });

  it("enforces maxItems with a friendly note", async () => {
    renderBlock(yourData, listBlock, listStrings);
    const input = screen.getByRole("textbox");
    for (const v of ["One", "Two", "Three"]) {
      await userEvent.type(input, v);
      await userEvent.click(screen.getByRole("button", { name: "Add it" }));
    }
    await userEvent.type(input, "Four");
    await userEvent.click(screen.getByRole("button", { name: "Add it" }));
    expect(screen.getByText("That is enough for now (up to 3).")).toBeInTheDocument();
  });

  it("adds an example when the learner is stuck, and removes items", async () => {
    renderBlock(yourData, listBlock, listStrings);
    await userEvent.click(screen.getByRole("button", { name: "Use an example" }));
    expect(screen.getByText("Listens")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove Listens" }));
    expect(screen.queryByText("Listens")).not.toBeInTheDocument();
  });

  it("adds via Enter key", async () => {
    renderBlock(yourData, listBlock, listStrings);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "Shows up{Enter}");
    expect(screen.getByText("Shows up")).toBeInTheDocument();
  });

  it("can be undone", async () => {
    renderBlock(yourData, listBlock, listStrings);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "Shares snacks{Enter}");
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByText("Shares snacks")).not.toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(yourData, listBlock, listStrings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });
});

describe("your-data (text)", () => {
  it("counts characters and caps length", async () => {
    renderBlock(yourData, textBlock, textStrings);
    const textarea = screen.getByRole("textbox");
    await userEvent.type(textarea, "This sentence is much too long for the limit");
    expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(20);
    expect(screen.getByText(/of 20 characters/)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderBlock(yourData, textBlock, textStrings);
    expect(await a11yViolations(container)).toEqual([]);
  });
});

describe("your-data contract", () => {
  it("satisfies its own configSchema and declares every string key it uses", () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(yourData.configSchema);
    expect(validate(listBlock.config)).toBe(true);
    expect(validate(textBlock.config)).toBe(true);
    expect(yourData.stringKeys(listBlock.config)).toEqual(expect.arrayContaining(["prompt", "ex1", "ex2"]));
  });

  it("rejects an unknown kind", () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(yourData.configSchema);
    expect(validate({ promptKey: "prompt", kind: "drawing" })).toBe(false);
  });
});
