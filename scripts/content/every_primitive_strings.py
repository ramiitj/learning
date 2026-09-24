# Source strings for content/lessons/every-primitive.json (en, hi, te).
# hi and te are drafts awaiting native-speaker review (docs/07).
# ICU message format. Use typographic apostrophes (’) to avoid ICU quoting.

S = {}

def add(key, en, hi, te):
    S[key] = {"en": en, "hi": hi, "te": te}

add("title", "How does a junk filter decide?", "जंक फ़िल्टर कैसे तय करता है?", "జంక్ ఫిల్టర్ ఎలా నిర్ణయిస్తుంది?")
add("subtitle", "Build one, then try to fool it.", "एक बनाइए, फिर उसे चकमा देने की कोशिश कीजिए।", "ఒకటి తయారు చేయండి, తర్వాత దాన్ని మోసం చేసి చూడండి.")
add("obj.o1", "Explain that a filter adds up clues into a score and compares the score with a threshold.",
    "समझाना कि फ़िल्टर सुरागों को जोड़कर एक स्कोर बनाता है और उस स्कोर की तुलना एक सीमा से करता है।",
    "ఫిల్టర్ ఆధారాలను కలిపి ఒక స్కోరు చేస్తుందని, ఆ స్కోరును ఒక హద్దుతో పోలుస్తుందని వివరించడం.")
add("obj.o2", "Show how a filter can be fooled, because it counts clues without understanding the message.",
    "दिखाना कि फ़िल्टर को चकमा दिया जा सकता है, क्योंकि वह संदेश को समझे बिना सिर्फ़ सुराग गिनता है।",
    "ఫిల్టర్ సందేశాన్ని అర్థం చేసుకోకుండా ఆధారాలను మాత్రమే లెక్కిస్తుంది కాబట్టి దాన్ని ఎలా మోసం చేయవచ్చో చూపించడం.")

# hook
add("hook.text", "A message arrives: “You WON a prize!!! Click now.” Your phone moved it to junk before you ever saw it. No person read it first.",
    "एक संदेश आता है: “आपने इनाम जीता!!! अभी क्लिक करें।” आपके देखने से पहले ही फ़ोन ने उसे जंक में डाल दिया। किसी इंसान ने उसे पहले नहीं पढ़ा।",
    "ఒక సందేశం వస్తుంది: “మీరు బహుమతి గెలిచారు!!! ఇప్పుడే క్లిక్ చేయండి.” మీరు చూడకముందే మీ ఫోన్ దాన్ని జంక్‌లోకి పంపేసింది. దాన్ని ముందుగా ఏ మనిషీ చదవలేదు.")
add("hook.q", "So how did a program decide, about a message it had never seen before?",
    "तो एक प्रोग्राम ने ऐसे संदेश के बारे में कैसे तय किया, जिसे उसने पहले कभी नहीं देखा था?",
    "మరి ఇంతకు ముందెప్పుడూ చూడని సందేశం గురించి ఒక ప్రోగ్రామ్ ఎలా నిర్ణయించింది?")

# predict
add("predict.prompt", "What do you think the filter does?", "आपके हिसाब से फ़िल्टर क्या करता है?", "ఫిల్టర్ ఏం చేస్తుందని మీరు అనుకుంటున్నారు?")
add("predict.c1", "It checks each message against a list of banned words that someone typed in.", "वह हर संदेश को किसी के लिखे हुए प्रतिबंधित शब्दों की सूची से मिलाता है।", "ఎవరో టైప్ చేసిన నిషిద్ధ పదాల జాబితాతో ప్రతి సందేశాన్ని పోల్చి చూస్తుంది.")
add("predict.c2", "It gives each message a score from clues, and blocks it if the score is high enough.", "वह सुरागों से हर संदेश को एक स्कोर देता है, और स्कोर काफ़ी ऊँचा हो तो उसे रोक देता है।", "ఆధారాల నుండి ప్రతి సందేశానికి ఒక స్కోరు ఇస్తుంది, స్కోరు తగినంత ఎక్కువైతే దాన్ని ఆపేస్తుంది.")
add("predict.c3", "It reads and understands every message, the way a person would.", "वह हर संदेश को किसी इंसान की तरह पढ़ता और समझता है।", "ఒక మనిషిలాగే ప్రతి సందేశాన్ని చదివి అర్థం చేసుకుంటుంది.")
add("predict.reveal", "It adds up clues into a <term-score>score</term-score>. If the score reaches a line, called a <term-threshold>threshold</term-threshold>, the message goes to junk. You are about to build one.",
    "वह सुरागों को जोड़कर एक <term-score>स्कोर</term-score> बनाता है। अगर स्कोर एक रेखा तक पहुँच जाए, जिसे <term-threshold>सीमा</term-threshold> कहते हैं, तो संदेश जंक में चला जाता है। अब आप ख़ुद एक बनाने वाले हैं।",
    "అది ఆధారాలను కలిపి ఒక <term-score>స్కోరు</term-score> చేస్తుంది. స్కోరు ఒక గీతను చేరితే, దాన్ని <term-threshold>హద్దు</term-threshold> అంటారు, ఆ సందేశం జంక్‌కి వెళ్తుంది. ఇప్పుడు మీరే ఒకటి తయారు చేయబోతున్నారు.")

