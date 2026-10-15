"""Builds content/lessons/m2-data-decides.json (AI for Kids, Module 2: Data decides).
Run: python3 scripts/content/build_m2_data_decides.py
Strings live in m2_data_decides_strings.py so the three locales stay aligned.

Feature values were checked against the train-classifier model (k = 3 nearest
neighbours, Euclidean distance, ties broken by example order):
  skewed set  -> P:1 (3/3), Q:7 (3/3), R:7 (3/3, wrong), S:7 (3/3)
  balanced set -> P:1 (3/3), Q:7 (2/3), R:1 (2/3), S:7 (3/3)
  break-it on the balanced set: plain 1 (1,0) -> 1 (3/3); hurried 7 (4,0) -> 1 (3/3, wrong);
  a 4 (0,8) -> 1 (2/3); flag 1 (5,0) -> 1 (2/3)."""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from m2_data_decides_strings import S, SCHOOL, FIXED

ROOT = pathlib.Path(__file__).resolve().parents[2]
LESSON_ID = "m2-data-decides"

FEATURES = {"plain": (0, 0), "tick": (1, 0), "seven": (9, 0), "flag": (6, 0), "flag2": (5, 0), "cross": (9, 8)}
# Second copies of some styles are drawn a little differently, so the cards are not clones.
OVERRIDES = {"s4": (8, 0), "s5": (0, 0), "c6": (8, 0), "c8": (8, 9)}


def block(id, type, config, **extra):
    return {"id": id, "type": type, "componentVersion": "1.0", "config": config, **extra}


def card(prefix, cid, kind):
    top, mid = OVERRIDES.get(cid, FEATURES[kind])
    return {"id": cid, "labelKey": f"{prefix}.{cid}", "features": {"top": top, "mid": mid}}


features = [{"id": "top", "labelKey": "f.top"}, {"id": "mid", "labelKey": "f.mid"}]
groups = ["g.one", "g.seven"]
test_items = [
    {"id": "p", "labelKey": "t.p", "features": {"top": 1, "mid": 0}},
    {"id": "q", "labelKey": "t.q", "features": {"top": 8, "mid": 0}},
    {"id": "r", "labelKey": "t.r", "features": {"top": 6, "mid": 0}},
    {"id": "s", "labelKey": "t.s", "features": {"top": 9, "mid": 9}},
]


def check(id, p, options, answer, feedback=None, hints=None, explain=None, detour=None, **extra):
    cfg = {"promptKey": f"{p}.prompt", "options": [f"{p}.{o}" for o in options], "answer": f"{p}.{answer}"}
    if feedback:
        cfg["feedback"] = {f"{p}.{o}": f"{p}.{k}" for o, k in feedback.items()}
    if hints:
        cfg["hints"] = [f"{p}.{h}" for h in hints]
    if explain:
        cfg["explainKey"] = f"{p}.explain"
    if detour:
        cfg["detour"] = detour
    return block(id, "check", cfg, **extra)


