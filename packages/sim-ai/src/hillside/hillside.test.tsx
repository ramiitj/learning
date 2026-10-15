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
    expect(hillside.vote!(valleys as never)!.options).toEqual([{ id: "left", labelKey: "left" }, { id: "right", labelKey: "right" }]);
    expect(hillside.act).toBe("explore");
  });

  it("shows only the local height and slope, and records each step", async () => {
    renderBlock(hillside, block(valleys), strings);
    expect(screen.getByText(/Height here: 7\.9/)).toBeInTheDocument();
    expect(screen.getByText("The ground falls to the right, so downhill is to the right.")).toBeInTheDocument();
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
    expect(screen.getByText("Height after each step: your loss curve")).toBeInTheDocument();
    expect(screen.getByText(strings.fade)).toBeInTheDocument();
    expect(screen.getAllByRole("img").length).toBe(2);
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

  it("classroom: the class votes each step by show of hands", async () => {
    renderBlock(hillside, block(valleys), strings, { mode: "classroom" });
    expect(screen.getByRole("button", { name: "Take the class's step" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "One more for Go left" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Go left" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Go right" }));
    await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
    await userEvent.click(screen.getByRole("button", { name: "Take the class's step" }));
    expect(screen.getByText(/Step 1: you went Go left/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Take the class's step" })).toBeDisabled();
  });

  it("classroom: a tie asks for another count", async () => {
    renderBlock(hillside, block(valleys), strings, { mode: "classroom" });
    await userEvent.click(screen.getByRole("button", { name: "One more for Go left" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Go right" }));
    await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
    expect(screen.getByText("It is a tie. Count the hands again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Take the class's step" })).toBeDisabled();
  });

  it("has no accessibility violations in either mode, walking or faded", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(hillside, block(valleys), strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      for (let i = 0; i < 2; i++) {
        if (mode === "personal") await go("Go right");
        else {
          await userEvent.click(screen.getByRole("button", { name: "One more for Go right" }));
          await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
          await userEvent.click(screen.getByRole("button", { name: "Take the class's step" }));
        }
      }
      await userEvent.click(screen.getByRole("button", { name: "Fade the fog away" }));
      expect(screen.getByText("The whole hill")).toBeInTheDocument();
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("ships hi and te strings for every key", () => {
    for (const locale of ["hi", "te"]) expect(Object.keys(hillside.messages[locale]!).sort()).toEqual(Object.keys(hillside.messages.en!).sort());
  });
});