# sort
add("sort.instruction", "Here are eight messages. Sort them into two groups. You are the filter now.", "ये आठ संदेश हैं। इन्हें दो समूहों में छाँटिए। अब फ़िल्टर आप हैं।", "ఇవి ఎనిమిది సందేశాలు. వీటిని రెండు గుంపులుగా వేరు చేయండి. ఇప్పుడు ఫిల్టర్ మీరే.")
add("sort.g1", "Junk", "जंक", "జంక్")
add("sort.g2", "Real", "असली", "నిజమైనది")
add("sort.m1", "You WON a prize!!! Click now",
    "आपने ₹10,00,000 जीते!!! अभी क्लिक करें",
    "మీరు ₹10,00,000 గెలిచారు!!! ఇప్పుడే క్లిక్ చేయండి")
add("sort.m2", "Maths homework is on page 42", "गणित का होमवर्क पेज 42 पर है", "లెక్కల హోంవర్క్ 42వ పేజీలో ఉంది")
add("sort.m3", "URGENT: your account is locked, send your PIN", "ज़रूरी: आपका खाता बंद है, अपना PIN भेजें", "అత్యవసరం: మీ ఖాతా లాక్ అయింది, మీ PIN పంపండి")
add("sort.m4", "Grandma says dinner is at 8",
    "नानी कह रही हैं खाना 8 बजे है",
    "అమ్మమ్మ రాత్రి భోజనం 8కి అంటోంది")
add("sort.m5", "FREE phone!!! Only today!!!", "मुफ़्त फ़ोन!!! सिर्फ़ आज!!!", "ఉచిత ఫోన్!!! ఈరోజు మాత్రమే!!!")
add("sort.m6", "Football practice moved to Friday",
    "क्रिकेट अभ्यास शुक्रवार को हो गया है",
    "క్రికెట్ ప్రాక్టీస్ శుక్రవారానికి మారింది")
add("sort.m7", "Congratulations, you are selected. Pay a small fee to claim",
    "बधाई हो, आप चुने गए हैं। दावा करने के लिए ₹99 दें",
    "అభినందనలు, మీరు ఎంపికయ్యారు. పొందడానికి ₹99 చెల్లించండి")
add("sort.m8", "Can you send me the science notes?", "क्या तुम मुझे विज्ञान के नोट्स भेज सकते हो?", "సైన్స్ నోట్స్ నాకు పంపగలవా?")
add("sort.reveal", "Look at what you used to decide: money you didn’t expect, words like FREE and URGENT, lots of “!!!”. Those are clues.",
    "देखिए आपने तय करने के लिए किन चीज़ों का इस्तेमाल किया: अनचाहा पैसा, मुफ़्त और ज़रूरी जैसे शब्द, ढेर सारे “!!!”। यही सुराग हैं।",
    "నిర్ణయించడానికి మీరు వేటిని ఉపయోగించారో చూడండి: ఊహించని డబ్బు, ఉచితం, అత్యవసరం లాంటి పదాలు, చాలా “!!!”. ఇవే ఆధారాలు.")

# knob
add("knob.prompt", "Here is a tiny filter. It counts three kinds of clue in a message and adds up points.", "यह एक छोटा-सा फ़िल्टर है। यह संदेश में तीन तरह के सुराग गिनता है और अंक जोड़ता है।", "ఇది ఒక చిన్న ఫిల్టర్. ఇది సందేశంలో మూడు రకాల ఆధారాలను లెక్కించి పాయింట్లు కలుపుతుంది.")
add("knob.goal", "Challenge: build a message whose junk score is exactly 10, right on the line.", "चुनौती: ऐसा संदेश बनाइए जिसका जंक स्कोर ठीक 10 हो, बिल्कुल रेखा पर।", "సవాలు: జంక్ స్కోరు సరిగ్గా 10 ఉండే సందేశం తయారు చేయండి, సరిగ్గా గీత మీద.")
add("knob.excl", "Exclamation marks “!” (1 point each)",
    "“!” चिह्न (हर एक का 1 अंक)",
    "“!” గుర్తులు (ఒక్కొక్కటికి 1 పాయింట్)")
add("knob.money", "Money words (2 points each)", "पैसे वाले शब्द (हर एक के 2 अंक)", "డబ్బు పదాలు (ఒక్కొక్కటికి 2 పాయింట్లు)")
add("knob.urgent", "Urgent words (3 points each)", "जल्दबाज़ी वाले शब्द (हर एक के 3 अंक)", "అత్యవసర పదాలు (ఒక్కొక్కటికి 3 పాయింట్లు)")
add("knob.output", "Junk score", "जंक स्कोर", "జంక్ స్కోరు")
add("knob.sentence", "This message has {excl} “!” marks, {money} money words and {urgent} urgent words. Its junk score is {output}, so it goes to {decision}.",
    "इस संदेश में {excl} “!” चिह्न, {money} पैसे वाले शब्द और {urgent} जल्दबाज़ी वाले शब्द हैं। इसका जंक स्कोर {output} है, इसलिए यह {decision} में जाता है।",
    "ఈ సందేశంలో {excl} “!” గుర్తులు, {money} డబ్బు పదాలు, {urgent} అత్యవసర పదాలు ఉన్నాయి. దీని జంక్ స్కోరు {output}, కాబట్టి ఇది {decision}కి వెళ్తుంది.")
