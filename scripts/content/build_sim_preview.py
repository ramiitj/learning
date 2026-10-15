"""Builds content/previews/sim-ai.json: one example of each AI simulation, for the
component preview page (personal and classroom variants in en, hi and te).
Run: python3 scripts/content/build_sim_preview.py
Hindi and Telugu are build-team drafts."""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
S = {}
def add(key, en, hi, te):
    S[key] = (en, hi, te)

add("title", "AI simulations", "AI सिमुलेशन", "AI సిమ్యులేషన్లు")
# train-classifier
add("tc.prompt", "Label each animal as small or big, then train the machine on your labels.", "हर जानवर को छोटा या बड़ा बताइए, फिर अपने लेबल से मशीन को ट्रेन कीजिए।", "ప్రతి జంతువును చిన్నది లేదా పెద్దది అని గుర్తించండి, తర్వాత మీ లేబుళ్లతో యంత్రాన్ని ట్రైన్ చేయండి.")
add("tc.small", "Small", "छोटा", "చిన్నది")
add("tc.big", "Big", "बड़ा", "పెద్దది")
add("tc.weight", "Weight (kg)", "वज़न (किलो)", "బరువు (కిలోలు)")
add("tc.height", "Height (m)", "ऊँचाई (मीटर)", "ఎత్తు (మీటర్లు)")
add("tc.mouse", "Mouse", "चूहा", "ఎలుక")
add("tc.cat", "Cat", "बिल्ली", "పిల్లి")
add("tc.horse", "Horse", "घोड़ा", "గుర్రం")
add("tc.elephant", "Elephant", "हाथी", "ఏనుగు")
add("tc.rabbit", "Rabbit", "खरगोश", "కుందేలు")
add("tc.cow", "Cow", "गाय", "ఆవు")
add("tc.explain", "The machine has no idea what an animal is. It finds the examples whose numbers are closest and copies their label.", "मशीन को नहीं पता कि जानवर क्या है। वह सबसे पास के अंकों वाले उदाहरण ढूँढकर उनका लेबल लगा देती है।", "జంతువు అంటే ఏమిటో యంత్రానికి తెలియదు. దగ్గరి సంఖ్యలున్న ఉదాహరణలను కనుగొని వాటి లేబుల్‌నే పెడుతుంది.")
# pixel-grid
add("pg.prompt", "Draw a digit. Then switch to numbers and see what the computer receives.", "एक अंक बनाइए। फिर संख्याओं पर जाइए और देखिए कि कंप्यूटर को क्या मिलता है।", "ఒక అంకె గీయండి. తర్వాత సంఖ్యలకు మారి కంప్యూటర్‌కు ఏమి అందుతుందో చూడండి.")
add("pg.one", "The digit 1", "अंक 1", "అంకె 1")
add("pg.why", "The computer never sees a picture, only these numbers.", "कंप्यूटर कभी तस्वीर नहीं देखता, सिर्फ़ ये संख्याएँ।", "కంప్యూటర్ ఎప్పుడూ బొమ్మను చూడదు, ఈ సంఖ్యలను మాత్రమే.")
add("pg.same", "Mostly the same numbers", "ज़्यादातर वही संख्याएँ", "చాలావరకు అవే సంఖ్యలు")
add("pg.diff", "Very different numbers", "बहुत अलग संख्याएँ", "చాలా వేరే సంఖ్యలు")
# next-word-model
add("nw.prompt", "Teach the machine some sentences, then ask it for the next word.", "मशीन को कुछ वाक्य सिखाइए, फिर उससे अगला शब्द पूछिए।", "యంత్రానికి కొన్ని వాక్యాలు నేర్పండి, తర్వాత తదుపరి పదం అడగండి.")
add("nw.starters", "The cat sat on the mat.|The cat ate the fish.|The dog sat on the step.", "बिल्ली चटाई पर बैठी।|बिल्ली ने मछली खाई।|कुत्ता सीढ़ी पर बैठा।", "పిల్లి చాప మీద కూర్చుంది.|పిల్లి చేపను తిన్నది.|కుక్క మెట్టు మీద కూర్చుంది.")
add("nw.why", "It only counts which word came next most often. There is no meaning or intention behind the choice.", "यह सिर्फ़ गिनता है कि आगे कौन-सा शब्द सबसे ज़्यादा आया। इस चुनाव के पीछे कोई अर्थ या इरादा नहीं है।", "తర్వాత ఏ పదం ఎక్కువసార్లు వచ్చిందో మాత్రమే లెక్కిస్తుంది. ఆ ఎంపిక వెనుక అర్థం లేదా ఉద్దేశం లేదు.")
# layer-builder
add("lb.prompt", "Build a network and train it on the dots. Then see how it does on new dots.", "एक नेटवर्क बनाइए और बिंदुओं पर ट्रेन कीजिए। फिर देखिए कि नए बिंदुओं पर कैसा करता है।", "ఒక నెట్‌వర్క్ కట్టి చుక్కల మీద ట్రైన్ చేయండి. తర్వాత కొత్త చుక్కల మీద ఎలా చేస్తుందో చూడండి.")
add("lb.explain", "A network that memorises the training dots can still miss the pattern.", "जो नेटवर्क ट्रेनिंग के बिंदु रट लेता है, वह फिर भी पैटर्न चूक सकता है।", "ట్రైనింగ్ చుక్కలను బట్టీ పట్టిన నెట్‌వర్క్ కూడా నమూనాను తప్పిపోవచ్చు.")
add("lb.small", "The small network", "छोटा नेटवर्क", "చిన్న నెట్‌వర్క్")
add("lb.big", "The big network", "बड़ा नेटवर्क", "పెద్ద నెట్‌వర్క్")
# dilemma-vote
add("dv.scenario", "A school app suggests which students need extra help, based on last year's marks. Should teachers follow its list?", "एक स्कूल ऐप पिछले साल के अंकों के आधार पर बताता है कि किन विद्यार्थियों को अतिरिक्त मदद चाहिए। क्या शिक्षक उसकी सूची मानें?", "గత సంవత్సరం మార్కుల ఆధారంగా ఏ విద్యార్థులకు అదనపు సహాయం కావాలో ఒక స్కూల్ యాప్ సూచిస్తుంది. ఉపాధ్యాయులు ఆ జాబితాను పాటించాలా?")
add("dv.o1", "Follow the list", "सूची मानें", "జాబితాను పాటించాలి")
add("dv.o2", "Use it only as one clue", "इसे सिर्फ़ एक सुराग मानें", "దాన్ని ఒక ఆధారంగా మాత్రమే వాడాలి")
add("dv.f1.name", "Outcomes", "नतीजे", "ఫలితాలు")
add("dv.f1.why", "Choose what helps the most students learn. If the list is usually right, following it helps many quickly.", "वह चुनें जिससे सबसे ज़्यादा विद्यार्थी सीखें। अगर सूची अक्सर सही है, तो उसे मानने से कई लोगों को जल्दी मदद मिलती है।", "ఎక్కువ మంది విద్యార్థులు నేర్చుకునేదాన్ని ఎంచుకోండి. జాబితా తరచూ సరైనదైతే, దాన్ని పాటిస్తే చాలా మందికి త్వరగా సహాయం అందుతుంది.")
add("dv.f2.name", "Fairness", "निष्पक्षता", "న్యాయం")
add("dv.f2.why", "Last year's marks may carry last year's unfairness. Each student deserves to be seen as they are now.", "पिछले साल के अंकों में पिछले साल की नाइंसाफ़ी हो सकती है। हर विद्यार्थी को आज जैसा है, वैसा देखा जाना चाहिए।", "గత ఏడాది మార్కుల్లో గత ఏడాది అన్యాయం ఉండొచ్చు. ప్రతి విద్యార్థిని ఇప్పుడు ఉన్నట్టే చూడాలి.")
add("dv.f3.name", "Care", "देखभाल", "శ్రద్ధ")
add("dv.f3.why", "It depends on the student. A teacher who knows them is better placed than a list to decide.", "यह विद्यार्थी पर निर्भर है। उन्हें जानने वाला शिक्षक सूची से बेहतर तय कर सकता है।", "అది విద్యార్థిపై ఆధారపడుతుంది. వారిని ఎరిగిన ఉపాధ్యాయుడు జాబితా కంటే బాగా నిర్ణయించగలరు.")
add("dv.reflect", "Who should be responsible if the list is wrong?", "अगर सूची गलत हो, तो ज़िम्मेदार किसे होना चाहिए?", "జాబితా తప్పైతే ఎవరు బాధ్యత వహించాలి?")
# hillside
add("hs.prompt", "You are on a hill in thick fog and want to reach the lowest ground. You can only feel the slope under your feet.", "आप घने कोहरे में एक पहाड़ी पर हैं और सबसे नीची जगह पहुँचना चाहते हैं। आप सिर्फ़ पैरों के नीचे की ढलान महसूस कर सकते हैं।", "మీరు దట్టమైన పొగమంచులో ఒక కొండ మీద ఉన్నారు, అత్యంత లోతైన చోటుకు చేరాలనుకుంటున్నారు. మీ కాళ్ల కింది వాలును మాత్రమే అనుభవించగలరు.")
add("hs.left", "Step left", "बाएँ कदम", "ఎడమకు అడుగు")
add("hs.right", "Step right", "दाएँ कदम", "కుడికి అడుగు")
add("hs.goal", "Reach the lowest ground in as few steps as you can.", "जितने कम कदमों में हो सके, सबसे नीची जगह पहुँचिए।", "వీలైనన్ని తక్కువ అడుగుల్లో అత్యంత లోతైన చోటుకు చేరండి.")
add("hs.fade", "This is how training works: the machine only knows the slope where it stands, and takes small steps downhill to make its error smaller.", "ट्रेनिंग ऐसे ही होती है: मशीन को सिर्फ़ अपनी जगह की ढलान पता होती है, और वह अपनी गलती घटाने के लिए नीचे की ओर छोटे कदम लेती है।", "ట్రైనింగ్ ఇలాగే జరుగుతుంది: యంత్రానికి తాను ఉన్న చోటి వాలు మాత్రమే తెలుసు, తన తప్పును తగ్గించడానికి కిందికి చిన్న అడుగులు వేస్తుంది.")

