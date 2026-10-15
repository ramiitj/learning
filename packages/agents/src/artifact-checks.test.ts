// @vitest-environment node
import { runArtifactChecks, scoreDecisions } from "./artifact-checks";

const checks = (agent: string, artifact: unknown, task: unknown = {}) => runArtifactChecks(agent, artifact, task).filter((f) => f.severity === "blocking").map((f) => f.check);

describe("curriculum checks", () => {
  const step = (id: string, stage: string, extra: Record<string, unknown> = {}) => ({ id, stage, learnerAct: "predict", purpose: "", draftText: "Guess what happens.", termsIntroduced: [], termsUsed: [], depth: "core", misconceptionAddressed: "", ...extra });
  const base = () => ({
    objectives: [{ id: "o1", text: "Explain bias" }],
    prerequisites: [{ concept: "sample", handledBy: "detour", detourOutline: "Pick five sweets from a jar and compare them with the whole jar." }],
    sequence: ["hook", "predict", "manipulate", "explain", "break-it", "transfer-reflect"].map((s, i) => step(`s${i}`, s)),
    glossary: [{ term: "bias", definition: "a lean one way" }],
    checks: { pre: [{ id: "p1", objective: "o1", question: "", answer: "" }], post: [{ id: "q1", objective: "o1", question: "", answer: "", transfer: true }] },
  });

  it("passes a complete sequence", () => expect(checks("curriculum-instructional-designer", base())).toEqual([]));

  it("catches a missing stage, a term used before it is introduced, and an objective without a post-check", () => {
    const a = base();
    a.sequence = a.sequence.filter((s) => s.stage !== "break-it");
    a.sequence[1]!.termsUsed = ["bias"] as never;
    a.objectives.push({ id: "o2", text: "Fix the data" });
    expect(checks("curriculum-instructional-designer", a)).toEqual(expect.arrayContaining(["grammar-order", "terms-defined-before-use", "objectives-checked"]));
  });

  it("catches three passive steps in a row and a banned phrase", () => {
    const a = base();
    for (const s of a.sequence.slice(1, 4)) s.learnerAct = "none";
    a.sequence[0]!.draftText = "Obviously the data matters.";
    expect(checks("curriculum-instructional-designer", a)).toEqual(expect.arrayContaining(["act-density", "banned-phrases"]));
  });
});

describe("localisation checks", () => {
  const task = { strings: { a: "Score {output}: {n, plural, one {# clue} other {# clues}} and 10 points <term-score>score</term-score>." } };
  const ok = "स्कोर {output}: {n, plural, one {# सुराग} other {# सुराग}} और 10 अंक <term-score>स्कोर</term-score>।";
  const art = (hi: string, extra: Record<string, unknown> = {}) => ({
    strings: [
      { key: "a", locale: "hi", text: hi, confidence: "high", note: "", ...extra },
      { key: "a", locale: "te", text: "స్కోరు {output}: {n, plural, one {# ఆధారం} other {# ఆధారాలు}} మరియు 10 పాయింట్లు <term-score>స్కోరు</term-score>.", confidence: "high", note: "" },
    ],
  });

  it("passes a faithful translation", () => expect(checks("localisation-specialist", art(ok), task)).toEqual([]));
  it("catches a renamed placeholder", () => expect(checks("localisation-specialist", art(ok.replace("{output}", "{score}")), task)).toContain("placeholders-kept"));
  it("catches a changed number", () => expect(checks("localisation-specialist", art(ok.replace("10", "12")), task)).toContain("numbers-kept"));
  it("catches a dropped term tag", () => expect(checks("localisation-specialist", art(ok.replace(/<\/?term-score>/g, "")), task)).toContain("term-tags-kept"));
  it("catches the wrong script", () => expect(checks("localisation-specialist", art("Score {output}: and 10 points <term-score>score</term-score>"), task)).toEqual(expect.arrayContaining(["script-correct"])));
  it("catches low confidence without a note", () => expect(checks("localisation-specialist", art(ok, { confidence: "low" }), task)).toContain("uncertainty-noted"));
  it("catches a missing locale", () => expect(checks("localisation-specialist", { strings: art(ok).strings.slice(0, 1) }, task)).toContain("all-strings-translated"));
});

describe("other makers", () => {
  it("analogy: catches one analogy, a perfect break point and a culture-specific source", () => {
    const a = { analogies: [{ id: "a1", source: "A cricket team chasing runs", mappings: [{ source: "run", target: "point", relation: "adds up" }], breakPoint: "It works perfectly in every way for this idea, always." }] };
    expect(checks("analogy-specialist", a)).toEqual(expect.arrayContaining(["two-analogies", "mappings-complete", "break-points-honest", "universal-sources"]));
  });

  it("educator: catches an overlong period and a missing no-device path", () => {
    const a = { timing: [{ minutes: 30 }, { minutes: 15 }], noDeviceAlternative: "", misconceptions: [] };
    expect(checks("educator-enablement", a)).toEqual(expect.arrayContaining(["timing-fits", "no-device-path", "misconceptions-covered"]));
  });

  it("experience: catches a hook with no question, a missing classroom variant and an Article 14 pattern", () => {
    const block = (id: string, stage: string, extra = {}) => ({ id, stage, component: "predict", learnerAct: "predict", text: "Guess.", configSummary: "", wrongAnswerDesign: "", classroomVariant: "Class votes by show of hands.", removalTest: "", ...extra });
    const a = { hook: { text: "Junk filters are everywhere." }, blocks: [block("b1", "hook", { classroomVariant: "" }), block("b2", "transfer-reflect", { text: "Keep your streak going!" })], ending: { keepable: "Their own card", text: "" } };
    expect(checks("learning-experience-designer", a)).toEqual(expect.arrayContaining(["hook-is-question", "classroom-variants", "refused-patterns"]));
  });

  it("editor: scores decisions, crediting accepted alternatives", () => {
    const art = { resolutions: [{ conflictId: "c1", decision: "both" }, { conflictId: "c2", decision: "side-a" }] };
    const d = scoreDecisions(art, [
      { conflictId: "c1", decision: "side-b", alsoAccept: ["both"], why: "" },
      { conflictId: "c2", decision: "escalate", why: "" },
    ]);
    expect(d.accuracy).toBe(0.5);
    expect(d.escalationRecall).toBe(0);
  });
});