add("knob.success", "Score 10: exactly on the threshold. One more clue and it goes to junk; one fewer and it reaches the inbox.",
    "स्कोर 10: ठीक सीमा पर। एक सुराग और, तो यह जंक में जाएगा; एक कम, तो इनबॉक्स में पहुँचेगा।",
    "స్కోరు 10: సరిగ్గా హద్దు మీద. ఇంకో ఆధారం ఉంటే జంక్‌కి వెళ్తుంది; ఒకటి తక్కువైతే ఇన్‌బాక్స్‌కి చేరుతుంది.")

# by hand then automate
add("bh.intro", "The filter’s rule is short. Each message below already has its clues counted and its points added up, using the points from the filter above. Try the rule by hand first, the way the program does it.",
    "फ़िल्टर का नियम छोटा है। नीचे हर संदेश के सुराग गिने जा चुके हैं और ऊपर वाले फ़िल्टर के अंकों से जोड़े जा चुके हैं। पहले नियम को हाथ से आज़माइए, ठीक वैसे जैसे प्रोग्राम करता है।",
    "ఫిల్టర్ నియమం చిన్నది. కింద ప్రతి సందేశంలోని ఆధారాలు ఇప్పటికే లెక్కించబడ్డాయి, పైన ఉన్న ఫిల్టర్ పాయింట్లతో కలపబడ్డాయి. ముందు ప్రోగ్రామ్ చేసినట్టే మీరు చేత్తో నియమాన్ని ప్రయత్నించండి.")
add("bh.rule", "If a message’s score is {threshold} or more, it goes to junk. Otherwise it goes to the inbox.", "अगर संदेश का स्कोर {threshold} या उससे ज़्यादा है, तो वह जंक में जाता है। नहीं तो इनबॉक्स में।", "సందేశం స్కోరు {threshold} లేదా అంతకంటే ఎక్కువైతే అది జంక్‌కి వెళ్తుంది. లేకపోతే ఇన్‌బాక్స్‌కి.")
add("bh.above", "Junk", "जंक", "జంక్")
add("bh.below", "Inbox", "इनबॉक्स", "ఇన్‌బాక్స్")
for i, (en, hi, te) in enumerate([
    ("The prize message", "इनाम वाला संदेश", "బహుమతి సందేశం"),
    ("The homework reminder", "होमवर्क की याद", "హోంవర్క్ గుర్తు"),
    ("The locked-account message", "खाता बंद वाला संदेश", "ఖాతా లాక్ సందేశం"),
    ("Nani’s dinner message", "नानी का खाने वाला संदेश", "అమ్మమ్మ భోజనం సందేశం"),
    ("The free-phone message", "मुफ़्त फ़ोन वाला संदेश", "ఉచిత ఫోన్ సందేశం"),
    ("The cricket message", "क्रिकेट वाला संदेश", "క్రికెట్ సందేశం"),
    ("The pay-₹99 message", "₹99 दो वाला संदेश", "₹99 చెల్లించండి సందేశం"),
    ("The science-notes message", "विज्ञान के नोट्स वाला संदेश", "సైన్స్ నోట్స్ సందేశం"),
], start=1):
    add(f"bh.i{i}", en, hi, te)
add("bh.auto", "The machine did the same step, the same way, every time. It never got tired, and it never used common sense either: two scams, the locked-account message and the pay-a-fee message, slipped into the inbox.",
    "मशीन ने हर बार वही कदम, उसी तरह दोहराया। वह कभी थकी नहीं, और उसने कभी अपनी समझ का इस्तेमाल भी नहीं किया: दो धोखे, खाता बंद वाला संदेश और ₹99 वाला संदेश, इनबॉक्स में पहुँच गए।",
    "యంత్రం ప్రతిసారీ అదే అడుగును, అదే విధంగా చేసింది. అది ఎప్పుడూ అలసిపోలేదు, ఇంగిత జ్ఞానాన్నీ ఉపయోగించలేదు: రెండు మోసాలు, ఖాతా లాక్ సందేశం, ₹99 సందేశం, ఇన్‌బాక్స్‌లోకి జారిపోయాయి.")

# compare
add("cmp.prompt", "Two versions of the same real message from a friend.",
    "एक दोस्त के एक ही असली संदेश के दो रूप।",
    "స్నేహితుడి నుండి వచ్చిన ఒకే నిజమైన సందేశానికి రెండు రూపాలు.")
add("cmp.a", "Calm: “We won the match.”", "शांत: “हम मैच जीत गए।”", "ప్రశాంతంగా: “మనం మ్యాచ్ గెలిచాం.”")
add("cmp.b", "Excited: “We WON the match!!!!!!!!!!”",
    "उत्साहित: “हम मैच जीत गए!!!!!!!!!!”",
    "ఉత్సాహంగా: “మనం మ్యాచ్ గెలిచాం!!!!!!!!!!”")
add("cmp.predict", "The threshold is 10. Which version ends up in junk?",
    "सीमा 10 है। कौन-सा रूप जंक में पहुँचेगा?",
    "హద్దు 10. ఏ రూపం జంక్‌లో పడుతుంది?")
