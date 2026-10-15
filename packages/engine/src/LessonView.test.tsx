import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LessonDoc } from "./LessonView";
import { LessonView } from "./LessonView";
import { Registry } from "./registry";
import type { ComponentPlugin } from "./types";

/** A minimal plugin: one button that records a choice, with a summary for the recall warm-up. */
const pick: ComponentPlugin<{ labelKey: string }, { picked: boolean }> = {
  type: "pick",
  versions: ["1.0"],
  act: "decide",
  configSchema: { type: "object" },
  stringKeys: (c) => [String(c.labelKey)],
  personal: ({ config, setState, t }) => <button type="button" onClick={() => setState({ picked: true })}>{t.text(config.labelKey)}</button>,
  classroom: ({ config, t }) => <p>{t.text(config.labelKey)}</p>,
  messages: { en: {}, hi: {}, te: {} },
  summarize: (s) => (s?.picked ? "You picked the lantern." : null),
};

const lesson: LessonDoc = {
  id: "engine-test",
  version: 1,
  meta: { titleKey: "title", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "title" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
  stages: [{ stage: "manipulate", blocks: [{ id: "b1", type: "pick", componentVersion: "1.0", config: { labelKey: "pick" } }] }],
  checks: {
    pre: [{ id: "pre1", objective: "o1", promptKey: "q", options: ["a", "b"], answer: "a" }],
    post: [{ id: "post1", objective: "o1", promptKey: "q", options: ["a", "b"], answer: "a", feedbackKey: "fb" }],
  },
  strings: { en: { title: "Lanterns", pick: "Pick the lantern", q: "Which one glows?", a: "The lit one", b: "The dark one", fb: "Light comes from the flame." } },
  localeStatus: { en: "draft" },
};

const registry = new Registry([pick]);

describe("LessonView", () => {
  beforeEach(() => localStorage.clear());

  it("offers the post-checks as a chance to try it on something new, never as a test", async () => {
    render(<LessonView lesson={lesson} locale="en" registry={registry} storageKey="t1" />);
    expect(screen.getByRole("heading", { name: "Try it on something new" })).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("The dark one"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(screen.getByText(/Have another think/)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("The lit one"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(screen.getByText("Yes, that's it.")).toBeInTheDocument();
    expect(screen.getByText("Light comes from the flame.")).toBeInTheDocument();
  });

  it("places the post-checks before a final transfer-and-reflect chapter, so the lesson ends on what the learner made", () => {
    const withReflect = { ...lesson, stages: [...lesson.stages, { stage: "transfer-reflect" as const, blocks: [{ id: "b9", type: "pick", componentVersion: "1.0", config: { labelKey: "pick" } }] }] };
    render(<LessonView lesson={withReflect} locale="en" registry={registry} storageKey="t5" />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings.indexOf("Try it on something new")).toBeLessThan(headings.indexOf("Your turn"));
    expect(screen.getByText(/That's the end of this story/)).toBeInTheDocument();
  });

  it("asks a returning learner to remember before showing what they made", async () => {
    const first = render(<LessonView lesson={lesson} locale="en" registry={registry} storageKey="t2" />);
    await userEvent.click(screen.getByRole("button", { name: "Pick the lantern" }));
    first.unmount();
    // A later visit: the store records one visit per key per page load, so simulate with a fresh key copy.
    const saved = JSON.parse(localStorage.getItem("t2")!);
    localStorage.setItem("t3", JSON.stringify({ ...saved, visits: 1 }));
    render(<LessonView lesson={lesson} locale="en" registry={registry} storageKey="t3" />);
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.queryByText("You picked the lantern.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show me what I made" }));
    expect(screen.getByText("You picked the lantern.")).toBeInTheDocument();
  });

  it("keeps depth and starting again inside a Lesson tools panel", async () => {
    render(<LessonView lesson={lesson} locale="en" registry={registry} storageKey="t4" />);
    const tools = screen.getByRole("button", { name: "Lesson tools" });
    expect(tools).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(tools);
    expect(screen.getByRole("group", { name: "Depth" })).toBeVisible();
    expect(screen.getByText(/Turn up the depth/)).toBeVisible();
  });
});

describe("engine messages", () => {
  it("has the same keys in every launch locale", async () => {
    const { engineMessages } = await import("./messages");
    const en = Object.keys(engineMessages.en!).sort();
    for (const loc of ["hi", "te"]) expect(Object.keys(engineMessages[loc]!).sort()).toEqual(en);
  });
});

describe("LessonView pre-checks (off unless the app turns them on)", () => {
  beforeEach(() => localStorage.clear());
  const hi = { ...lesson, strings: { ...lesson.strings, hi: { ...lesson.strings.en }, te: { ...lesson.strings.en } } };

  it("shows nothing by default", () => {
    render(<LessonView lesson={lesson} locale="en" registry={registry} storageKey="p0" />);
    expect(screen.queryByText("Before you start")).not.toBeInTheDocument();
  });

  it("is skipped in classroom mode", () => {
    render(<LessonView lesson={lesson} locale="en" mode="classroom" preChecks registry={registry} storageKey="p1" />);
    expect(screen.queryByText("Before you start")).not.toBeInTheDocument();
  });

  it("gives no right or wrong feedback, emits an anonymous tally, and does not come back", async () => {
    const events: unknown[] = [];
    const view = render(<LessonView lesson={lesson} locale="en" preChecks registry={registry} storageKey="p2" onEvent={(e) => events.push(e)} />);
    expect(screen.getByText(/Just your first guess/)).toBeInTheDocument();
    await userEvent.click(screen.getAllByLabelText("The dark one")[0]!);
    expect(screen.queryByText(/Yes, that's it|another think/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(events).toContainEqual({ type: "pre-check", itemId: "pre1", correct: false });
    expect(screen.queryByText("Before you start")).not.toBeInTheDocument();
    view.unmount();
    render(<LessonView lesson={lesson} locale="en" preChecks registry={registry} storageKey="p2" />);
    expect(screen.queryByText("Before you start")).not.toBeInTheDocument();
  });

  it("skips with one tap and reports nothing", async () => {
    const events: { type: string }[] = [];
    render(<LessonView lesson={lesson} locale="en" preChecks registry={registry} storageKey="p3" onEvent={(e) => events.push(e)} />);
    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(events.some((e) => e.type === "pre-check")).toBe(false);
    expect(screen.queryByText("Before you start")).not.toBeInTheDocument();
  });

  it.each([["en", "Before you start"], ["hi", "शुरू करने से पहले"], ["te", "మొదలుపెట్టే ముందు"]])("is accessible and localised in %s", async (loc, title) => {
    const { container } = render(<LessonView lesson={hi} locale={loc} preChecks registry={registry} storageKey={`p4${loc}`} />);
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    const axe = (await import("axe-core")).default;
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});
