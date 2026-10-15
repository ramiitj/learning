"""Strings for Module 5, "Inside a neural network" (docs/13), in en, hi and te.

Each key maps to (en, hi, te). Hindi and Telugu are unreviewed drafts by the
localisation pass of the agent pipeline: a native speaker must review every
string before either locale can be published.
"""

S = {
    # ---------- meta ----------
    "title": (
        "Inside a neural network",
        "न्यूरल नेटवर्क के अंदर",
        "న్యూరల్ నెట్‌వర్క్ లోపల",
    ),
    "subtitle": (
        "Build one, train it, and catch it copying.",
        "एक बनाइए, उसे ट्रेन कीजिए, और उसे नकल करते पकड़िए।",
        "ఒకటి నిర్మించండి, ట్రైనింగ్ ఇవ్వండి, అది కాపీ కొడుతుంటే పట్టుకోండి.",
    ),
    "obj.o1": (
        "Describe a neural network as layers of neurons that multiply numbers by weights and add them up.",
        "न्यूरल नेटवर्क को न्यूरॉनों की परतों के रूप में समझाना, जो संख्याओं को वेट से गुणा करके जोड़ते हैं।",
        "న్యూరల్ నెట్‌వర్క్‌ను న్యూరాన్ల పొరలుగా వివరించడం: అవి సంఖ్యలను వెయిట్‌లతో గుణించి కలుపుతాయి.",
    ),
    "obj.o2": (
        "Compare the error on training points with the error on new points. Use them to spot underfitting, overfitting and a good fit.",
        "ट्रेनिंग बिंदुओं की ग़लती की तुलना नए बिंदुओं की ग़लती से करना। इनसे अंडरफ़िटिंग, ओवरफ़िटिंग और अच्छा फ़िट पहचानना।",
        "ట్రైనింగ్ బిందువులపై పొరపాటును కొత్త బిందువులపై పొరపాటుతో పోల్చడం. వాటితో అండర్‌ఫిట్టింగ్, ఓవర్‌ఫిట్టింగ్, మంచి ఫిట్‌లను గుర్తించడం.",
    ),
    "obj.o3": (
        "Explain training as small steps that change the weights to make the error smaller.",
        "ट्रेनिंग को छोटे-छोटे क़दमों के रूप में समझाना, जो ग़लती घटाने के लिए वेट बदलते हैं।",
        "పొరపాటును తగ్గించడానికి వెయిట్‌లను మార్చే చిన్న చిన్న అడుగులుగా ట్రైనింగ్‌ను వివరించడం.",
    ),
    # ---------- hook ----------
    "hook.text": (
        "Two machines were trained on the same 10 points on a chart. Each one draws a line to follow the points. "
        "Machine A’s line passes exactly through every point: zero mistakes. Machine B’s line misses most points by a little.",
        "दो मशीनों को एक चार्ट के उन्हीं 10 बिंदुओं पर ट्रेन किया गया। हर मशीन बिंदुओं के साथ-साथ चलती एक रेखा खींचती है। "
        "मशीन A की रेखा हर बिंदु से ठीक होकर गुज़रती है: एक भी ग़लती नहीं। मशीन B की रेखा ज़्यादातर बिंदुओं से थोड़ा-सा चूक जाती है।",
        "రెండు యంత్రాలకు ఒక చార్ట్‌లోని అవే 10 బిందువులపై ట్రైనింగ్ ఇచ్చారు. ప్రతి యంత్రం బిందువులను అనుసరిస్తూ ఒక రేఖ గీస్తుంది. "
        "యంత్రం A రేఖ ప్రతి బిందువు గుండా సరిగ్గా వెళ్తుంది: ఒక్క తప్పు కూడా లేదు. యంత్రం B రేఖ చాలా బిందువులను కొంచెం తప్పిపోతుంది.",
    ),
    "hook.q": (
        "Then both get new points they have never seen. Which machine will make smaller mistakes?",
        "फिर दोनों को ऐसे नए बिंदु मिलते हैं जो उन्होंने पहले कभी नहीं देखे। कौन-सी मशीन छोटी ग़लतियाँ करेगी?",
        "తర్వాత రెండింటికీ ఇంతకు ముందు ఎప్పుడూ చూడని కొత్త బిందువులు వస్తాయి. ఏ యంత్రం చిన్న తప్పులు చేస్తుంది?",
    ),
    # ---------- predict ----------
    "predict.prompt": (
        "New points arrive. Which machine will make smaller mistakes on them?",
        "नए बिंदु आते हैं। उन पर कौन-सी मशीन छोटी ग़लतियाँ करेगी?",
        "కొత్త బిందువులు వచ్చాయి. వాటిపై ఏ యంత్రం చిన్న తప్పులు చేస్తుంది?",
    ),
    "predict.c1": (
        "Machine A, because it was perfect on the first points",
        "मशीन A, क्योंकि वह पहले वाले बिंदुओं पर एकदम सही थी",
        "యంత్రం A, ఎందుకంటే మొదటి బిందువులపై అది పూర్తిగా సరిగ్గా ఉంది",
    ),
    "predict.c2": (
        "Machine B, the one that missed a little",
        "मशीन B, जो थोड़ा-सा चूकी थी",
        "యంత్రం B, కొంచెం తప్పిపోయినది",
    ),
    "predict.c3": (
        "Both the same, because they were trained on the same points",
        "दोनों बराबर, क्योंकि दोनों को उन्हीं बिंदुओं पर ट्रेन किया गया था",
        "రెండూ సమానం, ఎందుకంటే రెండింటికీ అవే బిందువులపై ట్రైనింగ్ ఇచ్చారు",
    ),
    "predict.f1": (
        "Perfect does sound best. But perfect on old points can mean copying them, random wobbles and all. You will test this yourself.",
        "एकदम सही सुनने में सबसे अच्छा लगता है। पर पुराने बिंदुओं पर एकदम सही होने का मतलब उनकी नकल भी हो सकता है, उनकी बेतरतीब डगमगाहट समेत। आप इसे ख़ुद परखेंगे।",
        "పూర్తిగా సరిగ్గా అనేది వినడానికి ఉత్తమంగా అనిపిస్తుంది. కానీ పాత బిందువులపై పూర్తిగా సరిగ్గా ఉండడం అంటే వాటిని కాపీ చేయడం కావచ్చు, వాటిలోని యాదృచ్ఛిక ఒడిదొడుకులతో సహా. మీరే దీన్ని పరీక్షిస్తారు.",
    ),
    "predict.f3": (
        "Same points, yes. But two machines can take very different things from the same points. Soon you will see what each one takes.",
        "हाँ, बिंदु वही हैं। पर दो मशीनें उन्हीं बिंदुओं से बहुत अलग-अलग चीज़ें ले सकती हैं। जल्द ही आप देखेंगे कि हर एक क्या लेती है।",
        "అవును, బిందువులు అవే. కానీ రెండు యంత్రాలు అవే బిందువుల నుండి చాలా వేర్వేరు విషయాలు తీసుకోవచ్చు. ప్రతి ఒక్కటి ఏమి తీసుకుంటుందో త్వరలో మీరు చూస్తారు.",
    ),
    "predict.reveal": (
        "Usually Machine B. Being perfect on the points it was trained on is not the goal. Doing well on new points is. You will build both machines and see why.",
        "आमतौर पर मशीन B। जिन बिंदुओं पर ट्रेनिंग हुई, उन पर एकदम सही होना लक्ष्य नहीं है। नए बिंदुओं पर अच्छा करना लक्ष्य है। आप दोनों मशीनें बनाएँगे और देखेंगे कि ऐसा क्यों है।",
        "సాధారణంగా యంత్రం B. ట్రైనింగ్ ఇచ్చిన బిందువులపై పూర్తిగా సరిగ్గా ఉండడం లక్ష్యం కాదు. కొత్త బిందువులపై బాగా చేయడమే లక్ష్యం. మీరు రెండు యంత్రాలనూ నిర్మించి ఎందుకో చూస్తారు.",
    ),
    # ---------- manipulate: one neuron (knob) ----------
    "nr.prompt": (
        "Machines like these are called <term-neural-network>neural networks</term-neural-network>. "
        "They are built from tiny calculators called <term-neuron>neurons</term-neuron>. "
        "A neuron takes in some numbers. It multiplies each number by its own <term-weight>weight</term-weight>. "
        "Then it adds everything up. Here is one neuron. Three clues about an animal come in: 1 means yes, 0 means no.",
        "ऐसी मशीनों को <term-neural-network>न्यूरल नेटवर्क</term-neural-network> कहते हैं। "
        "ये <term-neuron>न्यूरॉन</term-neuron> नाम के छोटे-छोटे कैलकुलेटरों से बनती हैं। "
        "एक न्यूरॉन कुछ संख्याएँ लेता है। वह हर संख्या को उसके अपने <term-weight>वेट</term-weight> से गुणा करता है। "
        "फिर सब कुछ जोड़ देता है। यह रहा एक न्यूरॉन। किसी जानवर के बारे में तीन सुराग आते हैं: 1 यानी हाँ, 0 यानी नहीं।",
        "ఇలాంటి యంత్రాలను <term-neural-network>న్యూరల్ నెట్‌వర్క్‌లు</term-neural-network> అంటారు. "
        "అవి <term-neuron>న్యూరాన్లు</term-neuron> అనే చిన్న చిన్న కాలిక్యులేటర్లతో తయారవుతాయి. "
        "ఒక న్యూరాన్ కొన్ని సంఖ్యలను తీసుకుంటుంది. ప్రతి సంఖ్యను దాని సొంత <term-weight>వెయిట్</term-weight>తో గుణిస్తుంది. "
        "తర్వాత అన్నింటినీ కలుపుతుంది. ఇదిగో ఒక న్యూరాన్. ఒక జంతువు గురించి మూడు ఆధారాలు వస్తాయి: 1 అంటే అవును, 0 అంటే కాదు.",
    ),
    "nr.ears": (
        "Pointy ears (weight 2)",
        "नुकीले कान (वेट 2)",
        "మొనదేలిన చెవులు (వెయిట్ 2)",
    ),
    "nr.whiskers": (
        "Whiskers (weight 3)",
        "मूँछें (वेट 3)",
        "మీసాలు (వెయిట్ 3)",
    ),
    "nr.barks": (
        "Barks (weight minus 4)",
        "भौंकता है (वेट माइनस 4)",
        "మొరుగుతుంది (వెయిట్ మైనస్ 4)",
    ),
    "nr.output": (
        "Cat score",
        "बिल्ली स्कोर",
        "పిల్లి స్కోరు",
    ),
    "nr.goal": (
        "Challenge: switch the clues on or off to get the highest cat score you can.",
        "चुनौती: सुरागों को चालू या बंद करके सबसे ऊँचा बिल्ली स्कोर पाइए।",
        "సవాలు: ఆధారాలను ఆన్ లేదా ఆఫ్ చేసి వీలైనంత ఎక్కువ పిల్లి స్కోరు సాధించండి.",
    ),
    "nr.success": (
        "Top score: 2 × 1 + 3 × 1 + (minus 4) × 0 = 5. (× means times.) Each clue counts as much as its weight. "
        "A minus weight pulls the score down. In a real network, nobody types the weights in. "
        "<term-training>Training</term-training> finds them.",
        "सबसे ऊँचा स्कोर: 2 × 1 + 3 × 1 + (माइनस 4) × 0 = 5। (× यानी गुणा।) हर सुराग उतना ही गिना जाता है जितना उसका वेट है। "
        "माइनस वेट स्कोर को नीचे खींचता है। असली नेटवर्क में कोई भी वेट हाथ से नहीं लिखता। "
        "<term-training>ट्रेनिंग</term-training> उन्हें ढूँढती है।",
        "అత్యధిక స్కోరు: 2 × 1 + 3 × 1 + (మైనస్ 4) × 0 = 5. (× అంటే గుణకారం.) ప్రతి ఆధారం దాని వెయిట్ అంత లెక్కలోకి వస్తుంది. "
        "మైనస్ వెయిట్ స్కోరును కిందకు లాగుతుంది. నిజమైన నెట్‌వర్క్‌లో వెయిట్‌లను ఎవరూ చేత్తో రాయరు. "
        "<term-training>ట్రైనింగ్</term-training> వాటిని కనుగొంటుంది.",
    ),
    # ---------- manipulate: hillside ----------
    "hs.prompt": (
        "How does training find good weights? Picture a network with one weight. Each spot on this hill is one value for that weight. "
        "The height is the <term-error>error</term-error>: how far the network’s answers are from the right ones. "
        "You are in fog, so you can only feel the slope.",
        "ट्रेनिंग अच्छे वेट कैसे ढूँढती है? एक वेट वाले नेटवर्क की कल्पना कीजिए। इस पहाड़ी की हर जगह उस वेट का एक मान है। "
        "ऊँचाई <term-error>ग़लती (एरर)</term-error> है: नेटवर्क के जवाब सही जवाबों से कितनी दूर हैं। "
        "आप कोहरे में हैं, इसलिए आप सिर्फ़ ढलान महसूस कर सकते हैं।",
        "ట్రైనింగ్ మంచి వెయిట్‌లను ఎలా కనుగొంటుంది? ఒకే వెయిట్ ఉన్న నెట్‌వర్క్‌ను ఊహించండి. ఈ కొండపై ప్రతి చోటు ఆ వెయిట్‌కు ఒక విలువ. "
        "ఎత్తు అంటే <term-error>పొరపాటు (ఎర్రర్)</term-error>: నెట్‌వర్క్ జవాబులు సరైన జవాబులకు ఎంత దూరంగా ఉన్నాయో. "
        "మీరు పొగమంచులో ఉన్నారు, కాబట్టి వాలును మాత్రమే అనుభవించగలరు.",
    ),
    "hs.left": (
        "Step left (smaller weight)",
        "बाएँ क़दम (छोटा वेट)",
        "ఎడమకు అడుగు (చిన్న వెయిట్)",
    ),
    "hs.right": (
        "Step right (bigger weight)",
        "दाएँ क़दम (बड़ा वेट)",
        "కుడికి అడుగు (పెద్ద వెయిట్)",
    ),
    "hs.goal": (
        "Goal: reach the lowest error in as few steps as you can.",
        "लक्ष्य: जितने कम क़दमों में हो सके, सबसे कम ग़लती तक पहुँचिए।",
        "లక్ష్యం: వీలైనన్ని తక్కువ అడుగుల్లో అతి తక్కువ పొరపాటుకు చేరండి.",
    ),
    "hs.fade": (
        "The second chart shows your height after each step. This is a <term-loss-curve>loss curve</term-loss-curve>. "
        "Loss is another name for error. Training takes steps like yours for every weight at once, again and again. "
        "Unlike you, the computer does not feel the ground. It calculates the slope from numbers. "
        "With good steps, the curve goes down.",
        "दूसरा चार्ट हर क़दम के बाद आपकी ऊँचाई दिखाता है। इसे <term-loss-curve>लॉस-वक्र</term-loss-curve> कहते हैं। "
        "लॉस ग़लती का ही दूसरा नाम है। ट्रेनिंग हर वेट के लिए एक साथ आपके जैसे क़दम लेती है, बार-बार। "
        "आपकी तरह कंप्यूटर ज़मीन महसूस नहीं करता। वह संख्याओं से ढलान का हिसाब लगाता है। "
        "क़दम अच्छे हों, तो वक्र नीचे जाता है।",
        "రెండో చార్ట్ ప్రతి అడుగు తర్వాత మీ ఎత్తును చూపిస్తుంది. దీన్ని <term-loss-curve>లాస్ వక్రరేఖ</term-loss-curve> అంటారు. "
        "లాస్ అనేది పొరపాటుకు మరో పేరు. ట్రైనింగ్ ప్రతి వెయిట్‌కూ ఒకేసారి మీలాంటి అడుగులు వేస్తుంది, మళ్లీ మళ్లీ. "
        "మీలా కంప్యూటర్ నేలను అనుభవించదు. అది సంఖ్యల నుండి వాలును లెక్కిస్తుంది. "
        "అడుగులు బాగుంటే, వక్రరేఖ కిందకు వెళ్తుంది.",
    ),
    # ---------- manipulate: relay analogy (layers) ----------
    "rl.title": (
        "Detectives in a relay",
        "रिले में जासूस",
        "రిలేలో డిటెక్టివ్‌లు",
    ),
    "rl.source": (
        "Three detectives study one photo, in a relay. The first finds small marks: lines and edges. She passes her notes on. "
        "The second joins the marks into shapes. The third joins the shapes into a face and gives the answer.",
        "तीन जासूस एक ही फ़ोटो को रिले की तरह जाँचते हैं। पहली जासूस छोटे निशान ढूँढती है: रेखाएँ और किनारे। वह अपने नोट्स आगे दे देती है। "
        "दूसरा उन निशानों को जोड़कर आकार बनाता है। तीसरा आकारों को जोड़कर चेहरा बनाता है और जवाब देता है।",
        "ముగ్గురు డిటెక్టివ్‌లు ఒకే ఫోటోను రిలే లాగా పరిశీలిస్తారు. మొదటి డిటెక్టివ్ చిన్న గుర్తులు కనుగొంటుంది: గీతలు, అంచులు. ఆమె తన నోట్స్‌ను ముందుకు ఇస్తుంది. "
        "రెండో డిటెక్టివ్ ఆ గుర్తులను కలిపి ఆకారాలు చేస్తాడు. మూడో డిటెక్టివ్ ఆకారాలను కలిపి ముఖాన్ని గుర్తించి జవాబు ఇస్తాడు.",
    ),
    "rl.m1s": ("The photo", "फ़ोटो", "ఫోటో"),
    "rl.m1t": (
        "The numbers that go in: one for each <term-pixel>pixel</term-pixel>",
        "अंदर जाने वाली संख्याएँ: हर <term-pixel>पिक्सेल</term-pixel> के लिए एक",
        "లోపలికి వెళ్లే సంఖ్యలు: ప్రతి <term-pixel>పిక్సెల్</term-pixel>కు ఒకటి",
    ),
    "rl.m2s": ("One detective", "एक जासूस", "ఒక డిటెక్టివ్"),
    "rl.m2t": (
        "One <term-layer>layer</term-layer>: a group of neurons working side by side",
        "एक <term-layer>परत</term-layer>: साथ-साथ काम करते न्यूरॉनों का एक समूह",
        "ఒక <term-layer>పొర</term-layer>: పక్కపక్కనే పనిచేసే న్యూరాన్ల గుంపు",
    ),
    "rl.m3s": ("Notes passed to the next detective", "अगले जासूस को दिए गए नोट्स", "తర్వాతి డిటెక్టివ్‌కు ఇచ్చిన నోట్స్"),
    "rl.m3t": ("Numbers passed to the next layer", "अगली परत को दी गई संख्याएँ", "తర్వాతి పొరకు ఇచ్చిన సంఖ్యలు"),
    "rl.m4s": ("The final answer", "आख़िरी जवाब", "చివరి జవాబు"),
    "rl.m4t": (
        "The network’s output: its result, such as “face” or “no face”",
        "नेटवर्क का आउटपुट: उसका नतीजा, जैसे “चेहरा” या “चेहरा नहीं”",
        "నెట్‌వర్క్ అవుట్‌పుట్: దాని ఫలితం, ఉదాహరణకు “ముఖం” లేదా “ముఖం కాదు”",
    ),
    "rl.break": (
        "Here it stops working. Nobody gives real layers jobs like “find edges”. Training sets the weights. "
        "Many neurons then respond to mixtures nobody can name. In picture networks, early layers often respond to edges. "
        "People found that by testing trained networks, not by assigning it. "
        "And detectives understand what they see. Layers only multiply and add numbers.",
        "यहाँ तुलना काम करना बंद कर देती है। असली परतों को कोई “किनारे ढूँढो” जैसा काम नहीं देता। वेट ट्रेनिंग तय करती है। "
        "फिर कई न्यूरॉन ऐसे मेलजोल पर प्रतिक्रिया देते हैं जिसका कोई नाम नहीं रख सकता। चित्र वाले नेटवर्कों में शुरुआती परतें अक्सर किनारों पर प्रतिक्रिया देती हैं। "
        "यह लोगों ने ट्रेन हो चुके नेटवर्कों को परखकर पाया, किसी ने यह काम सौंपा नहीं था। "
        "और जासूस जो देखते हैं उसे समझते हैं। परतें सिर्फ़ संख्याओं को गुणा करती और जोड़ती हैं।",
        "ఇక్కడ పోలిక పనిచేయడం ఆగిపోతుంది. నిజమైన పొరలకు “అంచులు కనుగొను” లాంటి పనులు ఎవరూ ఇవ్వరు. వెయిట్‌లను ట్రైనింగ్ నిర్ణయిస్తుంది. "
        "తర్వాత చాలా న్యూరాన్లు ఎవరూ పేరు పెట్టలేని మిశ్రమాలకు స్పందిస్తాయి. చిత్రాల నెట్‌వర్క్‌లలో మొదటి పొరలు తరచుగా అంచులకు స్పందిస్తాయి. "
        "ట్రైనింగ్ అయిన నెట్‌వర్క్‌లను పరీక్షించి ప్రజలు దీన్ని కనుగొన్నారు, ఎవరూ ఆ పని అప్పగించలేదు. "
        "డిటెక్టివ్‌లు తాము చూసేదాన్ని అర్థం చేసుకుంటారు. పొరలు సంఖ్యలను గుణించి కలుపుతాయి, అంతే.",
    ),
    "rl.f1": (
        "Photo → detective 1 → detective 2 → detective 3 → answer. (→ means “passes to”.)",
        "फ़ोटो → जासूस 1 → जासूस 2 → जासूस 3 → जवाब। (→ यानी “आगे देता है”।)",
        "ఫోటో → డిటెక్టివ్ 1 → డిటెక్టివ్ 2 → డిటెక్టివ్ 3 → జవాబు. (→ అంటే “ముందుకు ఇస్తుంది”.)",
    ),
    "rl.f2": (
        "Pixel numbers → layer 1 → layer 2 → layer 3 → output",
        "पिक्सेल संख्याएँ → परत 1 → परत 2 → परत 3 → आउटपुट",
        "పిక్సెల్ సంఖ్యలు → పొర 1 → పొర 2 → పొర 3 → అవుట్‌పుట్",
    ),
    "rl.f3": (
        "Each arrow stands for many weights. Every neuron in a layer adds up the numbers from the layer before, each times its own weight.",
        "हर तीर कई वेट के लिए है। परत का हर न्यूरॉन पिछली परत की संख्याओं को जोड़ता है, हर एक को उसके अपने वेट से गुणा करके।",
        "ప్రతి బాణం చాలా వెయిట్‌లను సూచిస్తుంది. పొరలోని ప్రతి న్యూరాన్ ముందటి పొర సంఖ్యలను కలుపుతుంది, ప్రతిదాన్ని దాని సొంత వెయిట్‌తో గుణించి.",
    ),
    # ---------- manipulate: layer-builder ----------
    "lb.prompt": (
        "Your turn to build. The points follow a hidden pattern of flat steps, plus random wobbles called <term-noise>noise</term-noise>. "
        "Circles are training points. Squares are new points, kept aside for testing. "
        "Train three networks, one after another. First, the one shown: 1 layer of 3 neurons. "
        "Next, 1 layer of 1 neuron. Last, 3 layers of 16 neurons. Before each run, make your prediction.",
        "अब आपकी बारी है बनाने की। बिंदु सीढ़ियों जैसे एक छिपे पैटर्न पर चलते हैं, साथ में कुछ बेतरतीब डगमगाहट भी है, जिसे <term-noise>शोर</term-noise> कहते हैं। "
        "गोले ट्रेनिंग बिंदु हैं। चौकोर नए बिंदु हैं, जो जाँच के लिए अलग रखे गए हैं। "
        "एक के बाद एक, तीन नेटवर्क ट्रेन कीजिए। पहले, जो दिख रहा है: 1 परत, 3 न्यूरॉन। "
        "फिर, 1 परत, 1 न्यूरॉन। आख़िर में, 3 परतें, हर एक में 16 न्यूरॉन। हर बार ट्रेन करने से पहले अपना अनुमान लगाइए।",
        "ఇప్పుడు నిర్మించడం మీ వంతు. బిందువులు మెట్ల లాంటి ఒక దాగిన ప్యాటర్న్‌ను అనుసరిస్తాయి, వాటితో పాటు కొన్ని యాదృచ్ఛిక ఒడిదొడుకులు ఉన్నాయి, వాటిని <term-noise>శబ్దం</term-noise> అంటారు. "
        "వృత్తాలు ట్రైనింగ్ బిందువులు. చతురస్రాలు కొత్త బిందువులు, పరీక్ష కోసం పక్కన ఉంచినవి. "
        "ఒకదాని తర్వాత ఒకటి, మూడు నెట్‌వర్క్‌లకు ట్రైనింగ్ ఇవ్వండి. మొదట, కనిపిస్తున్నది: 1 పొర, 3 న్యూరాన్లు. "
        "తర్వాత, 1 పొర, 1 న్యూరాన్. చివరగా, 3 పొరలు, ఒక్కోదానిలో 16 న్యూరాన్లు. ప్రతిసారి ట్రైనింగ్‌కు ముందు మీ అంచనా వేయండి.",
    ),
    "lb.classPrompt": (
        "Two networks will train on the same 15 points. The points follow a hidden pattern of flat steps, plus random wobbles called noise. "
        "Circles are training points. Squares are new points, kept aside for testing.",
        "दो नेटवर्क उन्हीं 15 बिंदुओं पर ट्रेन होंगे। बिंदु सीढ़ियों जैसे एक छिपे पैटर्न पर चलते हैं, साथ में बेतरतीब डगमगाहट है, जिसे शोर कहते हैं। "
        "गोले ट्रेनिंग बिंदु हैं। चौकोर नए बिंदु हैं, जो जाँच के लिए अलग रखे गए हैं।",
        "రెండు నెట్‌వర్క్‌లు అవే 15 బిందువులపై ట్రైనింగ్ పొందుతాయి. బిందువులు మెట్ల లాంటి దాగిన ప్యాటర్న్‌ను అనుసరిస్తాయి, వాటితో పాటు యాదృచ్ఛిక ఒడిదొడుకులు ఉన్నాయి, వాటిని శబ్దం అంటారు. "
        "వృత్తాలు ట్రైనింగ్ బిందువులు. చతురస్రాలు కొత్త బిందువులు, పరీక్ష కోసం పక్కన ఉంచినవి.",
    ),
    "lb.explain": (
        "Too small, and both errors stay high. That is <term-underfitting>underfitting</term-underfitting>. "
        "Too big for 15 points, and training error falls to about 0 while new-point error rises. "
        "That is <term-overfitting>overfitting</term-overfitting>. "
        "Doing well on new points is called <term-generalisation>generalisation</term-generalisation>. It is the real goal.",
        "नेटवर्क बहुत छोटा हो, तो दोनों ग़लतियाँ ऊँची रहती हैं। इसे <term-underfitting>अंडरफ़िटिंग</term-underfitting> कहते हैं। "
        "15 बिंदुओं के लिए बहुत बड़ा हो, तो ट्रेनिंग की ग़लती लगभग 0 हो जाती है, पर नए बिंदुओं की ग़लती बढ़ जाती है। "
        "इसे <term-overfitting>ओवरफ़िटिंग</term-overfitting> कहते हैं। "
        "नए बिंदुओं पर अच्छा करने को <term-generalisation>जनरलाइज़ेशन</term-generalisation> कहते हैं। असली लक्ष्य यही है।",
        "నెట్‌వర్క్ మరీ చిన్నదైతే, రెండు పొరపాట్లూ ఎక్కువగానే ఉంటాయి. దీన్ని <term-underfitting>అండర్‌ఫిట్టింగ్</term-underfitting> అంటారు. "
        "15 బిందువులకు మరీ పెద్దదైతే, ట్రైనింగ్ పొరపాటు దాదాపు 0కి పడిపోతుంది, కానీ కొత్త బిందువుల పొరపాటు పెరుగుతుంది. "
        "దీన్ని <term-overfitting>ఓవర్‌ఫిట్టింగ్</term-overfitting> అంటారు. "
        "కొత్త బిందువులపై బాగా చేయడాన్ని <term-generalisation>జనరలైజేషన్</term-generalisation> అంటారు. అసలు లక్ష్యం అదే.",
    ),
    "lb.small": (
        "Small network: 1 layer of 2 neurons",
        "छोटा नेटवर्क: 1 परत, 2 न्यूरॉन",
        "చిన్న నెట్‌వర్క్: 1 పొర, 2 న్యూరాన్లు",
    ),
    "lb.big": (
        "Big network: 3 layers of 16 neurons",
        "बड़ा नेटवर्क: 3 परतें, हर एक में 16 न्यूरॉन",
        "పెద్ద నెట్‌వర్క్: 3 పొరలు, ఒక్కోదానిలో 16 న్యూరాన్లు",
    ),
    # ---------- explain: exam analogy ----------
    "ex.title": (
        "Memorising last year’s paper",
        "पिछले साल का पर्चा रटना",
        "పోయిన ఏడాది ప్రశ్నపత్రాన్ని బట్టీ పట్టడం",
    ),
    "ex.source": (
        "Two students prepare for a maths exam. One memorises last year’s paper, answer by answer, even its misprints. "
        "The other practises the methods behind the questions. This year, the questions are new.",
        "दो विद्यार्थी गणित की परीक्षा की तैयारी करते हैं। एक पिछले साल का पर्चा रट लेता है, हर जवाब, उसकी छपाई की ग़लतियों समेत। "
        "दूसरा सवालों के पीछे के तरीक़ों का अभ्यास करता है। इस साल सवाल नए हैं।",
        "ఇద్దరు విద్యార్థులు లెక్కల పరీక్షకు సిద్ధమవుతున్నారు. ఒకడు పోయిన ఏడాది ప్రశ్నపత్రాన్ని ప్రతి జవాబుతో సహా బట్టీ పడతాడు, అందులోని అచ్చు తప్పులతో సహా. "
        "మరొకడు ప్రశ్నల వెనుక ఉన్న పద్ధతులను సాధన చేస్తాడు. ఈ ఏడాది ప్రశ్నలు కొత్తవి.",
    ),
    "ex.m1s": ("Last year’s paper", "पिछले साल का पर्चा", "పోయిన ఏడాది ప్రశ్నపత్రం"),
    "ex.m1t": ("The training points", "ट्रेनिंग बिंदु", "ట్రైనింగ్ బిందువులు"),
    "ex.m2s": ("The misprints in that paper", "उस पर्चे की छपाई की ग़लतियाँ", "ఆ ప్రశ్నపత్రంలోని అచ్చు తప్పులు"),
    "ex.m2t": ("The noise in the training points", "ट्रेनिंग बिंदुओं का शोर", "ట్రైనింగ్ బిందువులలోని శబ్దం"),
    "ex.m3s": ("Memorising every answer, misprints too", "हर जवाब रटना, ग़लतियाँ भी", "ప్రతి జవాబును బట్టీ పట్టడం, తప్పులతో సహా"),
    "ex.m3t": (
        "Overfitting: copying the training points, noise and all",
        "ओवरफ़िटिंग: ट्रेनिंग बिंदुओं की नकल, शोर समेत",
        "ఓవర్‌ఫిట్టింగ్: ట్రైనింగ్ బిందువులను శబ్దంతో సహా కాపీ చేయడం",
    ),
    "ex.m4s": ("Learning the methods", "तरीक़े सीखना", "పద్ధతులను నేర్చుకోవడం"),
    "ex.m4t": ("Generalisation: catching the pattern", "जनरलाइज़ेशन: पैटर्न पकड़ना", "జనరలైజేషన్: ప్యాటర్న్‌ను పట్టుకోవడం"),
    "ex.m5s": ("This year’s new questions", "इस साल के नए सवाल", "ఈ ఏడాది కొత్త ప్రశ్నలు"),
    "ex.m5t": ("New points the network has never seen", "नए बिंदु जो नेटवर्क ने कभी नहीं देखे", "నెట్‌వర్క్ ఎప్పుడూ చూడని కొత్త బిందువులు"),
    "ex.break": (
        "Here it stops working. A student can choose to memorise or to understand. A network chooses nothing. "
        "Training only changes its weights to lower the error on the training points. "
        "Whether it ends up copying depends on things like its size and its data, and people choose those. "
        "Also, some memorising is useful, like formulas. The trouble is memorising instead of learning the method.",
        "यहाँ तुलना काम करना बंद कर देती है। विद्यार्थी चुन सकता है कि रटे या समझे। नेटवर्क कुछ नहीं चुनता। "
        "ट्रेनिंग सिर्फ़ उसके वेट बदलती है, ताकि ट्रेनिंग बिंदुओं पर ग़लती घटे। "
        "वह नकल पर पहुँचेगा या नहीं, यह उसके आकार और डेटा जैसी चीज़ों पर निर्भर है, और ये लोग चुनते हैं। "
        "और कुछ रटना काम का भी होता है, जैसे सूत्र। मुश्किल तब है जब तरीक़ा सीखने की जगह रटा जाए।",
        "ఇక్కడ పోలిక పనిచేయడం ఆగిపోతుంది. విద్యార్థి బట్టీ పట్టాలో, అర్థం చేసుకోవాలో ఎంచుకోగలరు. నెట్‌వర్క్ ఏమీ ఎంచుకోదు. "
        "ట్రైనింగ్ బిందువులపై పొరపాటును తగ్గించడానికి ట్రైనింగ్ దాని వెయిట్‌లను మారుస్తుంది, అంతే. "
        "అది కాపీ చేసే స్థితికి చేరుతుందా అనేది దాని పరిమాణం, డేటా లాంటి వాటిపై ఆధారపడుతుంది, వాటిని మనుషులే ఎంచుకుంటారు. "
        "అలాగే కొంత బట్టీ ఉపయోగకరమే, సూత్రాల్లాగా. పద్ధతి నేర్చుకునే బదులు బట్టీ పట్టడమే సమస్య.",
    ),
    "ex.f1": (
        "Last year’s paper → memorise it, or learn the methods → this year’s new questions",
        "पिछले साल का पर्चा → उसे रटो, या तरीक़े सीखो → इस साल के नए सवाल",
        "పోయిన ఏడాది ప్రశ్నపత్రం → బట్టీ పట్టడం, లేదా పద్ధతులు నేర్చుకోవడం → ఈ ఏడాది కొత్త ప్రశ్నలు",
    ),
    "ex.f2": (
        "Training points → copy them, or catch the pattern → new points",
        "ट्रेनिंग बिंदु → उनकी नकल, या पैटर्न पकड़ना → नए बिंदु",
        "ట్రైనింగ్ బిందువులు → వాటిని కాపీ చేయడం, లేదా ప్యాటర్న్‌ను పట్టుకోవడం → కొత్త బిందువులు",
    ),
    "ex.f3": (
        "Training error near 0 and new-point error high → overfitting. Both errors low and close → generalisation.",
        "ट्रेनिंग की ग़लती लगभग 0 और नए बिंदुओं की ग़लती ऊँची → ओवरफ़िटिंग। दोनों ग़लतियाँ कम और पास-पास → जनरलाइज़ेशन।",
        "ట్రైనింగ్ పొరపాటు దాదాపు 0, కొత్త బిందువుల పొరపాటు ఎక్కువ → ఓవర్‌ఫిట్టింగ్. రెండు పొరపాట్లూ తక్కువగా, దగ్గరగా → జనరలైజేషన్.",
    ),
    # ---------- explain: sieve analogy ----------
    "sv.title": (
        "Sieves of different sizes",
        "अलग-अलग आकार की छलनियाँ",
        "వేర్వేరు పరిమాణాల జల్లెడలు",
    ),
    "sv.source": (
        "You have rice mixed with fine dust. You shake it in a sieve to keep the rice and lose the dust. "
        "The size of the holes decides what stays.",
        "आपके पास चावल है जिसमें बारीक धूल मिली है। आप उसे छलनी में हिलाते हैं, ताकि चावल रह जाए और धूल निकल जाए। "
        "छेदों का आकार तय करता है कि क्या बचेगा।",
        "మీ దగ్గర సన్నని దుమ్ము కలిసిన బియ్యం ఉంది. బియ్యం ఉంచి దుమ్మును వదిలించడానికి మీరు దాన్ని జల్లెడలో జల్లిస్తారు. "
        "రంధ్రాల పరిమాణమే ఏది మిగులుతుందో నిర్ణయిస్తుంది.",
    ),
    "sv.m1s": ("The rice", "चावल", "బియ్యం"),
    "sv.m1t": ("The real pattern (the steps)", "असली पैटर्न (सीढ़ियाँ)", "అసలు ప్యాటర్న్ (మెట్లు)"),
    "sv.m2s": ("The dust", "धूल", "దుమ్ము"),
    "sv.m2t": ("The noise", "शोर", "శబ్దం"),
    "sv.m3s": ("Holes so big that the rice falls through", "इतने बड़े छेद कि चावल भी गिर जाए", "బియ్యం కూడా జారిపోయేంత పెద్ద రంధ్రాలు"),
    "sv.m3t": (
        "A network too small to hold the pattern: underfitting",
        "पैटर्न पकड़ने के लिए बहुत छोटा नेटवर्क: अंडरफ़िटिंग",
        "ప్యాటర్న్‌ను పట్టుకోలేనంత చిన్న నెట్‌వర్క్: అండర్‌ఫిట్టింగ్",
    ),
    "sv.m4s": ("Holes so tiny that the dust stays too", "इतने बारीक छेद कि धूल भी रह जाए", "దుమ్ము కూడా మిగిలిపోయేంత చిన్న రంధ్రాలు"),
    "sv.m4t": (
        "A network so big it holds the noise too: overfitting",
        "इतना बड़ा नेटवर्क कि शोर भी पकड़ ले: ओवरफ़िटिंग",
        "శబ్దాన్ని కూడా పట్టుకునేంత పెద్ద నెట్‌వర్క్: ఓవర్‌ఫిట్టింగ్",
    ),
    "sv.m5s": ("The right holes: rice stays, dust falls", "सही छेद: चावल रहे, धूल गिरे", "సరైన రంధ్రాలు: బియ్యం మిగులుతుంది, దుమ్ము పోతుంది"),
    "sv.m5t": ("The right size: pattern kept, noise dropped", "सही आकार: पैटर्न रहे, शोर छूटे", "సరైన పరిమాణం: ప్యాటర్న్ మిగులుతుంది, శబ్దం పోతుంది"),
    "sv.break": (
        "Here it stops working. You can see rice and dust, so you can pick a sieve by looking. "
        "A network cannot tell pattern from noise in its training points. "
        "Only testing on new points shows the difference. And size is not the only fix: more points help too.",
        "यहाँ तुलना काम करना बंद कर देती है। आप चावल और धूल देख सकते हैं, इसलिए देखकर छलनी चुन सकते हैं। "
        "नेटवर्क अपने ट्रेनिंग बिंदुओं में पैटर्न और शोर का फ़र्क नहीं कर सकता। "
        "यह फ़र्क सिर्फ़ नए बिंदुओं पर जाँचने से दिखता है। और आकार ही अकेला उपाय नहीं: ज़्यादा बिंदु भी मदद करते हैं।",
        "ఇక్కడ పోలిక పనిచేయడం ఆగిపోతుంది. మీరు బియ్యాన్ని, దుమ్మును చూడగలరు, కాబట్టి చూసి జల్లెడను ఎంచుకోగలరు. "
        "నెట్‌వర్క్ తన ట్రైనింగ్ బిందువులలో ప్యాటర్న్‌కు, శబ్దానికి తేడా గుర్తించలేదు. "
        "కొత్త బిందువులపై పరీక్షిస్తేనే ఆ తేడా కనిపిస్తుంది. పరిమాణం ఒక్కటే పరిష్కారం కాదు: ఎక్కువ బిందువులు కూడా సాయపడతాయి.",
    ),
    "sv.f1": (
        "Big holes → no rice. Right holes → rice only. Tiny holes → rice and dust.",
        "बड़े छेद → चावल नहीं बचा। सही छेद → सिर्फ़ चावल। बारीक छेद → चावल और धूल।",
        "పెద్ద రంధ్రాలు → బియ్యం మిగలదు. సరైన రంధ్రాలు → బియ్యం మాత్రమే. చిన్న రంధ్రాలు → బియ్యం, దుమ్ము రెండూ.",
    ),
    "sv.f2": (
        "1 neuron → misses the steps. 3 neurons → finds the steps. 3 layers of 16 → finds the steps and the noise.",
        "1 न्यूरॉन → सीढ़ियाँ छूट जाती हैं। 3 न्यूरॉन → सीढ़ियाँ मिल जाती हैं। 3 परतें, हर एक में 16 न्यूरॉन → सीढ़ियाँ और शोर, दोनों।",
        "1 న్యూరాన్ → మెట్లు దొరకవు. 3 న్యూరాన్లు → మెట్లు దొరుకుతాయి. 16 న్యూరాన్ల 3 పొరలు → మెట్లు, శబ్దం రెండూ.",
    ),
    "sv.f3": (
        "Underfitting: both errors high. Good fit: both low and close. Overfitting: training error near 0, new-point error high.",
        "अंडरफ़िटिंग: दोनों ग़लतियाँ ऊँची। अच्छा फ़िट: दोनों कम और पास-पास। ओवरफ़िटिंग: ट्रेनिंग की ग़लती लगभग 0, नए बिंदुओं की ग़लती ऊँची।",
        "అండర్‌ఫిట్టింగ్: రెండు పొరపాట్లూ ఎక్కువ. మంచి ఫిట్: రెండూ తక్కువ, దగ్గరగా. ఓవర్‌ఫిట్టింగ్: ట్రైనింగ్ పొరపాటు దాదాపు 0, కొత్త బిందువుల పొరపాటు ఎక్కువ.",
    ),
    # ---------- explain (deeper): building analogy ----------
    "bd.title": ("From bricks to a house", "ईंटों से घर तक", "ఇటుకల నుండి ఇంటి వరకు"),
    "bd.source": (
        "Builders lay bricks into walls. Walls make rooms. Rooms make a house. Each stage builds on the one before.",
        "मिस्त्री ईंटों से दीवारें बनाते हैं। दीवारों से कमरे बनते हैं। कमरों से घर बनता है। हर चरण पिछले चरण पर टिका है।",
        "మేస్త్రీలు ఇటుకలతో గోడలు కడతారు. గోడలతో గదులు అవుతాయి. గదులతో ఇల్లు అవుతుంది. ప్రతి దశ ముందటి దశ మీద నిలుస్తుంది.",
    ),
    "bd.m1s": ("Bricks", "ईंटें", "ఇటుకలు"),
    "bd.m1t": ("The numbers that go in", "अंदर जाने वाली संख्याएँ", "లోపలికి వెళ్లే సంఖ్యలు"),
    "bd.m2s": ("Walls built from bricks", "ईंटों से बनी दीवारें", "ఇటుకలతో కట్టిన గోడలు"),
    "bd.m2t": ("What layer 1 makes from those numbers", "परत 1 उन संख्याओं से जो बनाती है", "ఆ సంఖ్యల నుండి పొర 1 తయారుచేసేది"),
    "bd.m3s": ("Rooms built from walls", "दीवारों से बने कमरे", "గోడలతో కట్టిన గదులు"),
    "bd.m3t": ("What layer 2 makes from layer 1", "परत 2 परत 1 से जो बनाती है", "పొర 1 నుండి పొర 2 తయారుచేసేది"),
    "bd.m4s": ("The finished house", "बना हुआ घर", "పూర్తయిన ఇల్లు"),
    "bd.m4t": ("The output", "आउटपुट", "అవుట్‌పుట్"),
    "bd.break": (
        "Here it stops working. Builders follow a plan someone drew. Nobody draws a plan for the layers. "
        "Training adjusts the weights, and the in-between parts are rarely as tidy as walls and rooms.",
        "यहाँ तुलना काम करना बंद कर देती है। मिस्त्री किसी के बनाए नक्शे पर चलते हैं। परतों के लिए कोई नक्शा नहीं बनाता। "
        "ट्रेनिंग वेट बदलती है, और बीच के हिस्से शायद ही कभी दीवारों और कमरों जितने साफ़-सुथरे होते हैं।",
        "ఇక్కడ పోలిక పనిచేయడం ఆగిపోతుంది. మేస్త్రీలు ఎవరో గీసిన ప్లాన్‌ను అనుసరిస్తారు. పొరలకు ఎవరూ ప్లాన్ గీయరు. "
        "ట్రైనింగ్ వెయిట్‌లను మారుస్తుంది, మధ్యలోని భాగాలు గోడలు, గదులంత చక్కగా ఉండడం అరుదు.",
    ),
    # ---------- explain (deeper): two more facts ----------
    "dp.text": (
        "Two more facts about real networks.",
        "असली नेटवर्कों के बारे में दो और बातें।",
        "నిజమైన నెట్‌వర్క్‌ల గురించి మరో రెండు విషయాలు.",
    ),
    "dp.s1": (
        "A real neuron does one more thing after adding up. It bends the total in a fixed way. "
        "In this lesson’s networks, it squashes the total to between minus 1 and 1. "
        "This bend lets layers build curves and steps, not only straight lines. Without it, many layers would act like one.",
        "असली न्यूरॉन जोड़ने के बाद एक काम और करता है। वह कुल को एक तय तरीक़े से मोड़ देता है। "
        "इस पाठ के नेटवर्कों में वह कुल को माइनस 1 और 1 के बीच दबा देता है। "
        "इसी मोड़ से परतें वक्र और सीढ़ियाँ बना पाती हैं, सिर्फ़ सीधी रेखाएँ नहीं। इसके बिना कई परतें मिलकर भी एक परत जैसा काम करतीं।",
        "నిజమైన న్యూరాన్ కలిపిన తర్వాత ఇంకో పని చేస్తుంది. మొత్తాన్ని ఒక నిర్ణీత పద్ధతిలో వంచుతుంది. "
        "ఈ పాఠంలోని నెట్‌వర్క్‌లలో అది మొత్తాన్ని మైనస్ 1, 1 మధ్యకు నొక్కుతుంది. "
        "ఈ వంపు వల్లే పొరలు వక్రాలు, మెట్లు చేయగలవు, సరళ రేఖలు మాత్రమే కాదు. అది లేకపోతే, చాలా పొరలు కలిసినా ఒకే పొరలా పనిచేస్తాయి.",
    ),
    "dp.s2": (
        "Real networks are much bigger. Your biggest network had 593 numbers to adjust. "
        "Networks in phone apps can have millions. The largest have billions.",
        "असली नेटवर्क कहीं बड़े होते हैं। आपके सबसे बड़े नेटवर्क में बदलने लायक 593 संख्याएँ थीं। "
        "फ़ोन ऐप के नेटवर्कों में लाखों-करोड़ों हो सकती हैं। सबसे बड़े नेटवर्कों में अरबों होती हैं।",
        "నిజమైన నెట్‌వర్క్‌లు చాలా పెద్దవి. మీ అతిపెద్ద నెట్‌వర్క్‌లో మార్చగల సంఖ్యలు 593. "
        "ఫోన్ యాప్‌లలోని నెట్‌వర్క్‌లలో మిలియన్ల కొద్దీ ఉండవచ్చు. అతిపెద్ద వాటిలో బిలియన్ల కొద్దీ ఉంటాయి.",
    ),
    # ---------- explain: check ----------
    "ch.prompt": (
        "A network has error 0.01 on its training points and 0.40 on new points. What is going on?",
        "एक नेटवर्क की ट्रेनिंग बिंदुओं पर ग़लती 0.01 है और नए बिंदुओं पर 0.40। क्या हो रहा है?",
        "ఒక నెట్‌వర్క్‌కు ట్రైనింగ్ బిందువులపై పొరపాటు 0.01, కొత్త బిందువులపై 0.40. ఏం జరుగుతోంది?",
    ),
    "ch.o1": ("Underfitting", "अंडरफ़िटिंग", "అండర్‌ఫిట్టింగ్"),
    "ch.o2": ("Overfitting", "ओवरफ़िटिंग", "ఓవర్‌ఫిట్టింగ్"),
    "ch.o3": ("A good fit", "अच्छा फ़िट", "మంచి ఫిట్"),
    "ch.f1": (
        "Underfitting means both errors are high. Here the training error is almost 0. Which error is high?",
        "अंडरफ़िटिंग में दोनों ग़लतियाँ ऊँची होती हैं। यहाँ ट्रेनिंग की ग़लती लगभग 0 है। कौन-सी ग़लती ऊँची है?",
        "అండర్‌ఫిట్టింగ్‌లో రెండు పొరపాట్లూ ఎక్కువగా ఉంటాయి. ఇక్కడ ట్రైనింగ్ పొరపాటు దాదాపు 0. ఏ పొరపాటు ఎక్కువగా ఉంది?",
    ),
    "ch.f3": (
        "A good fit has both errors low and close together. Are 0.01 and 0.40 close?",
        "अच्छे फ़िट में दोनों ग़लतियाँ कम और पास-पास होती हैं। क्या 0.01 और 0.40 पास-पास हैं?",
        "మంచి ఫిట్‌లో రెండు పొరపాట్లూ తక్కువగా, దగ్గరగా ఉంటాయి. 0.01, 0.40 దగ్గరగా ఉన్నాయా?",
    ),
    "ch.h1": (
        "Look at the two numbers. Which one is small, and which is big?",
        "दोनों संख्याएँ देखिए। कौन-सी छोटी है, और कौन-सी बड़ी?",
        "రెండు సంఖ్యలను చూడండి. ఏది చిన్నది, ఏది పెద్దది?",
    ),
    "ch.h2": (
        "Tiny error on training points, big error on new points. Did it catch the pattern, or copy the points?",
        "ट्रेनिंग बिंदुओं पर बहुत छोटी ग़लती, नए बिंदुओं पर बड़ी ग़लती। क्या उसने पैटर्न पकड़ा, या बिंदुओं की नकल की?",
        "ట్రైనింగ్ బిందువులపై చాలా చిన్న పొరపాటు, కొత్త బిందువులపై పెద్ద పొరపాటు. అది ప్యాటర్న్‌ను పట్టుకుందా, లేక బిందువులను కాపీ చేసిందా?",
    ),
    "ch.explain": (
        "Almost no error on training points, big error on new ones. It copied the training points, noise and all. That is overfitting.",
        "ट्रेनिंग बिंदुओं पर लगभग कोई ग़लती नहीं, नए बिंदुओं पर बड़ी ग़लती। उसने ट्रेनिंग बिंदुओं की नकल की, शोर समेत। यही ओवरफ़िटिंग है।",
        "ట్రైనింగ్ బిందువులపై దాదాపు పొరపాటు లేదు, కొత్త వాటిపై పెద్ద పొరపాటు. అది ట్రైనింగ్ బిందువులను శబ్దంతో సహా కాపీ చేసింది. అదే ఓవర్‌ఫిట్టింగ్.",
    ),
    # ---------- break it ----------
    "br.challenge": (
        "Try to break it. For each change, predict: will the network do badly on new points? "
        "You can try the first two in the network builder above. We ran the last three for you, because its points are fixed.",
        "इसे तोड़ने की कोशिश कीजिए। हर बदलाव के लिए अनुमान लगाइए: क्या नेटवर्क नए बिंदुओं पर बुरा करेगा? "
        "पहले दो आप ऊपर नेटवर्क बनाने वाले हिस्से में आज़मा सकते हैं। आख़िरी तीन हमने आपके लिए चलाए, क्योंकि वहाँ बिंदु तय हैं।",
        "దీన్ని విరగ్గొట్టడానికి ప్రయత్నించండి. ప్రతి మార్పుకు అంచనా వేయండి: నెట్‌వర్క్ కొత్త బిందువులపై చెడుగా చేస్తుందా? "
        "మొదటి రెండింటిని పైన నెట్‌వర్క్ నిర్మించే భాగంలో మీరే ప్రయత్నించవచ్చు. చివరి మూడింటిని మేము మీ కోసం నడిపాం, ఎందుకంటే అక్కడ బిందువులు స్థిరంగా ఉంటాయి.",
    ),
    "br.t1": (
        "Train 3 layers of 16 neurons on the 15 noisy points",
        "शोर वाले 15 बिंदुओं पर 3 परतें ट्रेन कीजिए, हर एक में 16 न्यूरॉन",
        "శబ్దం ఉన్న 15 బిందువులపై 16 న్యూరాన్ల 3 పొరలకు ట్రైనింగ్ ఇవ్వండి",
    ),
    "br.r1": (
        "It breaks. Training error is about 0, but error on new points is about 0.35. It copied the wobbles.",
        "यह टूटता है। ट्रेनिंग की ग़लती लगभग 0 है, पर नए बिंदुओं पर ग़लती लगभग 0.35। इसने डगमगाहट की नकल कर ली।",
        "ఇది విరుగుతుంది. ట్రైనింగ్ పొరపాటు దాదాపు 0, కానీ కొత్త బిందువులపై పొరపాటు దాదాపు 0.35. అది ఒడిదొడుకులను కాపీ చేసింది.",
    ),
    "br.t2": (
        "Shrink it to 1 layer of 1 neuron",
        "इसे घटाकर 1 परत, 1 न्यूरॉन कर दीजिए",
        "దాన్ని 1 పొర, 1 న్యూరాన్‌కు తగ్గించండి",
    ),
    "br.r2": (
        "It breaks the other way. Both errors stay high, about 0.50 and 0.36. It is too simple to bend into steps.",
        "यह दूसरी तरह से टूटता है। दोनों ग़लतियाँ ऊँची रहती हैं, लगभग 0.50 और 0.36। यह सीढ़ियों का आकार लेने के लिए बहुत सरल है।",
        "ఇది మరో విధంగా విరుగుతుంది. రెండు పొరపాట్లూ ఎక్కువగానే ఉంటాయి, దాదాపు 0.50, 0.36. మెట్ల ఆకారంలోకి వంగలేనంత సరళంగా ఉంది.",
    ),
    "br.t3": (
        "Keep 3 layers of 16, but train on 60 points instead of 15",
        "3 परतें रखिए, हर एक में 16 न्यूरॉन, पर 15 की जगह 60 बिंदुओं पर ट्रेन कीजिए",
        "16 న్యూరాన్ల 3 పొరలనే ఉంచండి, కానీ 15కు బదులు 60 బిందువులపై ట్రైనింగ్ ఇవ్వండి",
    ),
    "br.r3": (
        "It holds up. Error on new points drops to about 0.05. With many points, the wobbles go up and down evenly, so the steps stand out.",
        "यह टिका रहता है। नए बिंदुओं पर ग़लती घटकर लगभग 0.05 रह जाती है। बहुत सारे बिंदुओं में डगमगाहट ऊपर-नीचे बराबर बँट जाती है, इसलिए सीढ़ियाँ उभर आती हैं।",
        "ఇది నిలబడుతుంది. కొత్త బిందువులపై పొరపాటు దాదాపు 0.05కు తగ్గుతుంది. చాలా బిందువులు ఉంటే, ఒడిదొడుకులు పైకీ కిందకీ సమానంగా పంచుకుంటాయి, కాబట్టి మెట్లు బయటపడతాయి.",
    ),
    "br.t4": (
        "Keep 3 layers of 16, but remove the noise, so every point sits exactly on the steps",
        "3 परतें रखिए, हर एक में 16 न्यूरॉन, पर शोर हटा दीजिए, ताकि हर बिंदु ठीक सीढ़ियों पर हो",
        "16 న్యూరాన్ల 3 పొరలనే ఉంచండి, కానీ శబ్దాన్ని తీసేయండి, అప్పుడు ప్రతి బిందువు సరిగ్గా మెట్లపైనే ఉంటుంది",
    ),
    "br.r4": (
        "It holds up. Error on new points is about 0.01. Copying exact, correct points does no harm. "
        "Some memorising is useful. Copying the noise is the problem.",
        "यह टिका रहता है। नए बिंदुओं पर ग़लती लगभग 0.01 है। सटीक और सही बिंदुओं की नकल से कोई नुकसान नहीं। "
        "कुछ रटना काम का होता है। मुश्किल शोर की नकल है।",
        "ఇది నిలబడుతుంది. కొత్త బిందువులపై పొరపాటు దాదాపు 0.01. కచ్చితమైన, సరైన బిందువులను కాపీ చేస్తే నష్టం లేదు. "
        "కొంత బట్టీ ఉపయోగకరమే. శబ్దాన్ని కాపీ చేయడమే సమస్య.",
    ),
    "br.t5": (
        "Open the trained big network and find the layer whose job is “find the steps”",
        "ट्रेन हो चुके बड़े नेटवर्क को खोलिए और वह परत ढूँढिए जिसका काम “सीढ़ियाँ ढूँढना” है",
        "ట్రైనింగ్ అయిన పెద్ద నెట్‌వర్క్‌ను తెరిచి, “మెట్లు కనుగొను” అనే పని ఉన్న పొరను వెతకండి",
    ),
    "br.r5": (
        "It breaks the detective story. You find 593 numbers and no labels. No layer was given a job. "
        "People can only test a trained network to guess what its parts respond to.",
        "यह जासूसों वाली कहानी को तोड़ देता है। आपको 593 संख्याएँ मिलती हैं, कोई नाम नहीं। किसी परत को कोई काम नहीं सौंपा गया था। "
        "लोग ट्रेन हो चुके नेटवर्क को परखकर ही अंदाज़ा लगा सकते हैं कि उसके हिस्से किस पर प्रतिक्रिया देते हैं।",
        "ఇది డిటెక్టివ్ కథను విరగ్గొడుతుంది. మీకు 593 సంఖ్యలు కనిపిస్తాయి, ఏ పేర్లూ ఉండవు. ఏ పొరకూ పని అప్పగించలేదు. "
        "ట్రైనింగ్ అయిన నెట్‌వర్క్‌ను పరీక్షించడం ద్వారానే దాని భాగాలు దేనికి స్పందిస్తాయో ప్రజలు ఊహించగలరు.",
    ),
    "br.reflect": (
        "Memorising hurt in one run and did no harm in another. What made the difference?",
        "एक बार रटने से नुकसान हुआ, दूसरी बार कोई नुकसान नहीं। फ़र्क किस बात से पड़ा?",
        "ఒకసారి బట్టీ నష్టం చేసింది, మరోసారి ఏ నష్టమూ చేయలేదు. తేడా దేని వల్ల వచ్చింది?",
    ),
    # ---------- transfer: choose ----------
    "tf.prompt": (
        "A new case. A phone app is trained to spot ripe tomatoes from 50 photos. It gets all 50 right. "
        "On new photos from a market, it is often wrong. What is the best explanation?",
        "एक नया मामला। एक फ़ोन ऐप को 50 फ़ोटो से पके टमाटर पहचानने के लिए ट्रेन किया गया। वह सभी 50 सही बताता है। "
        "बाज़ार की नई फ़ोटो पर वह अक्सर ग़लत होता है। सबसे अच्छी व्याख्या क्या है?",
        "ఒక కొత్త సందర్భం. 50 ఫోటోలతో పండిన టమాటాలను గుర్తించేలా ఒక ఫోన్ యాప్‌కు ట్రైనింగ్ ఇచ్చారు. అది మొత్తం 50 సరిగ్గా చెబుతుంది. "
        "మార్కెట్ నుండి వచ్చిన కొత్త ఫోటోలపై అది తరచూ తప్పుగా చెబుతుంది. ఉత్తమ వివరణ ఏది?",
    ),
    "tf.o1": (
        "It is overfitting: it copied details of those 50 photos, like their light, not the signs of ripeness.",
        "यह ओवरफ़िटिंग है: इसने उन 50 फ़ोटो की बारीकियों की नकल की, जैसे उनकी रोशनी, पकने के संकेतों की नहीं।",
        "ఇది ఓవర్‌ఫిట్టింగ్: అది ఆ 50 ఫోటోల వివరాలను కాపీ చేసింది, వాటి వెలుతురు లాంటివి, పండడానికి సంకేతాలను కాదు.",
    ),
    "tf.f1": (
        "Yes. Perfect on training photos, poor on new ones: the sign of overfitting. More varied photos, or a smaller network, could help.",
        "हाँ। ट्रेनिंग फ़ोटो पर एकदम सही, नई फ़ोटो पर कमज़ोर: यही ओवरफ़िटिंग का संकेत है। ज़्यादा तरह-तरह की फ़ोटो, या छोटा नेटवर्क, मदद कर सकता है।",
        "అవును. ట్రైనింగ్ ఫోటోలపై పూర్తిగా సరిగ్గా, కొత్త వాటిపై బలహీనంగా: ఇదే ఓవర్‌ఫిట్టింగ్ సంకేతం. రకరకాల ఫోటోలు ఎక్కువగా ఉంటే, లేదా చిన్న నెట్‌వర్క్ ఉంటే సాయపడవచ్చు.",
    ),
    "tf.o2": (
        "It is underfitting: it needs more layers.",
        "यह अंडरफ़िटिंग है: इसे और परतें चाहिए।",
        "ఇది అండర్‌ఫిట్టింగ్: దానికి ఇంకా పొరలు కావాలి.",
    ),
    "tf.f2": (
        "Underfitting would show mistakes on the 50 training photos too. It got all 50 right. More layers could make copying even easier.",
        "अंडरफ़िटिंग होती तो 50 ट्रेनिंग फ़ोटो पर भी ग़लतियाँ होतीं। इसने सभी 50 सही बताईं। और परतें नकल को और आसान बना सकती हैं।",
        "అండర్‌ఫిట్టింగ్ అయితే 50 ట్రైనింగ్ ఫోటోలపై కూడా తప్పులు కనిపించేవి. అది మొత్తం 50 సరిగ్గా చెప్పింది. ఇంకా పొరలు కాపీ చేయడాన్ని ఇంకా తేలిక చేయవచ్చు.",
    ),
    "tf.o3": (
        "It knows what tomatoes are, but market tomatoes are a new kind.",
        "यह जानता है कि टमाटर क्या होते हैं, पर बाज़ार के टमाटर नई क़िस्म के हैं।",
        "టమాటాలు అంటే ఏమిటో దానికి తెలుసు, కానీ మార్కెట్ టమాటాలు కొత్త రకం.",
    ),
    "tf.f3": (
        "The app has no idea what a tomato is. It only adjusts weights to match its 50 photos. "
        "The trouble starts when new photos differ from those 50.",
        "ऐप को कोई अंदाज़ा नहीं कि टमाटर क्या है। वह सिर्फ़ अपनी 50 फ़ोटो से मेल खाने के लिए वेट बदलता है। "
        "मुश्किल तब शुरू होती है जब नई फ़ोटो उन 50 से अलग होती हैं।",
        "టమాటా అంటే ఏమిటో యాప్‌కు ఏ ఆలోచనా లేదు. తన 50 ఫోటోలకు సరిపోయేలా అది వెయిట్‌లను మారుస్తుంది, అంతే. "
        "కొత్త ఫోటోలు ఆ 50కి భిన్నంగా ఉన్నప్పుడే సమస్య మొదలవుతుంది.",
    ),
    # ---------- reflect: own words ----------
    "ow.prompt": (
        "A company says: “Our network is 100% accurate!” Imagine it will mark your exam answers. "
        "What would you ask before you trust it? Write your question, and why it matters. What you write stays on this device.",
        "एक कंपनी कहती है: “हमारा नेटवर्क 100% सही है!” मान लीजिए वह आपकी परीक्षा की कॉपियाँ जाँचेगा। "
        "उस पर भरोसा करने से पहले आप क्या पूछेंगे? अपना सवाल लिखिए, और यह भी कि वह क्यों ज़रूरी है। आप जो लिखेंगे, वह इसी डिवाइस पर रहेगा।",
        "ఒక కంపెనీ ఇలా చెబుతుంది: “మా నెట్‌వర్క్ 100% సరైనది!” అది మీ పరీక్ష జవాబులను దిద్దుతుందని ఊహించండి. "
        "దాన్ని నమ్మే ముందు మీరు ఏమి అడుగుతారు? మీ ప్రశ్నను, అది ఎందుకు ముఖ్యమో రాయండి. మీరు రాసేది ఈ పరికరంలోనే ఉంటుంది.",
    ),
    "ow.model": (
        "I would ask: accurate on which examples? 100% on its own training examples could mean it copied them. "
        "I want its error on new examples it was never trained on.",
        "मैं पूछूँगा या पूछूँगी: किन उदाहरणों पर सही? अपने ही ट्रेनिंग उदाहरणों पर 100% का मतलब नकल भी हो सकता है। "
        "मुझे उन नए उदाहरणों पर उसकी ग़लती जाननी है, जिन पर उसे कभी ट्रेन नहीं किया गया।",
        "నేను ఇలా అడుగుతాను: ఏ ఉదాహరణలపై సరైనది? తన సొంత ట్రైనింగ్ ఉదాహరణలపై 100% అంటే వాటిని కాపీ చేసిందని కూడా కావచ్చు. "
        "దానికి ఎప్పుడూ ట్రైనింగ్ ఇవ్వని కొత్త ఉదాహరణలపై దాని పొరపాటు నాకు కావాలి.",
    ),
    # ---------- takeaway ----------
    "take.title": (
        "Inside my neural network",
        "मेरे न्यूरल नेटवर्क के अंदर",
        "నా న్యూరల్ నెట్‌వర్క్ లోపల",
    ),
    "take.card": (
        "A neural network is layers of neurons. Each neuron multiplies numbers by weights and adds them up. "
        "Training changes the weights step by step to lower the error. Too small: underfitting. "
        "Too big for the data: overfitting. The real test is always new examples.",
        "न्यूरल नेटवर्क न्यूरॉनों की परतें है। हर न्यूरॉन संख्याओं को वेट से गुणा करके जोड़ता है। "
        "ट्रेनिंग क़दम-दर-क़दम वेट बदलती है, ताकि ग़लती घटे। बहुत छोटा: अंडरफ़िटिंग। "
        "डेटा के हिसाब से बहुत बड़ा: ओवरफ़िटिंग। असली परीक्षा हमेशा नए उदाहरण हैं।",
        "న్యూరల్ నెట్‌వర్క్ అంటే న్యూరాన్ల పొరలు. ప్రతి న్యూరాన్ సంఖ్యలను వెయిట్‌లతో గుణించి కలుపుతుంది. "
        "పొరపాటు తగ్గేలా ట్రైనింగ్ అడుగడుగునా వెయిట్‌లను మారుస్తుంది. మరీ చిన్నది: అండర్‌ఫిట్టింగ్. "
        "డేటాకు మరీ పెద్దది: ఓవర్‌ఫిట్టింగ్. అసలు పరీక్ష ఎప్పుడూ కొత్త ఉదాహరణలే.",
    ),
    "take.l1": ("The network I built", "मेरा बनाया नेटवर्क", "నేను నిర్మించిన నెట్‌వర్క్"),
    "take.l2": ("My walk down the hill", "पहाड़ी से नीचे मेरा सफ़र", "కొండ దిగువకు నా నడక"),
    "take.l3": (
        "My question for anyone selling a “100% accurate” network",
        "“100% सही” नेटवर्क बेचने वाले से मेरा सवाल",
        "“100% సరైన” నెట్‌వర్క్ అమ్మేవారికి నా ప్రశ్న",
    ),
    # ---------- pre-checks ----------
    "pre1.q": (
        "What is inside a neural network?",
        "न्यूरल नेटवर्क के अंदर क्या होता है?",
        "న్యూరల్ నెట్‌వర్క్ లోపల ఏముంటుంది?",
    ),
    "pre1.a": (
        "A list of rules that programmers typed in",
        "नियमों की एक सूची, जिसे प्रोग्रामरों ने लिखा",
        "ప్రోగ్రామర్లు టైప్ చేసిన నియమాల జాబితా",
    ),
    "pre1.b": (
        "Layers of small calculators that multiply numbers by adjustable amounts and add them up",
        "छोटे कैलकुलेटरों की परतें, जो संख्याओं को बदले जा सकने वाले मानों से गुणा करके जोड़ती हैं",
        "సంఖ్యలను మార్చగల విలువలతో గుణించి కలిపే చిన్న కాలిక్యులేటర్ల పొరలు",
    ),
    "pre1.c": (
        "A tiny brain that understands pictures and words",
        "एक छोटा दिमाग़, जो चित्रों और शब्दों को समझता है",
        "చిత్రాలను, పదాలను అర్థం చేసుకునే ఒక చిన్న మెదడు",
    ),
    "pre2.q": (
        "A network gets every one of its training examples right. Will it do well on new examples?",
        "एक नेटवर्क अपने सभी ट्रेनिंग उदाहरण सही बताता है। क्या वह नए उदाहरणों पर भी अच्छा करेगा?",
        "ఒక నెట్‌వర్క్ తన ట్రైనింగ్ ఉదాహరణలన్నీ సరిగ్గా చెబుతుంది. కొత్త ఉదాహరణలపై కూడా బాగా చేస్తుందా?",
    ),
    "pre2.a": ("Yes, always", "हाँ, हमेशा", "అవును, ఎప్పుడూ"),
    "pre2.b": ("Not necessarily", "ज़रूरी नहीं", "తప్పనిసరిగా కాదు"),
    "pre2.c": ("No, never", "नहीं, कभी नहीं", "లేదు, ఎప్పుడూ కాదు"),
    "pre3.q": (
        "While a network is being trained, what changes inside it?",
        "जब किसी नेटवर्क को ट्रेन किया जा रहा होता है, तो उसके अंदर क्या बदलता है?",
        "ఒక నెట్‌వర్క్‌కు ట్రైనింగ్ ఇస్తున్నప్పుడు, దాని లోపల ఏమి మారుతుంది?",
    ),
    "pre3.a": ("Its examples", "उसके उदाहरण", "దాని ఉదాహరణలు"),
    "pre3.b": (
        "Its adjustable numbers, a little at a time",
        "उसकी बदली जा सकने वाली संख्याएँ, थोड़ा-थोड़ा करके",
        "దానిలోని మార్చగల సంఖ్యలు, కొంచెం కొంచెంగా",
    ),
    "pre3.c": (
        "Nothing; it only stores the examples",
        "कुछ नहीं; वह सिर्फ़ उदाहरण जमा करता है",
        "ఏమీ మారదు; అది ఉదాహరణలను దాచుకుంటుంది, అంతే",
    ),
    # ---------- post-checks ----------
    "post1.q": (
        "A neuron gets the numbers 1 and 2. Their weights are 3 and 4. What does it add up to?",
        "एक न्यूरॉन को संख्याएँ 1 और 2 मिलती हैं। उनके वेट 3 और 4 हैं। कुल कितना बनता है?",
        "ఒక న్యూరాన్‌కు 1, 2 సంఖ్యలు వస్తాయి. వాటి వెయిట్‌లు 3, 4. మొత్తం ఎంత అవుతుంది?",
    ),
    "post1.a": ("10", "10", "10"),
    "post1.b": ("11", "11", "11"),
    "post1.c": ("24", "24", "24"),
    "post1.fb": (
        "1 × 3 = 3 and 2 × 4 = 8. Then 3 + 8 = 11.",
        "1 × 3 = 3 और 2 × 4 = 8। फिर 3 + 8 = 11।",
        "1 × 3 = 3, 2 × 4 = 8. తర్వాత 3 + 8 = 11.",
    ),
    "post2.q": (
        "After training, does each layer have a job someone can name, like “find edges”?",
        "ट्रेनिंग के बाद, क्या हर परत का कोई ऐसा काम होता है जिसका नाम रखा जा सके, जैसे “किनारे ढूँढना”?",
        "ట్రైనింగ్ తర్వాత, ప్రతి పొరకూ “అంచులు కనుగొను” లాంటి పేరు పెట్టగల పని ఉంటుందా?",
    ),
    "post2.a": (
        "Yes, programmers give each layer its job",
        "हाँ, प्रोग्रामर हर परत को उसका काम देते हैं",
        "అవును, ప్రోగ్రామర్లు ప్రతి పొరకూ దాని పని ఇస్తారు",
    ),
    "post2.b": (
        "Not usually: training sets the weights, and what layers respond to is often hard to name",
        "आमतौर पर नहीं: वेट ट्रेनिंग तय करती है, और परतें किस पर प्रतिक्रिया देती हैं, इसका नाम रखना अक्सर मुश्किल होता है",
        "సాధారణంగా కాదు: వెయిట్‌లను ట్రైనింగ్ నిర్ణయిస్తుంది, పొరలు దేనికి స్పందిస్తాయో పేరు పెట్టడం తరచూ కష్టం",
    ),
    "post2.c": (
        "Yes, each layer understands one part of the picture",
        "हाँ, हर परत चित्र का एक हिस्सा समझती है",
        "అవును, ప్రతి పొర చిత్రంలోని ఒక భాగాన్ని అర్థం చేసుకుంటుంది",
    ),
    "post2.fb": (
        "Nobody assigns jobs to layers, and layers do not understand. Training sets the weights; people can only test what parts respond to.",
        "परतों को कोई काम नहीं सौंपता, और परतें समझती नहीं। वेट ट्रेनिंग तय करती है; लोग सिर्फ़ परखकर देख सकते हैं कि हिस्से किस पर प्रतिक्रिया देते हैं।",
        "పొరలకు ఎవరూ పనులు అప్పగించరు, పొరలు అర్థం చేసుకోవు. వెయిట్‌లను ట్రైనింగ్ నిర్ణయిస్తుంది; భాగాలు దేనికి స్పందిస్తాయో ప్రజలు పరీక్షించి చూడగలరు.",
    ),
    "post3.q": (
        "A handwriting app reads its 1,000 training samples almost perfectly. On new handwriting it makes many mistakes. What is the most likely problem?",
        "एक लिखावट पढ़ने वाला ऐप अपने 1,000 ट्रेनिंग नमूने लगभग पूरी तरह सही पढ़ता है। नई लिखावट पर वह बहुत ग़लतियाँ करता है। सबसे संभावित समस्या क्या है?",
        "చేతిరాత చదివే ఒక యాప్ తన 1,000 ట్రైనింగ్ శాంపిల్స్‌ను దాదాపు పూర్తిగా సరిగ్గా చదువుతుంది. కొత్త చేతిరాతపై చాలా తప్పులు చేస్తుంది. ఎక్కువగా అవకాశం ఉన్న సమస్య ఏది?",
    ),
    "post3.a": ("Underfitting", "अंडरफ़िटिंग", "అండర్‌ఫిట్టింగ్"),
    "post3.b": ("Overfitting", "ओवरफ़िटिंग", "ఓవర్‌ఫిట్టింగ్"),
    "post3.c": ("A good fit", "अच्छा फ़िट", "మంచి ఫిట్"),
    "post3.fb": (
        "Almost perfect on training samples, many mistakes on new ones: overfitting.",
        "ट्रेनिंग नमूनों पर लगभग सही, नए पर बहुत ग़लतियाँ: ओवरफ़िटिंग।",
        "ట్రైనింగ్ శాంపిల్స్‌పై దాదాపు సరిగ్గా, కొత్త వాటిపై చాలా తప్పులు: ఓవర్‌ఫిట్టింగ్.",
    ),
    "post4.q": (
        "A network has high error on its training points and on new points. What could help?",
        "एक नेटवर्क की ग़लती ट्रेनिंग बिंदुओं पर भी ऊँची है और नए बिंदुओं पर भी। किससे मदद मिल सकती है?",
        "ఒక నెట్‌వర్క్‌కు ట్రైనింగ్ బిందువులపై, కొత్త బిందువులపై రెండింటిలోనూ పొరపాటు ఎక్కువగా ఉంది. ఏది సాయపడవచ్చు?",
    ),
    "post4.a": (
        "A bigger network: more neurons or layers",
        "बड़ा नेटवर्क: ज़्यादा न्यूरॉन या परतें",
        "పెద్ద నెట్‌వర్క్: ఎక్కువ న్యూరాన్లు లేదా పొరలు",
    ),
    "post4.b": ("A smaller network", "छोटा नेटवर्क", "చిన్న నెట్‌వర్క్"),
    "post4.c": ("Testing it on fewer points", "उसे कम बिंदुओं पर जाँचना", "తక్కువ బిందువులపై పరీక్షించడం"),
    "post4.fb": (
        "Both errors high means it is too simple to hold the pattern: underfitting. A bigger network can help.",
        "दोनों ग़लतियाँ ऊँची यानी नेटवर्क पैटर्न पकड़ने के लिए बहुत सरल है: अंडरफ़िटिंग। बड़ा नेटवर्क मदद कर सकता है।",
        "రెండు పొరపాట్లూ ఎక్కువ అంటే ప్యాటర్న్‌ను పట్టుకోలేనంత సరళంగా ఉంది: అండర్‌ఫిట్టింగ్. పెద్ద నెట్‌వర్క్ సాయపడవచ్చు.",
    ),
    "post5.q": (
        "During training, what happens to the weights?",
        "ट्रेनिंग के दौरान वेट के साथ क्या होता है?",
        "ట్రైనింగ్ సమయంలో వెయిట్‌లకు ఏమవుతుంది?",
    ),
    "post5.a": (
        "A person types in better ones",
        "कोई व्यक्ति बेहतर वेट लिख देता है",
        "ఒక వ్యక్తి మెరుగైన వాటిని టైప్ చేస్తారు",
    ),
    "post5.b": (
        "They change in small steps that make the error smaller",
        "वे छोटे-छोटे क़दमों में बदलते हैं, जिससे ग़लती घटती है",
        "పొరపాటు తగ్గేలా అవి చిన్న చిన్న అడుగుల్లో మారుతాయి",
    ),
    "post5.c": (
        "They stay fixed while the examples change",
        "वे वैसे ही रहते हैं, उदाहरण बदलते हैं",
        "అవి మారవు, ఉదాహరణలు మారుతాయి",
    ),
    "post5.fb": (
        "Training nudges every weight a little downhill on the error. It does this again and again, like your walk in the fog.",
        "ट्रेनिंग हर वेट को ग़लती की ढलान पर थोड़ा-सा नीचे खिसकाती है। वह यह बार-बार करती है, कोहरे में आपकी सैर की तरह।",
        "ట్రైనింగ్ ప్రతి వెయిట్‌ను పొరపాటు వాలుపై కొంచెం కిందకు జరుపుతుంది. పొగమంచులో మీ నడకలాగే, ఇది మళ్లీ మళ్లీ చేస్తుంది.",
    ),
}