add("cmp.explain", "Only the “!” marks changed, and the excited version reached the threshold of 10. A real message from a friend lands in junk. The filter cannot tell an excited friend from a scammer. It only counts.",
    "सिर्फ़ “!” चिह्न बदले, और उत्साहित रूप 10 की सीमा तक पहुँच गया। दोस्त का असली संदेश जंक में पहुँच गया। फ़िल्टर किसी उत्साहित दोस्त और धोखेबाज़ में फ़र्क नहीं कर सकता। वह बस गिनता है।",
    "“!” గుర్తులు మాత్రమే మారాయి, ఉత్సాహపు రూపం 10 హద్దును చేరింది. స్నేహితుడి నిజమైన సందేశం జంక్‌లో పడింది. ఉత్సాహంగా ఉన్న స్నేహితుడికి, మోసగాడికి తేడాను ఫిల్టర్ చెప్పలేదు. అది లెక్కిస్తుంది, అంతే.")

# analogy
add("an.source", "Think of an exam with a pass mark. Each answer earns marks. The marks are added up. If the total reaches the pass mark, you pass.",
    "पास होने के अंकों वाली किसी परीक्षा के बारे में सोचिए। हर जवाब पर अंक मिलते हैं। अंक जोड़े जाते हैं। कुल अंक पास होने के अंकों तक पहुँचें, तो आप पास।",
    "పాస్ మార్కు ఉన్న ఒక పరీక్ష గురించి ఆలోచించండి. ప్రతి జవాబుకు మార్కులు వస్తాయి. మార్కులన్నీ కలుపుతారు. మొత్తం పాస్ మార్కును చేరితే, మీరు పాస్.")
add("an.m1s", "The marks for each answer", "हर जवाब के अंक", "ప్రతి జవాబుకు మార్కులు")
add("an.m1t", "The points for each clue", "हर सुराग के अंक", "ప్రతి ఆధారానికి పాయింట్లు")
add("an.m2s", "Your total marks", "आपके कुल अंक", "మీ మొత్తం మార్కులు")
add("an.m2t", "The junk score", "जंक स्कोर", "జంక్ స్కోరు")
add("an.m3s", "The pass mark", "पास होने के अंक", "పాస్ మార్కు")
add("an.m3t", "The threshold", "सीमा", "హద్దు")
add("an.m4s", "Pass, or not yet", "पास, या अभी नहीं", "పాస్, లేదా ఇంకా కాదు")
add("an.m4t", "Junk, or inbox", "जंक, या इनबॉक्स", "జంక్, లేదా ఇన్‌బాక్స్")
add("an.break", "Here the comparison stops working. An examiner reads your answers and understands them. The filter only counts clues. It has no idea what a message means.",
    "यहाँ यह तुलना काम करना बंद कर देती है। परीक्षक आपके जवाब पढ़ता है और समझता है। फ़िल्टर सिर्फ़ सुराग गिनता है। उसे पता ही नहीं कि संदेश का मतलब क्या है।",
    "ఇక్కడ ఈ పోలిక పనిచేయడం ఆగిపోతుంది. పరీక్షకులు మీ జవాబులు చదివి అర్థం చేసుకుంటారు. ఫిల్టర్ ఆధారాలను మాత్రమే లెక్కిస్తుంది. సందేశానికి అర్థం ఏమిటో దానికి ఏమాత్రం తెలియదు.")
add("an.f1", "marks + marks + marks ≥ pass mark → pass. (“≥” means “is at least”; “→” means “leads to”.)",
    "अंक + अंक + अंक ≥ पास के अंक → पास। (“≥” का मतलब “कम से कम इतना”; “→” का मतलब “नतीजा”।)",
    "మార్కులు + మార్కులు + మార్కులు ≥ పాస్ మార్కు → పాస్. (“≥” అంటే “కనీసం అంత”; “→” అంటే “దారి తీస్తుంది”.)")
add("an.f2", "points + points + points ≥ threshold → junk", "अंक + अंक + अंक ≥ सीमा → जंक", "పాయింట్లు + పాయింట్లు + పాయింట్లు ≥ హద్దు → జంక్")
add("an.f3", "1 × “!” marks + 2 × money words + 3 × urgent words ≥ 10 → junk. (“×” means “times”.)",
    "1 × “!” चिह्न + 2 × पैसे वाले शब्द + 3 × जल्दबाज़ी वाले शब्द ≥ 10 → जंक। (“×” का मतलब “गुणा”।)",
    "1 × “!” గుర్తులు + 2 × డబ్బు పదాలు + 3 × అత్యవసర పదాలు ≥ 10 → జంక్. (“×” అంటే “గుణించు”.)")

# deeper / deepest
add("deep.text", "Real filters use hundreds of clues, not three. Nobody sets their points by hand: the filter works them out from millions of messages that people marked as junk. That is called <term-training>training</term-training>.",
    "असली फ़िल्टर तीन नहीं, सैकड़ों सुराग इस्तेमाल करते हैं। उनके अंक कोई हाथ से तय नहीं करता: फ़िल्टर उन्हें उन लाखों संदेशों से निकालता है जिन्हें लोगों ने जंक बताया। इसे <term-training>ट्रेनिंग</term-training> कहते हैं।",
    "నిజమైన ఫిల్టర్లు మూడు కాదు, వందలాది ఆధారాలను ఉపయోగిస్తాయి. వాటి పాయింట్లను ఎవరూ చేత్తో పెట్టరు: ప్రజలు జంక్ అని గుర్తించిన లక్షలాది సందేశాల నుండి ఫిల్టర్ వాటిని లెక్కిస్తుంది. దాన్ని <term-training>ట్రైనింగ్</term-training> అంటారు.")
