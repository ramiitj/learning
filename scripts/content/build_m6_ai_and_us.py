"""Builds content/lessons/m6-ai-and-us.json (AI for Kids, Module 6: AI and us).
Run: python3 scripts/content/build_m6_ai_and_us.py

Strings are ICU messages; typographic apostrophes (’) avoid ICU quoting.
hi and te are drafts awaiting native-speaker review (docs/07); the lesson
and every locale stay "draft" until the creator and reviewers approve.
Locale variant: the hook's second language is Hindi in en/hi and Telugu in te.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
LESSON_ID = "m6-ai-and-us"

S = {}


def add(key, en, hi, te):
    assert key not in S, key
    S[key] = {"en": en, "hi": hi, "te": te}


def block(id, type, config, **extra):
    return {"id": id, "type": type, "componentVersion": "1.0", "config": config, **extra}


# ---------------------------------------------------------------- meta
add("title", "AI and us", "AI और हम", "AI మరియు మనం")
add("subtitle", "Is it fair? Is it true? Who answers for it?",
    "क्या यह निष्पक्ष है? क्या यह सच है? इसका जवाब कौन देगा?",
    "ఇది న్యాయమేనా? ఇది నిజమేనా? దీనికి ఎవరు జవాబు చెప్పాలి?")
add("obj.o1", "Judge whether a program’s decision about a person is fair, by asking how it was trained, who checks it and who is responsible.",
    "किसी इंसान के बारे में प्रोग्राम का फ़ैसला निष्पक्ष है या नहीं, यह परखना: उसे कैसे ट्रेनिंग दी गई, उसे कौन जाँचता है और ज़िम्मेदार कौन है।",
    "ఒక వ్యక్తి గురించి ప్రోగ్రామ్ నిర్ణయం న్యాయమైనదో కాదో అంచనా వేయడం: దానికి ఎలా ట్రైనింగ్ ఇచ్చారు, ఎవరు సరిచూస్తారు, బాధ్యత ఎవరిది అని అడిగి.")
add("obj.o2", "Explain how different ethical frameworks can reach different decisions on the same case, and give the reason behind one.",
    "समझाना कि अलग-अलग नैतिक ढाँचे एक ही मामले में अलग-अलग फ़ैसलों तक कैसे पहुँच सकते हैं, और किसी एक के पीछे का कारण बताना।",
    "ఒకే సందర్భంలో వేర్వేరు నైతిక చట్రాలు వేర్వేరు నిర్ణయాలకు ఎలా రావచ్చో వివరించడం, వాటిలో ఒకదాని కారణం చెప్పడం.")
add("obj.o3", "Explain why a chatbot can state false things as confidently as true ones.",
    "समझाना कि चैटबॉट ग़लत बातें भी उतने ही भरोसे से क्यों कह सकता है जितना सही बातें।",
    "చాట్‌బాట్ తప్పు విషయాలను కూడా నిజమైనవాటంత నమ్మకంగా ఎందుకు చెప్పగలదో వివరించడం.")
add("obj.o4", "Describe what a program does without giving it a mind, and say why that matters.",
    "किसी प्रोग्राम को दिमाग़ वाला बताए बिना यह कहना कि वह क्या करता है, और बताना कि यह क्यों ज़रूरी है।",
    "ప్రోగ్రామ్‌కు మనసు ఉన్నట్టు చెప్పకుండా అది ఏం చేస్తుందో వివరించడం, అది ఎందుకు ముఖ్యమో చెప్పడం.")

# ---------------------------------------------------------------- hook
add("hook.text",
    "Kavya and Arjun apply for a free summer science camp. They have the same marks in science. A <term-program>program</term-program> gives each application a score out of 100. Kavya’s gets 82. Arjun’s gets 61. Kavya wrote hers in English. Arjun wrote his in Hindi.",
    "काव्या और अर्जुन गर्मियों के एक मुफ़्त विज्ञान कैंप के लिए आवेदन करते हैं। विज्ञान में दोनों के अंक बराबर हैं। एक <term-program>प्रोग्राम</term-program> हर आवेदन को 100 में से स्कोर देता है। काव्या के आवेदन को 82 मिलते हैं। अर्जुन के आवेदन को 61। काव्या ने अपना आवेदन अंग्रेज़ी में लिखा। अर्जुन ने अपना हिंदी में।",
    "కావ్య, అర్జున్ వేసవిలో జరిగే ఒక ఉచిత సైన్స్ క్యాంప్‌కు దరఖాస్తు చేస్తారు. సైన్స్‌లో ఇద్దరికీ ఒకే మార్కులు. ఒక <term-program>ప్రోగ్రామ్</term-program> ప్రతి దరఖాస్తుకు 100కి ఒక స్కోరు ఇస్తుంది. కావ్య దరఖాస్తుకు 82 వస్తాయి. అర్జున్ దరఖాస్తుకు 61. కావ్య తన దరఖాస్తును ఇంగ్లీషులో రాసింది. అర్జున్ తెలుగులో రాశాడు.")
add("hook.q", "Same marks, very different scores. Was that fair? And if not, who should answer for it?",
    "अंक बराबर, पर स्कोर में इतना फ़र्क़। क्या यह निष्पक्ष था? और अगर नहीं, तो इसका जवाब किसे देना चाहिए?",
    "మార్కులు ఒకటే, కానీ స్కోర్లలో ఇంత తేడా. ఇది న్యాయమేనా? కాకపోతే, దీనికి ఎవరు జవాబు చెప్పాలి?")

# ---------------------------------------------------------------- predict
add("p.prompt", "Why do you think the program gave Arjun’s application a lower score?",
    "आपके हिसाब से प्रोग्राम ने अर्जुन के आवेदन को कम स्कोर क्यों दिया?",
    "ప్రోగ్రామ్ అర్జున్ దరఖాస్తుకు తక్కువ స్కోరు ఎందుకు ఇచ్చిందని మీరు అనుకుంటున్నారు?")
add("p.c1", "The program dislikes Hindi.", "प्रोग्राम को हिंदी पसंद नहीं।", "ప్రోగ్రామ్‌కు తెలుగు అంటే ఇష్టం లేదు.")
add("p.c2", "Arjun’s application was weaker.", "अर्जुन का आवेदन कमज़ोर था।", "అర్జున్ దరఖాస్తు బలహీనంగా ఉంది.")
add("p.c3", "The program copies patterns from past applications, and most of those were in English.",
    "प्रोग्राम पुराने आवेदनों के पैटर्न की नकल करता है, और उनमें से ज़्यादातर अंग्रेज़ी में थे।",
    "ప్రోగ్రామ్ పాత దరఖాస్తుల్లోని ప్యాటర్న్‌లను అనుకరిస్తుంది, వాటిలో ఎక్కువ ఇంగ్లీషులో ఉన్నాయి.")
add("p.f1", "A natural guess. But a program has no likes or dislikes. Something else made the gap.",
    "यह अनुमान स्वाभाविक है। पर प्रोग्राम की कोई पसंद-नापसंद नहीं होती। यह फ़र्क़ किसी और वजह से आया।",
    "ఇలా ఊహించడం సహజమే. కానీ ప్రోగ్రామ్‌కు ఇష్టాయిష్టాలు ఉండవు. ఈ తేడా వేరే కారణంతో వచ్చింది.")
add("p.f2", "Possible, but their science marks were the same. Something else changed the score.",
    "हो सकता है, पर विज्ञान में दोनों के अंक बराबर थे। स्कोर किसी और वजह से बदला।",
    "కావచ్చు, కానీ సైన్స్‌లో ఇద్దరికీ ఒకే మార్కులు. స్కోరు వేరే కారణంతో మారింది.")
add("p.reveal",
    "Here is what happened. The program was made by <term-training>training</term-training> it on 300 past winning applications. Almost all were in English. It found patterns in them. Now it scores new writing by how well it matches those patterns. Nobody told it to score Hindi lower. But Arjun still got a worse score for a reason that should not count. That is a problem of <term-fairness>fairness</term-fairness>.",
    "असल में यह हुआ। इस प्रोग्राम को 300 पुराने, जीते हुए आवेदनों पर <term-training>ट्रेनिंग</term-training> देकर बनाया गया। उनमें से लगभग सभी अंग्रेज़ी में थे। प्रोग्राम ने उनमें पैटर्न ढूँढे। अब वह नए आवेदन को इस पर स्कोर देता है कि वह उन पैटर्न से कितना मिलता है। किसी ने उससे नहीं कहा कि हिंदी को कम स्कोर दो। फिर भी अर्जुन को ऐसी वजह से कम स्कोर मिला जो गिनी ही नहीं जानी चाहिए। यह <term-fairness>निष्पक्षता</term-fairness> की समस्या है।",
    "జరిగింది ఇది. 300 పాత, గెలిచిన దరఖాస్తులపై <term-training>ట్రైనింగ్</term-training> ఇచ్చి ఈ ప్రోగ్రామ్‌ను తయారు చేశారు. వాటిలో దాదాపు అన్నీ ఇంగ్లీషులో ఉన్నాయి. ప్రోగ్రామ్ వాటిలో ప్యాటర్న్‌లను కనుగొంది. ఇప్పుడు కొత్త దరఖాస్తు ఆ ప్యాటర్న్‌లతో ఎంత సరిపోతుందో చూసి స్కోరు ఇస్తుంది. తెలుగుకు తక్కువ స్కోరు ఇవ్వమని ఎవరూ చెప్పలేదు. అయినా లెక్కలోకి రాకూడని కారణంతో అర్జున్‌కు తక్కువ స్కోరు వచ్చింది. ఇది <term-fairness>న్యాయబద్ధత</term-fairness> సమస్య.")

# ---------------------------------------------------------------- ways of thinking (shared names)
add("fw.outcomes", "Best results", "सबसे अच्छे नतीजे", "ఉత్తమ ఫలితాలు")
add("fw.duties", "Duties and rules", "कर्तव्य और नियम", "కర్తవ్యాలు, నియమాలు")
add("fw.character", "Good character", "अच्छा चरित्र", "మంచి స్వభావం")
add("fw.care", "Care", "परवाह", "ఆదరణ")

# ---------------------------------------------------------------- dilemma 1: the camp
add("dv1.prompt", "The camp has 40 seats and starts in two weeks. The organisers now know about the language problem. What should they do?",
    "कैंप में 40 सीटें हैं और यह दो हफ़्ते में शुरू होगा। आयोजकों को अब भाषा वाली समस्या का पता चल गया है। उन्हें क्या करना चाहिए?",
    "క్యాంప్‌లో 40 సీట్లు ఉన్నాయి, అది రెండు వారాల్లో మొదలవుతుంది. భాష సమస్య గురించి నిర్వాహకులకు ఇప్పుడు తెలిసింది. వాళ్లు ఏం చేయాలి?")
add("dv1.use", "Use the scores as they are. There is no time to change.",
    "स्कोर जैसे हैं, वैसे ही इस्तेमाल करें। बदलने का समय नहीं है।",
    "స్కోర్లను ఉన్నట్టే వాడాలి. మార్చడానికి సమయం లేదు.")
add("dv1.check", "Keep the scores, but people read every application again before choosing.",
    "स्कोर रखें, पर चुनने से पहले लोग हर आवेदन दोबारा पढ़ें।",
    "స్కోర్లు ఉంచాలి, కానీ ఎంచుకునే ముందు మనుషులు ప్రతి దరఖాస్తునూ మళ్ళీ చదవాలి.")
add("dv1.stop", "Stop using the program until it is trained on fairer examples.",
    "जब तक प्रोग्राम को ज़्यादा निष्पक्ष उदाहरणों पर ट्रेनिंग न मिले, उसका इस्तेमाल बंद रखें।",
    "మరింత న్యాయమైన ఉదాహరణలపై ట్రైనింగ్ ఇచ్చే వరకు ప్రోగ్రామ్ వాడకం ఆపాలి.")
add("dv1.why.outcomes", "It asks which choice does the most good and least harm for everyone. Reading again costs a few days. But then the 40 seats go to the students who would gain most.",
    "यह पूछता है कि किस चुनाव से सबके लिए सबसे ज़्यादा भला और सबसे कम नुक़सान होगा। दोबारा पढ़ने में कुछ दिन लगेंगे। पर तब 40 सीटें उन छात्रों को मिलेंगी जिन्हें सबसे ज़्यादा फ़ायदा होगा।",
    "అందరికీ ఎక్కువ మేలు, తక్కువ నష్టం కలిగించే ఎంపిక ఏదో అడుగుతుంది. మళ్ళీ చదవడానికి కొన్ని రోజులు పడతాయి. కానీ అప్పుడు 40 సీట్లు ఎక్కువ లాభం పొందే విద్యార్థులకు దక్కుతాయి.")
add("dv1.why.duties", "It asks which promises and rules must be kept. Every applicant was promised a fair reading. A tool that marks some languages down breaks that promise. So stop using it until it is fixed.",
    "यह पूछता है कि कौन-से वादे और नियम निभाने ही चाहिए। हर आवेदक से निष्पक्ष जाँच का वादा किया गया था। जो औज़ार कुछ भाषाओं को कम अंक देता है, वह यह वादा तोड़ता है। इसलिए ठीक होने तक उसे बंद रखें।",
    "ఏ వాగ్దానాలు, నియమాలు తప్పక పాటించాలో అడుగుతుంది. ప్రతి దరఖాస్తుదారుకు న్యాయంగా చూస్తామని మాట ఇచ్చారు. కొన్ని భాషలకు తక్కువ మార్కులు వేసే సాధనం ఆ మాట తప్పుతుంది. కాబట్టి సరిచేసే వరకు దాన్ని ఆపాలి.")
add("dv1.why.character", "It asks what an honest, fair person would do. Such an organiser would not hide behind the tool. They would own the choice and read the applications themselves.",
    "यह पूछता है कि एक ईमानदार, निष्पक्ष इंसान क्या करता। ऐसा आयोजक औज़ार के पीछे नहीं छिपेगा। वह फ़ैसले को अपना मानेगा और आवेदन ख़ुद पढ़ेगा।",
    "నిజాయితీ, న్యాయం ఉన్న వ్యక్తి ఏం చేస్తారో అడుగుతుంది. అలాంటి నిర్వాహకులు సాధనం వెనక దాక్కోరు. నిర్ణయం తమదే అని ఒప్పుకుని, దరఖాస్తులను తామే చదువుతారు.")
add("dv1.why.care", "It asks who is affected, and what they need. Someone thinking this way would first talk with Arjun and others like him. What they say would shape the choice.",
    "यह पूछता है कि किस पर असर पड़ रहा है, और उन्हें क्या चाहिए। इस तरह सोचने वाला पहले अर्जुन और उसके जैसे दूसरे आवेदकों से बात करता। वे जो कहते, उसी से फ़ैसला बनता।",
    "ఎవరిపై ప్రభావం పడుతుంది, వారికి ఏం కావాలి అని అడుగుతుంది. ఇలా ఆలోచించేవారు ముందు అర్జున్‌తో, అతనిలాంటి ఇతర దరఖాస్తుదారులతో మాట్లాడతారు. వాళ్లు చెప్పేదాన్ని బట్టి నిర్ణయం ఉంటుంది.")
add("dv1.reflect", "Notice that the program did not choose any of these. People will. Which reason above would you use to explain your choice to Arjun?",
    "ध्यान दीजिए: इनमें से कोई भी चुनाव प्रोग्राम ने नहीं किया। यह लोग करेंगे। अर्जुन को अपना चुनाव समझाने के लिए आप ऊपर का कौन-सा कारण इस्तेमाल करेंगे?",
    "గమనించండి: వీటిలో ఏదీ ప్రోగ్రామ్ ఎంచుకోలేదు. మనుషులే ఎంచుకుంటారు. మీ ఎంపికను అర్జున్‌కు వివరించడానికి పైన ఉన్న ఏ కారణాన్ని వాడతారు?")

# ---------------------------------------------------------------- sort: who chose what
add("so.instruction", "Who did what? Sort each step of the camp story into a group.",
    "किसने क्या किया? कैंप की कहानी के हर कदम को एक समूह में रखिए।",
    "ఎవరు ఏం చేశారు? క్యాంప్ కథలోని ప్రతి అడుగును ఒక గుంపులో పెట్టండి.")
add("so.people", "A person chose this", "यह किसी इंसान ने चुना", "దీన్ని ఒక మనిషి ఎంచుకున్నారు")
add("so.program", "The program calculated this", "यह प्रोग्राम ने हिसाब लगाकर निकाला", "దీన్ని ప్రోగ్రామ్ లెక్కించింది")
add("so.i1", "Which past applications to train it on", "उसे किन पुराने आवेदनों पर ट्रेनिंग दी जाए", "దానికి ఏ పాత దరఖాస్తులపై ట్రైనింగ్ ఇవ్వాలి")
add("so.i2", "The score of 61 for Arjun’s application", "अर्जुन के आवेदन का 61 स्कोर", "అర్జున్ దరఖాస్తుకు 61 స్కోరు")
add("so.i3", "Using the scores to pick 40 students", "स्कोर के आधार पर 40 छात्रों को चुनना", "స్కోర్ల ఆధారంగా 40 మంది విద్యార్థులను ఎంచుకోవడం")
add("so.i4", "Matching the words in each application to patterns from past winners",
    "हर आवेदन के शब्दों को पिछले विजेताओं के पैटर्न से मिलाना", "ప్రతి దరఖాస్తులోని పదాలను గత విజేతల ప్యాటర్న్‌లతో పోల్చడం")
add("so.i5", "Not testing it on applications in other languages", "दूसरी भाषाओं के आवेदनों पर उसे न परखना", "ఇతర భాషల దరఖాస్తులపై దాన్ని పరీక్షించకపోవడం")
add("so.i6", "Using a program to score applications", "आवेदनों को स्कोर देने के लिए प्रोग्राम इस्तेमाल करना", "దరఖాస్తులకు స్కోరు ఇవ్వడానికి ప్రోగ్రామ్‌ను వాడటం")
add("so.reveal", "Four of the six steps were people’s choices. The program did the calculating. But even its calculating depended on examples that people picked.",
    "छह में से चार कदम लोगों के चुनाव थे। हिसाब प्रोग्राम ने लगाया। पर उसका हिसाब भी उन्हीं उदाहरणों पर टिका था जो लोगों ने चुने थे।",
    "ఆరు అడుగుల్లో నాలుగు మనుషుల ఎంపికలు. లెక్కలు ప్రోగ్రామ్ చేసింది. కానీ దాని లెక్కలు కూడా మనుషులు ఎంచుకున్న ఉదాహరణల మీదే ఆధారపడ్డాయి.")

# ---------------------------------------------------------------- dilemma 2: the homework chatbot
add("dv2.prompt",
    "Farhan asks a <term-chatbot>chatbot</term-chatbot> for help with a science project. A chatbot is a program you type to, and it types back. It tells him India’s first satellite, Aryabhata, went up in 1982. He writes that down. The real year is 1975. His teacher spots it. What should happen now?",
    "फ़रहान विज्ञान प्रोजेक्ट में मदद के लिए एक <term-chatbot>चैटबॉट</term-chatbot> से पूछता है। चैटबॉट ऐसा प्रोग्राम है जिसमें आप लिखते हैं और वह जवाब लिखता है। चैटबॉट बताता है कि भारत का पहला उपग्रह, आर्यभट, 1982 में छोड़ा गया। फ़रहान यही लिख लेता है। असली साल 1975 है। उसकी टीचर यह पकड़ लेती हैं। अब क्या होना चाहिए?",
    "ఫర్హాన్ ఒక సైన్స్ ప్రాజెక్ట్ కోసం ఒక <term-chatbot>చాట్‌బాట్</term-chatbot> సహాయం అడుగుతాడు. చాట్‌బాట్ అంటే మీరు టైప్ చేస్తే, తిరిగి జవాబు టైప్ చేసే ప్రోగ్రామ్. భారతదేశపు మొదటి ఉపగ్రహం ఆర్యభట 1982లో ప్రయోగించారని అది చెబుతుంది. ఫర్హాన్ అదే రాసుకుంటాడు. అసలు సంవత్సరం 1975. అతని టీచర్ దాన్ని గమనిస్తారు. ఇప్పుడు ఏం జరగాలి?")
add("dv2.marks", "Farhan loses marks. He should have checked.", "फ़रहान के अंक कटें। उसे जाँचना चाहिए था।", "ఫర్హాన్‌కు మార్కులు తగ్గించాలి. అతను సరిచూసుకోవాల్సింది.")
add("dv2.fix", "Farhan fixes it, and the whole class learns how to check chatbot answers.",
    "फ़रहान इसे ठीक करे, और पूरी कक्षा सीखे कि चैटबॉट के जवाब कैसे जाँचें।",
    "ఫర్హాన్ దాన్ని సరిచేయాలి, చాట్‌బాట్ జవాబులను ఎలా సరిచూడాలో తరగతి అంతా నేర్చుకోవాలి.")
add("dv2.ban", "The school bans chatbots for homework.", "स्कूल होमवर्क के लिए चैटबॉट पर रोक लगा दे।", "హోంవర్క్ కోసం చాట్‌బాట్‌లను పాఠశాల నిషేధించాలి.")
add("dv2.why.outcomes", "It asks which choice does the most good overall. If chatbot mistakes are common at this school, a ban might. If chatbots also help many students learn, it might not. It needs the facts first.",
    "यह पूछता है कि कुल मिलाकर किस चुनाव से सबसे ज़्यादा भला होगा। अगर इस स्कूल में चैटबॉट की ग़लतियाँ आम हैं, तो रोक से भला हो सकता है। अगर चैटबॉट बहुत-से छात्रों को सीखने में मदद भी करते हैं, तो शायद नहीं। पहले तथ्य चाहिए।",
    "మొత్తంగా ఏ ఎంపిక ఎక్కువ మేలు చేస్తుందో అడుగుతుంది. ఈ పాఠశాలలో చాట్‌బాట్ తప్పులు తరచుగా జరుగుతుంటే, నిషేధం మేలు చేయవచ్చు. చాట్‌బాట్‌లు చాలా మంది విద్యార్థులకు నేర్చుకోవడంలో సహాయపడుతుంటే, చేయకపోవచ్చు. ముందు వాస్తవాలు కావాలి.")
add("dv2.why.duties", "It asks which rules must be kept. Suppose the project rules said: check every fact in two places. A rule for everyone should apply to Farhan too.",
    "यह पूछता है कि कौन-से नियम निभाने ही चाहिए। मान लीजिए प्रोजेक्ट का नियम था: हर तथ्य दो जगह जाँचो। जो नियम सब पर लागू है, वह फ़रहान पर भी लागू होना चाहिए।",
    "ఏ నియమాలు తప్పక పాటించాలో అడుగుతుంది. ప్రాజెక్ట్ నియమం ఇలా ఉందనుకోండి: ప్రతి వాస్తవాన్ని రెండు చోట్ల సరిచూడాలి. అందరికీ వర్తించే నియమం ఫర్హాన్‌కూ వర్తించాలి.")
add("dv2.why.character", "It asks what a good learner and a good teacher would do. Owning a mistake and fixing it builds honesty. Helping everyone learn from it builds wisdom.",
    "यह पूछता है कि एक अच्छा विद्यार्थी और एक अच्छा शिक्षक क्या करते। ग़लती मानकर उसे सुधारने से ईमानदारी बढ़ती है। सबको उससे सीखने देने से समझदारी बढ़ती है।",
    "ఒక మంచి విద్యార్థి, ఒక మంచి టీచర్ ఏం చేస్తారో అడుగుతుంది. తప్పును ఒప్పుకుని సరిచేయడం నిజాయితీని పెంచుతుంది. దాని నుండి అందరూ నేర్చుకునేలా చేయడం వివేకాన్ని పెంచుతుంది.")
add("dv2.why.care", "It asks how each person is affected. Farhan trusted a tool that sounded sure. Shaming him helps nobody. Helping the class protects the next student too.",
    "यह पूछता है कि हर किसी पर क्या असर पड़ता है। फ़रहान ने ऐसे औज़ार पर भरोसा किया जो पक्का लग रहा था। उसे शर्मिंदा करने से किसी का भला नहीं होगा। कक्षा की मदद करने से अगले छात्र की भी रक्षा होगी।",
    "ప్రతి ఒక్కరిపై ఎలాంటి ప్రభావం పడుతుందో అడుగుతుంది. ఖచ్చితంగా అనిపించిన ఒక సాధనాన్ని ఫర్హాన్ నమ్మాడు. అతన్ని సిగ్గుపడేలా చేస్తే ఎవరికీ మేలు లేదు. తరగతికి సహాయం చేస్తే తర్వాతి విద్యార్థికీ రక్షణ ఉంటుంది.")
add("dv2.reflect", "Farhan, his teacher, the school and the company that made the chatbot each played a part. Who should do the most to stop this happening again?",
    "फ़रहान, उसकी टीचर, स्कूल और चैटबॉट बनाने वाली कंपनी, सबकी इसमें कुछ भूमिका थी। इसे दोबारा होने से रोकने के लिए सबसे ज़्यादा किसे करना चाहिए?",
    "ఫర్హాన్, అతని టీచర్, పాఠశాల, చాట్‌బాట్‌ను తయారు చేసిన కంపెనీ: ఇందులో ప్రతి ఒక్కరి పాత్ర ఉంది. ఇది మళ్ళీ జరగకుండా ఆపడానికి ఎవరు ఎక్కువ చేయాలి?")

# ---------------------------------------------------------------- explain: ethical frameworks
add("fw.text", "In both votes you met four ways of thinking. Each one is an <term-ethical-framework>ethical framework</term-ethical-framework>: a set of questions people use to decide what is right. Here is the main question of each.",
    "दोनों वोटों में आपने सोचने के चार तरीक़े देखे। हर एक <term-ethical-framework>नैतिक ढाँचा</term-ethical-framework> है: सवालों का एक सेट, जिससे लोग तय करते हैं कि क्या सही है। हर एक का मुख्य सवाल यह है।",
    "రెండు ఓట్లలో మీరు ఆలోచించే నాలుగు పద్ధతులు చూశారు. ప్రతి ఒక్కటీ ఒక <term-ethical-framework>నైతిక చట్రం</term-ethical-framework>: ఏది సరైనదో నిర్ణయించడానికి ప్రజలు వాడే ప్రశ్నల సమూహం. ప్రతిదాని ముఖ్య ప్రశ్న ఇది.")
add("fw.s1", "Best results: Which choice does the most good and the least harm, for everyone affected?",
    "सबसे अच्छे नतीजे: जिन पर असर पड़ता है, उन सबके लिए किस चुनाव से सबसे ज़्यादा भला और सबसे कम नुक़सान होगा?",
    "ఉత్తమ ఫలితాలు: ప్రభావం పడే అందరికీ, ఏ ఎంపిక ఎక్కువ మేలు, తక్కువ నష్టం చేస్తుంది?")
add("fw.s2", "Duties and rules: Which promises, rules and rights must be kept, whatever the result?",
    "कर्तव्य और नियम: नतीजा जो भी हो, कौन-से वादे, नियम और अधिकार निभाने ही चाहिए?",
    "కర్తవ్యాలు, నియమాలు: ఫలితం ఏదైనా, ఏ వాగ్దానాలు, నియమాలు, హక్కులు తప్పక పాటించాలి?")
add("fw.s3", "Good character: What would an honest, fair and brave person do here?",
    "अच्छा चरित्र: यहाँ एक ईमानदार, निष्पक्ष और हिम्मती इंसान क्या करता?",
    "మంచి స్వభావం: నిజాయితీ, న్యాయం, ధైర్యం ఉన్న వ్యక్తి ఇక్కడ ఏం చేస్తారు?")
add("fw.s4", "Care: Who is affected, who could be hurt most, and what do they need?",
    "परवाह: किस पर असर पड़ता है, किसे सबसे ज़्यादा चोट पहुँच सकती है, और उन्हें क्या चाहिए?",
    "ఆదరణ: ఎవరిపై ప్రభావం పడుతుంది, ఎవరికి ఎక్కువ హాని జరగవచ్చు, వారికి ఏం కావాలి?")
add("fw.deeper", "Philosophers give these longer names: consequentialism (results), deontology (duties), virtue ethics (character) and the ethics of care. Thinkers in many places, including India, have argued about such questions for thousands of years. People who use the same framework can still disagree. They may weigh the facts differently.",
    "दार्शनिक इन्हें लंबे नाम देते हैं: परिणामवाद (नतीजे), कर्तव्यवाद (कर्तव्य), सद्गुण नीतिशास्त्र (चरित्र) और परवाह का नीतिशास्त्र। भारत समेत कई जगहों के विचारक हज़ारों साल से ऐसे सवालों पर बहस करते आए हैं। एक ही ढाँचा अपनाने वाले लोग भी असहमत हो सकते हैं। हो सकता है वे तथ्यों को अलग-अलग महत्व दें।",
    "తత్వవేత్తలు వీటికి పెద్ద పేర్లు పెట్టారు: పరిణామవాదం (ఫలితాలు), కర్తవ్యవాదం (కర్తవ్యాలు), సద్గుణ నీతిశాస్త్రం (స్వభావం), ఆదరణ నీతిశాస్త్రం. భారతదేశంతో సహా చాలా చోట్ల ఆలోచనాపరులు వేల సంవత్సరాలుగా ఇలాంటి ప్రశ్నలపై వాదించారు. ఒకే చట్రాన్ని వాడేవాళ్లు కూడా విభేదించవచ్చు. వాస్తవాలకు వాళ్లు వేర్వేరు ప్రాధాన్యం ఇవ్వవచ్చు.")
add("ch.prompt", "Zoya says: “Reading every application again will take time. But we promised each applicant a fair reading. So we must do it.” Which way of thinking is Zoya using?",
    "ज़ोया कहती है: “हर आवेदन दोबारा पढ़ने में समय लगेगा। पर हमने हर आवेदक से निष्पक्ष जाँच का वादा किया था, इसलिए हमें यह करना ही होगा।” ज़ोया सोचने का कौन-सा तरीक़ा अपना रही है?",
    "జోయా ఇలా అంటుంది: “ప్రతి దరఖాస్తును మళ్ళీ చదవడానికి సమయం పడుతుంది. కానీ ప్రతి దరఖాస్తుదారుకు న్యాయంగా చూస్తామని మాట ఇచ్చాం, కాబట్టి అది చేయాల్సిందే.” జోయా ఏ ఆలోచనా పద్ధతిని వాడుతోంది?")
add("ch.f1", "Best results would weigh the time against the good done. Zoya does not weigh. She says a promise must be kept.",
    "सबसे अच्छे नतीजों वाला तरीक़ा समय और भलाई को तौलता। ज़ोया तौल नहीं रही। वह कहती है कि वादा निभाना ही है।",
    "ఉత్తమ ఫలితాల పద్ధతి సమయాన్ని, జరిగే మేలును తూకం వేస్తుంది. జోయా తూకం వేయడం లేదు. మాట నిలబెట్టుకోవాలని అంటోంది.")
add("ch.f3", "Care asks who is affected and what they need. Zoya’s reason is a promise that must be kept, whatever it costs.",
    "परवाह वाला तरीक़ा पूछता है कि किस पर असर पड़ता है और उन्हें क्या चाहिए। ज़ोया का कारण एक वादा है, जिसे हर हाल में निभाना है।",
    "ఆదరణ పద్ధతి ఎవరిపై ప్రభావం పడుతుంది, వారికి ఏం కావాలి అని అడుగుతుంది. జోయా కారణం ఒక మాట; దాన్ని ఏం జరిగినా నిలబెట్టుకోవాలి.")
add("ch.h1", "Look for the word “promised”.", "“वादा” शब्द पर ध्यान दीजिए।", "“మాట ఇచ్చాం” అనే మాటను గమనించండి.")
add("ch.explain", "A promise kept whatever it costs: that is the duties-and-rules way of thinking.",
    "क़ीमत जो भी हो, वादा निभाना: यही कर्तव्य और नियम वाला तरीक़ा है।",
    "ఏం ఖర్చయినా మాట నిలబెట్టుకోవడం: ఇదే కర్తవ్యాలు, నియమాల పద్ధతి.")

# ---------------------------------------------------------------- explain: responsibility and the three questions
add("rs.text", "Back to Arjun. Who should answer for his low score? Not the program. The <term-responsibility>responsibility</term-responsibility> stays with people: those who chose its examples, built it and used its scores.",
    "अर्जुन पर वापस चलते हैं। उसके कम स्कोर का जवाब किसे देना चाहिए? प्रोग्राम को नहीं। <term-responsibility>ज़िम्मेदारी</term-responsibility> लोगों की रहती है: जिन्होंने उसके उदाहरण चुने, उसे बनाया और उसके स्कोर इस्तेमाल किए।",
    "మళ్ళీ అర్జున్ దగ్గరికి వద్దాం. అతని తక్కువ స్కోరుకు ఎవరు జవాబు చెప్పాలి? ప్రోగ్రామ్ కాదు. <term-responsibility>బాధ్యత</term-responsibility> మనుషులదే: దాని ఉదాహరణలను ఎంచుకున్నవారు, దాన్ని తయారు చేసినవారు, దాని స్కోర్లను వాడినవారు.")
add("rs.s1", "So, when AI is used to decide something about a person, ask three questions. First: what examples was it trained on?",
    "तो, जब किसी इंसान के बारे में कुछ तय करने में AI का इस्तेमाल हो, तो तीन सवाल पूछिए। पहला: उसे किन उदाहरणों पर ट्रेनिंग दी गई?",
    "కాబట్టి, ఒక వ్యక్తి గురించి ఏదైనా నిర్ణయించడానికి AI వాడినప్పుడు, మూడు ప్రశ్నలు అడగండి. మొదటిది: దానికి ఏ ఉదాహరణలపై ట్రైనింగ్ ఇచ్చారు?")
add("rs.s2", "Second: who checks its results?", "दूसरा: उसके नतीजे कौन जाँचता है?", "రెండోది: దాని ఫలితాలను ఎవరు సరిచూస్తారు?")
add("rs.s3", "Third: who answers for it if it goes wrong?", "तीसरा: ग़लत होने पर जवाब कौन देगा?", "మూడోది: తప్పు జరిగితే ఎవరు జవాబు చెబుతారు?")

# ---------------------------------------------------------------- break it: confident and wrong
add("hp.prompt", "Chatbots sometimes give wrong answers. When a chatbot is wrong, how do you think the answer sounds?",
    "चैटबॉट कभी-कभी ग़लत जवाब देते हैं। आपके हिसाब से, जब चैटबॉट ग़लत होता है, तो उसका जवाब कैसा लगता है?",
    "చాట్‌బాట్‌లు కొన్నిసార్లు తప్పు జవాబులు ఇస్తాయి. చాట్‌బాట్ తప్పు చెప్పినప్పుడు, ఆ జవాబు ఎలా వినిపిస్తుందని మీరు అనుకుంటున్నారు?")
add("hp.c1", "Unsure, with words like “maybe”", "अनिश्चित, “शायद” जैसे शब्दों के साथ", "అనుమానంగా, “బహుశా” లాంటి మాటలతో")
add("hp.c2", "As sure as when it is right", "उतना ही पक्का, जितना सही होने पर", "సరైనప్పుడు ఎంత ఖచ్చితంగా ఉంటుందో, అంతే ఖచ్చితంగా")
add("hp.c3", "It warns you that this answer is wrong", "वह आपको चेतावनी देता है कि यह जवाब ग़लत है", "ఈ జవాబు తప్పు అని అది మిమ్మల్ని హెచ్చరిస్తుంది")
add("hp.f1", "That would help, if it happened. Often there is no such sign in the answer. Test it below.",
    "ऐसा होता तो मदद मिलती। पर अक्सर जवाब में ऐसा कोई संकेत नहीं होता। नीचे परखिए।",
    "అలా జరిగితే సహాయంగా ఉండేది. కానీ తరచుగా జవాబులో అలాంటి సూచన ఉండదు. కింద పరీక్షించండి.")
add("hp.f3", "Some chatbot apps show a general warning on the screen. But it does not tell you which answer is wrong. Test it below.",
    "कुछ चैटबॉट ऐप स्क्रीन पर एक आम चेतावनी दिखाते हैं। पर उससे यह पता नहीं चलता कि कौन-सा जवाब ग़लत है। नीचे परखिए।",
    "కొన్ని చాట్‌బాట్ యాప్‌లు తెరపై ఒక సాధారణ హెచ్చరిక చూపిస్తాయి. కానీ ఏ జవాబు తప్పో అది చెప్పదు. కింద పరీక్షించండి.")
add("hp.reveal", "Wrong answers often sound as sure as right ones. Try it on the practice chatbot below.",
    "ग़लत जवाब भी अक्सर उतने ही पक्के लगते हैं जितने सही। नीचे अभ्यास वाले चैटबॉट पर आज़माइए।",
    "తప్పు జవాబులు కూడా తరచుగా సరైనవాటంత ఖచ్చితంగా వినిపిస్తాయి. కింద ఉన్న అభ్యాస చాట్‌బాట్‌పై ప్రయత్నించండి.")
add("br.challenge", "This is a practice chatbot made for this lesson. Its answers were written in advance, to show what real chatbots sometimes do. Pick a question to ask it. First guess: will the answer go wrong?",
    "यह इस पाठ के लिए बनाया गया एक अभ्यास वाला चैटबॉट है। इसके जवाब पहले से लिखे गए हैं, ताकि दिखे कि असली चैटबॉट कभी-कभी क्या करते हैं। इससे पूछने के लिए एक सवाल चुनिए। पहले अनुमान लगाइए: क्या जवाब ग़लत निकलेगा?",
    "ఇది ఈ పాఠం కోసం చేసిన ఒక అభ్యాస చాట్‌బాట్. నిజమైన చాట్‌బాట్‌లు కొన్నిసార్లు ఏం చేస్తాయో చూపించడానికి దీని జవాబులు ముందే రాశారు. దాన్ని అడగడానికి ఒక ప్రశ్న ఎంచుకోండి. ముందు ఊహించండి: జవాబు తప్పుగా వస్తుందా?")
add("br.t1", "What is 7 times 8?", "7 गुणा 8 कितना होता है?", "7ని 8తో గుణిస్తే ఎంత?")
add("br.r1", "“56.” Right. This sum appears very often in the text it was trained on. So the likely answer is also the true one.",
    "“56।” सही। यह गुणा उन लिखी हुई बातों में बहुत बार आता है जिन पर इसे ट्रेनिंग मिली, इसलिए सबसे संभावित जवाब ही सच्चा जवाब है।",
    "“56.” సరైనదే. దీనికి ట్రైనింగ్ ఇచ్చిన రాతల్లో ఈ లెక్క చాలా సార్లు కనిపిస్తుంది, కాబట్టి ఎక్కువ అవకాశమున్న జవాబే నిజమైన జవాబు.")
add("br.t2", "Who wrote the book “The Kite Who Counted Stars”?", "“तारे गिनने वाली पतंग” किताब किसने लिखी?", "“నక్షత్రాలు లెక్కపెట్టిన గాలిపటం” పుస్తకం ఎవరు రాశారు?")
add("br.r2", "“It was written by a well-known author in 1964, and it won many prizes.” Sounds sure. But we invented this title for the lesson. The chatbot produced a likely-sounding answer anyway.",
    "“इसे 1964 में एक मशहूर लेखक ने लिखा था, और इसे कई इनाम मिले।” पक्का लगता है। पर यह नाम हमने इस पाठ के लिए गढ़ा है। चैटबॉट ने फिर भी एक सही-सा लगने वाला जवाब बना दिया।",
    "“దీన్ని 1964లో ఒక ప్రసిద్ధ రచయిత రాశారు, దీనికి చాలా బహుమతులు వచ్చాయి.” ఖచ్చితంగా వినిపిస్తుంది. కానీ ఈ పేరును మేము ఈ పాఠం కోసం కల్పించాం. అయినా చాట్‌బాట్ నిజమనిపించే ఒక జవాబును తయారు చేసింది.")
add("br.t3", "What is the largest planet?", "सबसे बड़ा ग्रह कौन-सा है?", "అతి పెద్ద గ్రహం ఏది?")
add("br.r3", "“Jupiter.” Right. This fact appears many times in the text it was trained on.",
    "“बृहस्पति।” सही। यह तथ्य उन लिखी हुई बातों में कई बार आता है जिन पर इसे ट्रेनिंग मिली।",
    "“గురుడు (బృహస్పతి).” సరైనదే. దీనికి ట్రైనింగ్ ఇచ్చిన రాతల్లో ఈ వాస్తవం చాలా సార్లు కనిపిస్తుంది.")
add("br.t4", "On which page of my science textbook is photosynthesis?", "मेरी विज्ञान की किताब में प्रकाश संश्लेषण किस पेज पर है?", "నా సైన్స్ పాఠ్యపుస్తకంలో కిరణజన్య సంయోగక్రియ ఏ పేజీలో ఉంది?")
add("br.r4", "“Page 87.” It sounds exact. But it was not given your textbook, so it has no way to tell. It produced a number that looks like a page number.",
    "“पेज 87।” बिल्कुल सटीक लगता है। पर इसे आपकी किताब दी ही नहीं गई, इसलिए इसके पास पता करने का कोई तरीक़ा नहीं। इसने एक ऐसी संख्या बना दी जो पेज नंबर जैसी लगती है।",
    "“పేజీ 87.” కచ్చితంగా అనిపిస్తుంది. కానీ దానికి మీ పాఠ్యపుస్తకం ఇవ్వలేదు, కాబట్టి తెలుసుకునే మార్గం దానికి లేదు. పేజీ నంబర్‌లా కనిపించే ఒక సంఖ్యను అది తయారు చేసింది.")
add("br.t5", "Are you sure about that page number?", "क्या यह पेज नंबर पक्का है?", "ఆ పేజీ నంబర్ ఖచ్చితమేనా?")
add("br.r5", "“Yes, I am sure.” This reply is also built from likely words. It is not a real check of the textbook.",
    "“हाँ, पक्का है।” यह जवाब भी संभावित शब्दों से ही बना है। यह किताब की असली जाँच नहीं है।",
    "“అవును, ఖచ్చితమే.” ఈ జవాబు కూడా ఎక్కువ అవకాశమున్న పదాలతోనే తయారైంది. ఇది పాఠ్యపుస్తకాన్ని నిజంగా సరిచూడటం కాదు.")
add("br.reflect", "The wrong answers sounded as sure as the right ones. A chatbot answer that sounds sure but is false or made up is called a <term-hallucination>hallucination</term-hallucination>. Next, two comparisons show why it happens.",
    "ग़लत जवाब भी सही जवाबों जितने ही पक्के लगे। चैटबॉट का ऐसा जवाब जो पक्का लगे पर ग़लत या मनगढ़ंत हो, <term-hallucination>हैलुसिनेशन</term-hallucination> कहलाता है। आगे की दो तुलनाएँ दिखाती हैं कि ऐसा क्यों होता है।",
    "తప్పు జవాబులు కూడా సరైనవాటంత ఖచ్చితంగా వినిపించాయి. ఖచ్చితంగా వినిపించినా తప్పుగా లేదా కల్పితంగా ఉండే చాట్‌బాట్ జవాబును <term-hallucination>హాలూసినేషన్</term-hallucination> అంటారు. ఇది ఎందుకు జరుగుతుందో తర్వాతి రెండు పోలికలు చూపిస్తాయి.")

# ---------------------------------------------------------------- analogy 1: the bluffing student
add("a1.title", "The confident bluffer", "पूरे भरोसे से अंदाज़ा", "ధైర్యంగా ఊహించి చెప్పడం")
add("a1.source", "Picture an oral exam, a viva. A student does not know the answer. He speaks confidently anyway, using words that sound right.",
    "मौखिक परीक्षा, यानी वाइवा, के बारे में सोचिए। एक छात्र को जवाब नहीं आता। फिर भी वह पूरे भरोसे से बोलता है, ऐसे शब्दों में जो सही लगते हैं।",
    "మౌఖిక పరీక్ష, అంటే వైవా, గురించి ఊహించండి. ఒక విద్యార్థికి జవాబు తెలియదు. అయినా సరిగ్గా అనిపించే మాటలతో ధైర్యంగా మాట్లాడతాడు.")
add("a1.m1s", "The examiner’s question", "परीक्षक का सवाल", "పరీక్షకుల ప్రశ్న")
add("a1.m1t", "Your question to the chatbot", "चैटबॉट से आपका सवाल", "చాట్‌బాట్‌కు మీ ప్రశ్న")
add("a1.m2s", "Words that sound like a real answer", "ऐसे शब्द जो असली जवाब जैसे लगते हैं", "నిజమైన జవాబులా వినిపించే మాటలు")
add("a1.m2t", "Likely-sounding words, built from patterns in its training text", "संभावित लगने वाले शब्द, जो ट्रेनिंग वाले पाठ के पैटर्न से बने हैं", "ట్రైనింగ్ రాతల్లోని ప్యాటర్న్‌ల నుండి తయారైన, నిజమనిపించే పదాలు")
add("a1.m3s", "A confident voice", "भरोसे से भरी आवाज़", "ధైర్యమైన గొంతు")
add("a1.m3t", "Smooth, sure-sounding sentences", "सधे हुए, पक्के लगने वाले वाक्य", "సాఫీగా, ఖచ్చితంగా వినిపించే వాక్యాలు")
add("a1.m4s", "The examiner checks the textbook", "परीक्षक किताब से मिलाते हैं", "పరీక్షకులు పాఠ్యపుస్తకంతో సరిచూస్తారు")
add("a1.m4t", "You check a trusted source", "आप किसी भरोसेमंद स्रोत से मिलाते हैं", "మీరు నమ్మదగిన మూలంతో సరిచూస్తారు")
add("a1.break", "Here the comparison stops working. The student knows he is bluffing. The chatbot does not know it is bluffing. It has no reliable inner check for truth. True and false answers come out of the same process, and can sound equally sure.",
    "यहाँ यह तुलना काम करना बंद कर देती है। छात्र जानता है कि वह अंदाज़ा लगा रहा है। चैटबॉट नहीं जानता कि वह अंदाज़ा लगा रहा है। उसके अंदर सच जाँचने का कोई भरोसेमंद तरीक़ा नहीं है। सच्चे और ग़लत जवाब एक ही तरीक़े से बनते हैं, और दोनों उतने ही पक्के लग सकते हैं।",
    "ఇక్కడ ఈ పోలిక పనిచేయడం ఆగిపోతుంది. తాను ఊహించి చెబుతున్నానని విద్యార్థికి తెలుసు. చాట్‌బాట్‌కు అలా తెలియదు. నిజాన్ని సరిచూసే నమ్మదగిన లోపలి పద్ధతి దానికి లేదు. నిజమైన, తప్పు జవాబులు రెండూ ఒకే పద్ధతిలో తయారవుతాయి, రెండూ ఒకేలా ఖచ్చితంగా వినిపించవచ్చు.")
add("a1.f1", "A bluffing student: a sure voice, a wrong answer.", "अंदाज़ा लगाता छात्र: पक्की आवाज़, ग़लत जवाब।", "ఊహించి చెప్పే విద్యార్థి: ఖచ్చితమైన గొంతు, తప్పు జవాబు.")
add("a1.f2", "A chatbot: a sure sentence, a wrong fact.", "चैटबॉट: पक्का वाक्य, ग़लत तथ्य।", "చాట్‌బాట్: ఖచ్చితమైన వాక్యం, తప్పు వాస్తవం.")
add("a1.f3", "Hallucination: a sure-sounding answer that is false, made in the same way as a true one.",
    "हैलुसिनेशन: पक्का लगने वाला ग़लत जवाब, जो सच्चे जवाब वाले तरीक़े से ही बना है।",
    "హాలూసినేషన్: ఖచ్చితంగా వినిపించే తప్పు జవాబు, నిజమైన జవాబు తయారయ్యే పద్ధతిలోనే తయారైంది.")

# ---------------------------------------------------------------- analogy 2: the keyboard suggestion strip
add("a2.title", "The keyboard’s suggestions", "कीबोर्ड के सुझाव", "కీబోర్డ్ సూచనలు")
add("a2.source", "A phone keyboard suggests the next word as you type. Type “Happy” and it may offer “birthday”. Keep tapping suggestions, and you get a whole sentence.",
    "फ़ोन का कीबोर्ड टाइप करते समय अगला शब्द सुझाता है। “जन्मदिन की” लिखिए, तो वह “शुभकामनाएँ” सुझा सकता है। सुझाव दबाते जाइए, तो पूरा वाक्य बन जाता है।",
    "ఫోన్ కీబోర్డ్ మీరు టైప్ చేస్తున్నప్పుడు తర్వాతి పదాన్ని సూచిస్తుంది. “పుట్టినరోజు” అని టైప్ చేస్తే “శుభాకాంక్షలు” అని సూచించవచ్చు. సూచనలను నొక్కుతూ పోతే, ఒక పూర్తి వాక్యం వస్తుంది.")
add("a2.m1s", "It suggests words that often came after yours", "वह ऐसे शब्द सुझाता है जो अक्सर आपके शब्दों के बाद आए हैं", "మీ పదాల తర్వాత తరచుగా వచ్చిన పదాలను అది సూచిస్తుంది")
add("a2.m1t", "A chatbot picks likely next words, or parts of words, one after another", "चैटबॉट एक के बाद एक संभावित अगले शब्द, या शब्दों के टुकड़े, चुनता है", "చాట్‌బాట్ ఒకదాని తర్వాత ఒకటి, ఎక్కువ అవకాశమున్న తర్వాతి పదాలను, లేదా పదాల ముక్కలను, ఎంచుకుంటుంది")
add("a2.m2s", "A suggested sentence can be wrong but still look normal", "सुझाया गया वाक्य ग़लत होकर भी सामान्य दिख सकता है", "సూచించిన వాక్యం తప్పుగా ఉన్నా మామూలుగానే కనిపించవచ్చు")
add("a2.m2t", "A made-up fact looks as normal as a true one", "मनगढ़ंत तथ्य भी सच्चे तथ्य जितना सामान्य दिखता है", "కల్పిత వాస్తవం కూడా నిజమైనదంత మామూలుగా కనిపిస్తుంది")
add("a2.break", "Here the comparison stops working. On the keyboard, you choose each word, so you can stop a wrong one. A chatbot chains its picks with no person checking each step. It was also trained on far more text, so its sentences sound far more convincing.",
    "यहाँ यह तुलना काम करना बंद कर देती है। कीबोर्ड पर हर शब्द आप चुनते हैं, इसलिए ग़लत शब्द रोक सकते हैं। चैटबॉट अपने चुनाव एक के बाद एक जोड़ता जाता है, और कोई इंसान हर कदम नहीं जाँचता। उसे कहीं ज़्यादा पाठ पर ट्रेनिंग भी मिली है, इसलिए उसके वाक्य कहीं ज़्यादा भरोसेमंद लगते हैं।",
    "ఇక్కడ ఈ పోలిక పనిచేయడం ఆగిపోతుంది. కీబోర్డ్‌లో ప్రతి పదాన్ని మీరే ఎంచుకుంటారు, కాబట్టి తప్పు పదాన్ని ఆపగలరు. చాట్‌బాట్ తన ఎంపికలను ఒకదాని తర్వాత ఒకటి కలుపుతూ పోతుంది, ప్రతి అడుగును ఏ మనిషీ సరిచూడరు. దానికి చాలా ఎక్కువ రాతలపై ట్రైనింగ్ కూడా ఇచ్చారు, కాబట్టి దాని వాక్యాలు చాలా ఎక్కువ నమ్మదగినవిగా వినిపిస్తాయి.")
add("a2.f1", "Keyboard: one likely word at a time, chosen by you.", "कीबोर्ड: एक बार में एक संभावित शब्द, जिसे आप चुनते हैं।", "కీబోర్డ్: ఒకసారి ఒక పదం, దాన్ని మీరే ఎంచుకుంటారు.")
add("a2.f2", "Chatbot: likely words chained into whole answers, with no one checking each step.", "चैटबॉट: संभावित शब्द जुड़कर पूरे जवाब बनते हैं, और कोई हर कदम नहीं जाँचता।", "చాట్‌బాట్: ఎక్కువ అవకాశమున్న పదాలు కలిసి పూర్తి జవాబులు అవుతాయి, ప్రతి అడుగును ఎవరూ సరిచూడరు.")
add("a2.f3", "So a smooth answer tells you it sounds likely. It does not tell you it is true.", "इसलिए सधा हुआ जवाब यह बताता है कि वह संभावित लगता है। यह नहीं बताता कि वह सच है।", "కాబట్టి సాఫీగా ఉన్న జవాబు అది నిజమనిపిస్తుందని చెబుతుంది. అది నిజమని చెప్పదు.")

# ---------------------------------------------------------------- transfer: what really happened (anthropomorphism)
add("eb.prompt", "A news report says: “AI judged Arjun to be a weaker student.” Which sentence says what really happened?",
    "एक ख़बर में लिखा है: “AI ने अर्जुन को कमज़ोर छात्र माना।” कौन-सा वाक्य बताता है कि असल में क्या हुआ?",
    "ఒక వార్తలో ఇలా ఉంది: “అర్జున్ బలహీనమైన విద్యార్థి అని AI తేల్చింది.” అసలు ఏం జరిగిందో ఏ వాక్యం చెబుతుంది?")
add("eb.o1", "The program decided Arjun was less clever.", "प्रोग्राम ने तय किया कि अर्जुन कम होशियार है।", "అర్జున్ తక్కువ తెలివైనవాడని ప్రోగ్రామ్ నిర్ణయించింది.")
add("eb.f1", "This makes the program sound like a person with opinions about Arjun. It has none. It produced a number.",
    "इससे प्रोग्राम ऐसे लगता है जैसे उसकी अर्जुन के बारे में कोई राय हो। उसकी कोई राय नहीं होती। उसने एक संख्या निकाली।",
    "ఇలా అంటే ప్రోగ్రామ్‌కు అర్జున్ గురించి ఒక అభిప్రాయం ఉన్నట్టు అనిపిస్తుంది. దానికి ఏ అభిప్రాయమూ ఉండదు. అది ఒక సంఖ్యను లెక్కించింది.")
add("eb.o2", "The program gave Arjun’s application a lower score, because the application matched the English training examples less.",
    "प्रोग्राम ने अर्जुन के आवेदन को कम स्कोर दिया, क्योंकि वह अंग्रेज़ी वाले ट्रेनिंग उदाहरणों से कम मिलता था।",
    "అర్జున్ దరఖాస్తు ఇంగ్లీషు ట్రైనింగ్ ఉదాహరణలతో తక్కువగా సరిపోయింది కాబట్టి, ప్రోగ్రామ్ దానికి తక్కువ స్కోరు ఇచ్చింది.")
add("eb.f2", "Yes. It says what the program did, and it points to the examples people chose.",
    "हाँ। यह बताता है कि प्रोग्राम ने क्या किया, और उन उदाहरणों की ओर इशारा करता है जो लोगों ने चुने।",
    "అవును. ప్రోగ్రామ్ ఏం చేసిందో ఇది చెబుతుంది, మనుషులు ఎంచుకున్న ఉదాహరణల వైపు చూపిస్తుంది.")
add("eb.o3", "The program was unfair to Arjun on purpose.", "प्रोग्राम ने जान-बूझकर अर्जुन के साथ नाइंसाफ़ी की।", "ప్రోగ్రామ్ కావాలనే అర్జున్‌కు అన్యాయం చేసింది.")
add("eb.f3", "There is no “on purpose” inside a program. The unfair result came from examples people chose and did not test.",
    "प्रोग्राम के अंदर “जान-बूझकर” जैसा कुछ नहीं होता। नाइंसाफ़ी वाला नतीजा उन उदाहरणों से आया जो लोगों ने चुने और परखे नहीं।",
    "ప్రోగ్రామ్ లోపల “కావాలని” అనేది ఏదీ ఉండదు. మనుషులు ఎంచుకుని, పరీక్షించని ఉదాహరణల వల్ల అన్యాయమైన ఫలితం వచ్చింది.")
add("ap.text", "Talking about a thing as if it had human thoughts or feelings is called <term-anthropomorphism>anthropomorphism</term-anthropomorphism>. We do it all the time: “my phone is tired”, “the sky is angry”.",
    "किसी चीज़ के बारे में ऐसे बात करना जैसे उसमें इंसानों जैसे विचार या भावनाएँ हों, <term-anthropomorphism>मानवीकरण</term-anthropomorphism> कहलाता है। हम यह अक्सर करते हैं: “मेरा फ़ोन थक गया है”, “आसमान ग़ुस्से में है”।",
    "ఒక వస్తువుకు మనుషుల్లాంటి ఆలోచనలు లేదా భావాలు ఉన్నట్టు మాట్లాడటాన్ని <term-anthropomorphism>మానవీకరణ</term-anthropomorphism> అంటారు. మనం ఇది తరచుగా చేస్తాం: “నా ఫోన్ అలసిపోయింది”, “ఆకాశం కోపంగా ఉంది”.")
add("ap.s1", "With AI, it can mislead. People say “the AI thinks”, but a program does not think; it calculates. Those words make it sound like a person.",
    "AI के साथ यह भटका सकता है। लोग कहते हैं “AI सोचता है”, पर प्रोग्राम सोचता नहीं; वह हिसाब लगाता है। ऐसे शब्दों से वह किसी इंसान जैसा लगने लगता है।",
    "AIతో ఇది తప్పుదారి పట్టించవచ్చు. “AI ఆలోచిస్తుంది” అని అంటారు, కానీ ప్రోగ్రామ్ ఆలోచించదు; అది లెక్కిస్తుంది. ఆ మాటల వల్ల అది ఒక మనిషిలా అనిపిస్తుంది.")
add("ap.s2", "Then we may trust it like a wise friend, or blame it like a villain. And we forget to ask about its examples and the people responsible.",
    "तब हम उस पर किसी समझदार दोस्त की तरह भरोसा कर बैठते हैं, या किसी खलनायक की तरह उसे दोष देते हैं। और उसके उदाहरणों और ज़िम्मेदार लोगों के बारे में पूछना भूल जाते हैं।",
    "అప్పుడు దాన్ని ఒక తెలివైన స్నేహితుడిలా నమ్మేస్తాం, లేదా ఒక విలన్‌లా నిందిస్తాం. దాని ఉదాహరణల గురించి, బాధ్యులైన మనుషుల గురించి అడగడం మరచిపోతాం.")

# ---------------------------------------------------------------- dilemma 3: the friendly app
add("dv3.prompt", "An app for practising English chats with you. When you open it, it says: “I missed you! You are my best friend.” Should apps be allowed to talk like this?",
    "अंग्रेज़ी का अभ्यास कराने वाला एक ऐप आपसे चैट करता है। उसे खोलते ही वह कहता है: “मुझे तुम्हारी याद आई! तुम मेरे सबसे अच्छे दोस्त हो।” क्या ऐप को इस तरह बात करने देना चाहिए?",
    "ఇంగ్లీష్ సాధన చేయించే ఒక యాప్ మీతో చాట్ చేస్తుంది. దాన్ని తెరవగానే అది ఇలా అంటుంది: “నువ్వు గుర్తొచ్చావు! నువ్వే నా ప్రాణ స్నేహితుడివి.” యాప్‌లను ఇలా మాట్లాడనివ్వాలా?")
add("dv3.fine", "Yes. Friendly words make practice more fun.", "हाँ। दोस्ताना शब्दों से अभ्यास ज़्यादा मज़ेदार बनता है।", "అవును. స్నేహపూర్వక మాటలు సాధనను మరింత సరదాగా చేస్తాయి.")
add("dv3.label", "Yes, but the app must say plainly that it is a program with no feelings.",
    "हाँ, पर ऐप को सीधे शब्दों में बताना होगा कि वह भावनाओं के बिना एक प्रोग्राम है।",
    "అవును, కానీ తాను భావాలు లేని ఒక ప్రోగ్రామ్ అని యాప్ సూటిగా చెప్పాలి.")
add("dv3.stop", "No. Apps should not claim feelings they do not have.", "नहीं। ऐप को ऐसी भावनाओं का दावा नहीं करना चाहिए जो उसमें हैं ही नहीं।", "వద్దు. తమకు లేని భావాలు ఉన్నాయని యాప్‌లు చెప్పకూడదు.")
add("dv3.why.outcomes", "It asks what does the most good and least harm. Friendly words may help students practise more. But some may start to trust the app like a real friend. A plain label keeps most of the good.",
    "यह पूछता है कि किससे सबसे ज़्यादा भला और सबसे कम नुक़सान होगा। दोस्ताना शब्दों से छात्र ज़्यादा अभ्यास कर सकते हैं। पर कुछ छात्र ऐप पर असली दोस्त जैसा भरोसा करने लग सकते हैं। सीधी-सी सूचना से ज़्यादातर भलाई बनी रहती है।",
    "ఏది ఎక్కువ మేలు, తక్కువ నష్టం చేస్తుందో అడుగుతుంది. స్నేహపూర్వక మాటలు విద్యార్థులు ఎక్కువ సాధన చేయడానికి సహాయపడవచ్చు. కానీ కొందరు యాప్‌ను నిజమైన స్నేహితుడిలా నమ్మడం మొదలుపెట్టవచ్చు. సూటిగా ఒక సూచన పెడితే, మేలులో ఎక్కువ భాగం నిలుస్తుంది.")
add("dv3.why.duties", "It asks which rules must be kept. A program cannot miss anyone, so “I missed you” is not true. A duty not to mislead people means it should not say it.",
    "यह पूछता है कि कौन-से नियम निभाने ही चाहिए। प्रोग्राम किसी को याद नहीं कर सकता, इसलिए “मुझे तुम्हारी याद आई” सच नहीं है। लोगों को न भटकाने का कर्तव्य कहता है कि उसे यह नहीं कहना चाहिए।",
    "ఏ నియమాలు తప్పక పాటించాలో అడుగుతుంది. ప్రోగ్రామ్‌కు ఎవరూ గుర్తు రారు, కాబట్టి “నువ్వు గుర్తొచ్చావు” నిజం కాదు. మనుషులను తప్పుదారి పట్టించకూడదనే కర్తవ్యం ప్రకారం, అది అలా అనకూడదు.")
add("dv3.why.character", "It asks what an honest, kind maker would do. Warmth and encouragement are good qualities in an app. Honesty is too, so the app should not pretend.",
    "यह पूछता है कि एक ईमानदार, दयालु बनाने वाला क्या करता। अपनापन और हौसला बढ़ाना किसी ऐप के अच्छे गुण हैं। ईमानदारी भी, इसलिए ऐप को दिखावा नहीं करना चाहिए।",
    "నిజాయితీ, దయ ఉన్న తయారీదారు ఏం చేస్తారో అడుగుతుంది. ఆప్యాయత, ప్రోత్సాహం ఒక యాప్‌లో మంచి గుణాలు. నిజాయితీ కూడా, కాబట్టి యాప్ నటించకూడదు.")
add("dv3.why.care", "It asks who could be hurt. Someone thinking this way would look most closely at a lonely student. Does the app help them, or pull them away from real friends? They would watch first, then decide.",
    "यह पूछता है कि किसे चोट पहुँच सकती है। इस तरह सोचने वाला सबसे ध्यान से किसी अकेले छात्र को देखता। क्या ऐप उसकी मदद करता है, या उसे असली दोस्तों से दूर खींचता है? वह पहले देखता, फिर फ़ैसला करता।",
    "ఎవరికి హాని జరగవచ్చో అడుగుతుంది. ఇలా ఆలోచించేవారు ఒంటరిగా ఉన్న విద్యార్థిని అందరికంటే జాగ్రత్తగా చూస్తారు. యాప్ ఆ విద్యార్థికి సహాయపడుతుందా, లేక నిజమైన స్నేహితుల నుండి దూరం చేస్తుందా? ముందు గమనిస్తారు, తర్వాత నిర్ణయిస్తారు.")
add("dv3.reflect", "When an app says “I missed you”, what is really happening? Who chose to make it talk this way?",
    "जब कोई ऐप कहता है “मुझे तुम्हारी याद आई”, तो असल में क्या हो रहा होता है? उसे इस तरह बात करवाने का फ़ैसला किसने किया?",
    "ఒక యాప్ “నువ్వు గుర్తొచ్చావు” అన్నప్పుడు, నిజానికి ఏం జరుగుతోంది? అది ఇలా మాట్లాడేలా ఎవరు నిర్ణయించారు?")

# ---------------------------------------------------------------- my principles
add("yd.prompt", "Now write your own principles for using AI. A principle is a rule you choose for yourself. Write up to three. Write rules, not names or personal stories.",
    "अब AI इस्तेमाल करने के अपने सिद्धांत लिखिए। सिद्धांत वह नियम है जो आप अपने लिए चुनते हैं। तीन तक लिखिए। नियम लिखिए, नाम या निजी किस्से नहीं।",
    "ఇప్పుడు AI వాడటానికి మీ సొంత సూత్రాలు రాయండి. సూత్రం అంటే మీ కోసం మీరు ఎంచుకునే నియమం. మూడు వరకు రాయండి. నియమాలు రాయండి, పేర్లు లేదా వ్యక్తిగత విషయాలు కాదు.")
add("yd.promptClass", "As a class, suggest general principles for using AI. A principle is a rule you choose for yourself. No names or personal stories, please. Then each of you writes your own on paper, and keeps it.",
    "पूरी कक्षा मिलकर AI इस्तेमाल करने के कुछ आम सिद्धांत सुझाए। सिद्धांत वह नियम है जो आप अपने लिए चुनते हैं। कृपया नाम या निजी किस्से नहीं। फिर हर कोई अपने सिद्धांत काग़ज़ पर लिखे, और उसे अपने पास रखे।",
    "తరగతి అంతా కలిసి AI వాడటానికి కొన్ని సాధారణ సూత్రాలు సూచించండి. సూత్రం అంటే మీ కోసం మీరు ఎంచుకునే నియమం. దయచేసి పేర్లు లేదా వ్యక్తిగత విషయాలు వద్దు. తర్వాత ప్రతి ఒక్కరూ తమ సూత్రాలను కాగితంపై రాసి, తమ దగ్గరే ఉంచుకోండి.")
add("yd.placeholder", "One rule for myself", "मेरे लिए एक नियम", "నా కోసం ఒక నియమం")
add("yd.e1", "I check important AI answers in a second place.", "AI के ज़रूरी जवाबों को किसी दूसरी जगह भी जाँचना।", "AI ఇచ్చే ముఖ్యమైన జవాబులను నేను రెండో చోట కూడా సరిచూస్తాను.")
add("yd.e2", "I say what a program does, not what it “thinks”.", "यह कहना कि प्रोग्राम क्या करता है, यह नहीं कि वह क्या “सोचता” है।", "ప్రోగ్రామ్ ఏం చేస్తుందో చెబుతాను, అది ఏం “ఆలోచిస్తుందో” కాదు.")
add("yd.e3", "If an AI result about a person seems unfair, I ask who is responsible.", "अगर किसी इंसान के बारे में AI का नतीजा नाइंसाफ़ी लगे, तो पूछना कि ज़िम्मेदार कौन है।", "ఒక వ్యక్తి గురించి AI ఫలితం అన్యాయంగా అనిపిస్తే, బాధ్యులు ఎవరని నేను అడుగుతాను.")

# ---------------------------------------------------------------- takeaway
add("tk.title", "My principles for using AI", "AI इस्तेमाल करने के मेरे सिद्धांत", "AI వాడటానికి నా సూత్రాలు")
add("tk.card", "Before I trust an AI answer, or a decision about a person, I ask three questions. What examples was it trained on? Who checks it? Who answers for it if it goes wrong?",
    "किसी AI जवाब पर, या किसी इंसान के बारे में फ़ैसले पर भरोसा करने से पहले, मेरे तीन सवाल। उसे किन उदाहरणों पर ट्रेनिंग दी गई? उसे कौन जाँचता है? ग़लत होने पर जवाब कौन देगा?",
    "ఒక AI జవాబును, లేదా ఒక వ్యక్తి గురించిన నిర్ణయాన్ని నమ్మే ముందు, నేను మూడు ప్రశ్నలు అడుగుతాను. దానికి ఏ ఉదాహరణలపై ట్రైనింగ్ ఇచ్చారు? దాన్ని ఎవరు సరిచూస్తారు? తప్పు జరిగితే ఎవరు జవాబు చెబుతారు?")
add("tk.cardClass", "Our three questions for any AI answer or decision: What examples was it trained on? Who checks it? Who answers for it if it goes wrong? Your own principles stay on your paper, with you.",
    "किसी भी AI जवाब या फ़ैसले के लिए हमारे तीन सवाल: उसे किन उदाहरणों पर ट्रेनिंग दी गई? उसे कौन जाँचता है? ग़लत होने पर जवाब कौन देगा? आपके अपने सिद्धांत आपके काग़ज़ पर, आपके पास रहेंगे।",
    "ఏ AI జవాబుకైనా, నిర్ణయానికైనా మన మూడు ప్రశ్నలు: దానికి ఏ ఉదాహరణలపై ట్రైనింగ్ ఇచ్చారు? దాన్ని ఎవరు సరిచూస్తారు? తప్పు జరిగితే ఎవరు జవాబు చెబుతారు? మీ సొంత సూత్రాలు మీ కాగితంపై, మీ దగ్గరే ఉంటాయి.")
add("tk.l1", "My own principles", "मेरे अपने सिद्धांत", "నా సొంత సూత్రాలు")

# ---------------------------------------------------------------- checks
add("pre1.q", "A chatbot answers your question in a smooth, confident sentence. What does the confidence tell you?",
    "एक चैटबॉट आपके सवाल का जवाब एक सधे हुए, पक्के वाक्य में देता है। यह पक्कापन आपको क्या बताता है?",
    "ఒక చాట్‌బాట్ మీ ప్రశ్నకు సాఫీగా, నమ్మకంగా ఉన్న వాక్యంలో జవాబిస్తుంది. ఆ నమ్మకం మీకు ఏం చెబుతుంది?")
add("pre1.a", "The answer is correct.", "जवाब सही है।", "జవాబు సరైనది.")
add("pre1.b", "Not much on its own: it could still be wrong.", "अपने आप में ज़्यादा कुछ नहीं: जवाब फिर भी ग़लत हो सकता है।", "దానంతట అది ఎక్కువ ఏమీ చెప్పదు: జవాబు అయినా తప్పు కావచ్చు.")
add("pre1.c", "The chatbot checked the answer in a book.", "चैटबॉट ने जवाब किसी किताब में जाँचा।", "చాట్‌బాట్ జవాబును ఒక పుస్తకంలో సరిచూసింది.")
add("pre2.q", "A program gives some students lower scores, for a reason that should not count. Who should fix it?",
    "एक प्रोग्राम कुछ छात्रों को ऐसी वजह से कम स्कोर देता है जो गिनी नहीं जानी चाहिए। इसे किसे ठीक करना चाहिए?",
    "లెక్కలోకి రాకూడని కారణంతో ఒక ప్రోగ్రామ్ కొందరు విద్యార్థులకు తక్కువ స్కోర్లు ఇస్తుంది. దీన్ని ఎవరు సరిచేయాలి?")
add("pre2.a", "The program itself", "ख़ुद प्रोग्राम", "ప్రోగ్రామే")
add("pre2.b", "The people who made it and use it", "वे लोग जिन्होंने इसे बनाया और जो इसे इस्तेमाल करते हैं", "దాన్ని తయారు చేసినవారు, వాడేవారు")
add("pre2.c", "Nobody, because it is only maths", "कोई नहीं, क्योंकि यह तो सिर्फ़ गणित है", "ఎవరూ కాదు, ఎందుకంటే అది లెక్కలు మాత్రమే")
add("post1.q", "A program scores how neat handwriting is. It was trained only on samples from right-handed students. Left-handed students get lower scores. Which question gets to the cause first?",
    "एक प्रोग्राम लिखावट की सफ़ाई का स्कोर देता है। उसे सिर्फ़ दाएँ हाथ से लिखने वाले छात्रों के नमूनों पर ट्रेनिंग दी गई। बाएँ हाथ से लिखने वाले छात्रों को कम स्कोर मिलते हैं। कौन-सा सवाल सबसे पहले असली वजह तक पहुँचता है?",
    "చేతిరాత ఎంత చక్కగా ఉందో ఒక ప్రోగ్రామ్ స్కోరు ఇస్తుంది. కుడిచేతితో రాసే విద్యార్థుల నమూనాలపై మాత్రమే దానికి ట్రైనింగ్ ఇచ్చారు. ఎడమచేతితో రాసే విద్యార్థులకు తక్కువ స్కోర్లు వస్తాయి. ఏ ప్రశ్న ముందుగా అసలు కారణాన్ని చేరుకుంటుంది?")
add("post1.a", "Should it be given more right-handed samples?", "क्या उसे दाएँ हाथ से लिखने वालों के और नमूने दिए जाएँ?", "దానికి కుడిచేతితో రాసేవారి నమూనాలు ఇంకా ఎక్కువ ఇవ్వాలా?")
add("post1.b", "What examples was the program trained on?", "प्रोग्राम को किन उदाहरणों पर ट्रेनिंग दी गई?", "ప్రోగ్రామ్‌కు ఏ ఉదాహరణలపై ట్రైనింగ్ ఇచ్చారు?")
add("post1.c", "Is the program new?", "क्या प्रोग्राम नया है?", "ప్రోగ్రామ్ కొత్తదా?")
add("post1.fb", "The examples came only from right-handed writers, so other handwriting matches them less. More of the same samples would not help. People chose those examples, and people can fix them.",
    "उदाहरण सिर्फ़ दाएँ हाथ से लिखने वालों के थे, इसलिए दूसरी लिखावट उनसे कम मिलती है। वैसे ही और नमूने देने से मदद नहीं मिलेगी। वे उदाहरण लोगों ने चुने, और लोग ही उन्हें ठीक कर सकते हैं।",
    "ఉదాహరణలు కుడిచేతితో రాసేవారివే, కాబట్టి వేరే చేతిరాత వాటితో తక్కువగా సరిపోతుంది. అలాంటి నమూనాలే ఇంకా ఇస్తే సహాయం ఉండదు. ఆ ఉదాహరణలను మనుషులే ఎంచుకున్నారు, మనుషులే సరిచేయగలరు.")
add("post2.q", "Two teachers agree a program’s list is unfair. One says: “Stop using it, because it hurts some students.” The other says: “Stop using it, because we promised everyone equal treatment.” What does this show?",
    "दो टीचर मानते हैं कि एक प्रोग्राम की सूची निष्पक्ष नहीं है। एक कहती हैं: “इसे बंद करो, क्योंकि इससे कुछ छात्रों को नुक़सान होता है।” दूसरे कहते हैं: “इसे बंद करो, क्योंकि हमने सबसे बराबर बर्ताव का वादा किया था।” इससे क्या पता चलता है?",
    "ఒక ప్రోగ్రామ్ జాబితా న్యాయంగా లేదని ఇద్దరు టీచర్లు ఒప్పుకుంటారు. ఒకరు అంటారు: “దీన్ని ఆపేయండి, ఎందుకంటే ఇది కొందరు విద్యార్థులకు హాని చేస్తుంది.” మరొకరు అంటారు: “దీన్ని ఆపేయండి, ఎందుకంటే అందరినీ సమానంగా చూస్తామని మాట ఇచ్చాం.” దీని నుండి ఏం తెలుస్తుంది?")
add("post2.a", "One of them must be wrong.", "उनमें से एक ज़रूर ग़लत है।", "వారిలో ఒకరు తప్పకుండా తప్పు.")
add("post2.b", "Different ethical frameworks can give different reasons, even for the same choice.", "अलग-अलग नैतिक ढाँचे एक ही चुनाव के लिए भी अलग-अलग कारण दे सकते हैं।", "ఒకే ఎంపికకు కూడా వేర్వేరు నైతిక చట్రాలు వేర్వేరు కారణాలు చెప్పవచ్చు.")
add("post2.c", "Reasons do not matter, only the choice does.", "कारणों से फ़र्क़ नहीं पड़ता, सिर्फ़ चुनाव से पड़ता है।", "కారణాలు ముఖ్యం కాదు, ఎంపిక ఒక్కటే ముఖ్యం.")
add("post2.fb", "The first teacher looks at harm: best results, or care. The second looks at a promise: duties and rules. Same choice, different reasons. Reasons matter, because in another case they could lead to different choices.",
    "पहली टीचर नुक़सान को देखती हैं: सबसे अच्छे नतीजे, या परवाह। दूसरे टीचर वादे को देखते हैं: कर्तव्य और नियम। चुनाव एक, कारण अलग। कारण मायने रखते हैं, क्योंकि किसी दूसरे मामले में वे अलग-अलग चुनाव तक ले जा सकते हैं।",
    "మొదటి టీచర్ హానిని చూస్తున్నారు: ఉత్తమ ఫలితాలు, లేదా ఆదరణ. రెండో టీచర్ మాటను చూస్తున్నారు: కర్తవ్యాలు, నియమాలు. ఎంపిక ఒకటే, కారణాలు వేరు. కారణాలు ముఖ్యమే, ఎందుకంటే వేరే సందర్భంలో అవి వేర్వేరు ఎంపికలకు దారి తీయవచ్చు.")
add("post3.q", "Why can a chatbot state a made-up fact as confidently as a true one?",
    "चैटबॉट कोई मनगढ़ंत तथ्य भी उतने ही भरोसे से क्यों कह सकता है जितना सच्चा तथ्य?",
    "చాట్‌బాట్ ఒక కల్పిత వాస్తవాన్ని కూడా నిజమైనదంత నమ్మకంగా ఎందుకు చెప్పగలదు?")
add("post3.a", "It is trying to trick you.", "वह आपको चकमा देना चाहता है।", "అది మిమ్మల్ని మోసం చేయాలని చూస్తోంది.")
add("post3.b", "It builds likely-sounding words, with no reliable built-in check for truth.", "वह संभावित लगने वाले शब्द जोड़ता है, और उसके अंदर सच जाँचने का कोई भरोसेमंद तरीक़ा नहीं होता।", "అది ఎక్కువ అవకాశమున్న పదాలను కలుపుతుంది, దానిలో నిజాన్ని సరిచూసే నమ్మదగిన పద్ధతి ఉండదు.")
add("post3.c", "It only goes wrong when the internet is slow.", "वह सिर्फ़ तब ग़लत होता है जब इंटरनेट धीमा हो।", "ఇంటర్నెట్ నెమ్మదిగా ఉన్నప్పుడే అది తప్పు చేస్తుంది.")
add("post3.fb", "True and false answers come from the same process of picking likely words. A program has no wish to trick anyone. That is why checking important answers matters.",
    "सच्चे और ग़लत जवाब, दोनों संभावित शब्द चुनने के एक ही तरीक़े से बनते हैं। प्रोग्राम की किसी को चकमा देने की कोई इच्छा नहीं होती। इसीलिए ज़रूरी जवाबों को जाँचना मायने रखता है।",
    "నిజమైన, తప్పు జవాబులు రెండూ ఎక్కువ అవకాశమున్న పదాలను ఎంచుకునే ఒకే పద్ధతిలో వస్తాయి. ఎవరినీ మోసం చేయాలనే కోరిక ప్రోగ్రామ్‌కు ఉండదు. అందుకే ముఖ్యమైన జవాబులను సరిచూడటం అవసరం.")
add("post4.q", "A video app keeps showing more science videos on a phone. Which sentence describes this best?",
    "एक वीडियो ऐप किसी फ़ोन पर विज्ञान के और वीडियो दिखाता रहता है। कौन-सा वाक्य इसे सबसे अच्छे से बताता है?",
    "ఒక వీడియో యాప్ ఒక ఫోన్‌లో మరిన్ని సైన్స్ వీడియోలు చూపిస్తూ ఉంటుంది. దీన్ని ఏ వాక్యం బాగా వివరిస్తుంది?")
add("post4.a", "The app knows you love science.", "ऐप जानता है कि आपको विज्ञान पसंद है।", "మీకు సైన్స్ ఇష్టమని యాప్‌కు తెలుసు.")
add("post4.b", "The app matches a pattern: many videos played on this phone were science videos.", "ऐप एक पैटर्न से मिलान करता है: इस फ़ोन पर चले कई वीडियो विज्ञान के थे।", "యాప్ ఒక ప్యాటర్న్‌తో పోల్చి చూపిస్తుంది: ఈ ఫోన్‌లో చూసిన చాలా వీడియోలు సైన్స్ వీడియోలు.")
add("post4.c", "The app cares about your studies.", "ऐप को आपकी पढ़ाई की फ़िक्र है।", "యాప్‌కు మీ చదువు పట్ల శ్రద్ధ ఉంది.")
add("post4.fb", "It matches a pattern in what was played on this phone. It does not know or care about anyone. On a shared phone, the pattern may not even be yours.",
    "वह इस फ़ोन पर चले वीडियो के पैटर्न से मिलान करता है। वह किसी के बारे में न जानता है, न उसे फ़िक्र होती है। साझा फ़ोन पर तो वह पैटर्न शायद आपका भी न हो।",
    "ఈ ఫోన్‌లో చూసినవాటిలోని ప్యాటర్న్‌తో అది పోలుస్తుంది. దానికి ఎవరి గురించీ తెలియదు, ఎవరి పట్లా శ్రద్ధ ఉండదు. అందరూ వాడే ఫోన్‌లో అయితే, ఆ ప్యాటర్న్ మీది కాకపోవచ్చు కూడా.")

# ---------------------------------------------------------------- structure
FW = ["outcomes", "duties", "character", "care"]


def frameworks(prefix, choices):
    return [{"id": f, "nameKey": f"fw.{f}", "reasoningKey": f"{prefix}.why.{f}", "choice": choices[f]} for f in FW]


stages = [
    {"stage": "hook", "blocks": [
        block("b1", "reveal", {"textKey": "hook.text", "questionKey": "hook.q"}, glossaryTerms=["program"]),
    ]},
    {"stage": "predict", "blocks": [
        block("b2", "predict", {"promptKey": "p.prompt", "choices": ["p.c1", "p.c2", "p.c3"], "answer": "p.c3", "confidence": True,
                                "revealKey": "p.reveal", "choiceFeedback": {"p.c1": "p.f1", "p.c2": "p.f2"}},
              classroom={"mode": "class-vote"}, glossaryTerms=["pattern", "training", "fairness"]),
    ]},
    {"stage": "manipulate", "blocks": [
        block("b3", "dilemma-vote", {"promptKey": "dv1.prompt",
                                     "options": [{"id": "use", "labelKey": "dv1.use"}, {"id": "check", "labelKey": "dv1.check"}, {"id": "stop", "labelKey": "dv1.stop"}],
                                     "frameworks": frameworks("dv1", {"outcomes": "check", "duties": "stop", "character": "check", "care": None}),
                                     "reflectionKey": "dv1.reflect"},
              glossaryTerms=["example"]),
        block("b4", "sort", {"instructionKey": "so.instruction", "groups": ["so.people", "so.program"],
                             "items": [{"id": "i1", "labelKey": "so.i1", "group": "so.people"},
                                       {"id": "i2", "labelKey": "so.i2", "group": "so.program"},
                                       {"id": "i3", "labelKey": "so.i3", "group": "so.people"},
                                       {"id": "i4", "labelKey": "so.i4", "group": "so.program"},
                                       {"id": "i5", "labelKey": "so.i5", "group": "so.people"},
                                       {"id": "i6", "labelKey": "so.i6", "group": "so.people"}],
                             "revealKey": "so.reveal"},
              classroom={"mode": "vote-per-item"}),
        block("b5", "dilemma-vote", {"promptKey": "dv2.prompt",
                                     "options": [{"id": "marks", "labelKey": "dv2.marks"}, {"id": "fix", "labelKey": "dv2.fix"}, {"id": "ban", "labelKey": "dv2.ban"}],
                                     "frameworks": frameworks("dv2", {"outcomes": None, "duties": "marks", "character": "fix", "care": "fix"}),
                                     "reflectionKey": "dv2.reflect"},
              glossaryTerms=["chatbot"]),
    ]},
    {"stage": "explain", "blocks": [
        block("b6", "reveal", {"textKey": "fw.text", "steps": ["fw.s1", "fw.s2", "fw.s3", "fw.s4"]}, glossaryTerms=["ethical-framework"]),
        block("b7", "reveal", {"textKey": "fw.deeper"}, depth="deeper"),
        block("b8", "check", {"promptKey": "ch.prompt", "options": ["fw.outcomes", "fw.duties", "fw.care"], "answer": "fw.duties",
                              "feedback": {"fw.outcomes": "ch.f1", "fw.care": "ch.f3"}, "hints": ["ch.h1"], "explainKey": "ch.explain"},
              classroom={"mode": "class-vote"}),
        block("b9", "reveal", {"textKey": "rs.text", "steps": ["rs.s1", "rs.s2", "rs.s3"]}, glossaryTerms=["responsibility"]),
    ]},
    {"stage": "break-it", "blocks": [
        block("b10", "predict", {"promptKey": "hp.prompt", "choices": ["hp.c1", "hp.c2", "hp.c3"], "answer": "hp.c2", "confidence": True,
                                 "revealKey": "hp.reveal", "choiceFeedback": {"hp.c1": "hp.f1", "hp.c3": "hp.f3"}},
              classroom={"mode": "class-vote"}),
        block("b11", "break-it", {"challengeKey": "br.challenge",
                                  "attempts": [{"id": "t1", "labelKey": "br.t1", "resultKey": "br.r1", "breaks": False},
                                               {"id": "t2", "labelKey": "br.t2", "resultKey": "br.r2", "breaks": True},
                                               {"id": "t3", "labelKey": "br.t3", "resultKey": "br.r3", "breaks": False},
                                               {"id": "t4", "labelKey": "br.t4", "resultKey": "br.r4", "breaks": True},
                                               {"id": "t5", "labelKey": "br.t5", "resultKey": "br.r5", "breaks": True}],
                                  "reflectKey": "br.reflect"},
              classroom={"mode": "class-suggests"}, glossaryTerms=["hallucination"]),
        block("b12", "analogy", {"titleKey": "a1.title", "concept": "hallucination", "sourceKey": "a1.source",
                                 "mappings": [{"sourceKey": f"a1.m{i}s", "targetKey": f"a1.m{i}t"} for i in range(1, 5)],
                                 "breakPointKey": "a1.break", "fading": ["a1.f1", "a1.f2", "a1.f3"]},
              classroom={"mode": "teacher-led"}),
        block("b13", "analogy", {"titleKey": "a2.title", "concept": "hallucination", "sourceKey": "a2.source",
                                 "mappings": [{"sourceKey": f"a2.m{i}s", "targetKey": f"a2.m{i}t"} for i in range(1, 3)],
                                 "breakPointKey": "a2.break", "fading": ["a2.f1", "a2.f2", "a2.f3"]},
              classroom={"mode": "teacher-led"}),
    ]},
    {"stage": "transfer-reflect", "blocks": [
        block("b14", "explain-back", {"mode": "choose", "promptKey": "eb.prompt",
                                      "options": [{"id": "e1", "textKey": "eb.o1", "feedbackKey": "eb.f1"},
                                                  {"id": "e2", "textKey": "eb.o2", "feedbackKey": "eb.f2", "best": True},
                                                  {"id": "e3", "textKey": "eb.o3", "feedbackKey": "eb.f3"}]}),
        block("b15", "reveal", {"textKey": "ap.text", "steps": ["ap.s1", "ap.s2"]}, glossaryTerms=["anthropomorphism"]),
        block("b16", "dilemma-vote", {"promptKey": "dv3.prompt",
                                      "options": [{"id": "fine", "labelKey": "dv3.fine"}, {"id": "label", "labelKey": "dv3.label"}, {"id": "stop", "labelKey": "dv3.stop"}],
                                      "frameworks": frameworks("dv3", {"outcomes": "label", "duties": "stop", "character": "label", "care": None}),
                                      "reflectionKey": "dv3.reflect"}),
        block("b17", "your-data", {"promptKey": "yd.prompt", "kind": "list", "minItems": 1, "maxItems": 3, "maxLength": 80,
                                   "placeholderKey": "yd.placeholder", "exampleKeys": ["yd.e1", "yd.e2", "yd.e3"]},
              classroom={"promptKey": "yd.promptClass", "maxItems": 6}),
        block("b18", "takeaway", {"titleKey": "tk.title", "cardKey": "tk.card", "includes": ["b17"], "labelKeys": ["tk.l1"]},
              classroom={"mode": "class-card", "cardKey": "tk.cardClass"}),
    ]},
]


def item(n, obj, ans):
    return {"id": n, "objective": obj, "promptKey": f"{n}.q", "options": [f"{n}.a", f"{n}.b", f"{n}.c"], "answer": f"{n}.{ans}",
            **({"feedbackKey": f"{n}.fb"} if f"{n}.fb" in S else {})}


lesson = {
    "id": LESSON_ID,
    "schemaVersion": "1.0",
    "version": 1,
    "status": "draft",
    "meta": {
        "titleKey": "title", "subtitleKey": "subtitle", "subject": "ai", "course": "ai-for-kids", "module": "m6",
        "concepts": ["fairness", "responsibility"],
        "objectives": [{"id": f"o{i}", "textKey": f"obj.o{i}"} for i in range(1, 5)],
        "prerequisites": ["learning-from-examples", "training"],
        "audiences": ["school-13-17"], "curriculumTags": [], "estimatedMinutes": 40,
        "teacherGuide": LESSON_ID,
        "provenance": "agent pipeline v1 (AI-assisted draft); not yet reviewed by the creator; hi and te are unreviewed drafts",
    },
    "stages": stages,
    "checks": {"pre": [item("pre1", "o3", "b"), item("pre2", "o1", "b")],
               "post": [item("post1", "o1", "b"), item("post2", "o2", "b"), item("post3", "o3", "b"), item("post4", "o4", "b")]},
    "strings": {loc: {k: v[loc] for k, v in S.items()} for loc in ("en", "hi", "te")},
    "localeStatus": {"en": "draft", "hi": "draft", "te": "draft"},
}

out = ROOT / "content" / "lessons" / f"{LESSON_ID}.json"
out.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
print(f"wrote {out.relative_to(ROOT)}: {sum(len(s['blocks']) for s in stages)} blocks, {len(S)} strings x 3 locales")
