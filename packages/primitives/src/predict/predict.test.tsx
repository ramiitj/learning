import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { predict } from "./index";

const strings = { p: "What did the computer use to decide?", c1: "A rule someone wrote", c2: "Lots of examples", reveal: "It learned from examples." };
const block = { id: "b2", type: "predict", config: { promptKey: "p", choices: ["c1", "c2"], answer: "c2", confidence: true, revealKey: "reveal" } };

describe("predict", () => {
  it("asks for a commitment and confidence before revealing", async () => {
    renderBlock(predict, block, strings);
    const commit = screen.getByRole("button", { name: "Lock in my guess" });
    expect(commit).toBeDisabled();
    await userEvent.click(screen.getByLabelText("A rule someone wrote"));
    await userEvent.click(screen.getByLabelText("Very sure"));
    expect(screen.queryByText(strings.reveal)).not.toBeInTheDocument();
    await userEvent.click(commit);
    expect(screen.getByText(strings.reveal)).toBeInTheDocument();
  });

  it("meets a wrong guess with curiosity, never a verdict", async () => {
    const { container } = renderBlock(predict, block, strings);
    await userEvent.click(screen.getByLabelText("A rule someone wrote"));
    await userEvent.click(screen.getByLabelText("Very sure"));
    await userEvent.click(screen.getByRole("button", { name: "Lock in my guess" }));
    expect(container.textContent).not.toMatch(/incorrect|wrong/i);
    expect(screen.getByText(/the difference is the interesting part/)).toBeInTheDocument();
    expect(screen.getByText(/You were very sure/)).toBeInTheDocument();
  });

  it("lets the class vote by show of hands, then reveals", async () => {
    renderBlock(predict, block, strings, { mode: "classroom" });
    await userEvent.click(screen.getByRole("button", { name: "One more for Lots of examples" }));
    await userEvent.click(screen.getByRole("button", { name: "One more for Lots of examples" }));
    expect(screen.getByText("2 votes in total")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show what happens" }));
    expect(screen.getByText(strings.reveal)).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(predict, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });
});
