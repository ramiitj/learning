"""Novice Learner Panel benchmark: the Phase 1 test lesson with planted
comprehension traps, plus a clean control. Each trap is something a real
beginner trips on; `personas` names who should hit it.
Cases are frozen snapshots: recorded runs in runs/ were measured against
them, so fixing the live lesson does not change the benchmark. Rebuild only
to make a new benchmark version, and re-run the agents on it.

Run: python3 benchmarks/novice-learner-panel/build_cases.py"""
import copy, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).parent
lesson = json.loads((ROOT / "content/lessons/every-primitive.json").read_text())
glossary = {loc: json.loads((ROOT / f"content/glossary/{loc}.json").read_text()) for loc in ("en", "hi", "te")}

def bundle(l):
    return {"task": "Play through this lesson as each panel member, in their own language, and report.", "lesson": l, "glossary": glossary}

seeded = copy.deepcopy(lesson)
S = seeded["strings"]
seeds = []

def trap(id, check, severity, locale, key, new, note, block, personas, also=()):
    S[locale][key] = new
    seeds.append({"id": id, "check": check, "alsoAccept": list(also), "severity": severity, "locale": locale, "keys": [key], "block": block, "personas": personas, "note": note})

trap("t01", "unknown-term", "blocking", "en", "knob.prompt",
     "Here is a tiny filter, a linear classifier over a three-dimensional feature vector. It counts three kinds of clue in a message and adds up points.",
     "'linear classifier', 'three-dimensional feature vector' never explained.", "b4", ["asha"], ("assumed-knowledge",))
trap("t02", "assumed-knowledge", "blocking", "en", "hook.text",
     "As you already know from your computer science class, a family phone gets about 40 messages a day, and a spam filter moves the junk using the algorithms you studied.",
     "Assumes a computer science class and known algorithms.", "b1", ["asha", "meera"])
trap("t03", "unexplained-jump", "blocking", "en", "bh.rule",
     "If the posterior probability of junk exceeds the prior, it goes to junk. Otherwise it goes to the inbox.",
     "Rule stated in probability terms the lesson never introduced; breaks the score-and-threshold thread.", "b5", ["asha", "meera"], ("unknown-term",))
trap("t04", "number-trouble", "blocking", "hi", "knob.success",
     "स्कोर 10: अधिकतम का 0.4 अनुपात, यानी सीमा पर। एक सुराग और, तो यह जंक में जाएगा।",
     "Ratio 0.4 of the maximum appears with no steps (Rohit loses confidence with decimals).", "b4", ["rohit"])
trap("t05", "confusing-instruction", "blocking", "en", "as.instruction",
     "Do it.",
     "No instruction about what to do with the pieces.", "b10", ["asha", "rohit", "telugu-student", "meera"])
trap("t06", "reading-load", "advisory", "en", "an.source",
     "Think of an exam with a pass mark, where each answer you write earns some marks from the examiner who reads it carefully, and all of those marks from every answer on every page are then added up together into one total, and if that total reaches the pass mark that the school decided on beforehand, you pass.",
     "One 60-word sentence for a class 8 reader.", "b7", ["asha", "rohit"])
trap("t07", "boredom", "advisory", "en", "cmp.explain",
     "Only the “!” marks changed. Only the exclamation marks were different. Nothing else changed except the exclamation marks. The only difference between the two versions is the number of “!” marks. And yet the excited version reached the threshold of 10. The filter cannot tell an excited friend from a scammer. It only counts.",
     "The same point made four times in a row (Meera skips or quits).", "b6", ["meera"])
trap("t08", "unknown-term", "blocking", "hi", "predict.reveal",
     "वह एक probabilistic heuristic से सुरागों को जोड़कर एक <term-score>स्कोर</term-score> बनाता है। अगर स्कोर <term-threshold>सीमा</term-threshold> तक पहुँच जाए, तो संदेश जंक में चला जाता है।",
     "Untranslated English jargon in Hindi.", "b2", ["rohit"])
trap("t09", "unknown-term", "blocking", "te", "bh.rule",
     "weighted sum threshold function ప్రకారం స్కోరు {threshold} లేదా అంతకంటే ఎక్కువైతే అది జంక్‌కి వెళ్తుంది.",
     "Untranslated English jargon in Telugu.", "b5", ["telugu-student"])
trap("t10", "lost-place", "blocking", "en", "ch.prompt",
     "Use the rule from Part 2 to decide. A message says “Meeting moved to 3 pm.” It has no clues at all. Where does it go?",
     "Points back to Part 2, but the rule was given in Part 3; also drops the threshold value.", "b11", ["asha", "rohit", "meera"], ("confusing-instruction",))
trap("t11", "unknown-term", "blocking", "en", "sort.reveal",
     "Look at what you used to decide: those are the model’s features, and the labels you gave are the ground truth.",
     "'features', 'ground truth', 'model' used before any explanation.", "b3", ["asha"])

(HERE / "cases").mkdir(exist_ok=True); (HERE / "expected").mkdir(exist_ok=True)
(HERE / "cases/clean.json").write_text(json.dumps(bundle(lesson), ensure_ascii=False, indent=1))
(HERE / "cases/seeded.json").write_text(json.dumps(bundle(seeded), ensure_ascii=False, indent=1))
(HERE / "expected/seeded.json").write_text(json.dumps({"seeds": seeds}, ensure_ascii=False, indent=2))
(HERE / "expected/clean.json").write_text(json.dumps({"seeds": []}))
print(len(seeds), "traps;", sum(s["severity"] == "blocking" for s in seeds), "blocking")