add("deepest.text", "Choosing the threshold is a trade-off. A low threshold catches more junk but also blocks more real messages. A high threshold lets real messages through but lets more junk in too. There is no setting that makes zero mistakes.",
    "सीमा चुनना एक सौदा है। नीची सीमा ज़्यादा जंक पकड़ती है, पर ज़्यादा असली संदेश भी रोक देती है। ऊँची सीमा असली संदेशों को आने देती है, पर ज़्यादा जंक भी आ जाता है। ऐसी कोई सेटिंग नहीं जिसमें कोई गलती न हो।",
    "హద్దును ఎంచుకోవడం ఒక బేరం. తక్కువ హద్దు ఎక్కువ జంక్‌ను పట్టుకుంటుంది, కానీ ఎక్కువ నిజమైన సందేశాలనూ ఆపేస్తుంది. ఎక్కువ హద్దు నిజమైన సందేశాలను రానిస్తుంది, కానీ ఎక్కువ జంక్‌నూ లోపలికి రానిస్తుంది. ఒక్క తప్పు కూడా చేయని అమరిక లేదు.")

# assemble
add("as.instruction", "Put the filter’s steps in order.", "फ़िल्टर के कदमों को सही क्रम में लगाइए।", "ఫిల్టర్ అడుగులను సరైన క్రమంలో అమర్చండి.")
add("as.p1", "Read the message", "संदेश पढ़ें", "సందేశాన్ని చదవండి")
add("as.p2", "Count each kind of clue", "हर तरह के सुराग गिनें", "ప్రతి రకం ఆధారాన్ని లెక్కించండి")
add("as.p3", "Add up the points into a score", "अंकों को जोड़कर स्कोर बनाएँ", "పాయింట్లను కలిపి స్కోరు చేయండి")
add("as.p4", "Compare the score with the threshold", "स्कोर की तुलना सीमा से करें", "స్కోరును హద్దుతో పోల్చండి")
add("as.p5", "Send it to junk or to the inbox", "उसे जंक या इनबॉक्स में भेजें", "దాన్ని జంక్‌కి లేదా ఇన్‌బాక్స్‌కి పంపండి")
add("as.success", "That is the whole filter: clues, a score, a line.", "यही पूरा फ़िल्टर है: सुराग, एक स्कोर, एक रेखा।", "ఫిల్టర్ మొత్తం ఇదే: ఆధారాలు, ఒక స్కోరు, ఒక గీత.")
add("as.check", "Each step needs the one before it. You can’t add up clues you haven’t counted.", "हर कदम को अपने से पहले वाले कदम की ज़रूरत है। जो सुराग गिने ही नहीं, उन्हें जोड़ा नहीं जा सकता।", "ప్రతి అడుగుకు దాని ముందు అడుగు అవసరం. లెక్కించని ఆధారాలను కలపలేరు.")

# check
add("ch.prompt", "A message says “Meeting moved to 3 pm.” It has no clues at all. The threshold is 10. Where does it go?", "एक संदेश में लिखा है “मीटिंग 3 बजे हो गई है।” इसमें कोई सुराग नहीं है। सीमा 10 है। यह कहाँ जाएगा?", "ఒక సందేశంలో “మీటింగ్ మధ్యాహ్నం 3కి మారింది.” అని ఉంది. అందులో ఒక్క ఆధారం కూడా లేదు. హద్దు 10. అది ఎక్కడికి వెళ్తుంది?")
add("ch.o1", "Junk", "जंक", "జంక్")
add("ch.o2", "Inbox", "इनबॉक्स", "ఇన్‌బాక్స్")
add("ch.o3", "It depends on who sent it", "यह इस पर निर्भर है कि किसने भेजा", "ఎవరు పంపారనే దానిపై ఆధారపడి ఉంటుంది")
add("ch.f1", "Its score is 0, because it has no clues. Is 0 at least 10?", "इसका स्कोर 0 है, क्योंकि इसमें कोई सुराग नहीं। क्या 0 कम से कम 10 है?", "దీని స్కోరు 0, ఎందుకంటే ఇందులో ఆధారాలు లేవు. 0 కనీసం 10 అవుతుందా?")
add("ch.f3", "A person would think about the sender. This filter only adds up clues. What is the score here?", "कोई इंसान भेजने वाले के बारे में सोचता। यह फ़िल्टर सिर्फ़ सुराग जोड़ता है। यहाँ स्कोर कितना है?", "ఒక మనిషి పంపినవారి గురించి ఆలోచిస్తారు. ఈ ఫిల్టర్ ఆధారాలను మాత్రమే కలుపుతుంది. ఇక్కడ స్కోరు ఎంత?")
add("ch.h1", "Count the clues: exclamation marks, money words, urgent words.", "सुराग गिनिए: विस्मयादिबोधक चिह्न, पैसे वाले शब्द, जल्दबाज़ी वाले शब्द।", "ఆధారాలను లెక్కించండి: ఆశ్చర్యార్థక గుర్తులు, డబ్బు పదాలు, అత్యవసర పదాలు.")
add("ch.h2", "No clues gives a score of 0. Now compare: 0 is less than 10, so the message does not reach the threshold.", "कोई सुराग नहीं, तो स्कोर 0। अब तुलना कीजिए: 0, 10 से कम है, इसलिए संदेश सीमा तक नहीं पहुँचता।", "ఆధారాలు లేకపోతే స్కోరు 0. ఇప్పుడు పోల్చండి: 0, 10 కన్నా తక్కువ, కాబట్టి సందేశం హద్దును చేరదు.")
add("ch.explain", "Score 0 is below the threshold of 10, so the message goes to the inbox.", "स्कोर 0, सीमा 10 से नीचे है, इसलिए संदेश इनबॉक्स में जाता है।", "స్కోరు 0, హద్దు 10 కన్నా తక్కువ, కాబట్టి సందేశం ఇన్‌బాక్స్‌కి వెళ్తుంది.")

