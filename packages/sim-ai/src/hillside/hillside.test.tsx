import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateBlocks } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "@lm/primitives/test-utils";
import { hillside } from "./index";
import type { HillsideConfig } from "./contract";

const strings = {
  p: "Find the lowest ground in the fog.",
  goal: "Get as low as you can.",
  fade: "This height is the loss. Training is a walk downhill on it.",
  breaks: "Where this picture breaks: a real model has millions of directions.",
  left: "Go left",
  right: "Go right",
};
const valleys: HillsideConfig = {
  promptKey: "p", landscape: { type: "two-valleys", min: 0, max: 100 }, start: 10, stepMin: 2, stepMax: 10, maxSteps: 12,
  leftKey: "left", rightKey: "right", goalKey: "goal", fadeKey: "fade",
};
const bowl: HillsideConfig = { ...valleys, landscape: { type: "bowl", min: 0, max: 100 }, start: 47, stepMax: 4 };
const block = (c: HillsideConfig) => ({ id: "h1", type: "hillside", config: c as unknown as Record<string, unknown> });
const go = (name: string) => userEvent.click(screen.getByRole("button", { name: new RegExp(name) }));

describe("hillside", () => {
  it("validates against its schema, rejects bad configs and lists its keys and votes", () => {
    const issues = (c: object) => validateBlocks([{ ...block(c as never), componentVersion: "1.0" }] as never, { en: strings }, { contracts: [hillside], locales: ["en"] }).filter((x) => x.check === "config" || x.check === "component");
    expect(issues(valleys)).toEqual([]);
    expect(issues({ ...valleys, landscape: { type: "volcano", min: 0, max: 1 } }).length).toBeGreaterThan(0);
    expect(issues({ ...valleys, stepMin: 0 }).length).toBeGreaterThan(0);
    expect(issues({ ...valleys, extra: true }).length).toBeGreaterThan(0);
    const { leftKey: _l, ...noLeft } = valleys;
    expect(issues(noLeft).length).toBeGreaterThan(0);
    expect(hillside.stringKeys(valleys as never).sort()).toEqual(["fade", "goal", "left", "p", "right"]);
    expect(hillside.stringKeys({ ...valleys, breaksKey: "breaks" } as never)).toContain("breaks");
    expect(issues({ ...valleys, breaksKey: "breaks", glossary: ["slope", "loss"] })).toEqual([]);
    expect(issues({ ...valleys, glossary: "slope" }).length).toBeGreaterThan(0);
    expect(hillside.vote!(valleys as never)!.options).toEqual([{ id: "left", labelKey: "left" }, { id: "right", labelKey: "right" }]);
    expect(hillside.act).toBe("explore");
  });

  it("shows only the local height and slope, and records each step", async () => {
    renderBlock(hillside, block(valleys), strings);
    expect(screen.getByText(/Height here: 7\.9/)).toBeInTheDocument();
    expect(screen.getByText("The ground falls to the right.")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/downhill is to the/);
    expect(screen.getByText(/“Slope” means how steeply the ground tilts/)).toBeInTheDocument();
    expect(screen.queryByText("The whole hill")).not.toBeInTheDocument();
    await go("Go right");
    expect(screen.getByText(/Step 1: you went Go right/)).toBeInTheDocument();
    expect(screen.getByText(/Heights so far: 7\.9 → /)).toBeInTheDocument();
    expect(screen.getByText("11 steps left")).toBeInTheDocument();
  });

  it("lets the learner change the step size with the slider", async () => {
    renderBlock(hillside, block(bowl), strings);
    fireEvent.change(screen.getByLabelText("Step size"), { target: { value: "4" } });
    await go("Go right");
    expect(screen.getByText(/Position: 51/)).toBeInTheDocument();
  });

  it("reports being trapped in a local valley, then fades into the full curve and loss chart", async () => {
    renderBlock(hillside, block(valleys), strings);
    await go("Go right");
    await go("Go right");
    expect(screen.getByText(/You stopped in a valley, but there is lower ground elsewhere/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Go right/ })).not.toBeInTheDocument();
    const fade = screen.getByRole("button", { name: "Fade the fog away" });
    expect(fade).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(fade);
    expect(fade).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("The whole hill")).toBeInTheDocument();
    expect(screen.getByText(/^Height after each step: your loss curve/)).toBeInTheDocument();
    expect(screen.getByText(strings.fade)).toBeInTheDocument();
    expect(screen.queryByText(strings.breaks)).not.toBeInTheDocument();
    expect(screen.getAllByRole("img").length).toBe(2);
  });

  it("shows where the picture breaks only after the fade", async () => {
    renderBlock(hillside, block({ ...valleys, breaksKey: "breaks" }), strings);
    await go("Go right");
    await go("Go right");
    expect(screen.queryByText(strings.breaks)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Fade the fog away" }));
    expect(screen.getByText(strings.breaks)).toBeInTheDocument();
  });

  it("draws one narrow window of the ground in the fog", async () => {
    const { container } = renderBlock(hillside, block(bowl), strings);
    fireEvent.change(screen.getByLabelText("Step size"), { target: { value: "2" } });
    // At step size 2 the window is 2.5 wide on each side: only the nearby ground is drawn.
    const label = container.querySelector("svg.lm-hill__svg")!.getAttribute("aria-label")!;
    expect(label).toMatch(/^Fog view\./);
    expect(container.querySelectorAll("svg.lm-hill__svg polyline")).toHaveLength(1);
  });

  it("lets the learner walk again from the start or try another step size", async () => {
    renderBlock(hillside, block(valleys), strings);
    await go("Go right");
    await go("Go right");
    await userEvent.click(screen.getByRole("button", { name: "Walk again from the start" }));
    expect(screen.getByText(/You are at the start/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Go right/ })).toBeInTheDocument();
    await go("Go right");
    await go("Go right");
    await userEvent.click(screen.getByRole("button", { name: "Try a different step size" }));
    expect(screen.getByLabelText("Step size")).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: /^Undo/ }));
    expect(screen.getByRole("button", { name: "Walk again from the start" })).toBeInTheDocument();
  });

  it("celebrates reaching the bottom of the bowl", async () => {
    renderBlock(hillside, block(bowl), strings);
    fireEvent.change(screen.getByLabelText("Step size"), { target: { value: "3.1111111111111107" } });
    await go("Go right");
    expect(screen.getByText("You reached the lowest ground on the whole hill.")).toBeInTheDocument();
  });

  it("ends when the step budget runs out", async () => {
    renderBlock(hillside, block({ ...valleys, maxSteps: 2, start: 50 }), strings);
    await go("Go left");
    await go("Go right");
    expect(screen.getByText("You ran out of steps before settling anywhere.")).toBeInTheDocument();
  });

  it("supports undo and reset", async () => {
    renderBlock(hillside, block(valleys), strings);
    await go("Go right");
    await go("Go right");
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("button", { name: /Go right/ })).toBeInTheDocument();
    expect(screen.getByText(/^Step 1:/)).toBeInTheDocument();
    expect(screen.queryByText(/^Step 2:/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start this part again" }));
    expect(screen.getByText(/You are at the start/)).toBeInTheDocument();
  });

  const settleSize = async (name = "Medium steps (6)") => {
    await userEvent.click(screen.getByRole("button", { name: `One more for ${name}` }));
    await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
    await userEvent.click(screen.getByRole("button", { name: "Use the class's step size" }));
  };

  it("classroom: the class votes once on step size, then the walk follows the slope", async () => {
    renderBlock(hillside, block(valleys), strings, { mode: "classroom" });
    expect(screen.getByRole("button", { name: "Use the class's step size" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Take one step downhill" })).not.toBeInTheDocument();
    await settleSize();
    expect(screen.queryByRole("button", { name: /One more for (Small|Medium|Large)/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Take one step downhill" }));
    expect(screen.getByText(/Step 1: you went Go right/)).toBeInTheDocument();
    expect(screen.getByText(/Position: 16/)).toBeInTheDocument();
  });

  it("classroom: a tie on step size asks for another count", async () => {
    renderBlock(hillside, block(valleys), strings, { mode: "classroom" });
    await userEvent.click(screen.getByRole("button", { name: "One more for Small steps (2)" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Large steps (10)" }));
    await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
    expect(screen.getByText("It is a tie. Count the hands again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use the class's step size" })).toBeDisabled();
  });

  it("classroom: the class votes a direction only at the trap moment", async () => {
    renderBlock(hillside, block(valleys), strings, { mode: "classroom" });
    await settleSize();
    await userEvent.click(screen.getByRole("button", { name: "Take one step downhill" }));
    expect(screen.queryByRole("button", { name: "One more for Go left" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Take one step downhill" }));
    expect(screen.getByText(/You stopped in a valley, but there is lower ground elsewhere/)).toBeInTheDocument();
    expect(screen.getByText("The walk is stuck. Which way should it try now?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Take the class's step" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "One more for Go right" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Go right" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Go left" }));
    await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
    await userEvent.click(screen.getByRole("button", { name: "Take the class's step" }));
    expect(screen.getByText(/Step 3: you went Go right/)).toBeInTheDocument();
  });

  it("classroom: a trap tie asks for another count, and the class can restart with a new step size", async () => {
    renderBlock(hillside, block(valleys), strings, { mode: "classroom" });
    await settleSize();
    await userEvent.click(screen.getByRole("button", { name: "Take one step downhill" }));
    await userEvent.click(screen.getByRole("button", { name: "Take one step downhill" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Go left" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Go right" }));
    await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
    expect(screen.getByText("It is a tie. Count the hands again.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try a different step size" }));
    expect(screen.getByRole("button", { name: "Use the class's step size" })).toBeInTheDocument();
    expect(screen.getByText(/You are at the start/)).toBeInTheDocument();
  });

  it("classroom: undo takes back a step and reset starts over", async () => {
    renderBlock(hillside, block(valleys), strings, { mode: "classroom" });
    await settleSize();
    await userEvent.click(screen.getByRole("button", { name: "Take one step downhill" }));
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText(/You are at the start/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start this part again" }));
    expect(screen.getByRole("button", { name: "Use the class's step size" })).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode, walking or faded", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(hillside, block(valleys), strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      for (let i = 0; i < 2; i++) {
        if (mode === "personal") await go("Go right");
        else {
          if (i === 0) {
            await userEvent.click(screen.getByRole("button", { name: "One more for Medium steps (6)" }));
            await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
            expect(await a11yViolations(container)).toEqual([]);
            await userEvent.click(screen.getByRole("button", { name: "Use the class's step size" }));
          }
          await userEvent.click(screen.getByRole("button", { name: "Take one step downhill" }));
        }
      }
      if (mode === "classroom") {
        expect(await a11yViolations(container)).toEqual([]);
        await userEvent.click(screen.getByRole("button", { name: "One more for Go left" }));
        await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
        expect(await a11yViolations(container)).toEqual([]);
      }
      await userEvent.click(screen.getByRole("button", { name: "Fade the fog away" }));
      expect(screen.getByText("The whole hill")).toBeInTheDocument();
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  }, 30000);

  it("ships hi and te strings for every key", () => {
    for (const locale of ["hi", "te"]) expect(Object.keys(hillside.messages[locale]!).sort()).toEqual(Object.keys(hillside.messages.en!).sort());
  });
});