stages = [
    {"stage": "hook", "blocks": [
        block("b1", "reveal", {"textKey": "hook.text", "questionKey": "hook.q"},
              glossaryTerms=["accuracy", "percentage"], detours=["percentage"]),
    ]},
    {"stage": "predict", "blocks": [
        block("b2", "predict", {"promptKey": "predict.prompt", "choices": ["predict.c1", "predict.c2", "predict.c3"], "answer": "predict.c2",
                                "confidence": True, "revealKey": "predict.reveal",
                                "choiceFeedback": {"predict.c1": "predict.f1", "predict.c3": "predict.f3"}},
              classroom={"mode": "class-vote"}, glossaryTerms=["dataset", "training"]),
    ]},
    {"stage": "manipulate", "blocks": [
        block("b3", "train-classifier", {"promptKey": "tc1.prompt", "groups": groups, "features": features,
                                         "items": [card("sk", cid, kind) for cid, kind in SCHOOL],
                                         "testItems": test_items, "explainKey": "tc1.explain"},
              glossaryTerms=["label", "dataset"]),
        check("b4", "pc", ["a", "b", "c"], "a", feedback={"b": "fb", "c": "fc"}, hints=["h1", "h2"], explain=True, detour="percentage",
              classroom={"mode": "class-vote"}, glossaryTerms=["percentage", "accuracy"], detours=["percentage"]),
        block("b5", "train-classifier", {"promptKey": "tc2.prompt", "groups": groups, "features": features,
                                         "items": [card("fx", cid, kind) for cid, kind in FIXED],
                                         "testItems": test_items, "explainKey": "tc2.explain"},
              glossaryTerms=["dataset", "label"]),
    ]},
    {"stage": "explain", "blocks": [
        block("b6", "reveal", {"textKey": "ex.text", "steps": ["ex.s1", "ex.s2"]}, glossaryTerms=["sample", "bias"], detours=["sample"]),
        block("b7", "analogy", {"concept": "bias", "titleKey": "an1.title", "sourceKey": "an1.source",
                                "mappings": [{"sourceKey": f"an1.m{i}s", "targetKey": f"an1.m{i}t"} for i in range(1, 5)],
                                "breakPointKey": "an1.break", "fading": ["an1.f1", "an1.f2", "an1.f3"]},
              glossaryTerms=["bias", "dataset"]),
        block("b8", "analogy", {"concept": "bias", "titleKey": "an2.title", "sourceKey": "an2.source",
                                "mappings": [{"sourceKey": f"an2.m{i}s", "targetKey": f"an2.m{i}t"} for i in range(1, 5)],
                                "breakPointKey": "an2.break", "fading": ["an2.f1", "an2.f2", "an2.f3"]},
              glossaryTerms=["sample"], detours=["sample"]),
        block("b9", "reveal", {"textKey": "deep.text"}, depth="deeper"),
        check("b10", "mc", ["o1", "o2", "o3"], "o1", feedback={"o2": "f2", "o3": "f3"}, explain=True, classroom={"mode": "class-vote"}),
        check("b11", "hs", ["a", "b", "c"], "a", feedback={"b": "fb", "c": "fc"}, hints=["h1", "h2"], explain=True, detour="percentage",
              classroom={"mode": "class-vote"}, glossaryTerms=["accuracy", "sample"]),
    ]},
    {"stage": "break-it", "blocks": [
        block("b12", "break-it", {"challengeKey": "br.challenge", "target": "b5",
                                  "attempts": [{"id": "t1", "labelKey": "br.t1", "resultKey": "br.r1", "breaks": False},
                                               {"id": "t2", "labelKey": "br.t2", "resultKey": "br.r2", "breaks": True},
                                               {"id": "t3", "labelKey": "br.t3", "resultKey": "br.r3", "breaks": True},
                                               {"id": "t4", "labelKey": "br.t4", "resultKey": "br.r4", "breaks": False}],
                                  "reflectKey": "br.reflect"}),
        check("b13", "md", ["a", "b", "c"], "b", feedback={"a": "fa", "c": "fc"}, explain=True, classroom={"mode": "class-vote"}),
    ]},
    {"stage": "transfer-reflect", "blocks": [
        check("b14", "vt", ["a", "b", "c"], "a", feedback={"b": "fb", "c": "fc"}, explain=True, classroom={"mode": "class-vote"}, glossaryTerms=["dataset"]),
        block("b15", "predict", {"promptKey": "rs.prompt", "choices": [f"rs.c{i}" for i in range(1, 6)], "revealKey": "rs.reveal",
                                 "choiceFeedback": {f"rs.c{i}": f"rs.f{i}" for i in range(1, 6)}},
              classroom={"mode": "class-vote"}),
        block("b16", "explain-back", {"mode": "own-words", "promptKey": "eb.prompt", "modelAnswerKey": "eb.model"}),
        block("b17", "takeaway", {"titleKey": "take.title", "cardKey": "take.card", "includes": ["b5", "b15", "b16"],
                                  "labelKeys": ["take.l1", "take.l2", "take.l3"]}),
    ]},
]


def checks(items):
    out = []
    for cid, obj, ans in items:
        c = {"id": cid, "objective": obj, "promptKey": f"{cid}.q", "options": [f"{cid}.a", f"{cid}.b", f"{cid}.c"], "answer": f"{cid}.{ans}"}
        if f"{cid}.fb" in S:
            c["feedbackKey"] = f"{cid}.fb"
        out.append(c)
    return out


lesson = {
    "id": LESSON_ID,
    "schemaVersion": "1.0",
    "version": 1,
    "status": "draft",
    "meta": {
        "titleKey": "title", "subtitleKey": "subtitle", "subject": "ai", "course": "ai-for-kids", "module": "m2", "issue": "issue-01",
        "concepts": ["dataset", "bias"],
        "objectives": [{"id": f"o{i}", "textKey": f"obj.o{i}"} for i in range(1, 4)],
        "prerequisites": ["learning-from-examples"], "audiences": ["school-13-17"], "curriculumTags": [], "estimatedMinutes": 40,
        "teacherGuide": LESSON_ID,
        "provenance": "agent pipeline v1 (single-author pass through every role); hi and te are unreviewed drafts; not yet creator-reviewed",
    },
    "stages": stages,
    "checks": {"pre": checks([("pre1", "o1", "a"), ("pre2", "o2", "b"), ("pre3", "o3", "a")]),
               "post": checks([("post1", "o1", "b"), ("post2", "o2", "b"), ("post3", "o3", "a")])},
    "strings": {loc: {k: v[loc] for k, v in S.items()} for loc in ("en", "hi", "te")},
    "localeStatus": {"en": "draft", "hi": "draft", "te": "draft"},
}

out = ROOT / "content" / "lessons" / f"{LESSON_ID}.json"
out.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n")
print(f"wrote {out.relative_to(ROOT)}: {sum(len(s['blocks']) for s in stages)} blocks, {len(S)} strings x 3 locales")
