import { render } from "@testing-library/react";
import axe from "axe-core";
import { LessonView, Registry, type AnyPlugin, type Mode } from "@lm/engine";
import type { Block } from "@lm/schema";

/** Render one block inside a real lesson, the way learners meet it. */
export function renderBlock(plugin: AnyPlugin, block: Omit<Block, "componentVersion"> & { componentVersion?: string }, strings: Record<string, string>, opts: { mode?: Mode; locale?: string; extraPlugins?: AnyPlugin[]; before?: Block[] } = {}) {
  localStorage.clear();
  const registry = new Registry([plugin, ...(opts.extraPlugins ?? [])]);
  const full: Block = { componentVersion: plugin.versions[0]!, ...block };
  const lesson = {
    id: `test-${plugin.type}`,
    version: 1,
    meta: { titleKey: "title", subject: "test", concepts: ["c"], objectives: [{ id: "o1", textKey: "title" }], prerequisites: [], audiences: ["school-13-17"], estimatedMinutes: 5 },
    stages: [{ stage: "manipulate" as const, blocks: [...(opts.before ?? []), full] }],
    strings: { en: { title: "Test lesson", ...strings } },
    localeStatus: { en: "draft" as const },
  };
  return render(<LessonView lesson={lesson} locale={opts.locale ?? "en"} mode={opts.mode ?? "personal"} registry={registry} storageKey={`test:${Math.random()}`} />);
}

/** Run axe on a rendered container. Colour contrast is checked separately against the tokens. */
export async function a11yViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
}
