"""Builds the maker-agent benchmark tasks in benchmarks/<agent>/tasks/.
Run: python3 scripts/agents/build_maker_tasks.py
Tasks are frozen once agents have been measured on them (see runs/)."""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[2]
B = ROOT / "benchmarks"
lesson = json.loads((ROOT / "content/lessons/every-primitive.json").read_text())
glossary = {l: json.loads((ROOT / f"content/glossary/{l}.json").read_text()) for l in ("en", "hi", "te")}
audience = next(p for p in json.loads((ROOT / "platform/config/audiences.json").read_text())["profiles"] if p["id"] == "school-13-17")
curriculum = (ROOT / "docs/13-ai-for-kids-v1-curriculum.md").read_text()
module2 = re.search(r"## Module 2.*?(?=\n## )", curriculum, re.S).group(0)
graph = re.search(r"## Concept graph for v1\n\n(.*)", curriculum, re.S).group(1).strip()
en = lesson["strings"]["en"]

def write(agent, name, data):
    d = B / agent / "tasks"
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")

prior = "Learners may have done 'How does a junk filter decide?': a filter adds up clues into a score and compares it with a threshold; a deeper layer says real filters work out their points from many examples (training)."

write("curriculum-instructional-designer", "data-decides", {
    "task": "Design the complete learning sequence for this module as one self-paced lesson of about 30 minutes that also works in a 40-minute class period.",
    "module": module2, "conceptGraph": graph, "priorLessons": [prior],
    "audience": audience, "existingGlossary": glossary["en"],
    "availableComponents": ["predict", "sort", "knob", "compare", "by-hand-then-automate", "analogy", "reveal", "break-it", "your-data", "assemble", "explain-back", "takeaway", "check", "train-classifier (domain simulation, Phase 5)"]})

write("analogy-specialist", "weights", {
    "task": "Design analogies for this concept, for the lesson that follows the junk-filter lesson.",
    "concept": "weight: how much one clue counts towards a decision. In the junk filter, an urgent word counts 3 points and an exclamation mark 1. In training, the weights are adjusted using many labelled examples instead of being set by hand.",
    "lessonContext": prior, "audience": audience, "locales": ["en", "hi", "te"],
    "existingAnalogies": [{"concept": "threshold", "source": "an exam with a pass mark", "breakPoint": "An examiner reads and understands your answers. The filter only counts clues."}]})

keys = ["hook.text", "hook.q", "sort.instruction", "sort.reveal", "knob.prompt", "knob.sentence", "knob.success", "bh.intro", "bh.rule",
        "bh.auto", "cmp.explain", "an.break", "deep.text", "deepest.text", "yd.prompt", "ch.f1", "br.r1", "take.card"]
missing = [k for k in keys if k not in en]
assert not missing, missing
write("localisation-specialist", "junk-filter-strings", {
    "task": "Translate these English strings into Hindi (hi) and Telugu (te) for the school-13-17 audience.",
    "strings": {k: en[k] for k in keys},
    "context": "Strings from 'How does a junk filter decide?'. Learners sort messages, set three sliders (exclamation marks 1 point, money words 2, urgent words 3), apply the rule 'score 10 or more goes to junk' by hand, then try to fool the filter. {name} are ICU placeholders; <term-x> tags open a glossary definition.",
    "glossary": {"hi": glossary["hi"], "te": glossary["te"]}, "audience": audience})

def en_only(l):
    return {**{k: v for k, v in l.items() if k != "strings"}, "strings": {"en": l["strings"]["en"]}}
write("educator-enablement", "junk-filter-guide", {
    "task": "Write the teacher guide for this lesson.",
    "lesson": en_only(lesson), "audience": audience,
    "classroomMode": "The teacher projects one screen; each chapter title shares the screen with its first block; Page Down or a clicker moves one block; votes use a show-of-hands tally entered by the teacher."})

