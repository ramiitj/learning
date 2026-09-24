import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Ajv2020 from "ajv/dist/2020.js";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { sort } from "./index";

const strings = {
  instr: "Sort these into food groups.",
  mango: "Mango",
  potato: "Potato",
  fruit: "Fruit",
  veg: "Vegetable",
  reveal: "A botanist and a cook might sort these differently.",
};

const block = {
  id: "b3",
  type: "sort",
  config: {
    instructionKey: "instr",
    groups: ["fruit", "veg"],
    items: [
      { id: "mango", labelKey: "mango", symbol: "🥭", group: "fruit" },
      { id: "potato", labelKey: "potato", symbol: "🥔", group: "veg" },
    ],
    revealKey: "reveal",
  },
};

describe("sort", () => {
  it("moves an item from the tray into a group by tap, tap", async () => {
    renderBlock(sort, block, strings);
    const mango = screen.getByRole("button", { name: /Mango/ });
    await userEvent.click(mango);
    expect(mango).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Put it in Fruit" }));
    const tray = screen.getByRole("region", { name: "Not yet sorted" });
    expect(within(tray).queryByRole("button", { name: /Mango/ })).not.toBeInTheDocument();
    expect(within(tray).getByRole("button", { name: /Potato/ })).toBeInTheDocument();
  });

  it("reveals and notes items sorted differently from the expert grouping, without judgement", async () => {
    const { container } = renderBlock(sort, block, strings);
    await userEvent.click(screen.getByRole("button", { name: /Mango/ }));
    await userEvent.click(screen.getByRole("button", { name: "Put it in Vegetable" }));
    await userEvent.click(screen.getByRole("button", { name: /Potato/ }));
    await userEvent.click(screen.getByRole("button", { name: "Put it in Fruit" }));
    expect(screen.getByText(strings.reveal)).toBeInTheDocument();
    expect(screen.getByText("You put Mango in Vegetable. The lesson’s own grouping puts it in Fruit: worth a second look.")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/incorrect|wrong/i);
  });

  it("lets a placed item be picked up again and moved", async () => {
    renderBlock(sort, block, strings);
    await userEvent.click(screen.getByRole("button", { name: /Mango/ }));
    await userEvent.click(screen.getByRole("button", { name: "Put it in Vegetable" }));
    await userEvent.click(screen.getByRole("button", { name: /Potato/ }));
    await userEvent.click(screen.getByRole("button", { name: "Put it in Fruit" }));
    expect(screen.getByText(strings.reveal)).toBeInTheDocument();
    // move the misplaced mango into fruit; both now agree with the expert grouping
    const placedMango = screen.getByRole("button", { name: /Mango/ });
    await userEvent.click(placedMango);
    await userEvent.click(screen.getByRole("button", { name: "Put it in Fruit" }));
    expect(screen.queryByText("You put Mango in Vegetable. The lesson’s own grouping puts it in Fruit: worth a second look.")).not.toBeInTheDocument();
  });

  it("lets a placed item go back to the tray", async () => {
    renderBlock(sort, block, strings);
    await userEvent.click(screen.getByRole("button", { name: /Mango/ }));
    await userEvent.click(screen.getByRole("button", { name: "Put it in Fruit" }));
    await userEvent.click(screen.getByRole("button", { name: /Mango/ }));
    await userEvent.click(screen.getByRole("button", { name: "Put Mango back in the tray" }));
    const tray = screen.getByRole("region", { name: "Not yet sorted" });
    expect(within(tray).getByRole("button", { name: /Mango/ })).toBeInTheDocument();
  });

  it("can be undone", async () => {
    renderBlock(sort, block, strings);
    await userEvent.click(screen.getByRole("button", { name: /Mango/ }));
    await userEvent.click(screen.getByRole("button", { name: "Put it in Fruit" }));
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("button", { name: /^Mango/ })).toBeInTheDocument();
  });

  it("shows a notice when the referenced item set is not available yet", () => {
    renderBlock(sort, { ...block, config: { instructionKey: "instr", groups: ["fruit", "veg"], itemSet: "food-101" } }, strings);
    expect(screen.getByText("This set of items is not available yet.")).toBeInTheDocument();
  });

  it("classroom mode: the class votes item by item, and each is placed where most hands went", async () => {
    renderBlock(sort, block, strings, { mode: "classroom" });
    // first item
    await userEvent.click(screen.getByRole("button", { name: "One more for Fruit" }));
    await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
    await userEvent.click(screen.getByRole("button", { name: "Place it where most hands went" }));
    // second item
    await userEvent.click(screen.getByRole("button", { name: "One more for Vegetable" }));
    await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
    await userEvent.click(screen.getByRole("button", { name: "Place it where most hands went" }));
    expect(screen.getByText("How it was sorted")).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(sort, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("satisfies its own configSchema and declares every string key it uses", () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(sort.configSchema);
    expect(validate(block.config)).toBe(true);
    expect(sort.stringKeys(block.config)).toEqual(expect.arrayContaining(["instr", "fruit", "veg", "mango", "potato", "reveal"]));
  });

  it("rejects a config with neither items nor an itemSet", () => {
    const ajv = new Ajv2020({ strict: false });
    const validate = ajv.compile(sort.configSchema);
    expect(validate({ instructionKey: "instr", groups: ["fruit", "veg"] })).toBe(false);
  });
});
