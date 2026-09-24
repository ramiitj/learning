import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateLesson } from "@lm/schema/validate";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { assemble } from "./index";

const strings = {
  instr: "Put the steps of training a model in order.",
  s1: "Collect examples",
  s2: "Choose a model",
  s3: "Train it",
  success: "That is the order most teams follow.",
  checked: "Order matters here: each step needs what came before it.",
};

const block = {
  id: "b4",
  type: "assemble",
  config: {
    instructionKey: "instr",
    pieces: [
      { id: "collect", labelKey: "s1" },
      { id: "choose", labelKey: "s2" },
      { id: "train", labelKey: "s3" },
    ],
    targetOrder: ["collect", "choose", "train"],
    successKey: "success",
    checkKey: "checked",
  },
};

describe("assemble", () => {
  it("shows pieces in a shuffled order and reorders them with move buttons", async () => {
    renderBlock(assemble, block, strings);
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items.join("")).not.toEqual(["Collect examples", "Choose a model", "Train it"].join(""));
  });

  it("checks the order and reports how many pieces are in place", async () => {
    renderBlock(assemble, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "Check my order" }));
    expect(screen.getByText(strings.checked)).toBeInTheDocument();
    expect(screen.getByText(/of 3 are in place\./)).toBeInTheDocument();
  });

  it("reaches the target order through moves and shows success", async () => {
    renderBlock(assemble, block, strings);
    // move every piece to the top repeatedly until sorted, bounded loop
    for (let pass = 0; pass < 10; pass++) {
      const rows = screen.getAllByRole("listitem");
      const labels = rows.map((r) => r.textContent ?? "");
      const wanted = ["Collect examples", "Choose a model", "Train it"];
      let done = true;
      for (let i = 0; i < wanted.length; i++) {
        if (!labels[i]?.startsWith(wanted[i]!)) { done = false; break; }
      }
      if (done) break;
      // find a piece that is not yet at its correct position and move it up if possible
      for (let i = 0; i < labels.length; i++) {
        const wantedIndex = wanted.findIndex((w) => labels[i]?.startsWith(w));
        if (wantedIndex < i) {
          await userEvent.click(screen.getByRole("button", { name: `Move ${wanted[wantedIndex]} up` }));
          break;
        }
      }
    }
    await userEvent.click(screen.getByRole("button", { name: "Check my order" }));
    expect(screen.getByText("3 of 3 are in place.")).toBeInTheDocument();
    expect(screen.getByText(strings.success)).toBeInTheDocument();
  });

  it("clears the checked state when a piece moves again", async () => {
    renderBlock(assemble, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "Check my order" }));
    expect(screen.getByText(strings.checked)).toBeInTheDocument();
    const upButtons = screen.getAllByRole("button", { name: /^Move .+ up$/ });
    await userEvent.click(upButtons[0]!);
    expect(screen.queryByText(strings.checked)).not.toBeInTheDocument();
  });

  it("can be undone", async () => {
    renderBlock(assemble, block, strings);
    await userEvent.click(screen.getByRole("button", { name: "Check my order" }));
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByText(/of 3 are in place\./)).not.toBeInTheDocument();
  });

  it("invites class suggestions in classroom mode", () => {
    renderBlock(assemble, block, strings, { mode: "classroom" });
    expect(screen.getByText("Ask the class what should come next, then move a piece.")).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(assemble, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("satisfies its own configSchema and declares every string key it uses", () => {
    const lesson = {
      id: "assemble-contract-check",
      schemaVersion: "1.0",
      version: 1,
      status: "draft" as const,
      meta: { titleKey: "instr", subject: "test", concepts: [], objectives: [], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 3 },
      stages: [{ stage: "manipulate" as const, blocks: [{ ...block, componentVersion: "1.0" }] }],
      checks: { pre: [], post: [] },
      strings: { en: strings },
      localeStatus: { en: "draft" as const },
    };
    const issues = validateLesson(lesson, { contracts: [assemble] });
    expect(issues.filter((i) => i.check === "config" || i.check === "component")).toEqual([]);
  });
});
