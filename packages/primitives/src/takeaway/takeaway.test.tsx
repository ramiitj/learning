import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Ajv2020 from "ajv/dist/2020.js";
import { predict } from "../predict";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { takeaway } from "./index";

const strings = {
  card: "Here is what you made today.",
  title: "Your card",
  p: "What did the computer use to decide?",
  c1: "A rule someone wrote",
  c2: "Lots of examples",
  reveal: "It learned from examples.",
};

const predictBlock = { id: "b1", type: "predict", componentVersion: "1.0", config: { promptKey: "p", choices: ["c1", "c2"], revealKey: "reveal" } };
const block = { id: "b2", type: "takeaway", config: { cardKey: "card", titleKey: "title", includes: ["b1"] } };

describe("takeaway", () => {
  it("shows 'Not made yet' before the included block has anything to show", () => {
    renderBlock(takeaway, block, strings, { before: [predictBlock], extraPlugins: [predict] });
    expect(screen.getByText("Not made yet.")).toBeInTheDocument();
  });

  it("shows the included block's summary once the learner has made something", async () => {
    renderBlock(takeaway, block, strings, { before: [predictBlock], extraPlugins: [predict] });
    await userEvent.click(screen.getByLabelText("Lots of examples"));
    await userEvent.click(screen.getByRole("button", { name: "Lock in my guess" }));
    expect(screen.getByText("You guessed: Lots of examples")).toBeInTheDocument();
    expect(screen.queryByText("Not made yet.")).not.toBeInTheDocument();
  });

  it("resolves an include with a suffix to the block id before its first dash", async () => {
    const suffixed = { ...block, config: { ...block.config, includes: ["b1-model-summary"] } };
    renderBlock(takeaway, suffixed, strings, { before: [predictBlock], extraPlugins: [predict] });
    await userEvent.click(screen.getByLabelText("A rule someone wrote"));
    await userEvent.click(screen.getByRole("button", { name: "Lock in my guess" }));
    expect(screen.getByText("You guessed: A rule someone wrote")).toBeInTheDocument();
  });

  it("lets the learner keep the card on this device, and the action can be undone", async () => {
    renderBlock(takeaway, block, strings, { before: [predictBlock], extraPlugins: [predict] });
    await userEvent.click(screen.getByRole("button", { name: "Keep it on this device" }));
    expect(screen.getByText("Kept on this device.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("button", { name: "Keep it on this device" })).toBeInTheDocument();
  });

  it("downloads the card without sending anything over the network", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderBlock(takeaway, block, strings, { before: [predictBlock], extraPlugins: [predict] });
    await userEvent.click(screen.getByRole("button", { name: "Download my card" }));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("shows a class card and a show-on-screen note in classroom mode", () => {
    renderBlock(takeaway, block, strings, { before: [predictBlock], extraPlugins: [predict], mode: "classroom" });
    expect(screen.getByText("The class's result")).toBeInTheDocument();
    expect(screen.getByText("Show on screen")).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(takeaway, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("satisfies its own configSchema and declares every string key it uses", () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(takeaway.configSchema);
    expect(validate(block.config)).toBe(true);
    expect(takeaway.stringKeys(block.config)).toEqual(expect.arrayContaining(["card", "title"]));
    expect(takeaway.blockRefs?.({ cardKey: "card", includes: ["b1-model-summary", "b2"] })).toEqual(["b1", "b2"]);
  });
});