# break it
add("br.challenge", "Try to fool the filter. Which tricks get junk into the inbox, or push a real message into junk?", "फ़िल्टर को चकमा देने की कोशिश कीजिए। कौन-सी तरकीबें जंक को इनबॉक्स में पहुँचा देती हैं, या असली संदेश को जंक में धकेल देती हैं?", "ఫిల్టర్‌ను మోసం చేసి చూడండి. ఏ ఉపాయాలు జంక్‌ను ఇన్‌బాక్స్‌లోకి పంపుతాయి, లేదా నిజమైన సందేశాన్ని జంక్‌లోకి నెట్టుతాయి?")
add("br.t1", "Write “fr ee” instead of “free”", "“मुफ़्त” की जगह “मु फ़्त” लिखें", "“ఉచితం” బదులు “ఉ చితం” అని రాయండి")
add("br.r1", "The filter no longer sees a money word. The junk slips through.", "फ़िल्टर को अब पैसे वाला शब्द दिखता ही नहीं। जंक निकल जाता है।", "ఫిల్టర్‌కు ఇప్పుడు డబ్బు పదం కనిపించదు. జంక్ జారిపోతుంది.")
add("br.t2", "A friend writes “I WON the quiz!!!!!!!!!!”",
    "एक दोस्त लिखता है “मैं क्विज़ जीत गया!!!!!!!!!!”",
    "స్నేహితుడు రాస్తాడు “నేను క్విజ్ గెలిచా!!!!!!!!!!”")
add("br.r2", "Ten exclamation marks score 10 points. A real message lands in junk.", "दस विस्मयादिबोधक चिह्न, 10 अंक। एक असली संदेश जंक में पहुँच जाता है।", "పది ఆశ్చర్యార్థక గుర్తులు, 10 పాయింట్లు. నిజమైన సందేశం జంక్‌లో పడుతుంది.")
add("br.t3", "Add a polite, normal sentence to a junk message", "जंक संदेश में एक विनम्र, सामान्य वाक्य जोड़ें", "జంక్ సందేశానికి ఒక మర్యాదగా ఉన్న సాధారణ వాక్యం జోడించండి")
add("br.r3", "The money and urgent words are still there, so the score stays high. It is still caught.", "पैसे और जल्दबाज़ी वाले शब्द अब भी हैं, इसलिए स्कोर ऊँचा ही रहता है। वह फिर भी पकड़ा जाता है।", "డబ్బు, అత్యవసర పదాలు ఇంకా ఉన్నాయి, కాబట్టి స్కోరు ఎక్కువగానే ఉంటుంది. అది ఇంకా పట్టుబడుతుంది.")
add("br.t4", "Send the same junk message twice", "वही जंक संदेश दो बार भेजें", "అదే జంక్ సందేశాన్ని రెండుసార్లు పంపండి")
add("br.r4", "Same clues, same score, same result, both times.", "वही सुराग, वही स्कोर, दोनों बार वही नतीजा।", "అవే ఆధారాలు, అదే స్కోరు, రెండుసార్లూ అదే ఫలితం.")
add("br.reflect", "What do the tricks that worked have in common?", "जो तरकीबें काम कर गईं, उनमें क्या बात एक जैसी है?", "పనిచేసిన ఉపాయాలలో ఉమ్మడిగా ఉన్నది ఏమిటి?")

# your data
add("yd.prompt", "Write up to five messages that you think would fool this filter. For each one, count its clues and work out its score with the points above: would it reach 10?",
    "पाँच तक ऐसे संदेश लिखिए जो आपको लगता है इस फ़िल्टर को चकमा दे देंगे। हर एक के सुराग गिनिए और ऊपर के अंकों से उसका स्कोर निकालिए: क्या वह 10 तक पहुँचेगा?",
    "ఈ ఫిల్టర్‌ను మోసం చేస్తాయని మీరు అనుకునే సందేశాలు ఐదు వరకు రాయండి. ప్రతిదానిలో ఆధారాలను లెక్కించి, పై పాయింట్లతో దాని స్కోరు లెక్కించండి: అది 10ని చేరుతుందా?")
add("yd.placeholder", "Type a message", "एक संदेश लिखिए", "ఒక సందేశం టైప్ చేయండి")
add("yd.e1", "Hello friend, a small gift is waiting for you, reply with your address",
    "नमस्ते दोस्त, आपके लिए एक छोटा-सा तोहफ़ा इंतज़ार कर रहा है, अपना पता भेजिए",
    "హలో మిత్రమా, మీకోసం ఒక చిన్న కానుక ఎదురుచూస్తోంది, మీ చిరునామా పంపండి")
