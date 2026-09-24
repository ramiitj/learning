import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateLesson } from "@lm/schema/validate";
import { LessonView, Registry } from "@lm/engine";
import { a11yViolations, renderBlock } from "../shared/test-utils";
import { check } from "./index";
import { checkContract } from "./contract";

const strings = {
  p: "What did the computer use to decide?",
  c1: "A rule someone wrote",
  c2: "Lots of examples",
  fb1: "A rule is what a programmer writes by hand.",
  explain: "It learned the pattern from many labelled examples.",
  detourTitle: "What is an example?",
};
const block = {
  id: "b1",
  type: "check",
  config: { promptKey: "p", options: ["c1", "c2"], answer: "c2", feedback: { c1: "fb1" }, hints: ["fb1"], explainKey: "explain", detour: "d1" },
};

/** Minimal lesson document that satisfies the lesson schema's structure, so the
 * per-block config schema (checked by validateLesson) can be exercised in isolation. */
function lessonWith(config: Record<string, unknown>) {
  return {
    id: "contract-test",
    schemaVersion: "1.0",
    version: 1,
    status: "draft" as const,
    meta: { titleKey: "p", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "p" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
    stages: [
      { stage: "hook" as const, blocks: [{ id: "f1", type: "filler", componentVersion: "1.0", config: {} }] },
      { stage: "predict" as const, blocks: [{ id: "f2", type: "filler", componentVersion: "1.0", config: {} }] },
      { stage: "manipulate" as const, blocks: [{ id: "f3", type: "filler", componentVersion: "1.0", config: {} }] },
      { stage: "explain" as const, blocks: [{ id: "b1", type: "check", componentVersion: "1.0", config }] },
      { stage: "break-it" as const, blocks: [{ id: "f4", type: "filler", componentVersion: "1.0", config: {} }] },
      { stage: "transfer-reflect" as const, blocks: [{ id: "f5", type: "filler", componentVersion: "1.0", config: {} }] },
    ],
    checks: {
      pre: [{ id: "pre1", objective: "o1", promptKey: "p", options: ["c1", "c2"], answer: "c2" }],
      post: [{ id: "post1", objective: "o1", promptKey: "p", options: ["c1", "c2"], answer: "c2" }],
    },
    strings: { en: strings },
    localeStatus: { en: "draft" as const },
  };
}

describe("check", () => {
  it("confirms a correct choice with the explanation, never a score", async () => {
    renderBlock(check, block, strings);
    await userEvent.click(screen.getByLabelText("Lots of examples"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(screen.getByText(strings.explain)).toBeInTheDocument();
  });

  it("meets an attempt that does not land with curiosity, and lets the learner choose again", async () => {
    const { container } = renderBlock(check, block, strings);
    await userEvent.click(screen.getByLabelText("A rule someone wrote"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(container.textContent).not.toMatch(/incorrect|wrong/i);
    expect(screen.getByText(strings.fb1)).toBeInTheDocument();
    // the group is not locked, so the learner can pick again
    await userEvent.click(screen.getByLabelText("Lots of examples"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(screen.getByText(strings.explain)).toBeInTheDocument();
  });

  it("offers a hint after the first attempt", async () => {
    renderBlock(check, block, strings);
    await userEvent.click(screen.getByLabelText("A rule someone wrote"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(screen.getByRole("button", { name: /hint/i })).toBeInTheDocument();
  });

  it("offers a detour after two attempts that do not land, when the detour exists", async () => {
    const registry = new Registry([check]);
    const lesson = {
      id: "test-check",
      version: 1,
      meta: { titleKey: "title", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "title" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
      stages: [{ stage: "manipulate" as const, blocks: [{ ...block, componentVersion: "1.0" }] }],
      strings: { en: { title: "Test lesson", ...strings } },
      localeStatus: { en: "draft" as const },
    };
    const detours = { d1: { id: "d1", titleKey: "detourTitle", blocks: [], strings: { en: { detourTitle: strings.detourTitle } } } };
    render(<LessonView lesson={lesson} locale="en" mode="personal" registry={registry} detours={detours} storageKey={`test:${Math.random()}`} />);
    await userEvent.click(screen.getByLabelText("A rule someone wrote"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(screen.queryByRole("button", { name: "Try a short detour on this first" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(screen.getByRole("button", { name: "Try a short detour on this first" })).toBeInTheDocument();
  });

  it("can be undone", async () => {
    renderBlock(check, block, strings);
    await userEvent.click(screen.getByLabelText("Lots of examples"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(screen.getByText(strings.explain)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.queryByText(strings.explain)).not.toBeInTheDocument();
  });

  it("lets the class vote, then shows the answer", async () => {
    renderBlock(check, block, strings, { mode: "classroom" });
    await userEvent.click(screen.getByRole("button", { name: "One more for Lots of examples" }));
    await userEvent.click(screen.getByRole("button", { name: "Show the answer" }));
    expect(screen.getByText(strings.explain)).toBeInTheDocument();
  });

  it("has no accessibility violations in either mode", async () => {
    for (const mode of ["personal", "classroom"] as const) {
      const { container, unmount } = renderBlock(check, block, strings, { mode });
      expect(await a11yViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("validates the config against the JSON Schema contract (via the lesson validator) and reports its string keys", () => {
    const ok = validateLesson(lessonWith(block.config), { contracts: [checkContract] });
    expect(ok.filter((i) => i.check === "config")).toEqual([]);

    const bad = validateLesson(lessonWith({ ...block.config, extra: true }), { contracts: [checkContract] });
    expect(bad.some((i) => i.check === "config")).toBe(true);

    expect([...new Set(checkContract.stringKeys(block.config))].sort()).toEqual(["c1", "c2", "explain", "fb1", "p"].sort());
  });
});
