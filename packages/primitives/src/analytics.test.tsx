import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LessonView, Registry, type LessonEvent } from "@lm/engine";
import { predict } from "./predict";
import { check } from "./check";

const lesson = {
  id: "analytics-test",
  version: 1,
  meta: { titleKey: "title", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "title" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
  stages: [
    {
      stage: "predict" as const,
      blocks: [{ id: "b1", type: "predict", componentVersion: "1.0", config: { promptKey: "p", choices: ["c1", "c2"], answer: "c2", revealKey: "r" } }],
    },
  ],
  checks: { pre: [], post: [{ id: "q1", objective: "o1", promptKey: "q", options: ["a", "b"], answer: "b" }] },
  strings: { en: { title: "T", p: "Which?", c1: "One", c2: "Two", r: "Reveal", q: "Post?", a: "A", b: "B" } },
  localeStatus: { en: "draft" as const },
};

describe("learning moments for anonymous analytics", () => {
  it("reports a start, the first act, the first committed answer and post-checks, with no identifiers", async () => {
    localStorage.clear();
    const events: LessonEvent[] = [];
    render(<LessonView lesson={lesson as never} locale="en" registry={new Registry([predict, check])} storageKey={`t:${Math.random()}`} onEvent={(e) => events.push(e)} />);
    await userEvent.click(screen.getByLabelText("One"));
    await userEvent.click(screen.getByRole("button", { name: "Lock in my guess" }));
    await userEvent.click(screen.getByLabelText("A"));
    await userEvent.click(screen.getByRole("button", { name: "Check my thinking" }));
    expect(events[0]).toEqual({ type: "start", returning: false });
    expect(events).toContainEqual({ type: "act", blockId: "b1", component: "predict" });
    expect(events).toContainEqual({ type: "answer", blockId: "b1", component: "predict", choice: "c1", correct: false });
    expect(events.filter((e) => e.type === "answer")).toHaveLength(1);
    expect(events).toContainEqual({ type: "post-check", itemId: "q1", correct: false, firstTry: true });
    // Nothing identifying travels with an event.
    expect(JSON.stringify(events)).not.toMatch(/lm:|storage|visit|time|date/i);
  });
});
