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

  it("ends with the post-checks, framed as seeing how far you've come", async () => {
    render(<LessonView lesson={lesson} locale="en" registry={registry} storageKey="t1" />);
    expect(screen.getByRole("heading", { name: "See how far you've come" })).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("The dark one"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(screen.getByText(/Have another think/)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("The lit one"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(screen.getByText("Yes, that's it.")).toBeInTheDocument();
    expect(screen.getByText("Light comes from the flame.")).toBeInTheDocument();
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
