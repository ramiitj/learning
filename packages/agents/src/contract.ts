import type { MakerRubric, ReviewerRubric } from "./rubric";

/**
 * The output contract a reviewer must return. Derived from its rubric, so the
 * checks it must report and the categories it may flag are exactly the
 * rubric's: an agent cannot skip a check or invent a category.
 */
export function reviewerOutputSchema(r: ReviewerRubric) {
  const checkIds = r.checks.map((c) => c.id);
  const personas = r.personas?.map((p) => p.id);
  const flagProps: Record<string, unknown> = {
    id: { type: "string" },
    check: { type: "string", enum: r.flagCategories },
    severity: { type: "string", enum: ["blocking", "advisory"] },
    locale: { type: "string", enum: ["en", "hi", "te", "all"] },
    stringKey: { type: "string", description: "Lesson string key, glossary entry as 'glossary:<term>', or config path such as 'b4.config.model.inputs[1].weight'." },
    blockId: { type: "string", description: "Block id, or '' for lesson-level items such as checks and glossary." },
    quote: { type: "string", description: "The exact offending text or value." },
    problem: { type: "string" },
    why: { type: "string", description: "Which check and standard it breaks, and the harm." },
    fix: { type: "string", description: "A concrete fix the maker can apply." },
  };
  const flagRequired = ["id", "check", "severity", "locale", "stringKey", "blockId", "quote", "problem", "why", "fix"];
  if (personas) {
    flagProps.persona = { type: "string", enum: personas };
    flagRequired.push("persona");
  }
  const extra = personas
    ? {
        personaVerdicts: {
          type: "array",
          description: "One per persona: would they keep going to the end?",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["persona", "wouldContinue", "reason"],
            properties: { persona: { type: "string", enum: personas }, wouldContinue: { type: "string", enum: ["yes", "maybe", "no"] }, reason: { type: "string" } },
          },
        },
      }
    : {};
  return {
    type: "object",
    additionalProperties: false,
    required: ["agent", "checks", "flags", "summary", ...(personas ? ["personaVerdicts"] : [])],
    properties: {
      ...extra,
      agent: { type: "string", enum: [r.agent] },
      checks: {
        type: "array",
        description: "One entry per rubric check, in rubric order. Every check must be reported.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["check", "status", "note"],
          properties: {
            check: { type: "string", enum: checkIds },
            status: { type: "string", enum: ["pass", "flagged", "not-applicable"] },
            note: { type: "string", description: "What was examined for this check (one or two sentences)." },
          },
        },
      },
      flags: {
        type: "array",
        items: { type: "object", additionalProperties: false, required: flagRequired, properties: flagProps },
      },
      summary: {
        type: "object",
        additionalProperties: false,
        required: ["blocking", "advisory", "verdict"],
        properties: {
          blocking: { type: "integer" },
          advisory: { type: "integer" },
          verdict: { type: "string", enum: ["ready-for-creator", "needs-revision"] },
        },
      },
    },
  } as const;
}

/** Judge output for a maker artifact: one anchored score per criterion, with evidence. */
export function judgeOutputSchema(r: MakerRubric) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["agent", "scores", "overall"],
    properties: {
      agent: { type: "string", enum: [r.agent] },
      scores: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["criterion", "score", "evidence", "improve"],
          properties: {
            criterion: { type: "string", enum: r.criteria.map((c) => c.id) },
            score: { type: "integer", minimum: 0, maximum: 4 },
            evidence: { type: "string", description: "Quote or point to the part of the artifact that justifies the score." },
            improve: { type: "string", description: "What would raise the score by one level." },
          },
        },
      },
      overall: { type: "string" },
    },
  } as const;
}