# The weights detour: "how much you trust each friend's advice".
D = {
    "d.title": ("What is a weight?", "वेट क्या होता है?", "వెయిట్ అంటే ఏమిటి?"),
    "d.text": (
        "A <term-weight>weight</term-weight> says how much something counts.",
        "<term-weight>वेट</term-weight> बताता है कि कोई चीज़ कितनी गिनी जाती है।",
        "<term-weight>వెయిట్</term-weight> ఏదైనా ఎంత లెక్కలోకి వస్తుందో చెబుతుంది.",
    ),
    "d.s1": (
        "You want to know if a new film is worth watching. Three friends give advice.",
        "आप जानना चाहते हैं कि कोई नई फ़िल्म देखने लायक है या नहीं। तीन दोस्त सलाह देते हैं।",
        "ఒక కొత్త సినిమా చూడదగ్గదో కాదో మీరు తెలుసుకోవాలనుకుంటున్నారు. ముగ్గురు స్నేహితులు సలహా ఇస్తారు.",
    ),
    "d.s2": (
        "You trust some friends more than others. Put that trust as a number: that number is a weight.",
        "आप कुछ दोस्तों पर दूसरों से ज़्यादा भरोसा करते हैं। उस भरोसे को एक संख्या मानिए: वही संख्या वेट है।",
        "మీరు కొందరు స్నేహితులను ఇతరుల కంటే ఎక్కువగా నమ్ముతారు. ఆ నమ్మకాన్ని ఒక సంఖ్యగా పెట్టండి: ఆ సంఖ్యే వెయిట్.",
    ),
    "d.s3": (
        "Where this stops working: in a network, nobody picks weights by trust. Training adjusts them. "
        "Weights can also be minus numbers, which pull the total down.",
        "यह तुलना कहाँ रुकती है: नेटवर्क में कोई भरोसे से वेट नहीं चुनता। ट्रेनिंग उन्हें बदलती है। "
        "वेट माइनस संख्याएँ भी हो सकते हैं, जो कुल को नीचे खींचते हैं।",
        "ఈ పోలిక ఎక్కడ ఆగుతుంది: నెట్‌వర్క్‌లో నమ్మకాన్ని బట్టి ఎవరూ వెయిట్‌లను ఎంచుకోరు. ట్రైనింగ్ వాటిని మారుస్తుంది. "
        "వెయిట్‌లు మైనస్ సంఖ్యలు కూడా కావచ్చు, అవి మొత్తాన్ని కిందకు లాగుతాయి.",
    ),
    "d.kprompt": (
        "Switch on each friend who says “watch it”. Each yes adds that friend’s weight. If the total reaches 4, you go.",
        "हर उस दोस्त को चालू कीजिए जो कहता है “देखो”। हर हाँ उस दोस्त का वेट जोड़ती है। कुल 4 तक पहुँचे, तो आप जाएँगे।",
        "“చూడు” అని చెప్పిన ప్రతి స్నేహితుడిని ఆన్ చేయండి. ప్రతి అవును ఆ స్నేహితుడి వెయిట్‌ను కలుపుతుంది. మొత్తం 4కు చేరితే, మీరు వెళ్తారు.",
    ),
    "d.ayesha": (
        "Ayesha says yes (you trust her a lot: weight 3)",
        "आयशा हाँ कहती है (उस पर आपको बहुत भरोसा है: वेट 3)",
        "ఆయేషా అవును అంటుంది (ఆమెను మీరు బాగా నమ్ముతారు: వెయిట్ 3)",
    ),
    "d.ravi": (
        "Ravi says yes (weight 1)",
        "रवि हाँ कहता है (वेट 1)",
        "రవి అవును అంటాడు (వెయిట్ 1)",
    ),
    "d.lalitha": (
        "Lalitha says yes (weight 2)",
        "ललिता हाँ कहती है (वेट 2)",
        "లలిత అవును అంటుంది (వెయిట్ 2)",
    ),
    "d.out": ("Trust total", "भरोसे का कुल", "నమ్మకం మొత్తం"),
    "d.sentence": (
        "Trust total: {output}. So {decision}.",
        "भरोसे का कुल: {output}। इसलिए {decision}।",
        "నమ్మకం మొత్తం: {output}. కాబట్టి {decision}.",
    ),
    "d.go": ("you go to the film", "आप फ़िल्म देखने जाएँगे", "మీరు సినిమాకు వెళ్తారు"),
    "d.skip": ("you skip it", "आप नहीं जाएँगे", "మీరు వెళ్లరు"),
    "d.goal": (
        "Challenge: make the total exactly 4.",
        "चुनौती: कुल ठीक 4 बनाइए।",
        "సవాలు: మొత్తాన్ని సరిగ్గా 4 చేయండి.",
    ),
    "d.success": (
        "Ayesha and Ravi: 3 × 1 + 1 × 1 + 2 × 0 = 4. (× means times.) Ayesha’s yes counts three times as much as Ravi’s.",
        "आयशा और रवि: 3 × 1 + 1 × 1 + 2 × 0 = 4। (× यानी गुणा।) आयशा की हाँ रवि की हाँ से तीन गुना गिनी जाती है।",
        "ఆయేషా, రవి: 3 × 1 + 1 × 1 + 2 × 0 = 4. (× అంటే గుణకారం.) ఆయేషా అవును రవి అవును కంటే మూడు రెట్లు లెక్కలోకి వస్తుంది.",
    ),
    "d.q": (
        "Lalitha’s weight is 2 and Ravi’s is 1. Both say yes. Whose yes counts more?",
        "ललिता का वेट 2 है और रवि का 1। दोनों हाँ कहते हैं। किसकी हाँ ज़्यादा गिनी जाती है?",
        "లలిత వెయిట్ 2, రవి వెయిట్ 1. ఇద్దరూ అవును అంటారు. ఎవరి అవును ఎక్కువగా లెక్కలోకి వస్తుంది?",
    ),
    "d.o1": ("Lalitha’s", "ललिता की", "లలితది"),
    "d.o2": ("Ravi’s", "रवि की", "రవిది"),
    "d.o3": ("They count the same", "दोनों बराबर गिनी जाती हैं", "రెండూ సమానంగా లెక్కలోకి వస్తాయి"),
    "d.f2": (
        "Ravi’s weight is 1 and Lalitha’s is 2. Which number is bigger?",
        "रवि का वेट 1 है और ललिता का 2। कौन-सी संख्या बड़ी है?",
        "రవి వెయిట్ 1, లలిత వెయిట్ 2. ఏ సంఖ్య పెద్దది?",
    ),
    "d.f3": (
        "Both said yes, but their weights differ. A yes counts as much as its weight.",
        "दोनों ने हाँ कहा, पर उनके वेट अलग हैं। हर हाँ उतनी गिनी जाती है जितना उसका वेट है।",
        "ఇద్దరూ అవును అన్నారు, కానీ వారి వెయిట్‌లు వేరు. ప్రతి అవును దాని వెయిట్ అంత లెక్కలోకి వస్తుంది.",
    ),
    "d.explain": (
        "Lalitha’s yes adds 2 and Ravi’s adds 1. A bigger weight means the advice counts more.",
        "ललिता की हाँ 2 जोड़ती है और रवि की 1। बड़ा वेट यानी सलाह ज़्यादा गिनी जाती है।",
        "లలిత అవును 2 కలుపుతుంది, రవి అవును 1. పెద్ద వెయిట్ అంటే ఆ సలహా ఎక్కువగా లెక్కలోకి వస్తుంది.",
    ),
}
