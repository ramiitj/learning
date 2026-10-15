import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LessonView, Registry, type AnyPlugin } from "@lm/engine";
import { a11yViolations } from "@lm/primitives/test-utils";
import { aiContracts } from "./contracts";
import { nextWordModel } from "./next-word-model";
import { pixelGrid } from "./pixel-grid";
import { hillside } from "./hillside";
import { dilemmaVote } from "./dilemma-vote";

const glossary = { en: { slope: { term: "Slope", definition: "How steeply the ground tilts." }, ghost: { term: "Ghost", definition: "Never shown." } } };

function show(plugin: AnyPlugin, config: Record<string, unknown>, strings: Record<string, string>, mode: "personal" | "classroom", ids: string[]) {
  const lesson = {
    id: `g-${plugin.type}`, version: 1,
    meta: { titleKey: "title", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "title" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
    stages: [{ stage: "manipulate" as const, blocks: [{ id: "b", type: plugin.type, componentVersion: "1.0", config: { ...config, glossary: ids } }] }],
    strings: { en: { title: "T", ...strings } },
    localeStatus: { en: "draft" as const },
  };
  localStorage.clear();
  return render(<LessonView lesson={lesson} locale="en" mode={mode} registry={new Registry([plugin])} glossary={glossary} storageKey={`g:${Math.random()}`} />);
}

describe("optional glossary field on the AI simulations", () => {
  it("is declared in every contract's schema as an array of unique strings", () => {
    for (const c of aiContracts) {
      const props = (c.configSchema as { properties: Record<string, { type: string; uniqueItems: boolean }> }).properties;
      expect(props.glossary, c.type).toMatchObject({ type: "array", uniqueItems: true });
    }
  });

  for (const mode of ["personal", "classroom"] as const) {
    it(`renders known terms as the engine's glossary links in ${mode} mode and skips unknown ids`, async () => {
      const { container } = show(nextWordModel, { promptKey: "p" }, { p: "Teach it." }, mode, ["slope", "missing"]);
      const link = within(container).getByRole("button", { name: "Slope" });
      expect(link).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(link);
      expect(link).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("How steeply the ground tilts.")).toBeVisible();
      expect(within(container).queryByText("Ghost")).not.toBeInTheDocument();
      expect(await a11yViolations(container)).toEqual([]);
    });
  }

  it("renders in the other simulations too", () => {
    show(pixelGrid, { promptKey: "p" }, { p: "Draw." }, "personal", ["slope"]);
    expect(screen.getAllByRole("button", { name: "Slope" }).length).toBeGreaterThan(0);
  });

  it("shows nothing when the field is absent or empty", () => {
    const { container } = show(hillside, { promptKey: "p", landscape: { type: "bowl", min: 0, max: 100 }, start: 10, stepMin: 2, stepMax: 10, leftKey: "l", rightKey: "r" }, { p: "P", l: "L", r: "R" }, "personal", []);
    expect(container.querySelector(".lm-hill .lm-words")).toBeNull();
    show(dilemmaVote, { promptKey: "p", options: [{ id: "a", labelKey: "p" }, { id: "b", labelKey: "p" }], frameworks: [{ id: "f", nameKey: "p", reasoningKey: "p", choice: null }] }, { p: "P" }, "classroom", ["slope"]);
    expect(screen.getAllByRole("button", { name: "Slope" })).toHaveLength(1);
  });
});
