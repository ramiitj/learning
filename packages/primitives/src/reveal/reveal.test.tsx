import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { reveal } from "./index";

const strings = { text: "A computer called a yellow ball a mango.", s1: "Nobody told it what a mango is.", s2: "It had only seen examples.", q: "So how did it decide?" };
const block = { id: "b1", type: "reveal", config: { textKey: "text", steps: ["s1", "s2"], questionKey: "q" } };

describe("reveal", () => {
  it("uncovers ideas one at a time and saves the question for last", async () => {
    renderBlock(reveal, block, strings);
    expect(screen.queryByText(strings.s1)).not.toBeInTheDocument();
    expect(screen.queryByText(strings.q)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show the next idea" }));
    expect(screen.getByText(strings.s1)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show the next idea" }));
    expect(screen.getByText(strings.q)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show the next idea" })).not.toBeInTheDocument();
  });

  it("can be undone", async () => {
    renderBlock(reveal, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "Show the next idea" }));
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByText(strings.s1)).not.toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(reveal, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });
});