add("yd.e2", "Exam results are out!!!! Check the school notice board", "परीक्षा के नतीजे आ गए!!!! स्कूल का नोटिस बोर्ड देखो", "పరీక్ష ఫలితాలు వచ్చాయి!!!! స్కూల్ నోటీసు బోర్డు చూడు")

# explain back
add("eb.prompt", "Think of something else in life where points are added up and the total has to reach a line. Describe it as your own comparison.",
    "ज़िंदगी में कोई और ऐसी चीज़ सोचिए जहाँ अंक जोड़े जाते हैं और कुल को किसी रेखा तक पहुँचना होता है। उसे अपनी तुलना के रूप में लिखिए।",
    "జీవితంలో పాయింట్లు కలిపి, మొత్తం ఒక గీతను చేరాల్సిన మరో సందర్భం గురించి ఆలోచించండి. దాన్ని మీ సొంత పోలికగా రాయండి.")
add("eb.break", "Where does your comparison stop working?", "आपकी तुलना कहाँ काम करना बंद कर देती है?", "మీ పోలిక ఎక్కడ పనిచేయడం ఆగిపోతుంది?")
add("eb.model", "A class needs 30 signatures to start a new school club. Each signature adds one, and 30 is the line. But the students can read the petition and change it; the filter can’t see anything beyond the clues.",
    "क्रिकेट टीम को जीतने के लिए 150 रन चाहिए। हर रन जुड़ता है, और 150 रेखा है। पर टीम मैच देख सकती है और अपनी योजना बदल सकती है; फ़िल्टर सुरागों के आगे कुछ नहीं देख सकता।",
    "క్రికెట్ జట్టు గెలవడానికి 150 పరుగులు కావాలి. ప్రతి పరుగు కలుస్తుంది, 150 గీత. కానీ జట్టు మ్యాచ్‌ను చూసి తన ప్రణాళిక మార్చుకోగలదు; ఫిల్టర్ ఆధారాలకు మించి ఏమీ చూడలేదు.")

# takeaway
add("take.title", "My junk filter", "मेरा जंक फ़िल्टर", "నా జంక్ ఫిల్టర్")
add("take.card", "I built a junk filter today. It adds up clues into a score and compares it with a line. It never understands the message.",
    "आज मैंने एक जंक फ़िल्टर बनाया। यह सुरागों को जोड़कर स्कोर बनाता है और उसकी तुलना एक रेखा से करता है। यह संदेश को कभी समझता नहीं।",
    "ఈరోజు నేను ఒక జంక్ ఫిల్టర్ తయారు చేశాను. అది ఆధారాలను కలిపి ఒక స్కోరు చేసి దాన్ని ఒక గీతతో పోలుస్తుంది. అది సందేశాన్ని ఎప్పుడూ అర్థం చేసుకోదు.")

# checks
add("pre1.q", "How does a junk filter usually decide?", "जंक फ़िल्टर आमतौर पर कैसे तय करता है?", "జంక్ ఫిల్టర్ సాధారణంగా ఎలా నిర్ణయిస్తుంది?")
add("pre1.a", "A person reads each message first", "कोई इंसान पहले हर संदेश पढ़ता है", "ప్రతి సందేశాన్ని ముందుగా ఒక మనిషి చదువుతారు")
add("pre1.b", "It adds up clues into a score and compares it with a line", "वह सुरागों को जोड़कर स्कोर बनाता है और उसकी तुलना एक रेखा से करता है", "ఆధారాలను కలిపి స్కోరు చేసి దాన్ని ఒక గీతతో పోలుస్తుంది")
add("pre1.c", "It understands what each message means", "वह समझता है कि हर संदेश का मतलब क्या है", "ప్రతి సందేశం అర్థం ఏమిటో అది అర్థం చేసుకుంటుంది")
add("post1.q", "A message scores 12. The threshold is 10. Where does it go?", "एक संदेश का स्कोर 12 है। सीमा 10 है। वह कहाँ जाएगा?", "ఒక సందేశం స్కోరు 12. హద్దు 10. అది ఎక్కడికి వెళ్తుంది?")
add("post1.a", "Inbox", "इनबॉक्स", "ఇన్‌బాక్స్")
add("post1.b", "Junk", "जंक", "జంక్")
add("post1.c", "It depends on who sent it", "यह इस पर निर्भर है कि किसने भेजा", "ఎవరు పంపారనే దానిపై ఆధారపడి ఉంటుంది")
add("post1.fb", "12 is at least 10, so it reaches the threshold and goes to junk.", "12, कम से कम 10 है, इसलिए यह सीमा तक पहुँचता है और जंक में जाता है।", "12 కనీసం 10, కాబట్టి అది హద్దును చేరి జంక్‌కి వెళ్తుంది.")
add("post2.q", "Why can a friend’s excited message end up in junk?", "किसी दोस्त का उत्साहित संदेश जंक में क्यों पहुँच सकता है?", "స్నేహితుడి ఉత్సాహపు సందేశం జంక్‌లో ఎందుకు పడవచ్చు?")
add("post2.a", "The filter knows the friend is lying", "फ़िल्टर जानता है कि दोस्त झूठ बोल रहा है", "స్నేహితుడు అబద్ధం చెబుతున్నాడని ఫిల్టర్‌కు తెలుసు")
add("post2.b", "Friends’ messages are always blocked", "दोस्तों के संदेश हमेशा रोके जाते हैं", "స్నేహితుల సందేశాలు ఎప్పుడూ ఆపివేయబడతాయి")
add("post2.c", "The filter counts clues like “!!!” without understanding the message", "फ़िल्टर संदेश को समझे बिना “!!!” जैसे सुराग गिनता है", "ఫిల్టర్ సందేశాన్ని అర్థం చేసుకోకుండా “!!!” లాంటి ఆధారాలను లెక్కిస్తుంది")
add("post2.fb", "It only counts clues. An excited friend and a scammer can look the same to it.", "वह सिर्फ़ सुराग गिनता है। उसके लिए उत्साहित दोस्त और धोखेबाज़ एक जैसे दिख सकते हैं।", "అది ఆధారాలను మాత్రమే లెక్కిస్తుంది. దానికి ఉత్సాహపు స్నేహితుడు, మోసగాడు ఒకేలా కనిపించవచ్చు.")
add("predict.f1", "Early filters worked a lot like that. The trouble: scammers change one letter and the list misses it. Watch for that idea later.",
    "शुरुआती फ़िल्टर काफ़ी हद तक ऐसे ही काम करते थे। दिक्कत यह: धोखेबाज़ एक अक्षर बदल देते हैं और सूची चूक जाती है। आगे यह बात फिर आएगी।",
    "తొలి ఫిల్టర్లు దాదాపు అలాగే పనిచేసేవి. సమస్య ఏమిటంటే: మోసగాళ్ళు ఒక అక్షరం మారుస్తారు, జాబితా దాన్ని పట్టుకోలేదు. ఈ ఆలోచన తర్వాత మళ్ళీ వస్తుంది.")
