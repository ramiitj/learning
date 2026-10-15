"""Builds content/lessons/m5-inside-a-neural-network.json and content/detours/weights.json.

Module 5 of AI for Kids v1 (docs/13): Inside a neural network. Draft by the
agent pipeline; hi and te are unreviewed drafts that need a native-speaker
review. Strings live in m5_inside_a_neural_network_strings.py.

The layer-builder numbers quoted in the text (about 0.50/0.36 for 1 neuron,
0.00/0.35 for 3 layers of 16, 0.05 with 60 points, 0.01 without noise) come
from packages/sim-ai/src/layer-builder/model.ts with the dataset below and the
component's 2,000 training steps; re-check them if the model or dataset changes.

Usage: python3 scripts/content/build_m5_inside_a_neural_network.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from m5_inside_a_neural_network_strings import D, S  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
LESSON_ID = "m5-inside-a-neural-network"
LOCALES = ("en", "hi", "te")

# A step-shaped hidden pattern with noise: 1 neuron underfits, 1 layer of 2-4 neurons fits well,
# 3 layers of 16 overfits (training error 0.00, new-point error 0.35).
DATASET = {"type": "steps", "points": 15, "noise": 0.3, "seed": 7}


def block(id_, type_, config, **extra):
    return {"id": id_, "type": type_, "componentVersion": "1.0", "config": config, **extra}


def mappings(prefix, n):
    return [{"sourceKey": f"{prefix}.m{i}s", "targetKey": f"{prefix}.m{i}t"} for i in range(1, n + 1)]


neuron_model = {
    "type": "linear",
    "bias": 0,
    "inputs": [
        {"id": "ears", "labelKey": "nr.ears", "kind": "toggle", "min": 0, "max": 1, "step": 1, "initial": 0, "weight": 2},
        {"id": "whiskers", "labelKey": "nr.whiskers", "kind": "toggle", "min": 0, "max": 1, "step": 1, "initial": 0, "weight": 3},
        {"id": "barks", "labelKey": "nr.barks", "kind": "toggle", "min": 0, "max": 1, "step": 1, "initial": 1, "weight": -4},
    ],
    "output": {"labelKey": "nr.output", "min": -4, "max": 5},
}

stages = [
    {"stage": "hook", "blocks": [block("b1", "reveal", {"textKey": "hook.text", "questionKey": "hook.q"})]},
    {
        "stage": "predict",
        "blocks": [
            block(
                "b2",
                "predict",
                {
                    "promptKey": "predict.prompt",
                    "choices": ["predict.c1", "predict.c2", "predict.c3"],
                    "answer": "predict.c2",
                    "confidence": True,
                    "revealKey": "predict.reveal",
                    "choiceFeedback": {"predict.c1": "predict.f1", "predict.c3": "predict.f3"},
                },
                classroom={"mode": "class-vote"},
            )
        ],
    },
    {
        "stage": "manipulate",
        "blocks": [
            block(
                "b3",
                "knob",
                {
                    "promptKey": "nr.prompt",
                    "model": neuron_model,
                    "goal": {"target": 5, "tolerance": 0, "goalKey": "nr.goal", "successKey": "nr.success"},
                },
                glossaryTerms=["neural-network", "neuron", "weight", "clue"],
                detours=["weights"],
            ),
            block(
                "b4",
                "hillside",
                {
                    "promptKey": "hs.prompt",
                    "landscape": {"type": "bowl", "min": 0, "max": 6},
                    "start": 0.5,
                    "stepMin": 0.25,
                    "stepMax": 1.5,
                    "maxSteps": 10,
                    "leftKey": "hs.left",
                    "rightKey": "hs.right",
                    "goalKey": "hs.goal",
                    "fadeKey": "hs.fade",
                    "breaksKey": "hs.breaks",
                },
                glossaryTerms=["training", "error", "loss-curve"],
                detours=["weights"],
            ),
            block(
                "b5",
                "analogy",
                {
                    "concept": "layer",
                    "titleKey": "rl.title",
                    "sourceKey": "rl.source",
                    "mappings": mappings("rl", 4),
                    "breakPointKey": "rl.break",
                    "fading": ["rl.f1", "rl.f2", "rl.f3"],
                },
                classroom={"mode": "teacher-led"},
                glossaryTerms=["layer", "pixel"],
            ),
            block(
                "b6",
                "layer-builder",
                {
                    "promptKey": "lb.prompt",
                    "dataset": DATASET,
                    "maxLayers": 3,
                    "maxWidth": 16,
                    "explainKey": "lb.explain",
                    "smallKey": "lb.small",
                    "bigKey": "lb.big",
                    "glossary": ["layer", "neuron", "error", "noise", "underfitting", "overfitting", "generalisation"],
                },
                classroom={"promptKey": "lb.classPrompt"},
                glossaryTerms=["noise", "underfitting", "overfitting", "generalisation"],
            ),
        ],
    },
    {
        "stage": "explain",
        "blocks": [
            block(
                "b7",
                "analogy",
                {
                    "concept": "overfitting",
                    "titleKey": "ex.title",
                    "sourceKey": "ex.source",
                    "mappings": mappings("ex", 5),
                    "breakPointKey": "ex.break",
                    "fading": ["ex.f1", "ex.f2", "ex.f3"],
                },
                classroom={"mode": "teacher-led"},
            ),
            block(
                "b8",
                "analogy",
                {
                    "concept": "overfitting",
                    "titleKey": "sv.title",
                    "sourceKey": "sv.source",
                    "mappings": mappings("sv", 5),
                    "breakPointKey": "sv.break",
                    "fading": ["sv.f1", "sv.f2", "sv.f3"],
                },
                classroom={"mode": "teacher-led"},
            ),
            block(
                "b9",
                "analogy",
                {
                    "concept": "layer",
                    "titleKey": "bd.title",
                    "sourceKey": "bd.source",
                    "mappings": mappings("bd", 4),
                    "breakPointKey": "bd.break",
                },
                depth="deeper",
                classroom={"mode": "teacher-led"},
            ),
            block("b10", "reveal", {"textKey": "dp.text", "steps": ["dp.s1", "dp.s2"]}, depth="deeper"),
            block(
                "b11",
                "check",
                {
                    "promptKey": "ch.prompt",
                    "options": ["ch.o1", "ch.o2", "ch.o3"],
                    "answer": "ch.o2",
                    "feedback": {"ch.o1": "ch.f1", "ch.o3": "ch.f3"},
                    "hints": ["ch.h1", "ch.h2"],
                    "explainKey": "ch.explain",
                },
                classroom={"mode": "class-vote"},
            ),
        ],
    },
    {
        "stage": "break-it",
        "blocks": [
            block(
                "b12",
                "break-it",
                {
                    "challengeKey": "br.challenge",
                    "target": "b6",
                    "attempts": [
                        {"id": "t1", "labelKey": "br.t1", "resultKey": "br.r1", "breaks": True},
                        {"id": "t2", "labelKey": "br.t2", "resultKey": "br.r2", "breaks": True},
                        {"id": "t3", "labelKey": "br.t3", "resultKey": "br.r3", "breaks": False},
                        {"id": "t4", "labelKey": "br.t4", "resultKey": "br.r4", "breaks": False},
                        {"id": "t5", "labelKey": "br.t5", "resultKey": "br.r5", "breaks": True},
                    ],
                    "reflectKey": "br.reflect",
                },
                classroom={"mode": "class-suggests"},
            )
        ],
    },
    {
        "stage": "transfer-reflect",
        "blocks": [
            block(
                "b13",
                "explain-back",
                {
                    "mode": "choose",
                    "promptKey": "tf.prompt",
                    "options": [
                        {"id": "o1", "textKey": "tf.o1", "feedbackKey": "tf.f1", "best": True},
                        {"id": "o2", "textKey": "tf.o2", "feedbackKey": "tf.f2"},
                        {"id": "o3", "textKey": "tf.o3", "feedbackKey": "tf.f3"},
                    ],
                },
            ),
            block("b14", "explain-back", {"mode": "own-words", "promptKey": "ow.prompt", "modelAnswerKey": "ow.model"}),
            block(
                "b15",
                "takeaway",
                {"titleKey": "take.title", "cardKey": "take.card", "includes": ["b6", "b4", "b14"], "labelKeys": ["take.l1", "take.l2", "take.l3"]},
                classroom={"mode": "class-card"},
            ),
        ],
    },
]


def check(id_, objective, n_options, answer, feedback=True):
    item = {"id": id_, "objective": objective, "promptKey": f"{id_}.q", "options": [f"{id_}.{c}" for c in "abc"[:n_options]], "answer": f"{id_}.{answer}"}
    if feedback:
        item["feedbackKey"] = f"{id_}.fb"
    return item


lesson = {
    "id": LESSON_ID,
    "schemaVersion": "1.0",
    "version": 1,
    "status": "draft",
    "meta": {
        "titleKey": "title",
        "subtitleKey": "subtitle",
        "subject": "ai",
        "course": "ai-for-kids",
        "module": "m5",
        "concepts": ["weight", "layer", "overfitting", "generalisation"],
        "objectives": [{"id": f"o{i}", "textKey": f"obj.o{i}"} for i in (1, 2, 3)],
        "prerequisites": ["learning-from-examples", "pixel", "error", "training"],
        "audiences": ["school-13-17"],
        "curriculumTags": [],
        "estimatedMinutes": 40,
        "teacherGuide": LESSON_ID,
        "provenance": "Agent pipeline v1 draft (Module 5, docs/13); hi and te are unreviewed machine-assisted drafts; not yet creator-reviewed",
    },
    "stages": stages,
    "checks": {
        "pre": [check("pre1", "o1", 3, "b", False), check("pre2", "o2", 3, "b", False), check("pre3", "o3", 3, "b", False)],
        "post": [
            check("post1", "o1", 3, "b"),
            check("post2", "o1", 3, "b"),
            check("post3", "o2", 3, "b"),
            check("post4", "o2", 3, "a"),
            check("post5", "o3", 3, "b"),
        ],
    },
    "strings": {loc: {k: v[i] for k, v in S.items()} for i, loc in enumerate(LOCALES)},
    "localeStatus": {"en": "draft", "hi": "draft", "te": "draft"},
}

detour = {
    "id": "weights",
    "titleKey": "d.title",
    "blocks": [
        block("d1", "reveal", {"textKey": "d.text", "steps": ["d.s1", "d.s2", "d.s3"]}),
        block(
            "d2",
            "knob",
            {
                "promptKey": "d.kprompt",
                "model": {
                    "type": "linear",
                    "bias": 0,
                    "inputs": [
                        {"id": "ayesha", "labelKey": "d.ayesha", "kind": "toggle", "min": 0, "max": 1, "step": 1, "initial": 0, "weight": 3},
                        {"id": "ravi", "labelKey": "d.ravi", "kind": "toggle", "min": 0, "max": 1, "step": 1, "initial": 0, "weight": 1},
                        {"id": "lalitha", "labelKey": "d.lalitha", "kind": "toggle", "min": 0, "max": 1, "step": 1, "initial": 0, "weight": 2},
                    ],
                    "output": {"labelKey": "d.out", "min": 0, "max": 6},
                },
                "outputTemplateKey": "d.sentence",
                "decision": {"threshold": 4, "aboveKey": "d.go", "belowKey": "d.skip"},
                "goal": {"target": 4, "tolerance": 0, "goalKey": "d.goal", "successKey": "d.success"},
            },
        ),
        block(
            "d3",
            "check",
            {
                "promptKey": "d.q",
                "options": ["d.o1", "d.o2", "d.o3"],
                "answer": "d.o1",
                "feedback": {"d.o2": "d.f2", "d.o3": "d.f3"},
                "explainKey": "d.explain",
            },
        ),
    ],
    "strings": {loc: {k: v[i] for k, v in D.items()} for i, loc in enumerate(LOCALES)},
}

for name, doc in ((f"content/lessons/{LESSON_ID}.json", lesson), ("content/detours/weights.json", detour)):
    out = ROOT / name
    out.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"wrote {name}")
print(f"{sum(len(s['blocks']) for s in stages)} blocks, {len(S)} lesson strings and {len(D)} detour strings x {len(LOCALES)} locales")
