"""Builds content/lessons/every-primitive.json, the Phase 1 test lesson that
uses every universal primitive. Run: python3 scripts/content/build_every_primitive.py
Strings live in every_primitive_strings.py so the three locales stay aligned."""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from every_primitive_strings import S

ROOT = pathlib.Path(__file__).resolve().parents[2]

def block(id, type, config, **extra):
    return {"id": id, "type": type, "componentVersion": "1.0", "config": config, **extra}

filter_model = {
    "type": "linear",
    "bias": 0,
    "inputs": [
        {"id": "excl", "labelKey": "knob.excl", "kind": "slider", "min": 0, "max": 10, "step": 1, "initial": 2, "weight": 1},
        {"id": "money", "labelKey": "knob.money", "kind": "slider", "min": 0, "max": 3, "step": 1, "initial": 0, "weight": 2},
        {"id": "urgent", "labelKey": "knob.urgent", "kind": "slider", "min": 0, "max": 3, "step": 1, "initial": 0, "weight": 3},
    ],
    "output": {"labelKey": "knob.output", "min": 0, "max": 25},
}

messages = [("m1", "🎁", "sort.g1"), ("m2", "📘", "sort.g2"), ("m3", "🔒", "sort.g1"), ("m4", "🍲", "sort.g2"),
            ("m5", "📱", "sort.g1"), ("m6", "🏏", "sort.g2"), ("m7", "💸", "sort.g1"), ("m8", "🔬", "sort.g2")]

stages = [
    {"stage": "hook", "blocks": [
        block("b1", "reveal", {"textKey": "hook.text", "steps": ["hook.s1", "hook.s2"], "questionKey": "hook.q"}),
    ]},
    {"stage": "predict", "blocks": [
        block("b2", "predict", {"promptKey": "predict.prompt", "choices": ["predict.c1", "predict.c2", "predict.c3"], "answer": "predict.c2", "confidence": True, "revealKey": "predict.reveal"},
              classroom={"mode": "class-vote"}, glossaryTerms=["score", "threshold"]),
    ]},
    {"stage": "manipulate", "blocks": [
        block("b3", "sort", {"instructionKey": "sort.instruction", "groups": ["sort.g1", "sort.g2"],
                             "items": [{"id": m, "labelKey": f"sort.{m}", "symbol": sym, "group": g} for m, sym, g in messages],
                             "revealKey": "sort.reveal"},
              classroom={"mode": "vote-per-item"}, glossaryTerms=["clue"]),
        block("b4", "knob", {"promptKey": "knob.prompt", "model": filter_model, "outputTemplateKey": "knob.sentence",
                             "goal": {"target": 10, "tolerance": 0, "goalKey": "knob.goal", "successKey": "knob.success"}},
              glossaryTerms=["score", "threshold"], detours=["threshold"]),
        block("b5", "by-hand-then-automate", {"introKey": "bh.intro", "ruleKey": "bh.rule",
                             "process": {"type": "threshold", "threshold": 10, "aboveKey": "bh.above", "belowKey": "bh.below"},
                             "items": [{"id": f"i{i}", "labelKey": f"bh.i{i}", "value": v} for i, v in enumerate([12, 0, 11, 0, 14, 0, 8, 2], start=1)],
                             "manualCount": 2, "automateKey": "bh.auto"}),
        block("b6", "compare", {"promptKey": "cmp.prompt", "model": filter_model, "shared": ["money", "urgent"],
                                "variants": [{"id": "calm", "labelKey": "cmp.a", "overrides": {"excl": 0}},
                                             {"id": "excited", "labelKey": "cmp.b", "overrides": {"excl": 6}}],
                                "predictKey": "cmp.predict", "explainKey": "cmp.explain"}),
    ]},
    {"stage": "explain", "blocks": [
        block("b7", "analogy", {"concept": "threshold", "sourceKey": "an.source",
                                "mappings": [{"sourceKey": f"an.m{i}s", "targetKey": f"an.m{i}t"} for i in range(1, 5)],
                                "breakPointKey": "an.break", "fading": ["an.f1", "an.f2", "an.f3"]},
              glossaryTerms=["threshold"]),
        block("b8", "reveal", {"textKey": "deep.text"}, depth="deeper", glossaryTerms=["training"]),
        block("b9", "reveal", {"textKey": "deepest.text"}, depth="deepest"),
        block("b10", "assemble", {"instructionKey": "as.instruction", "pieces": [{"id": f"p{i}", "labelKey": f"as.p{i}"} for i in range(1, 6)],
                                  "targetOrder": [f"p{i}" for i in range(1, 6)], "successKey": "as.success", "checkKey": "as.check"}),
        block("b11", "check", {"promptKey": "ch.prompt", "options": ["ch.o1", "ch.o2", "ch.o3"], "answer": "ch.o2",
                               "feedback": {"ch.o1": "ch.f1", "ch.o3": "ch.f3"}, "hints": ["ch.h1", "ch.h2"],
                               "explainKey": "ch.explain", "detour": "threshold"}),
    ]},
    {"stage": "break-it", "blocks": [
        block("b12", "break-it", {"challengeKey": "br.challenge", "target": "b4",
                                  "attempts": [{"id": "t1", "labelKey": "br.t1", "resultKey": "br.r1", "breaks": True},
                                               {"id": "t2", "labelKey": "br.t2", "resultKey": "br.r2", "breaks": True},
                                               {"id": "t3", "labelKey": "br.t3", "resultKey": "br.r3", "breaks": False},
                                               {"id": "t4", "labelKey": "br.t4", "resultKey": "br.r4", "breaks": False}],
                                  "reflectKey": "br.reflect"}),
        block("b13", "your-data", {"promptKey": "yd.prompt", "kind": "list", "maxItems": 5, "maxLength": 120,
                                   "placeholderKey": "yd.placeholder", "exampleKeys": ["yd.e1", "yd.e2"]},
              classroom={"maxItems": 12}),
    ]},
    {"stage": "transfer-reflect", "blocks": [
        block("b14", "explain-back", {"mode": "own-analogy", "promptKey": "eb.prompt", "breakPointPromptKey": "eb.break", "modelAnswerKey": "eb.model"}),
        block("b15", "takeaway", {"titleKey": "take.title", "cardKey": "take.card", "includes": ["b4", "b13", "b14"]}),
    ]},
]