add("predict.f3", "It can seem that way, because the results are often right. Keep that guess in mind: by the end you can test it yourself.",
    "ऐसा लग सकता है, क्योंकि नतीजे अक्सर सही होते हैं। यह अनुमान याद रखिए: आख़िर तक आप इसे ख़ुद परख सकेंगे।",
    "అలా అనిపించవచ్చు, ఎందుకంటే ఫలితాలు తరచుగా సరిగ్గా ఉంటాయి. ఈ అంచనాను గుర్తుంచుకోండి: చివరికి మీరే దీన్ని పరీక్షించవచ్చు.")
add("knob.junk", "junk",
    "जंक",
    "జంక్")
add("knob.inbox", "the inbox",
    "इनबॉक्स",
    "ఇన్‌బాక్స్")
add("bh.value", "Junk score",
    "जंक स्कोर",
    "జంక్ స్కోరు")
add("bh.i1", "The prize message: 3 “!”, 2 money words, 1 urgent word (3 + 4 + 3)",
    "इनाम वाला संदेश: 3 “!”, 2 पैसे वाले शब्द, 1 जल्दबाज़ी वाला शब्द (3 + 4 + 3)",
    "బహుమతి సందేశం: 3 “!”, 2 డబ్బు పదాలు, 1 అత్యవసర పదం (3 + 4 + 3)")
add("bh.i2", "The homework reminder: no clues",
    "होमवर्क की याद: कोई सुराग नहीं",
    "హోంవర్క్ గుర్తు: ఆధారాలు లేవు")
add("bh.i3", "The locked-account message: 1 urgent word (3)",
    "खाता बंद वाला संदेश: 1 जल्दबाज़ी वाला शब्द (3)",
    "ఖాతా లాక్ సందేశం: 1 అత్యవసర పదం (3)")
add("bh.i4", "Grandma’s dinner message: no clues",
    "नानी का खाने वाला संदेश: कोई सुराग नहीं",
    "అమ్మమ్మ భోజనం సందేశం: ఆధారాలు లేవు")
add("bh.i5", "The free-phone message: 6 “!”, 1 money word, 1 urgent word (6 + 2 + 3)",
    "मुफ़्त फ़ोन वाला संदेश: 6 “!”, 1 पैसे वाला शब्द, 1 जल्दबाज़ी वाला शब्द (6 + 2 + 3)",
    "ఉచిత ఫోన్ సందేశం: 6 “!”, 1 డబ్బు పదం, 1 అత్యవసర పదం (6 + 2 + 3)")
add("bh.i6", "The football message: no clues",
    "क्रिकेट वाला संदेश: कोई सुराग नहीं",
    "క్రికెట్ సందేశం: ఆధారాలు లేవు")
add("bh.i7", "The pay-a-fee message: 2 money words (4)",
    "₹99 दो वाला संदेश: 2 पैसे वाले शब्द (4)",
    "₹99 చెల్లించండి సందేశం: 2 డబ్బు పదాలు (4)")
add("bh.i8", "The science-notes message: no clues",
    "विज्ञान के नोट्स वाला संदेश: कोई सुराग नहीं",
    "సైన్స్ నోట్స్ సందేశం: ఆధారాలు లేవు")
add("take.l1", "My filter",
    "मेरा फ़िल्टर",
    "నా ఫిల్టర్")
add("take.l2", "Messages I wrote to fool it",
    "उसे चकमा देने के लिए मेरे लिखे संदेश",
    "దాన్ని మోసం చేయడానికి నేను రాసిన సందేశాలు")
add("take.l3", "My own comparison",
    "मेरी अपनी तुलना",
    "నా సొంత పోలిక")