blocks = [
    {"id": "s1", "type": "train-classifier", "config": {"promptKey": "tc.prompt", "groups": ["tc.small", "tc.big"], "features": [{"id": "weight", "labelKey": "tc.weight"}, {"id": "height", "labelKey": "tc.height"}],
        "items": [{"id": "mouse", "labelKey": "tc.mouse", "symbol": "🐭", "features": {"weight": 0.1, "height": 0.1}}, {"id": "cat", "labelKey": "tc.cat", "symbol": "🐱", "features": {"weight": 4, "height": 0.3}},
                  {"id": "horse", "labelKey": "tc.horse", "symbol": "🐴", "features": {"weight": 500, "height": 1.6}}, {"id": "elephant", "labelKey": "tc.elephant", "symbol": "🐘", "features": {"weight": 5000, "height": 3}}],
        "testItems": [{"id": "rabbit", "labelKey": "tc.rabbit", "symbol": "🐰", "features": {"weight": 2, "height": 0.25}}, {"id": "cow", "labelKey": "tc.cow", "symbol": "🐮", "features": {"weight": 600, "height": 1.4}}], "explainKey": "tc.explain"}},
    {"id": "s2", "type": "pixel-grid", "config": {"promptKey": "pg.prompt", "size": 8, "presets": [{"labelKey": "pg.one", "rows": [[0, 9, 0], [9, 9, 0], [0, 9, 0], [0, 9, 0], [9, 9, 9]]}], "tools": ["draw", "erase", "blur", "shift"], "explainKey": "pg.why", "sameKey": "pg.same", "differentKey": "pg.diff"}},
    {"id": "s3", "type": "next-word-model", "config": {"promptKey": "nw.prompt", "starterSentencesKey": "nw.starters", "maxSentences": 10, "explainKey": "nw.why"}},
    {"id": "s4", "type": "layer-builder", "config": {"promptKey": "lb.prompt", "dataset": {"type": "wave", "points": 10, "noise": 0.5, "seed": 3}, "maxLayers": 3, "maxWidth": 16, "explainKey": "lb.explain", "smallKey": "lb.small", "bigKey": "lb.big"}},
    {"id": "s5", "type": "dilemma-vote", "config": {"promptKey": "dv.scenario", "options": [{"id": "follow", "labelKey": "dv.o1"}, {"id": "clue", "labelKey": "dv.o2"}],
        "frameworks": [{"id": "outcomes", "nameKey": "dv.f1.name", "reasoningKey": "dv.f1.why", "choice": "follow"}, {"id": "fairness", "nameKey": "dv.f2.name", "reasoningKey": "dv.f2.why", "choice": "clue"}, {"id": "care", "nameKey": "dv.f3.name", "reasoningKey": "dv.f3.why", "choice": None}], "reflectionKey": "dv.reflect"}},
    {"id": "s6", "type": "hillside", "config": {"promptKey": "hs.prompt", "landscape": {"type": "two-valleys", "min": 0, "max": 100}, "start": 10, "stepMin": 2, "stepMax": 10, "maxSteps": 12, "leftKey": "hs.left", "rightKey": "hs.right", "goalKey": "hs.goal", "fadeKey": "hs.fade"}},
]
for b in blocks: b["componentVersion"] = "1.0"
doc = {"titleKey": "title", "blocks": blocks, "strings": {loc: {k: v[i] for k, v in S.items()} for i, loc in enumerate(["en", "hi", "te"])}}
(ROOT / "content/previews/sim-ai.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
print(f"wrote content/previews/sim-ai.json: {len(blocks)} simulations, {len(S)} strings x 3 locales")