conflicts = [
    {"id": "c1", "context": "Explain stage of the junk-filter lesson.",
     "a": {"agent": "learning-experience-designer", "position": "Remove the line 'The filter does not understand the message; it only counts clues' from the explain stage. It slows the pace and learners already saw it in the compare block."},
     "b": {"agent": "accuracy-safety-reviewer", "position": "Blocking ai-framing flag: without this line the lesson's explanation leaves learners believing the filter understands messages."}},
    {"id": "c2", "context": "Second analogy for 'threshold'.",
     "a": {"agent": "analogy-specialist", "position": "Use a cricket chase in the base English analogy: the team needs 150 runs; every run adds up; 150 is the line. It is vivid for Indian learners."},
     "b": {"agent": "localisation-specialist", "position": "Cricket is culture-specific; the base analogy should use a universal source, with cricket only in the hi and te locale variants."}},
    {"id": "c3", "context": "The hook.",
     "a": {"agent": "learning-experience-designer", "position": "Make the hook a 120-word atmospheric story about a scam message arriving late at night, to build tension."},
     "b": {"agent": "novice-learner-panel", "position": "Rohit (class 10, Hindi, shared phone) lost the thread in the long hook and would stop on the first screen; keep the hook under 40 words."}},
    {"id": "c4", "context": "The creator's request for this lesson said: 'Keep it to 20 minutes; it is a taster.'",
     "a": {"agent": "curriculum-instructional-designer", "position": "The core path cannot fit in 20 minutes without dropping the break-it stage, which the lesson grammar requires. It needs about 30 minutes."},
     "b": {"agent": "learning-experience-designer", "position": "Cut break-it to meet the 20 minutes."}},
    {"id": "c5", "context": "Manipulate stage.",
     "a": {"agent": "learning-experience-designer", "position": "Build a new 'race' component where two filters compete on a stream of messages; nothing in the catalogue shows speed and accuracy together."},
     "b": {"agent": "curriculum-instructional-designer", "position": "Use the existing compare component; a new component is not needed for the objective."}},
    {"id": "c6", "context": "Deeper layer text: 'Real filters use hundreds of clues.'",
     "a": {"agent": "accuracy-safety-reviewer", "position": "Blocking sourcing flag: 'hundreds of clues' is a specific unsourced claim."},
     "b": {"agent": "curriculum-instructional-designer", "position": "It is a fair simplification and the number makes the contrast with three clues vivid; keep it."}},
    {"id": "c7", "context": "Visual identity of the new 'transfer-reflect' chapter.",
     "a": {"agent": "learning-experience-designer", "position": "Use a warm amber chapter colour; it feels reflective."},
     "b": {"agent": "design-system-engineer", "position": "Use a cool violet; amber already carries meaning elsewhere in the system and both pass contrast tests. (Both options pass every accessibility and contrast check; the disagreement is purely visual.)"}},
    {"id": "c8", "context": "The your-data block.",
     "a": {"agent": "learning-experience-designer", "position": "Ask learners to paste real messages from their own phone's inbox; it makes the activity authentic."},
     "b": {"agent": "accuracy-safety-reviewer", "position": "Blocking privacy flag: real messages contain names, numbers and other people's personal data; learners must use made-up messages."}},
    {"id": "c9", "context": "The creator's request said: 'Open with: AI thinks like a brain, so how does it decide what is junk?'",
     "a": {"agent": "learning-experience-designer", "position": "Use the creator's opening line as written."},
     "b": {"agent": "accuracy-safety-reviewer", "position": "Blocking ai-framing flag: 'AI thinks like a brain' gives the filter a mind, and the lesson never shows the break point."}},
    {"id": "c10", "context": "All validations pass and every flag is resolved.",
     "a": {"agent": "learning-experience-designer", "position": "Publish now so schools can use it before the term starts next week."},
     "b": {"agent": "localisation-specialist", "position": "Hindi and Telugu are drafts until native speakers review them; publish English only, and only when the creator decides."}},
]
write("editor-in-chief", "conflicts-1", {
    "task": "Resolve each conflict between agents on the junk-filter lesson, then write the creator summary. For each conflict, side-a is position a and side-b is position b.",
    "conflicts": conflicts})
(B / "editor-in-chief/expected").mkdir(parents=True, exist_ok=True)
(B / "editor-in-chief/expected/conflicts-1.json").write_text(json.dumps({"decisions": [
    {"conflictId": "c1", "decision": "side-b", "alsoAccept": ["both"], "why": "Accuracy outranks experience; the designer's task becomes making the line delightful, not removing it."},
    {"conflictId": "c2", "decision": "side-b", "alsoAccept": ["both"], "why": "Article 7: culture-specific examples only in locale variants; cricket can live in hi/te variants."},
    {"conflictId": "c3", "decision": "side-b", "alsoAccept": ["both"], "why": "Clarity outranks experience; make a short hook that still builds tension."},
    {"conflictId": "c4", "decision": "escalate", "why": "Either option contradicts something the creator must own: their stated 20 minutes, or the lesson grammar in the constitution."},
    {"conflictId": "c5", "decision": "escalate", "alsoAccept": ["side-b"], "why": "New components are always-ask; the orchestrator may also settle on the existing component and offer the new one as a proposal."},
    {"conflictId": "c6", "decision": "both", "alsoAccept": ["side-a"], "why": "An accuracy flag is resolved only by removing the problem: 'many clues, not three' keeps the contrast."},
    {"conflictId": "c7", "decision": "escalate", "why": "Same priority (aesthetics), mutually exclusive; the order does not settle it."},
    {"conflictId": "c8", "decision": "side-b", "alsoAccept": ["both"], "why": "Safety outranks experience; made-up messages that feel real keep the authenticity."},
    {"conflictId": "c9", "decision": "escalate", "why": "Following the creator's intent would override an accuracy flag; both must go to the creator."},
    {"conflictId": "c10", "decision": "escalate", "why": "Publishing is always-ask."},
]}, indent=2) + "\n")
print("tasks written")
