"""Plants known defects in a maker's recorded artifact to calibrate its judge.
Each defect targets one rubric criterion. The judge must score every targeted
criterion lower than on the original (and 2 or below), while untargeted
criteria stay within one point. A judge that cannot see planted defects cannot
be trusted to score real ones.

Run: python3 scripts/agents/degrade.py <agent> <task>
Reads benchmarks/<agent>/runs/<task>.artifact.json and writes
benchmarks/<agent>/calibration/<task>.degraded.json as {artifact, defects}."""
import copy, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]

def curriculum(a):
    a = copy.deepcopy(a)
    gl = a["glossary"] or [{"term": "it", "definition": "the idea"}]
    for i, p in enumerate(a["checks"]["post"]):
        g = gl[i % len(gl)]
        p.update(question=f"Which word did the lesson use for: '{g['definition']}'?", answer=g["term"], transfer=False)
    explain = " ".join(s["draftText"] for s in a["sequence"] if s["stage"] == "explain")
    first = a["sequence"][0]
    first["draftText"] = f"Before you start, here is what you will learn. {explain} {first['draftText']}"
    first["termsIntroduced"] = sorted({t for s in a["sequence"] for t in s["termsIntroduced"]})
    a["prerequisites"] = [p for p in a["prerequisites"] if p["handledBy"] != "detour"]
    return a, [
        {"criterion": "checks-aligned", "description": "Every post-check item replaced by recall of a glossary word; no transfer items."},
        {"criterion": "experience-before-naming", "description": "The whole explanation and every term is told on the first screen, before any act."},
        {"criterion": "prerequisites", "description": "Every detour removed; those prerequisites are now silently assumed."},
    ]

def experience(a):
    a = copy.deepcopy(a)
    for b in a["blocks"]:
        if b["wrongAnswerDesign"]:
            b["wrongAnswerDesign"] = "Show 'Wrong! Try again.' and let the learner retry until correct."
        b["classroomVariant"] = "Project the same screen as personal mode; students watch."
    a["blocks"][0]["text"] = "Obviously you already know junk when you see it. " + a["blocks"][0]["text"]
    a["ending"]["text"] = a["ending"]["text"] + " The AI now knows your style and will remember you next time."
    return a, [
        {"criterion": "wrong-answers", "description": "Every wrong-answer design replaced by 'Wrong! Try again.'"},
        {"criterion": "classroom", "description": "Every classroom variant replaced by 'project the same screen; students watch'."},
        {"criterion": "voice-and-respect", "description": "Added 'Obviously…' to the first block and a claim that the AI knows and remembers the learner to the ending."},
    ]

def analogy(a):
    a = copy.deepcopy(a)
    for x in a["analogies"]:
        x["breakPoint"] = "This comparison works in every way that matters, so learners can rely on it fully."
        targets = [m["target"] for m in x["mappings"]]
        for m, t in zip(x["mappings"], targets[1:] + targets[:1]):
            m["target"] = t
    m0 = a["analogies"][0]["mappings"][0]
    m0["target"] = m0["target"] + " (the filter understands which clues matter, just as the person does)"
    return a, [
        {"criterion": "break-point", "description": "Every break point replaced by a claim that the analogy works in every way."},
        {"criterion": "structural-fit", "description": "Mapping targets rotated, so each source element maps to the wrong part of the concept."},
        {"criterion": "ai-framing", "description": "First mapping now says the filter understands which clues matter."},
    ]

def localisation(a):
    a = copy.deepcopy(a)
    hi = [s for s in a["strings"] if s["locale"] == "hi"]
    by = {s["key"]: s for s in hi}
    # meaning: swap two Hindi strings that have no placeholders, numbers or tags
    plain = [s for s in hi if not any(c in s["text"] for c in "{<0123456789")]
    if len(plain) >= 2:
        plain[0]["text"], plain[1]["text"] = plain[1]["text"], plain[0]["text"]
    # terminology: translate kept-English terms with coined words, inconsistently
    for s in a["strings"]:
        if s["locale"] == "hi":
            s["text"] = s["text"].replace("फ़िल्टर", "छलनी", 1).replace("स्कोर", "प्राप्तांक", 1)
    # honesty: every string claims high confidence, no notes
    for s in a["strings"]:
        s["confidence"], s["note"] = "high", ""
    return a, [
        {"criterion": "meaning", "description": f"Two Hindi strings swapped: {plain[0]['key']} and {plain[1]['key']}." if len(plain) >= 2 else "No swap possible."},
        {"criterion": "terminology", "description": "In Hindi, फ़िल्टर replaced once per string by छलनी and स्कोर by प्राप्तांक, against the glossary and policy."},
        {"criterion": "honesty", "description": "Every string marked high confidence with no notes."},
    ]

def educator(a):
    a = copy.deepcopy(a)
    a["misconceptions"] = [{"studentsSay": m["studentsSay"], "goodResponse": "Yes, that's right: the filter understands what the message means, which is how it knows it is junk."} for m in a["misconceptions"]]
    a["noDeviceAlternative"] = "If there are no devices, read the lesson aloud to the class."
    for t in a["timing"]:
        t["teacherDoes"] = "Run this part of the lesson."
        t["studentsDo"] = "Follow along."
    return a, [
        {"criterion": "misconceptions", "description": "Every response now confirms the misconception that the filter understands messages."},
        {"criterion": "no-device", "description": "No-device path reduced to 'read the lesson aloud'."},
        {"criterion": "runnable", "description": "Every segment's instructions reduced to 'Run this part' / 'Follow along'."},
    ]

def editor(a):
    a = copy.deepcopy(a)
    for r in a["resolutions"]:
        if r["conflictId"] in ("c1", "c8"):
            r.update(decision="side-a", resolution="Go with the learning-experience designer.", reason="The experience matters most here.", options=[])
        if r["conflictId"] == "c10":
            r.update(decision="side-a", resolution="Publish now in all three languages.", reason="Schools need it before term.", options=[])
    a["creatorSummary"]["weaknesses"] = []
    a["creatorSummary"]["forYourDecision"] = [x for x in a["creatorSummary"]["forYourDecision"] if "publish" not in x.lower()]
    return a, [
        {"criterion": "priority", "description": "c1 and c8 now let experience override accuracy and safety."},
        {"criterion": "escalation", "description": "c10: the orchestrator decides to publish itself instead of escalating."},
        {"criterion": "summary", "description": "Weaknesses removed from the creator summary."},
    ]

DEGRADE = {"curriculum-instructional-designer": curriculum, "learning-experience-designer": experience, "analogy-specialist": analogy,
           "localisation-specialist": localisation, "educator-enablement": educator, "editor-in-chief": editor}

if __name__ == "__main__":
    agent, task = sys.argv[1], sys.argv[2]
    d = ROOT / "benchmarks" / agent
    art, defects = DEGRADE[agent](json.loads((d / "runs" / f"{task}.artifact.json").read_text()))
    (d / "calibration").mkdir(exist_ok=True)
    (d / "calibration" / f"{task}.degraded.json").write_text(json.dumps({"defects": defects, "artifact": art}, ensure_ascii=False, indent=2) + "\n")
    print(f"{agent} · {task}: {len(defects)} planted defects")
