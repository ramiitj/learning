import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateLesson } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { knob } from "./index";
import type { KnobConfig } from "./contract";

const strings = {
  p: "How loud does the alarm ring?",
  goal: "Get the alarm to ring at a medium volume.",
  success: "That is a medium volume: loud enough to notice, not loud enough to startle.",
  a: "Sensitivity",
  b: "Background noise",
  o: "Volume",
};

const config: KnobConfig = {
  promptKey: "p",
  goal: { target: 6, tolerance: 1, goalKey: "goal", successKey: "success" },
  model: {
    type: "linear",
    bias: 0,
    inputs: [
      { id: "a", labelKey: "a", initial: 2, weight: 1, min: 0, max: 10, step: 1 },
      { id: "b", labelKey: "b", initial: 0, weight: 1, min: 0, max: 10, step: 1 },
    ],
    output: { labelKey: "o", min: 0, max: 20 },
  },
};

const block = { id: "k1", type: "knob", config: config as unknown as Record<string, unknown> };

describe("knob", () => {
  it("validates a sample config against its schema and declares its string keys", () => {
    const lesson = {
      id: "test-knob",
      schemaVersion: "1.0",
      version: 1,
      status: "draft" as const,
      meta: { titleKey: "title", subject: "test", concepts: [], objectives: [], prerequisites: [], audiences: [], estimatedMinutes: 5 },
      stages: [{ stage: "manipulate" as const, blocks: [{ ...block, componentVersion: "1.0" }] }],
      checks: { pre: [], post: [] },
      strings: { en: { title: "Test", ...strings } },
      localeStatus: { en: "draft" as const },
    };
    const issues = validateLesson(lesson as never, { contracts: [knob] });
    expect(issues.filter((i) => i.check === "config" || i.check === "component")).toEqual([]);
    expect(knob.stringKeys(config as unknown as Record<string, unknown>)).toEqual(expect.arrayContaining(["p", "goal", "success", "a", "b", "o"]));
  });

  it("moves the slider and updates the working line and output live", async () => {
    renderBlock(knob, block, strings);
    const slider = screen.getByLabelText("Sensitivity");
    fireChange(slider, "6");
    expect(screen.getByText(/Volume: 6/)).toBeInTheDocument();
    expect(screen.getByText(/1 × 6 \+ 1 × 0 = 6/)).toBeInTheDocument();
  });

  it("shows the success message once the output is within tolerance of the goal", async () => {
    renderBlock(knob, block, strings);
    const slider = screen.getByLabelText("Sensitivity");
    fireChange(slider, "6");
    expect(screen.getByText(strings.success)).toBeInTheDocument();
  });

  it("can be reset", async () => {
    renderBlock(knob, block, strings);
    const slider = screen.getByLabelText("Sensitivity");
    fireChange(slider, "6");
    expect(screen.getByText(strings.success)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start this part again" }));
    expect(screen.queryByText(strings.success)).not.toBeInTheDocument();
  });

  it("classroom: gates the controls behind a class prediction", async () => {
    renderBlock(knob, block, strings, { mode: "classroom" });
    expect(screen.queryByLabelText("Sensitivity")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "We have made our predictions" }));
    expect(screen.getByLabelText("Sensitivity")).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(knob, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });
  it("turns the output into a decision at a threshold, inside the responsive sentence", async () => {
    const withDecision = { ...config, outputTemplateKey: "sentence", decision: { threshold: 5, aboveKey: "loud", belowKey: "quiet" } };
    renderBlock(knob, { ...block, config: withDecision as unknown as Record<string, unknown> }, { ...strings, sentence: "Volume {output}: {decision}.", loud: "loud", quiet: "quiet" });
    expect(screen.getByText("Volume 2: quiet.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Sensitivity"), { target: { value: "7" } });
    expect(screen.getByText("Volume 7: loud.")).toBeInTheDocument();
  });
});

/** jsdom's range inputs need a native value set + change event; userEvent.type does not work on range inputs. */
function fireChange(el: HTMLElement, value: string) {
  const input = el as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
