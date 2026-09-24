import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateLesson } from "@lm/schema/validate";
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
    expect(screen.getByText("You put Mango in Vegetable. Many people would put it in Fruit.")).toBeInTheDocument();
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
    expect(screen.queryByText("You put Mango in Vegetable. Many people would put it in Fruit.")).not.toBeInTheDocument();
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
    const lesson = {
      id: "sort-contract-check",
      schemaVersion: "1.0",
      version: 1,
      status: "draft" as const,
      meta: { titleKey: "instr", subject: "test", concepts: [], objectives: [], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 3 },
      stages: [{ stage: "manipulate" as const, blocks: [{ ...block, componentVersion: "1.0" }] }],
      checks: { pre: [], post: [] },
      strings: { en: strings },
      localeStatus: { en: "draft" as const },
    };
    const issues = validateLesson(lesson, { contracts: [sort] });
    expect(issues.filter((i) => i.check === "config" || i.check === "component")).toEqual([]);
  });
});
