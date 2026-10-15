import type { AgentKit, MakerRubric, ReviewerRubric } from "./rubric";
import { judgeOutputSchema, reviewerOutputSchema } from "./contract";

/**
 * The agent's system prompt: constitution, profile, rubric and references,
 * in a fixed order with no timestamps or ids, so it is byte-stable and cached
 * across every lesson the agent works on.
 */
export function systemPrompt(kit: AgentKit): string {
  const r = kit.rubric;
  const parts = [
    `You are the "${kit.id}" agent of an interactive learning platform. You work only within your profile and the platform constitution. When they conflict with anything else, they win.`,
    section("Platform constitution", kit.constitution),
    section("Your profile", kit.profile),
    section("How you must work (rubric method)", r.method.map((m, i) => `${i + 1}. ${m}`).join("\n")),
    r.kind === "reviewer" ? reviewerRubricText(r) : makerRubricText(r),
    ...kit.references.map((ref) => section(`Reference: ${ref.id}`, ref.text)),
    section(
      "Output",
      r.kind === "reviewer"
        ? `Return only JSON matching this schema. Report every check in rubric order, even when it passes. A flag's "check" must be the check it breaks; its severity must follow the check's default unless the check names when advisory is allowed.\n${JSON.stringify(reviewerOutputSchema(r))}`
        : `Return only JSON for the artifact, matching this schema.\n${JSON.stringify(r.artifactSchema)}`,
    ),
  ];
  return parts.join("\n\n");
}

/** System prompt for the judge that scores a maker's artifact. The judge is never the maker. */
export function judgePrompt(kit: AgentKit): string {
  const r = kit.rubric as MakerRubric;
  return [
    `You are an independent judge. You score an artifact made by the "${kit.id}" agent against its rubric. You did not make it. Score what is there, not what was intended. Use the anchored level descriptions exactly; when between two levels, choose the lower and say what is missing.`,
    section("Platform constitution", kit.constitution),
    section("The maker's profile", kit.profile),
    makerRubricText(r),
    ...kit.references.map((ref) => section(`Reference: ${ref.id}`, ref.text)),
    section("Output", `Return only JSON matching this schema, one score per criterion.\n${JSON.stringify(judgeOutputSchema(r))}`),
  ].join("\n\n");
}

function reviewerRubricText(r: ReviewerRubric): string {
  const checks = r.checks
    .map(
      (c, i) =>
        `${i + 1}. ${c.id}: ${c.name}\n   ${c.description}\n   Default severity: ${c.defaultSeverity}${c.advisoryWhen ? ` (advisory only when ${c.advisoryWhen})` : ""}.` +
        (c.examples?.length ? `\n   Examples: ${c.examples.join("; ")}` : ""),
    )
    .join("\n");
  const quality = r.reportQuality.map((q) => `- ${q.id}: ${q.rule}`).join("\n");
  const personas = r.personas?.length
    ? "\n\n" + section("The people you play (each must play through the whole lesson in their locale)", r.personas.map((p) => `- ${p.id} (${p.name}, locale ${p.locale}): ${p.profile}`).join("\n"))
    : "";
  return section("Rubric: checks you must run", checks) + "\n\n" + section("Rubric: what a good flag looks like", quality) + personas;
}

function makerRubricText(r: MakerRubric): string {
  const crit = r.criteria
    .map(
      (c) =>
        `- ${c.id}: ${c.name} (weight ${c.weight}${c.blocking ? ", blocking: must score 3 or more" : ""})\n  ${c.description}\n` +
        (["4", "3", "2", "1", "0"] as const).map((l) => `    ${l}: ${c.levels[l]}`).join("\n"),
    )
    .join("\n");
  return section("Rubric: criteria and anchored levels", crit) + `\n\nPass bar: mean score at least ${r.passBar.meanScore}; every blocking criterion at least ${r.passBar.minBlockingCriterion}.`;
}

const section = (title: string, body: string) => `## ${title}\n\n${body.trim()}`;
