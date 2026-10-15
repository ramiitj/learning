import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateBlocks } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "@lm/primitives/test-utils";
import { dilemmaVote } from "./index";
import { messages } from "./messages";

const strings = {
  p: "A self-driving car must swerve or stay on course.",
  o1: "Swerve", o2: "Stay on course",
  f1n: "Outcomes", f1r: "Count who is harmed least.",
  f2n: "Duties", f2r: "Some rules should never be broken.",
  f3n: "Care", f3r: "It depends on who is nearby.",
  refl: "Could a program ever settle this?",
};
const config = {
  promptKey: "p",
  options: [{ id: "swerve", labelKey: "o1" }, { id: "stay", labelKey: "o2" }],
  frameworks: [
    { id: "f1", nameKey: "f1n", reasoningKey: "f1r", choice: "swerve" },
    { id: "f2", nameKey: "f2n", reasoningKey: "f2r", choice: "stay" },
    { id: "f3", nameKey: "f3n", reasoningKey: "f3r", choice: null },
  ],
  reflectionKey: "refl",
};
const block = { id: "dv1", type: "dilemma-vote", config };

describe("dilemma-vote", () => {
  it("asks for a choice, then shows every framework beside it", async () => {
    renderBlock(dilemmaVote, block, strings);
    const lock = screen.getByRole("button", { name: "Lock in my choice" });
    expect(lock).toBeDisabled();
    expect(screen.queryByText(strings.f1r)).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Swerve"));
    await userEvent.type(screen.getByLabelText("Your reason (optional)"), "Fewer people hurt");
    await userEvent.click(lock);
    expect(screen.getByText("Your choice: Swerve")).toBeInTheDocument();
    expect(screen.getByText("Your reason: Fewer people hurt")).toBeInTheDocument();
    for (const k of ["f1n", "f2n", "f3n"]) expect(screen.getByText(strings[k as keyof typeof strings])).toBeInTheDocument();
    expect(screen.getByText("Would choose: Swerve")).toBeInTheDocument();
    expect(screen.getByText("Same as your choice")).toBeInTheDocument();
    expect(screen.getByText("Different from your choice")).toBeInTheDocument();
    expect(screen.getByText("Would not settle this on its own")).toBeInTheDocument();
    expect(screen.getByText(strings.refl)).toBeInTheDocument();
  });

  it("never implies a right answer and gives every framework identical treatment", async () => {
    const { container } = renderBlock(dilemmaVote, block, strings);
    await userEvent.click(screen.getByLabelText("Stay on course"));
    await userEvent.click(screen.getByRole("button", { name: "Lock in my choice" }));
    expect(container.textContent).not.toMatch(/incorrect|wrong|correct answer|well done/i);
    expect(screen.getByText(/no single right answer/)).toBeInTheDocument();
    const cards = container.querySelectorAll(".lm-dilemma-card");
    expect(cards).toHaveLength(3);
    const shapes = [...cards].map((c) => [c.className, [...c.children].map((x) => x.tagName).join()].join("|"));
    expect(new Set(shapes).size).toBe(1);
  });

  it("lets the learner change their vote after reading", async () => {
    renderBlock(dilemmaVote, block, strings);
    await userEvent.click(screen.getByLabelText("Swerve"));
    await userEvent.click(screen.getByRole("button", { name: "Lock in my choice" }));
    await userEvent.click(screen.getByRole("button", { name: "Change my choice" }));
    await userEvent.click(screen.getByLabelText("Stay on course"));
    await userEvent.click(screen.getByRole("button", { name: "Lock in my choice" }));
    expect(screen.getByText("Your choice: Stay on course")).toBeInTheDocument();
  });

  it("can be undone", async () => {
    renderBlock(dilemmaVote, block, strings);
    await userEvent.click(screen.getByLabelText("Swerve"));
    await userEvent.click(screen.getByRole("button", { name: "Lock in my choice" }));
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByText(strings.f1r)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lock in my choice" })).toBeInTheDocument();
  });

  it("does not send anything anywhere", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("no network"));
    renderBlock(dilemmaVote, block, strings);
    await userEvent.click(screen.getByLabelText("Swerve"));
    await userEvent.type(screen.getByLabelText("Your reason (optional)"), "private");
    await userEvent.click(screen.getByRole("button", { name: "Lock in my choice" }));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("classroom: class votes, then the teacher reveals frameworks one at a time", async () => {
    const { container } = renderBlock(dilemmaVote, block, strings, { mode: "classroom" });
    await userEvent.click(screen.getByRole("button", { name: "One more for Swerve" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Stay on course" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Stay on course" }));
    expect(screen.getByText("3 votes in total")).toBeInTheDocument();
    expect(container.querySelectorAll(".lm-dilemma-card")).toHaveLength(0);
    expect(screen.getByText("0 of 3 ways of thinking shown")).toBeInTheDocument();
    // The ways of thinking wait until the class's own result is on screen.
    expect(screen.getByRole("button", { name: "Show the next way of thinking" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Show the class result" }));
    await userEvent.click(screen.getByRole("button", { name: "Show the next way of thinking" }));
    expect(container.querySelectorAll(".lm-dilemma-card")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Show the next way of thinking" }));
    await userEvent.click(screen.getByRole("button", { name: "Show the next way of thinking" }));
    expect(container.querySelectorAll(".lm-dilemma-card")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Show the next way of thinking" })).not.toBeInTheDocument();
    expect(within(container).getByText(strings.refl)).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode, before and after", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(dilemmaVote, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      if (mode === "personal") {
        await userEvent.click(screen.getByLabelText("Swerve"));
        await userEvent.click(screen.getByRole("button", { name: "Lock in my choice" }));
      } else {
        await userEvent.click(screen.getByRole("button", { name: "Show the next way of thinking" }));
      }
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  }, 30000);

  it("has complete en, hi and te messages", () => {
    const en = Object.keys(messages.en).sort();
    expect(Object.keys(messages.hi).sort()).toEqual(en);
    expect(Object.keys(messages.te).sort()).toEqual(en);
  });

  it("declares a strict contract and rejects invalid configuration", () => {
    const check = (c: Record<string, unknown>) => validateBlocks([{ id: "x", type: "dilemma-vote", componentVersion: "1.0", config: c }], { en: strings }, { contracts: [dilemmaVote] });
    expect(dilemmaVote.act).toBe("decide");
    expect(check(config).map((i) => i.message)).toEqual([]);
    expect(check({ ...config, options: [config.options[0]] }).length).toBeGreaterThan(0);
    expect(check({ ...config, frameworks: [{ id: "f", nameKey: "f1n", reasoningKey: "f1r" }] }).length).toBeGreaterThan(0);
    expect(check({ ...config, extra: true }).length).toBeGreaterThan(0);
    expect(check({ promptKey: "p" }).length).toBeGreaterThan(0);
    expect(check({ ...config, glossary: ["algorithm"] })).toEqual([]);
    expect(check({ ...config, glossary: "algorithm" }).length).toBeGreaterThan(0);
  });

  it("exposes string keys and the options for live phone voting", () => {
    expect(dilemmaVote.stringKeys(config)).toEqual(["p", "o1", "o2", "f1n", "f1r", "f2n", "f2r", "f3n", "f3r", "refl"]);
    expect(dilemmaVote.vote?.(config)).toEqual({ promptKey: "p", options: [{ id: "swerve", labelKey: "o1" }, { id: "stay", labelKey: "o2" }] });
  });
});