def checks(prefix, items):
    return [{"id": f"{prefix}{n}", "objective": obj, "promptKey": f"{prefix}{n}.q", "options": [f"{prefix}{n}.a", f"{prefix}{n}.b", f"{prefix}{n}.c"],
             "answer": f"{prefix}{n}.{ans}", **({"feedbackKey": f"{prefix}{n}.fb"} if f"{prefix}{n}.fb" in S else {})} for n, obj, ans in items]

lesson = {
    "id": "every-primitive",
    "schemaVersion": "1.0",
    "version": 1,
    "status": "draft",
    "meta": {
        "titleKey": "title", "subtitleKey": "subtitle", "subject": "ai", "course": "ai-for-kids", "issue": "issue-01",
        "concepts": ["clue", "score", "threshold"],
        "objectives": [{"id": "o1", "textKey": "obj.o1"}, {"id": "o2", "textKey": "obj.o2"}],
        "prerequisites": [], "audiences": ["school-13-17"], "curriculumTags": [], "estimatedMinutes": 25,
        "provenance": "Phase 1 hand-written test lesson using every universal primitive; hi and te are unreviewed drafts",
    },
    "stages": stages,
    "checks": {"pre": checks("pre", [(1, "o1", "b")]), "post": checks("post", [(1, "o1", "b"), (2, "o2", "c")])},
    "strings": {loc: {k: v[loc] for k, v in S.items()} for loc in ("en", "hi", "te")},
    "localeStatus": {"en": "draft", "hi": "draft", "te": "draft"},
}

out = ROOT / "content" / "lessons" / "every-primitive.json"
out.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n")
print(f"wrote {out.relative_to(ROOT)}: {sum(len(s['blocks']) for s in stages)} blocks, {len(S)} strings x 3 locales")
