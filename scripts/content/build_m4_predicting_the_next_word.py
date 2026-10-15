"""Builds content/lessons/m4-predicting-the-next-word.json (AI for Kids, Module 4).
Run: python3 scripts/content/build_m4_predicting_the_next_word.py
hi and te are drafts awaiting native-speaker review (docs/07).
ICU message format. Use typographic apostrophes (’) to avoid ICU quoting."""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
LESSON_ID = "m4-predicting-the-next-word"
S = {}


def add(key, en, hi, te):
    assert key not in S, key
    S[key] = {"en": en, "hi": hi, "te": te}


# ---------------------------------------------------------------- meta
add("title", "Predicting the next word", "अगले शब्द का अनुमान", "తర్వాతి పదాన్ని ఊహించడం")
add("subtitle", "Build a tiny sentence-finisher, then find where it fails.",
    "वाक्य पूरा करने वाली एक छोटी मशीन बनाइए, फिर देखिए वह कहाँ चूकती है।",
    "వాక్యాలు పూర్తి చేసే చిన్న యంత్రాన్ని తయారు చేయండి, తర్వాత అది ఎక్కడ తప్పుతుందో చూడండి.")
add("obj.o1", "Explain that a next-word model picks the token that most often came next in its text: likelihood, not meaning or intention.",
    "समझाना कि अगला शब्द बताने वाला मॉडल वह टोकन चुनता है जो उसके वाक्यों में सबसे ज़्यादा बार आगे आया: यह संभावना है, मतलब या इरादा नहीं।",
    "తర్వాతి పదం చెప్పే మోడల్ తన వాక్యాల్లో ఎక్కువసార్లు తర్వాత వచ్చిన టోకెన్‌ను ఎంచుకుంటుందని వివరించడం: ఇది అవకాశం మాత్రమే, అర్థం లేదా ఉద్దేశం కాదు.")
add("obj.o2", "Cut a sentence into tokens, count its vocabulary, and work out a probability as “times out of all the times”.",
    "किसी वाक्य को टोकन में काटना, उसकी शब्दावली गिनना, और प्रायिकता को “कुल में से कितनी बार” के रूप में निकालना।",
    "ఒక వాక్యాన్ని టోకెన్లుగా కోయడం, దాని పదజాలాన్ని లెక్కించడం, సంభావ్యతను “మొత్తం సార్లలో ఎన్నిసార్లు” అని లెక్కించడం.")
add("obj.o3", "Describe training as changing a model’s settings step by step to make its error smaller.",
    "ट्रेनिंग को ऐसे बताना: मॉडल की सेटिंग्स को क़दम-दर-क़दम बदलना, ताकि उसकी ग़लती छोटी होती जाए।",
    "ట్రైనింగ్ అంటే మోడల్ సెట్టింగ్‌లను అడుగు అడుగుకీ మార్చి దాని పొరపాటును తగ్గించడం అని వివరించడం.")

# ---------------------------------------------------------------- hook
add("hook.text", "Finish this sentence in your head: “Happy birthday to …”",
    "इस वाक्य को मन में पूरा कीजिए: “जन्मदिन की बहुत-बहुत …”",
    "ఈ వాక్యాన్ని మనసులో పూర్తి చేయండి: “పుట్టినరోజు …”")
add("hook.s1", "Did you say “you”? A phone keyboard often suggests that same word.",
    "क्या आपने “बधाई” कहा? फ़ोन का कीबोर्ड भी अक्सर यही शब्द सुझाता है।",
    "మీరు “శుభాకాంక్షలు” అన్నారా? ఫోన్ కీబోర్డ్ కూడా తరచుగా ఇదే పదాన్ని సూచిస్తుంది.")
add("hook.q", "How can a machine finish your sentence? Is there any meaning or intention behind its choice?",
    "एक मशीन आपका वाक्य कैसे पूरा कर सकती है? क्या उसकी पसंद के पीछे कोई मतलब या इरादा होता है?",
    "ఒక యంత్రం మీ వాక్యాన్ని ఎలా పూర్తి చేయగలదు? అది ఎంచుకున్న పదం వెనుక ఏదైనా అర్థం లేదా ఉద్దేశం ఉంటుందా?")

# ---------------------------------------------------------------- predict
add("pr.prompt", "How do you think a phone keyboard picks the words it suggests?",
    "आपके हिसाब से फ़ोन का कीबोर्ड सुझाने वाले शब्द कैसे चुनता है?",
    "ఫోన్ కీబోర్డ్ సూచించే పదాలను ఎలా ఎంచుకుంటుందని మీరు అనుకుంటున్నారు?")
add("pr.c1", "It understands what you mean and what you want to say.",
    "वह समझता है कि आपका मतलब क्या है और आप क्या कहना चाहते हैं।",
    "మీ ఉద్దేశం ఏమిటో, మీరు ఏం చెప్పాలనుకుంటున్నారో అది అర్థం చేసుకుంటుంది.")
add("pr.c2", "It goes by which word came next most often, in lots of text.",
    "ढेर सारे लिखे हुए वाक्यों में आगे सबसे ज़्यादा बार कौन-सा शब्द आया, वह इसी हिसाब से चलता है।",
    "చాలా రాతల్లో తర్వాత ఏ పదం ఎక్కువసార్లు వచ్చిందో, దాని ప్రకారం ఎంచుకుంటుంది.")
add("pr.c3", "A person wrote down the right next word for every sentence.",
    "किसी इंसान ने हर वाक्य के लिए सही अगला शब्द लिखकर रखा है।",
    "ప్రతి వాక్యానికీ సరైన తర్వాతి పదాన్ని ఒక మనిషి ముందే రాసి పెట్టారు.")
add("pr.f1", "It can feel that way, because the suggestions often fit. But nothing in it understands you. Build one and see what it really does.",
    "ऐसा लग सकता है, क्योंकि सुझाव अक्सर ठीक बैठते हैं। पर उसमें कुछ भी आपको समझता नहीं। एक बनाकर देखिए कि वह असल में क्या करता है।",
    "అలా అనిపించవచ్చు, ఎందుకంటే సూచనలు తరచుగా సరిపోతాయి. కానీ అందులో ఏదీ మిమ్మల్ని అర్థం చేసుకోదు. ఒకటి తయారు చేసి, అది నిజంగా ఏం చేస్తుందో చూడండి.")
add("pr.f3", "There are far too many sentences for anyone to write them all. The keyboard works it out from text instead. You will see how.",
    "वाक्य इतने ज़्यादा हैं कि कोई सबको लिख नहीं सकता। इसकी जगह कीबोर्ड यह लिखे हुए वाक्यों से निकालता है। आप देखेंगे कैसे।",
    "వాక్యాలు చాలా ఎక్కువ, ఎవరూ అన్నీ రాయలేరు. బదులుగా కీబోర్డ్ రాతల నుండి దీన్ని లెక్కిస్తుంది. ఎలాగో మీరు చూస్తారు.")
add("pr.reveal", "It goes by likelihood: which word came next most often in lots of text. Real keyboards do this on a huge scale. You will build the simplest version, from your own sentences.",
    "वह संभावना के हिसाब से चलता है: ढेर सारे वाक्यों में आगे सबसे ज़्यादा बार कौन-सा शब्द आया। असली कीबोर्ड यह बहुत बड़े पैमाने पर करते हैं। आप इसका सबसे सरल रूप अपने ही वाक्यों से बनाएँगे।",
    "అది అవకాశం ప్రకారం ఎంచుకుంటుంది: చాలా రాతల్లో తర్వాత ఏ పదం ఎక్కువసార్లు వచ్చిందో చూస్తుంది. నిజమైన కీబోర్డ్‌లు దీన్ని చాలా పెద్ద ఎత్తున చేస్తాయి. మీరు దీని అతి సరళమైన రూపాన్ని మీ సొంత వాక్యాలతో తయారు చేస్తారు.")

# ---------------------------------------------------------------- manipulate: your sentences
add("yd.prompt", "Type 3 to 6 short sentences. Make up everyday ones, and start some the same way, like “I am going…”. Do not type names, phone numbers, addresses or anything private. Your sentences stay on this device.",
    "3 से 6 छोटे वाक्य लिखिए। रोज़ की बातों वाले वाक्य ख़ुद बनाइए, और कुछ को एक ही तरह शुरू कीजिए, जैसे “मैं स्कूल…”। नाम, फ़ोन नंबर, पता या कोई निजी बात मत लिखिए। आपके वाक्य इसी डिवाइस पर रहते हैं।",
    "3 నుండి 6 చిన్న వాక్యాలు రాయండి. రోజూ మాట్లాడే లాంటి వాక్యాలు మీరే తయారు చేయండి, కొన్నింటిని ఒకేలా మొదలుపెట్టండి, ఉదాహరణకు “నేను బడికి…”. పేర్లు, ఫోన్ నంబర్లు, చిరునామాలు లేదా ఏ వ్యక్తిగత విషయమూ రాయవద్దు. మీ వాక్యాలు ఈ పరికరంలోనే ఉంటాయి.")
add("yd.promptClass", "Class, suggest 3 to 8 short, made-up sentences. Start some the same way, like “I am going…”. No names or private details: everyone can see this screen.",
    "कक्षा, 3 से 8 छोटे, बनाए हुए वाक्य सुझाइए। कुछ को एक ही तरह शुरू कीजिए, जैसे “मैं स्कूल…”। कोई नाम या निजी बात नहीं: यह स्क्रीन सबको दिखती है।",
    "తరగతి, 3 నుండి 8 చిన్న, కల్పిత వాక్యాలు సూచించండి. కొన్నింటిని ఒకేలా మొదలుపెట్టండి, ఉదాహరణకు “నేను బడికి…”. పేర్లు, వ్యక్తిగత వివరాలు వద్దు: ఈ తెర అందరికీ కనిపిస్తుంది.")
add("yd.placeholder", "I am going to school.", "मैं स्कूल जा रही हूँ।", "నేను బడికి వెళ్తున్నాను.")
for i, (en, hi, te) in enumerate([
    ("I am going to school.", "मैं स्कूल जा रही हूँ।", "నేను బడికి వెళ్తున్నాను."),
    ("I am going home.", "मैं घर जा रहा हूँ।", "నేను ఇంటికి వెళ్తున్నాను."),
    ("I am hungry.", "मैं भूखी हूँ।", "నేను ఆకలితో ఉన్నాను."),
    ("I like rain.", "मुझे बारिश पसंद है।", "నాకు వాన ఇష్టం."),
    ("See you at school.", "स्कूल में मिलते हैं।", "బడిలో కలుద్దాం."),
    ("See you tomorrow.", "कल मिलते हैं।", "రేపు కలుద్దాం."),
], start=1):
    add(f"yd.e{i}", en, hi, te)

# ---------------------------------------------------------------- manipulate: tokens
add("tk.prompt", "Before a computer can count words, it cuts each sentence into pieces. How many pieces does it make from “I am going to school.”?",
    "शब्द गिनने से पहले कंप्यूटर हर वाक्य को टुकड़ों में काटता है। “मैं स्कूल जा रही हूँ।” से वह कितने टुकड़े बनाता है?",
    "పదాలను లెక్కించే ముందు, కంప్యూటర్ ప్రతి వాక్యాన్ని ముక్కలుగా కోస్తుంది. “నేను రేపు ఉదయం బడికి వెళ్తాను.” నుండి అది ఎన్ని ముక్కలు చేస్తుంది?")
add("tk.c1", "5: one for each word", "5: हर शब्द का एक", "5: ఒక్కో పదానికి ఒకటి")
add("tk.c2", "6", "6", "6")
add("tk.c3", "1: the whole sentence is one piece", "1: पूरा वाक्य एक ही टुकड़ा", "1: మొత్తం వాక్యం ఒకే ముక్క")
add("tk.f1", "Close. The five words are pieces. The full stop at the end is a piece too, so that makes 6.",
    "क़रीब हैं। पाँचों शब्द टुकड़े हैं। आख़िर का पूर्ण विराम (।) भी एक टुकड़ा है, इसलिए कुल 6 हुए।",
    "దగ్గరగా వచ్చారు. ఐదు పదాలూ ముక్కలే. చివరి ఫుల్ స్టాప్ (.) కూడా ఒక ముక్క, కాబట్టి మొత్తం 6.")
add("tk.f3", "Then it could only count whole sentences, and most sentences turn up once. Smaller pieces repeat, so they can be counted.",
    "तब वह सिर्फ़ पूरे वाक्य गिन पाता, और ज़्यादातर वाक्य एक ही बार आते हैं। छोटे टुकड़े बार-बार आते हैं, इसलिए उन्हें गिना जा सकता है।",
    "అప్పుడు అది మొత్తం వాక్యాలనే లెక్కించగలదు, చాలా వాక్యాలు ఒక్కసారే వస్తాయి. చిన్న ముక్కలు మళ్ళీ మళ్ళీ వస్తాయి, కాబట్టి వాటిని లెక్కించవచ్చు.")
add("tk.reveal", "Each piece is called a <term-token>token</term-token>. The full stop is a token too. Here, capital letters become small ones, so “I” and “i” are the same token. The 6 tokens: “i | am | going | to | school | .”",
    "हर टुकड़े को <term-token>टोकन</term-token> कहते हैं। पूर्ण विराम भी एक टोकन है। 6 टोकन ये हैं: “मैं | स्कूल | जा | रही | हूँ | ।”",
    "ప్రతి ముక్కనూ <term-token>టోకెన్</term-token> అంటారు. ఫుల్ స్టాప్ కూడా ఒక టోకెన్. ఆ 6 టోకెన్లు: “నేను | రేపు | ఉదయం | బడికి | వెళ్తాను | .”")

# ---------------------------------------------------------------- manipulate: vocabulary
add("vc.prompt", "Two sentences: “I am going to school.” and “I am hungry.” Together they have 10 tokens. How many different tokens are there?",
    "दो वाक्य: “मैं स्कूल जा रही हूँ।” और “मैं भूखी हूँ।” दोनों में मिलाकर 10 टोकन हैं। इनमें अलग-अलग टोकन कितने हैं?",
    "రెండు వాక్యాలు: “నేను రేపు ఉదయం బడికి వెళ్తాను.”, “నేను రేపు ఆడతాను.” రెండింటిలో కలిపి 10 టోకెన్లు ఉన్నాయి. వీటిలో వేర్వేరు టోకెన్లు ఎన్ని?")
add("vc.o1", "10", "10", "10")
add("vc.o2", "7", "7", "7")
add("vc.o3", "1", "1", "1")
add("vc.f1", "10 counts every token, repeats included. Here we want different ones, so count each token once.",
    "10 में हर टोकन गिना गया है, दोहराए हुए भी। यहाँ अलग-अलग टोकन चाहिए, इसलिए हर टोकन को एक ही बार गिनिए।",
    "10లో ప్రతి టోకెన్ లెక్కించారు, మళ్ళీ వచ్చినవి కూడా. ఇక్కడ వేర్వేరువి కావాలి, కాబట్టి ప్రతి టోకెన్‌ను ఒక్కసారే లెక్కించండి.")
add("vc.f3", "Yes, one token in the second sentence is new. But the different tokens from the first sentence count too.",
    "हाँ, दूसरे वाक्य में एक टोकन नया है। पर पहले वाक्य के अलग-अलग टोकन भी गिने जाएँगे।",
    "అవును, రెండో వాక్యంలో ఒక టోకెన్ కొత్తది. కానీ మొదటి వాక్యంలోని వేర్వేరు టోకెన్లు కూడా లెక్కలోకి వస్తాయి.")
add("vc.h1", "Write each token once. Skip any you have already written.",
    "हर टोकन एक बार लिखिए। जो पहले लिख चुके हैं, उसे छोड़ दीजिए।",
    "ప్రతి టోకెన్‌ను ఒక్కసారి రాయండి. ఇప్పటికే రాసినదాన్ని వదిలేయండి.")
add("vc.h2", "The first sentence gives: i, am, going, to, school and the full stop. That is 6. Which token in the second sentence is new?",
    "पहले वाक्य से: मैं, स्कूल, जा, रही, हूँ और पूर्ण विराम। ये 6 हैं। दूसरे वाक्य में कौन-सा टोकन नया है?",
    "మొదటి వాక్యం నుండి: నేను, రేపు, ఉదయం, బడికి, వెళ్తాను, ఫుల్ స్టాప్. ఇవి 6. రెండో వాక్యంలో ఏ టోకెన్ కొత్తది?")
add("vc.explain", "7 different tokens: the 6 from the first sentence, plus “hungry”. The list of all the different tokens a computer can use is its <term-vocabulary>vocabulary</term-vocabulary>. Each token is listed once.",
    "7 अलग-अलग टोकन: पहले वाक्य के 6, और “भूखी”। कंप्यूटर जितने अलग-अलग टोकन इस्तेमाल कर सकता है, उनकी सूची उसकी <term-vocabulary>शब्दावली</term-vocabulary> है। हर टोकन सूची में एक ही बार आता है।",
    "7 వేర్వేరు టోకెన్లు: మొదటి వాక్యంలోని 6, ఇంకా “ఆడతాను”. కంప్యూటర్ వాడగలిగే వేర్వేరు టోకెన్ల జాబితాను దాని <term-vocabulary>పదజాలం</term-vocabulary> అంటారు. ప్రతి టోకెన్ జాబితాలో ఒక్కసారే ఉంటుంది.")

# ---------------------------------------------------------------- manipulate: one prediction by hand
add("bh.intro", "Now make one guess by hand. In 10 made-up sentences, these words came straight after “I”. Which word is the most likely next? First work out each word’s share: what part of the 10 sentences it came in.",
    "अब एक अनुमान हाथ से लगाइए। 10 बनाए हुए वाक्यों में “मैं” के ठीक बाद ये शब्द आए। अगला शब्द कौन-सा होने की संभावना सबसे ज़्यादा है? पहले हर शब्द का हिस्सा निकालिए: वह 10 वाक्यों के कितने भाग में आया।",
    "ఇప్పుడు ఒక అంచనా చేత్తో వేయండి. 10 కల్పిత వాక్యాల్లో “నేను” తర్వాత వెంటనే ఈ పదాలు వచ్చాయి. తర్వాత రావడానికి ఎక్కువ అవకాశం ఉన్న పదం ఏది? ముందు ప్రతి పదం వాటా లెక్కించండి: అది 10 వాక్యాల్లో ఎంత భాగంలో వచ్చిందో.")
add("bh.rule", "Share = times × {weight} + {bias}. Multiplying by 0.1 is the same as dividing by 10, the number of sentences. Adding 0 changes nothing.",
    "हिस्सा = बार × {weight} + {bias}। 0.1 से गुणा करना 10 से भाग देने जैसा ही है, क्योंकि वाक्य 10 हैं। 0 जोड़ने से कुछ नहीं बदलता।",
    "వాటా = సార్లు × {weight} + {bias}. 0.1తో గుణించడం అంటే 10తో భాగించడమే, ఎందుకంటే వాక్యాలు 10. 0 కలిపితే ఏమీ మారదు.")
add("bh.value", "Times it came after “I”", "“मैं” के बाद कितनी बार आया", "“నేను” తర్వాత ఎన్నిసార్లు వచ్చింది")
BH_ITEMS = [("am", "स्कूल", "బడికి", 4), ("like", "घर", "ఇంటికి", 2), ("have", "कल", "రేపు", 2), ("can", "भी", "కూడా", 1), ("was", "आज", "ఈరోజు", 1)]
for i, (en, hi, te, _) in enumerate(BH_ITEMS, start=1):
    add(f"bh.i{i}", f"“{en}”", f"“{hi}”", f"“{te}”")
add("bh.auto", "The machine did the same sum for every word. All the shares add up to 1: 0.4 + 0.2 + 0.2 + 0.1 + 0.1 = 1. “am” has the biggest share: 4 out of 10, or 0.4. So it predicts “am”. A share like this is a <term-probability>probability</term-probability>: how often something happened, out of all the times.",
    "मशीन ने हर शब्द के लिए यही हिसाब किया। सारे हिस्से जोड़ें तो 1 बनता है: 0.4 + 0.2 + 0.2 + 0.1 + 0.1 = 1। “स्कूल” का हिस्सा सबसे बड़ा है: 10 में से 4, यानी 0.4। इसलिए वह “स्कूल” का अनुमान लगाती है। ऐसे हिस्से को <term-probability>प्रायिकता</term-probability> कहते हैं: कुल में से कोई चीज़ कितनी बार हुई।",
    "యంత్రం ప్రతి పదానికీ ఇదే లెక్క చేసింది. అన్ని వాటాలూ కలిపితే 1: 0.4 + 0.2 + 0.2 + 0.1 + 0.1 = 1. “బడికి” వాటా అన్నిటికంటే పెద్దది: 10లో 4, అంటే 0.4. కాబట్టి అది “బడికి” అని అంచనా వేస్తుంది. ఇలాంటి వాటాను <term-probability>సంభావ్యత</term-probability> అంటారు: మొత్తం సార్లలో ఒకటి ఎన్నిసార్లు జరిగిందో చెప్పే సంఖ్య.")

# ---------------------------------------------------------------- manipulate: the model
add("nw.prompt", "Now your sentences become a <term-model>model</term-model>: a set of counts a computer uses to guess. Pick a word and guess what came next most often. Then let it write a sentence.",
    "अब आपके वाक्य एक <term-model>मॉडल</term-model> बनते हैं: गिनतियों का ऐसा समूह, जिससे कंप्यूटर अनुमान लगाता है। एक शब्द चुनिए और सोचिए कि उसके बाद सबसे ज़्यादा बार क्या आया। फिर उससे एक वाक्य लिखवाइए।",
    "ఇప్పుడు మీ వాక్యాలు ఒక <term-model>మోడల్</term-model> అవుతాయి: కంప్యూటర్ ఊహించడానికి వాడే లెక్కల సమూహం. ఒక పదం ఎంచుకుని, దాని తర్వాత ఎక్కువసార్లు ఏది వచ్చిందో ఊహించండి. తర్వాత దానితో ఒక వాక్యం రాయించండి.")
add("nw.starters", "I am going to school.|I am going home.|I am hungry.|I like rain.|See you at school.|See you tomorrow.",
    "मैं स्कूल जा रही हूँ।|मैं घर जा रहा हूँ।|मैं भूखी हूँ।|मुझे बारिश पसंद है।|स्कूल में मिलते हैं।|कल मिलते हैं।",
    "నేను బడికి వెళ్తున్నాను.|నేను ఇంటికి వెళ్తున్నాను.|నేను ఆకలితో ఉన్నాను.|నాకు వాన ఇష్టం.|బడిలో కలుద్దాం.|రేపు కలుద్దాం.")
add("nw.explain", "Each guess is a <term-prediction>prediction</term-prediction>: the token with the biggest share wins. No meaning and no intention are involved. It is counting, nothing more.",
    "मॉडल के हर अंदाज़े को <term-prediction>अनुमान (प्रेडिक्शन)</term-prediction> कहते हैं: जिस टोकन का हिस्सा सबसे बड़ा, वही जीतता है। इसमें न कोई मतलब है, न कोई इरादा। यह गिनती है, इससे ज़्यादा कुछ नहीं।",
    "మోడల్ వేసే ప్రతి ఊహనూ <term-prediction>అంచనా (ప్రిడిక్షన్)</term-prediction> అంటారు: ఏ టోకెన్ వాటా పెద్దదో అదే గెలుస్తుంది. ఇందులో అర్థం గానీ, ఉద్దేశం గానీ లేవు. ఇది లెక్కించడం, అంతకు మించి ఏమీ లేదు.")

# ---------------------------------------------------------------- explain: analogy 1, a friend's sentence
add("an1.title", "Finishing a friend’s sentence", "दोस्त का वाक्य पूरा करना", "స్నేహితురాలి వాక్యాన్ని పూర్తి చేయడం")
add("an1.source", "A friend ends every chat with “See you…”, and nearly always adds “tomorrow”. Soon you finish it for them.",
    "आपकी एक दोस्त हर बातचीत के आख़िर में कहती है “फिर…”, और लगभग हमेशा जोड़ती है “मिलेंगे”। जल्दी ही आप उसका वाक्य पूरा करने लगते हैं।",
    "మీ స్నేహితురాలు ప్రతి మాటా “మళ్ళీ…” అని ముగిస్తుంది, దాదాపు ఎప్పుడూ “కలుద్దాం” అని కలుపుతుంది. కొద్ది రోజుల్లోనే మీరు ఆమె వాక్యాన్ని పూర్తి చేసేస్తారు.")
add("an1.m1s", "All the times you heard your friend talk", "जितनी बार आपने दोस्त को बोलते सुना", "మీ స్నేహితురాలు మాట్లాడగా మీరు విన్న అన్ని సార్లు")
add("an1.m1t", "The sentences the model counted", "वे वाक्य जिन्हें मॉडल ने गिना", "మోడల్ లెక్కించిన వాక్యాలు")
add("an1.m2s", "The ending you heard most often", "वह अंत जो आपने सबसे ज़्यादा बार सुना", "మీరు ఎక్కువసార్లు విన్న ముగింపు")
add("an1.m2t", "The token with the biggest share after a word", "किसी शब्द के बाद सबसे बड़े हिस्से वाला टोकन", "ఒక పదం తర్వాత అతి పెద్ద వాటా ఉన్న టోకెన్")
add("an1.m3s", "You saying “tomorrow” before your friend does", "दोस्त से पहले आपका “मिलेंगे” कह देना", "స్నేహితురాలి కంటే ముందే మీరు “కలుద్దాం” అనడం")
add("an1.m3t", "The model’s prediction", "मॉडल का अनुमान", "మోడల్ అంచనా")
add("an1.m4s", "A new friend whose way of talking you have not heard yet", "नई दोस्त, जिसकी बोली आपने अभी सुनी ही नहीं", "ఇంకా మాట్లాడగా వినని కొత్త స్నేహితురాలు")
add("an1.m4t", "A word the model never saw: it has nothing to count", "ऐसा शब्द जो मॉडल ने कभी नहीं देखा: उसके पास गिनने को कुछ नहीं", "మోడల్ ఎప్పుడూ చూడని పదం: దానికి లెక్కించడానికి ఏమీ లేదు")
add("an1.break", "You know your friend. You know what “tomorrow” means, and you care if you guess wrong. The model has none of this: no friend, no meaning, no wish to help. It picks the most likely token from its counts.",
    "आप अपनी दोस्त को जानते हैं। आप “मिलेंगे” का मतलब जानते हैं, और ग़लत अनुमान से आपको फ़र्क़ पड़ता है। मॉडल के पास इनमें से कुछ नहीं: न दोस्त, न मतलब, न मदद करने की चाह। वह अपनी गिनती से सबसे संभावित टोकन चुनता है।",
    "మీకు మీ స్నేహితురాలు తెలుసు. “కలుద్దాం” అంటే ఏమిటో మీకు తెలుసు, తప్పుగా ఊహిస్తే మీకు పట్టింపు ఉంటుంది. మోడల్‌కు ఇవేవీ లేవు: స్నేహితులు లేరు, అర్థం లేదు, సాయం చేయాలనే కోరిక లేదు. అది తన లెక్కల నుండి ఎక్కువ అవకాశం ఉన్న టోకెన్‌ను ఎంచుకుంటుంది.")
add("an1.f1", "Friend: “See you…” You: “tomorrow!”", "दोस्त: “फिर…” आप: “मिलेंगे!”", "స్నేహితురాలు: “మళ్ళీ…” మీరు: “కలుద్దాం!”")
add("an1.f2", "Your memory: after “you”, “tomorrow” came 5 times out of 8.", "आपकी याद: “फिर” के बाद 8 में से 5 बार “मिलेंगे” आया।", "మీ జ్ఞాపకం: “మళ్ళీ” తర్వాత 8 సార్లలో 5 సార్లు “కలుద్దాం” వచ్చింది.")
add("an1.f3", "The model: after “you”, pick the token with the biggest share, “tomorrow” (5 out of 8).",
    "मॉडल: “फिर” के बाद सबसे बड़े हिस्से वाला टोकन चुनो, “मिलेंगे” (8 में से 5)।",
    "మోడల్: “మళ్ళీ” తర్వాత అతి పెద్ద వాటా ఉన్న టోకెన్‌ను ఎంచుకో, “కలుద్దాం” (8లో 5).")

# ---------------------------------------------------------------- explain: analogy 2, the keyboard strip
add("an2.title", "The suggestion strip on a phone keyboard", "फ़ोन कीबोर्ड पर सुझावों की पट्टी", "ఫోన్ కీబోర్డ్ మీద సూచనల పట్టీ")
add("an2.source", "Above a phone keyboard, a strip offers three words. Each time you type a word, the three words change.",
    "फ़ोन के कीबोर्ड के ऊपर एक पट्टी तीन शब्द सुझाती है। जब भी आप एक शब्द लिखते हैं, तीनों शब्द बदल जाते हैं।",
    "ఫోన్ కీబోర్డ్ పైన ఒక పట్టీ మూడు పదాలు సూచిస్తుంది. మీరు ఒక పదం టైప్ చేసిన ప్రతిసారీ, ఆ మూడు పదాలూ మారతాయి.")
add("an2.m1s", "The three words on the strip", "पट्टी पर तीन शब्द", "పట్టీ మీద ఉన్న మూడు పదాలు")
add("an2.m1t", "The three tokens with the biggest shares", "सबसे बड़े हिस्सों वाले तीन टोकन", "అతి పెద్ద వాటాలు ఉన్న మూడు టోకెన్లు")
add("an2.m2s", "The strip changing after each word you type", "हर शब्द लिखने के बाद पट्टी का बदलना", "మీరు ప్రతి పదం టైప్ చేశాక పట్టీ మారడం")
add("an2.m2t", "The model looking up the counts for the newest token", "मॉडल का सबसे नए टोकन की गिनती देखना", "కొత్తగా వచ్చిన టోకెన్ లెక్కలను మోడల్ చూడడం")
add("an2.m3s", "Tapping the first suggestion again and again", "बार-बार पहले सुझाव पर टैप करना", "మొదటి సూచనను మళ్ళీ మళ్ళీ నొక్కడం")
add("an2.m3t", "Your model writing a sentence, always taking the top token", "आपके मॉडल का वाक्य लिखना, हर बार सबसे ऊपर वाला टोकन लेकर", "ప్రతిసారీ పై టోకెన్‌నే తీసుకుంటూ మీ మోడల్ వాక్యం రాయడం")
add("an2.break", "A real keyboard uses a far bigger model, built from huge amounts of text. It looks back over several words, not one. Some keyboards also adjust to words their owner types often. But it still picks by likelihood. It does not know what you want to say.",
    "असली कीबोर्ड एक बहुत बड़ा मॉडल इस्तेमाल करता है, जो ढेरों लिखे हुए वाक्यों से बना है। वह एक नहीं, पिछले कई शब्दों को देखता है। कुछ कीबोर्ड उन शब्दों के हिसाब से भी बदलते हैं जो फ़ोन चलाने वाला अक्सर लिखता है। फिर भी वह संभावना से ही चुनता है। उसे नहीं पता कि आप क्या कहना चाहते हैं।",
    "నిజమైన కీబోర్డ్ చాలా పెద్ద మోడల్‌ను వాడుతుంది, అది ఎన్నో రాతల నుండి తయారైంది. అది ఒక పదం కాదు, వెనుక ఉన్న చాలా పదాలను చూస్తుంది. కొన్ని కీబోర్డ్‌లు ఫోన్ వాడేవారు తరచుగా టైప్ చేసే పదాలకు తగ్గట్టు కూడా మారతాయి. అయినా అది అవకాశం ప్రకారమే ఎంచుకుంటుంది. మీరు ఏం చెప్పాలనుకుంటున్నారో దానికి తెలియదు.")
add("an2.f1", "The strip: “tomorrow | soon | there”", "पट्टी: “मिलेंगे | से | कब”", "పట్టీ: “కలుద్దాం | ఎప్పుడు | రా”")
add("an2.f2", "Counts after “you”: tomorrow 5, soon 2, there 1", "“फिर” के बाद गिनती: मिलेंगे 5, से 2, कब 1", "“మళ్ళీ” తర్వాత లెక్కలు: కలుద్దాం 5, ఎప్పుడు 2, రా 1")
add("an2.f3", "The model: shares of 5 out of 8, 2 out of 8 and 1 out of 8. Show the top three.",
    "मॉडल: हिस्से 8 में से 5, 8 में से 2 और 8 में से 1। सबसे ऊपर के तीन दिखाओ।",
    "మోడల్: వాటాలు 8లో 5, 8లో 2, 8లో 1. పై మూడింటిని చూపించు.")

# ---------------------------------------------------------------- explain: probability check
add("pc1.prompt", "In some sentences, “are” came after “we” 3 times, and “play” came after “we” 1 time. What is the probability of “are” after “we”?",
    "कुछ वाक्यों में “हम” के बाद “खेलते” 3 बार आया, और “पढ़ते” 1 बार आया। “हम” के बाद “खेलते” की प्रायिकता क्या है?",
    "కొన్ని వాక్యాల్లో “మనం” తర్వాత “ఆడదాం” 3 సార్లు వచ్చింది, “చదువుదాం” 1 సారి వచ్చింది. “మనం” తర్వాత “ఆడదాం” సంభావ్యత ఎంత?")
add("pc1.o1", "3 out of 4, or 0.75", "4 में से 3, यानी 0.75", "4లో 3, అంటే 0.75")
add("pc1.o2", "3 out of 1", "1 में से 3", "1లో 3")
add("pc1.o3", "1 out of 4, or 0.25", "4 में से 1, यानी 0.25", "4లో 1, అంటే 0.25")
add("pc1.f2", "The “out of” number is all the times anything came after “we”: 3 + 1 = 4.",
    "“में से” वाली संख्या वह है जितनी बार “हम” के बाद कुछ भी आया: 3 + 1 = 4।",
    "“లో” ముందు వచ్చే సంఖ్య, “మనం” తర్వాత ఏదైనా వచ్చిన మొత్తం సార్లు: 3 + 1 = 4.")
add("pc1.f3", "That is the share for the other word, which came 1 time. Which word came 3 times?",
    "यह दूसरे शब्द का हिस्सा है, जो 1 बार आया। 3 बार कौन-सा शब्द आया?",
    "అది 1 సారి వచ్చిన మరో పదం వాటా. 3 సార్లు వచ్చిన పదం ఏది?")
add("pc1.h1", "First add up everything that came after “we”.", "पहले वह सब जोड़िए जो “हम” के बाद आया।", "ముందు “మనం” తర్వాత వచ్చినవన్నీ కలపండి.")
add("pc1.h2", "3 + 1 = 4 times in all. The word came 3 of those 4 times. 3 ÷ 4 = 0.75.",
    "कुल 3 + 1 = 4 बार। वह शब्द इन 4 में से 3 बार आया। 3 ÷ 4 = 0.75।",
    "మొత్తం 3 + 1 = 4 సార్లు. ఆ పదం ఈ 4లో 3 సార్లు వచ్చింది. 3 ÷ 4 = 0.75.")
add("pc1.explain", "3 out of 4. Divide 3 by 4 to get 0.75. The model would predict this word, because 0.75 is the biggest share.",
    "4 में से 3। 3 को 4 से भाग दें तो 0.75 आता है। मॉडल इसी शब्द का अनुमान लगाएगा, क्योंकि 0.75 सबसे बड़ा हिस्सा है।",
    "4లో 3. 3ని 4తో భాగిస్తే 0.75. 0.75 అతి పెద్ద వాటా కాబట్టి మోడల్ ఈ పదాన్నే అంచనా వేస్తుంది.")

# ---------------------------------------------------------------- explain: what fixes poor guesses?
add("tr.prompt", "Your model was made by counting. Big models, like the ones in phones, use millions of number settings instead. Each setting is like a volume knob that can be turned up or down. At first their guesses are poor. What fixes that?",
    "आपका मॉडल गिनती से बना। बड़े मॉडल, जैसे फ़ोन वाले, गिनती की जगह दस लाख से भी ज़्यादा संख्याओं वाली सेटिंग्स रखते हैं। हर सेटिंग वॉल्यूम के बटन जैसी है, जिसे घटाया-बढ़ाया जा सकता है। शुरू में उनके अनुमान ख़राब होते हैं। इसे क्या ठीक करता है?",
    "మీ మోడల్ లెక్కించడం ద్వారా తయారైంది. ఫోన్‌లలో ఉండేలాంటి పెద్ద మోడల్స్‌లో లెక్కలకు బదులు పది లక్షలకు పైగా సంఖ్యల సెట్టింగ్‌లు ఉంటాయి. ప్రతి సెట్టింగ్ ఒక వాల్యూమ్ నాబ్ లాంటిది, దాన్ని పెంచవచ్చు, తగ్గించవచ్చు. మొదట్లో వాటి అంచనాలు సరిగా ఉండవు. దాన్ని ఏది సరిచేస్తుంది?")
add("tr.c1", "Changing the settings a little at a time, so the guesses get less wrong",
    "सेटिंग्स को थोड़ा-थोड़ा बदलना, ताकि अनुमान कम ग़लत हों",
    "సెట్టింగ్‌లను కొద్దికొద్దిగా మార్చడం, అంచనాలు తక్కువ తప్పుగా ఉండేలా")
add("tr.c2", "Teaching the model what each word means", "मॉडल को हर शब्द का मतलब सिखाना", "ప్రతి పదానికి అర్థం ఏమిటో మోడల్‌కు నేర్పడం")
add("tr.c3", "A person typing in the right next word for every sentence", "कोई इंसान हर वाक्य का सही अगला शब्द टाइप करे", "ప్రతి వాక్యానికీ సరైన తర్వాతి పదాన్ని ఒక మనిషి టైప్ చేయడం")
add("tr.f2", "Nobody gives it meanings. It only ever gets text, and a number that says how wrong each guess was.",
    "कोई उसे मतलब नहीं देता। उसे हमेशा सिर्फ़ लिखे हुए वाक्य मिलते हैं, और एक संख्या जो बताती है कि हर अनुमान कितना ग़लत था।",
    "దానికి ఎవరూ అర్థాలు ఇవ్వరు. దానికి ఎప్పుడూ రాతలు, ప్రతి అంచనా ఎంత తప్పో చెప్పే ఒక సంఖ్య మాత్రమే అందుతాయి.")
add("tr.f3", "There are too many sentences for that. Instead, the text itself shows the right next word, and the settings get nudged towards it.",
    "उसके लिए वाक्य बहुत ज़्यादा हैं। इसकी जगह लिखे हुए वाक्य ख़ुद सही अगला शब्द दिखाते हैं, और सेटिंग्स थोड़ा-थोड़ा उसकी ओर खिसकाई जाती हैं।",
    "అందుకు వాక్యాలు చాలా ఎక్కువ. బదులుగా, రాతే సరైన తర్వాతి పదాన్ని చూపిస్తుంది, సెట్టింగ్‌లు కొద్దికొద్దిగా దాని వైపు జరుగుతాయి.")
add("tr.reveal", "This step-by-step fixing is called <term-training>training</term-training>. The model guesses the next token of real text. A sum works out how wrong the guess was. Then every setting moves a little to make that smaller.",
    "क़दम-दर-क़दम ऐसे सुधारने को <term-training>ट्रेनिंग</term-training> कहते हैं। मॉडल असली वाक्यों में अगले टोकन का अनुमान लगाता है। एक हिसाब बताता है कि अनुमान कितना ग़लत था। फिर हर सेटिंग थोड़ी बदलती है, ताकि वह ग़लती छोटी हो।",
    "ఇలా అడుగు అడుగుకీ సరిచేయడాన్ని <term-training>ట్రైనింగ్</term-training> అంటారు. మోడల్ నిజమైన రాతల్లో తర్వాతి టోకెన్‌ను అంచనా వేస్తుంది. ఆ అంచనా ఎంత తప్పో ఒక లెక్క తేలుస్తుంది. తర్వాత ఆ తప్పు తగ్గేలా ప్రతి సెట్టింగ్ కొద్దిగా మారుతుంది.")

# ---------------------------------------------------------------- explain: hillside
add("hs.prompt", "How wrong a model’s guesses are is called its <term-error>error</term-error>. Picture the error as a hill in thick fog. Where you stand is the value of one setting. Your height is the error. Walk downhill to make it smaller.",
    "मॉडल के अनुमान कितने ग़लत हैं, इसे उसकी <term-error>ग़लती (एरर)</term-error> कहते हैं। ग़लती को घने कोहरे में एक पहाड़ी समझिए। आप जहाँ खड़े हैं, वह एक सेटिंग का मान है। आपकी ऊँचाई ग़लती है। उसे छोटा करने के लिए ढलान पर नीचे चलिए।",
    "మోడల్ అంచనాలు ఎంత తప్పుగా ఉన్నాయో దాన్ని దాని <term-error>పొరపాటు (ఎర్రర్)</term-error> అంటారు. పొరపాటును దట్టమైన పొగమంచులో ఒక కొండగా ఊహించుకోండి. మీరు నిలబడిన చోటు ఒక సెట్టింగ్ విలువ. మీ ఎత్తే పొరపాటు. దాన్ని తగ్గించడానికి వాలు వెంట కిందికి నడవండి.")
add("hs.left", "Step left", "बाईं ओर क़दम", "ఎడమకు అడుగు")
add("hs.right", "Step right", "दाईं ओर क़दम", "కుడికి అడుగు")
add("hs.goal", "Reach the lowest error in as few steps as you can. Use the slope to choose your direction.",
    "जितने कम क़दमों में हो सके, सबसे कम ग़लती तक पहुँचिए। दिशा चुनने के लिए ढलान देखिए।",
    "వీలైనంత తక్కువ అడుగుల్లో అతి తక్కువ పొరపాటును చేరండి. దిశ ఎంచుకోవడానికి వాలును చూడండి.")
add("hs.fade", "Each step downhill made the error smaller. Training does this for every setting at once, again and again, often many thousands of times. People call this error the loss, so the chart is a loss curve.",
    "नीचे की ओर हर क़दम से ग़लती छोटी हुई। ट्रेनिंग यही सारी सेटिंग्स के साथ एक साथ करती है, बार-बार, अक्सर हज़ारों बार। लोग इस ग़लती को “लॉस” भी कहते हैं, इसलिए इस चार्ट को लॉस कर्व कहते हैं।",
    "కిందికి వేసిన ప్రతి అడుగుతో పొరపాటు తగ్గింది. ట్రైనింగ్ ఇదే పనిని అన్ని సెట్టింగ్‌లకూ ఒకేసారి, మళ్ళీ మళ్ళీ, తరచుగా వేల సార్లు చేస్తుంది. ఈ పొరపాటును “లాస్” అని కూడా అంటారు, అందుకే ఈ చార్ట్‌ను లాస్ కర్వ్ అంటారు.")
add("hs.breaks", "Where this picture breaks: a real model has millions of settings, not one. Its hill has millions of directions at once. And a computer does not pick its step size by feel. A rule called the learning rate sets it.",
    "यह तस्वीर यहाँ टूटती है: असली मॉडल में एक नहीं, लाखों सेटिंग्स होती हैं। उसकी पहाड़ी की एक साथ लाखों दिशाएँ होती हैं। और कंप्यूटर क़दम का आकार अंदाज़े से नहीं चुनता। उसे सीखने की दर (लर्निंग रेट) नाम का नियम तय करता है।",
    "ఈ చిత్రం ఇక్కడ విఫలమవుతుంది: నిజమైన మోడల్‌కు ఒక్క సెట్టింగ్ కాదు, లక్షలాది సెట్టింగ్‌లు ఉంటాయి. దాని కొండకు ఒకేసారి లక్షలాది దిశలు ఉంటాయి. అడుగు పరిమాణాన్ని కంప్యూటర్ అంచనాతో ఎంచుకోదు. లెర్నింగ్ రేట్ అనే నియమం దాన్ని నిర్ణయిస్తుంది.")

# ---------------------------------------------------------------- break it
add("br.challenge", "Now try to make your model fail. Pick an attempt, guess what will happen, then open it. You can also try some on your model above.",
    "अब अपने मॉडल को चूकने पर मजबूर कीजिए। एक कोशिश चुनिए, सोचिए क्या होगा, फिर उसे खोलिए। कुछ कोशिशें आप ऊपर अपने मॉडल पर भी कर सकते हैं।",
    "ఇప్పుడు మీ మోడల్ తప్పు చేసేలా ప్రయత్నించండి. ఒక ప్రయత్నం ఎంచుకుని, ఏం జరుగుతుందో ఊహించి, దాన్ని తెరవండి. కొన్నింటిని పైన మీ మోడల్ మీద కూడా ప్రయత్నించవచ్చు.")
add("br.t1", "Ask for the word after one that is in none of your sentences",
    "ऐसे शब्द के बाद का शब्द पूछिए जो आपके किसी वाक्य में नहीं है",
    "మీ ఏ వాక్యంలోనూ లేని పదం తర్వాత ఏం వస్తుందో అడగండి")
add("br.r1", "It has nothing to count, so it cannot guess at all. A model only has what was in its sentences.",
    "उसके पास गिनने को कुछ नहीं, इसलिए वह अनुमान लगा ही नहीं सकता। मॉडल के पास बस वही है जो उसके वाक्यों में था।",
    "దానికి లెక్కించడానికి ఏమీ లేదు, అందుకే అది అసలు ఊహించలేదు. మోడల్ దగ్గర దాని వాక్యాల్లో ఉన్నదే ఉంటుంది.")
add("br.t2", "Let it write a long sentence from a common word", "किसी आम शब्द से उसे लंबा वाक्य लिखने दीजिए", "ఒక సాధారణ పదం నుండి దాన్ని పొడవైన వాక్యం రాయనివ్వండి")
add("br.r2", "It often starts well, then can go round in circles: “the cat sat on the cat sat on…”. It takes the top token every time, with no plan for the whole sentence.",
    "वह अक्सर ठीक शुरू करता है, फिर गोल-गोल घूम सकता है: “बिल्ली ने दूध पिया और बिल्ली ने दूध पिया और…”। वह हर बार सबसे ऊपर वाला टोकन लेता है, पूरे वाक्य की कोई योजना नहीं।",
    "అది తరచుగా బాగానే మొదలుపెడుతుంది, తర్వాత గుండ్రంగా తిరగవచ్చు: “పిల్లి పాలు తాగింది పిల్లి పాలు తాగింది…”. అది ప్రతిసారీ పై టోకెన్‌నే తీసుకుంటుంది, మొత్తం వాక్యానికి ఏ ప్రణాళికా లేదు.")
add("br.t3", "Add a silly sentence, like “I am a flying mango.”", "एक बेतुका वाक्य जोड़िए, जैसे “मैं एक उड़ता आम हूँ।”", "ఒక వింత వాక్యం చేర్చండి, ఉదాహరణకు “నేను ఎగిరే మామిడిపండును.”")
add("br.r3", "Now “a” can lead to “flying”. The model copies whatever its sentences contain, sensible or silly. It cannot tell the difference.",
    "अब “एक” के बाद “उड़ता” आ सकता है। मॉडल वही दोहराता है जो उसके वाक्यों में है, समझदारी वाला हो या बेतुका। वह फ़र्क़ नहीं कर सकता।",
    "ఇప్పుడు “ఎగిరే” తర్వాత “మామిడిపండును” రావచ్చు. మోడల్ తన వాక్యాల్లో ఏది ఉంటే దాన్నే అనుసరిస్తుంది, అర్థవంతమైనదైనా వింతదైనా. అది తేడా గుర్తించలేదు.")
add("br.t4", "Ask for the word after one that appears in many of your sentences", "ऐसे शब्द के बाद का शब्द पूछिए जो आपके कई वाक्यों में है", "మీ చాలా వాక్యాల్లో ఉన్న పదం తర్వాత ఏం వస్తుందో అడగండి")
add("br.r4", "This works well. With many counts, its pick matches what your sentences do most often.",
    "यह ठीक चलता है। गिनती ज़्यादा हो तो उसकी पसंद वही होती है जो आपके वाक्यों में सबसे ज़्यादा होता है।",
    "ఇది బాగానే పనిచేస్తుంది. లెక్కలు ఎక్కువ ఉంటే, దాని ఎంపిక మీ వాక్యాల్లో ఎక్కువగా జరిగేదానితో సరిపోతుంది.")
add("br.reflect", "Every failure came from the same place: the model follows its counts, not meaning. Which failure would matter most if people trusted it?",
    "हर चूक एक ही जगह से आई: मॉडल अपनी गिनती पर चलता है, मतलब पर नहीं। अगर लोग इस पर भरोसा करें, तो कौन-सी चूक सबसे ज़्यादा मायने रखेगी?",
    "ప్రతి తప్పూ ఒకే చోటు నుండి వచ్చింది: మోడల్ తన లెక్కలను అనుసరిస్తుంది, అర్థాన్ని కాదు. ప్రజలు దాన్ని నమ్మితే, ఏ తప్పు ఎక్కువ ముఖ్యం?")

# ---------------------------------------------------------------- break it: tokens are not always words
add("an3.title", "Tokens as puzzle pieces", "पहेली के टुकड़ों जैसे टोकन", "పజిల్ ముక్కల్లాంటి టోకెన్లు")
add("an3.source", "A jigsaw puzzle is a picture cut into pieces. The cuts do not follow the picture: one piece can hold half an eye.",
    "जिगसॉ पहेली एक तस्वीर है जिसे टुकड़ों में काटा गया है। कटाई तस्वीर के हिसाब से नहीं होती: एक टुकड़े में आधी आँख हो सकती है।",
    "జిగ్‌సా పజిల్ అంటే ముక్కలుగా కోసిన ఒక బొమ్మ. కోతలు బొమ్మను బట్టి ఉండవు: ఒక ముక్కలో సగం కన్ను ఉండవచ్చు.")
add("an3.m1s", "The whole picture", "पूरी तस्वीर", "మొత్తం బొమ్మ")
add("an3.m1t", "A sentence", "एक वाक्य", "ఒక వాక్యం")
add("an3.m2s", "The pieces", "टुकड़े", "ముక్కలు")
add("an3.m2t", "The tokens", "टोकन", "టోకెన్లు")
add("an3.m3s", "A cut through the middle of an eye", "आँख के बीच से गुज़रती कटाई", "కన్ను మధ్యలో నుండి వెళ్ళే కోత")
add("an3.m3t", "A cut through the middle of a word, like “play | ing”", "शब्द के बीच से कटाई, जैसे “खेल | ना”", "పదం మధ్యలో కోత, ఉదాహరణకు “ఆట | లు”")
add("an3.m4s", "Fitting the pieces back together in order", "टुकड़ों को फिर से क्रम में जोड़ना", "ముక్కలను మళ్ళీ వరుసగా కలపడం")
add("an3.m4t", "Joining tokens back into text", "टोकन को जोड़कर फिर से वाक्य बनाना", "టోకెన్లను కలిపి మళ్ళీ రాతగా చేయడం")
add("an3.break", "Puzzle cuts are made once, for one picture. A model’s pieces are chosen from lots of text, by finding letter groups that appear often, like “ing”. The same pieces are then reused in every sentence. And the model only ever sees pieces, never a picture or a meaning.",
    "पहेली की कटाई एक ही बार, एक तस्वीर के लिए होती है। मॉडल के टुकड़े ढेरों वाक्यों से चुने जाते हैं: वे अक्षरों के ऐसे समूह होते हैं जो अक्सर आते हैं, जैसे “ना”। फिर वही टुकड़े हर वाक्य में दोबारा इस्तेमाल होते हैं। और मॉडल को सिर्फ़ टुकड़े दिखते हैं, कभी कोई तस्वीर या मतलब नहीं।",
    "పజిల్ కోతలు ఒక్కసారే, ఒక బొమ్మ కోసం చేస్తారు. మోడల్ ముక్కలను ఎన్నో రాతల నుండి ఎంచుకుంటారు: తరచుగా వచ్చే అక్షరాల గుంపులు, ఉదాహరణకు “లు”. తర్వాత అవే ముక్కలు ప్రతి వాక్యంలోనూ మళ్ళీ వాడతారు. మోడల్‌కు ఎప్పుడూ ముక్కలే కనిపిస్తాయి, బొమ్మ గానీ అర్థం గానీ కాదు.")
add("an3.f1", "Puzzle: one picture becomes many pieces", "पहेली: एक तस्वीर, कई टुकड़े", "పజిల్: ఒక బొమ్మ, ఎన్నో ముక్కలు")
add("an3.f2", "Word: “playing” becomes “play” + “ing”", "शब्द: “खेलना” बनता है “खेल” + “ना”", "పదం: “ఆటలు” అవుతుంది “ఆట” + “లు”")
add("an3.f3", "Tokens: the pieces a model reads, one after another", "टोकन: वे टुकड़े जिन्हें मॉडल एक के बाद एक पढ़ता है", "టోకెన్లు: మోడల్ ఒకదాని తర్వాత ఒకటి చదివే ముక్కలు")

add("an4.title", "Tokens as building blocks", "बिल्डिंग ब्लॉक जैसे टोकन", "బిల్డింగ్ బ్లాక్‌ల్లాంటి టోకెన్లు")
add("an4.source", "With a small box of building blocks, you can build almost anything, even a shape nobody has built before.",
    "बिल्डिंग ब्लॉक के एक छोटे डिब्बे से आप लगभग कुछ भी बना सकते हैं, ऐसी आकृति भी जो पहले किसी ने नहीं बनाई।",
    "చిన్న బిల్డింగ్ బ్లాక్‌ల పెట్టెతో మీరు దాదాపు ఏదైనా కట్టవచ్చు, ఇంతకు ముందు ఎవరూ కట్టని ఆకారం కూడా.")
add("an4.m1s", "A small set of block shapes", "ब्लॉक की कुछ गिनी-चुनी आकृतियाँ", "కొన్ని బ్లాక్ ఆకారాల సెట్")
add("an4.m1t", "A vocabulary of word pieces", "शब्द-टुकड़ों की शब्दावली", "పద ముక్కల పదజాలం")
add("an4.m2s", "A new shape built from the same blocks", "उन्हीं ब्लॉक से बनी नई आकृति", "అవే బ్లాక్‌లతో కట్టిన కొత్త ఆకారం")
add("an4.m2t", "A new or rare word built from known pieces", "जाने-पहचाने टुकड़ों से बना नया या कम दिखने वाला शब्द", "తెలిసిన ముక్కలతో తయారైన కొత్త లేదా అరుదైన పదం")
add("an4.break", "A toy maker chooses block shapes for building. Token pieces are chosen by counting which letter groups appear most in the text used. So languages that were rare in that text often get cut into more, smaller pieces.",
    "खिलौना बनाने वाला ब्लॉक की आकृतियाँ बनाने के लिए चुनता है। टोकन के टुकड़े यह गिनकर चुने जाते हैं कि इस्तेमाल हुए वाक्यों में अक्षरों के कौन-से समूह सबसे ज़्यादा आए। इसलिए जो भाषाएँ उन वाक्यों में कम थीं, वे अक्सर ज़्यादा और छोटे टुकड़ों में कटती हैं।",
    "బొమ్మలు తయారు చేసేవారు కట్టడానికి పనికొచ్చేలా బ్లాక్ ఆకారాలను ఎంచుకుంటారు. టోకెన్ ముక్కలను, వాడిన రాతల్లో ఏ అక్షరాల గుంపులు ఎక్కువగా వచ్చాయో లెక్కించి ఎంచుకుంటారు. అందుకే ఆ రాతల్లో అరుదుగా ఉన్న భాషలు తరచుగా ఎక్కువ, చిన్న ముక్కలుగా కోయబడతాయి.")
add("an4.f1", "A tower from 3 blocks", "3 ब्लॉक से बनी मीनार", "3 బ్లాక్‌లతో ఒక గోపురం")
add("an4.f2", "“unbreakable” from “un” + “break” + “able”", "“अनपढ़” बना “अन” + “पढ़” से", "“అసాధ్యం” = “అ” + “సాధ్యం”")
add("an4.f3", "Any word, built from a fixed vocabulary of tokens", "कोई भी शब्द, टोकन की एक तय शब्दावली से बना", "ఏ పదమైనా, టోకెన్ల ఒక స్థిర పదజాలం నుండి తయారవుతుంది")

add("pp.prompt", "Your model used whole words as tokens. Big models often cut words into smaller pieces. Suppose one cuts “playing” into “play” and “ing”. How many tokens is that?",
    "आपके मॉडल ने पूरे शब्दों को टोकन माना। बड़े मॉडल अक्सर शब्दों को छोटे टुकड़ों में काटते हैं। मान लीजिए कोई मॉडल “खेलना” को “खेल” और “ना” में काटता है। यह कितने टोकन हुए?",
    "మీ మోడల్ పూర్తి పదాలనే టోకెన్లుగా తీసుకుంది. పెద్ద మోడల్స్ తరచుగా పదాలను చిన్న ముక్కలుగా కోస్తాయి. ఒక మోడల్ “ఆటలు” అనే పదాన్ని “ఆట”, “లు” గా కోసిందనుకోండి. అవి ఎన్ని టోకెన్లు?")
add("pp.o1", "1: it is one word", "1: यह एक शब्द है", "1: ఇది ఒకే పదం")
add("pp.o2", "2", "2", "2")
add("pp.o3", "It depends on what the word means", "यह शब्द के मतलब पर निर्भर है", "అది పదం అర్థం మీద ఆధారపడుతుంది")
add("pp.f1", "To a person it is one word. The model reads two pieces, one after the other.",
    "इंसान के लिए यह एक शब्द है। मॉडल इसे दो टुकड़ों में, एक के बाद एक पढ़ता है।",
    "మనిషికి ఇది ఒకే పదం. మోడల్ దీన్ని రెండు ముక్కలుగా, ఒకదాని తర్వాత ఒకటి చదువుతుంది.")
add("pp.f3", "The cutting never looks at meaning. It follows letter groups that were common in the text the pieces came from.",
    "कटाई कभी मतलब नहीं देखती। वह अक्षरों के उन समूहों पर चलती है जो उन वाक्यों में आम थे जिनसे टुकड़े चुने गए।",
    "కోత ఎప్పుడూ అర్థాన్ని చూడదు. ముక్కలు ఏ రాతల నుండి వచ్చాయో, వాటిలో తరచుగా వచ్చిన అక్షరాల గుంపులనే అనుసరిస్తుంది.")
add("pp.explain", "2 tokens. A piece like “ing” turns up in many words: “play|ing”, “read|ing”, “cook|ing”. So a small vocabulary of pieces can build a great many words.",
    "2 टोकन। “ना” जैसा टुकड़ा कई शब्दों में आता है: “खेल|ना”, “पढ़|ना”, “लिख|ना”। इसलिए टुकड़ों की छोटी-सी शब्दावली से बहुत सारे शब्द बन सकते हैं।",
    "2 టోకెన్లు. “లు” లాంటి ముక్క చాలా పదాల్లో వస్తుంది: “ఆట|లు”, “పాట|లు”, “పువ్వు|లు”. అందుకే ముక్కల చిన్న పదజాలంతో ఎన్నో పదాలు తయారు చేయవచ్చు.")

add("ix.text", "Many big models were built mostly from English text. They often cut Hindi or Telugu words into more, smaller pieces than English words. So the same message can need more tokens in Hindi or Telugu. More tokens can mean slower or costlier answers.",
    "कई बड़े मॉडल ज़्यादातर अंग्रेज़ी वाक्यों से बने हैं। वे हिंदी या तेलुगु शब्दों को अक्सर अंग्रेज़ी शब्दों से ज़्यादा और छोटे टुकड़ों में काटते हैं। इसलिए वही संदेश हिंदी या तेलुगु में ज़्यादा टोकन ले सकता है। ज़्यादा टोकन का मतलब धीमे या महँगे जवाब हो सकते हैं।",
    "చాలా పెద్ద మోడల్స్ ఎక్కువగా ఇంగ్లీష్ రాతలతో తయారయ్యాయి. అవి తరచుగా తెలుగు లేదా హిందీ పదాలను ఇంగ్లీష్ పదాల కంటే ఎక్కువ, చిన్న ముక్కలుగా కోస్తాయి. అందుకే అదే సందేశానికి తెలుగు లేదా హిందీలో ఎక్కువ టోకెన్లు అవసరం కావచ్చు. ఎక్కువ టోకెన్లు అంటే నెమ్మదైన లేదా ఖరీదైన జవాబులు కావచ్చు.")
add("ix.q", "Who should make sure these tools work equally well in every language?",
    "यह कौन पक्का करे कि ये टूल हर भाषा में बराबर अच्छे से काम करें?",
    "ఈ సాధనాలు ప్రతి భాషలోనూ సమానంగా బాగా పనిచేసేలా ఎవరు చూసుకోవాలి?")

# ---------------------------------------------------------------- transfer and reflect
add("eb1.prompt", "A chatbot, an app you can type questions to, answers in smooth, confident sentences. Using what you built, which explanation fits best?",
    "एक चैटबॉट, यानी ऐसा ऐप जिसमें आप सवाल टाइप कर सकते हैं, साफ़-सुथरे, पक्के लगने वाले वाक्यों में जवाब देता है। आपने जो बनाया, उसके आधार पर कौन-सी व्याख्या सबसे सही बैठती है?",
    "చాట్‌బాట్, అంటే మీరు ప్రశ్నలు టైప్ చేయగల ఒక యాప్, చక్కని, ఖచ్చితంగా అనిపించే వాక్యాల్లో జవాబిస్తుంది. మీరు తయారు చేసినదాని ఆధారంగా, ఏ వివరణ బాగా సరిపోతుంది?")
add("eb1.a", "It knows the answer and explains it, the way a teacher does.", "उसे जवाब पता है और वह उसे एक शिक्षक की तरह समझाता है।", "దానికి జవాబు తెలుసు, ఉపాధ్యాయుల్లాగే దాన్ని వివరిస్తుంది.")
add("eb1.afb", "It can sound like that. But it builds its answer one token at a time, from likelihoods. Sounding sure is not the same as being right.",
    "ऐसा लग सकता है। पर वह अपना जवाब एक-एक टोकन करके, संभावनाओं से बनाता है। पक्का लगना और सही होना एक बात नहीं है।",
    "అలా అనిపించవచ్చు. కానీ అది తన జవాబును ఒక్కో టోకెన్‌గా, అవకాశాల ఆధారంగా కూర్చుతుంది. ఖచ్చితంగా అనిపించడం, సరిగ్గా ఉండడం ఒకటి కాదు.")
add("eb1.b", "It picks each next token by likelihood, learned from huge amounts of text. Sounding sure does not make it true.",
    "वह हर अगला टोकन संभावना से चुनता है, जो ढेरों लिखे हुए वाक्यों से सीखी गई है। पक्का लगने से बात सच नहीं हो जाती।",
    "అది ప్రతి తర్వాతి టోకెన్‌ను అవకాశం ప్రకారం ఎంచుకుంటుంది, ఆ అవకాశాలు ఎన్నో రాతల నుండి నేర్చుకున్నవి. ఖచ్చితంగా అనిపించినంత మాత్రాన అది నిజం కాదు.")
add("eb1.bfb", "Yes. Big chatbots are far larger than your model. They are also tuned further with people’s feedback, and often mix in a little chance when picking. But each token still comes from likelihood, not meaning.",
    "हाँ। बड़े चैटबॉट आपके मॉडल से कहीं बड़े होते हैं। लोगों की राय से उन्हें और सुधारा भी जाता है, और चुनते समय अक्सर थोड़ा संयोग भी मिलाया जाता है। पर हर टोकन फिर भी संभावना से आता है, मतलब से नहीं।",
    "అవును. పెద్ద చాట్‌బాట్‌లు మీ మోడల్ కంటే ఎంతో పెద్దవి. ప్రజల అభిప్రాయాలతో వాటిని ఇంకా సరిదిద్దుతారు, ఎంచుకునేటప్పుడు తరచుగా కొంచెం యాదృచ్ఛికతను కూడా కలుపుతారు. అయినా ప్రతి టోకెన్ అవకాశం నుండే వస్తుంది, అర్థం నుండి కాదు.")
add("eb1.c", "It finds a whole answer that a person wrote earlier and copies it.", "वह किसी इंसान का पहले लिखा पूरा जवाब ढूँढकर उसकी नक़ल करता है।", "ఒక మనిషి ఇంతకు ముందు రాసిన పూర్తి జవాబును వెతికి దాన్ని కాపీ చేస్తుంది.")
add("eb1.cfb", "Parts may match text it was trained on. But it builds the answer one token at a time. That is why it can write sentences nobody wrote before.",
    "कुछ हिस्से उन वाक्यों से मिल सकते हैं जिन पर उसकी ट्रेनिंग हुई। पर वह जवाब एक-एक टोकन करके बनाता है। इसीलिए वह ऐसे वाक्य भी लिख सकता है जो पहले किसी ने नहीं लिखे।",
    "కొన్ని భాగాలు అది ట్రైనింగ్ పొందిన రాతలతో సరిపోలవచ్చు. కానీ అది జవాబును ఒక్కో టోకెన్‌గా కూర్చుతుంది. అందుకే ఇంతకు ముందు ఎవరూ రాయని వాక్యాలను కూడా అది రాయగలదు.")

add("eb2.prompt", "Your turn, in a sentence or two. Where would you trust a next-word model, and where would you check its answer? Keep it general: nothing private.",
    "अब आपकी बारी, एक-दो वाक्यों में। आप अगला शब्द बताने वाले मॉडल पर कहाँ भरोसा करेंगे, और कहाँ उसका जवाब जाँचेंगे? आम बातें लिखिए: कुछ भी निजी नहीं।",
    "ఇప్పుడు మీ వంతు, ఒకటి రెండు వాక్యాల్లో. తర్వాతి పదం చెప్పే మోడల్‌ను మీరు ఎక్కడ నమ్ముతారు, ఎక్కడ దాని జవాబును సరిచూస్తారు? సాధారణ విషయాలే రాయండి: వ్యక్తిగతమైనవి వద్దు.")
add("eb2.break", "When could the most likely next word be the wrong one?", "सबसे संभावित अगला शब्द कब ग़लत हो सकता है?", "ఎక్కువ అవకాశం ఉన్న తర్వాతి పదం ఎప్పుడు తప్పు కావచ్చు?")
add("eb2.model", "I would trust it to suggest a common next word while I type a message. I would check it for facts, like dates or medicines, because likely words are not always true ones.",
    "मैसेज टाइप करते समय आम अगला शब्द सुझाने के लिए मैं इस पर भरोसा करूँगी। तारीख़ या दवाइयों जैसे तथ्यों के लिए मैं इसे जाँचूँगी, क्योंकि संभावित शब्द हमेशा सच नहीं होते।",
    "మెసేజ్ టైప్ చేసేటప్పుడు సాధారణ తర్వాతి పదం సూచించడానికి నేను దాన్ని నమ్ముతాను. తేదీలు, మందుల లాంటి వాస్తవాల కోసం సరిచూస్తాను, ఎందుకంటే ఎక్కువ అవకాశం ఉన్న పదాలు ఎప్పుడూ నిజమైనవి కావు.")

add("tw.title", "What I built today", "आज मैंने क्या बनाया", "ఈ రోజు నేను ఏం తయారు చేశాను")
add("tw.card", "I built a model that predicts the next token by counting. It picks the most likely token, with no meaning or intention behind it. Training makes a model’s error smaller, one small step at a time.",
    "मैंने एक मॉडल बनाया जो गिनकर अगले टोकन का अनुमान लगाता है। वह सबसे संभावित टोकन चुनता है, उसके पीछे कोई मतलब या इरादा नहीं होता। ट्रेनिंग मॉडल की ग़लती को छोटे-छोटे क़दमों में कम करती है।",
    "లెక్కించి తర్వాతి టోకెన్‌ను అంచనా వేసే ఒక మోడల్‌ను నేను తయారు చేశాను. అది ఎక్కువ అవకాశం ఉన్న టోకెన్‌ను ఎంచుకుంటుంది, దాని వెనుక అర్థం గానీ ఉద్దేశం గానీ లేవు. ట్రైనింగ్ మోడల్ పొరపాటును చిన్న చిన్న అడుగులతో తగ్గిస్తుంది.")
add("tw.l1", "My model", "मेरा मॉडल", "నా మోడల్")
add("tw.l2", "My walk down the hill", "पहाड़ी से नीचे मेरा रास्ता", "కొండ దిగిన నా దారి")
add("tw.l3", "Where I would trust it, and where I would check", "मैं कहाँ भरोसा करूँगा/करूँगी, और कहाँ जाँचूँगा/जाँचूँगी", "నేను ఎక్కడ నమ్ముతాను, ఎక్కడ సరిచూస్తాను")

# ---------------------------------------------------------------- pre- and post-checks
add("pre1.q", "A phone suggests “tomorrow” after “See you”. Why?", "फ़ोन “फिर” के बाद “मिलेंगे” सुझाता है। क्यों?", "ఫోన్ “మళ్ళీ” తర్వాత “కలుద్దాం” అని సూచిస్తుంది. ఎందుకు?")
add("pre1.a", "It understands your plans for tomorrow", "वह आपकी योजनाएँ समझता है", "అది మీ ప్రణాళికలను అర్థం చేసుకుంటుంది")
add("pre1.b", "“tomorrow” often came after “see you” in the text behind it", "जिन वाक्यों से वह बना, उनमें “फिर” के बाद अक्सर “मिलेंगे” आया", "అది తయారైన రాతల్లో “మళ్ళీ” తర్వాత తరచుగా “కలుద్దాం” వచ్చింది")
add("pre1.c", "Someone typed that rule in for the phone", "किसी ने फ़ोन के लिए यह नियम टाइप किया", "ఎవరో ఫోన్ కోసం ఆ నియమాన్ని టైప్ చేశారు")
add("pre2.q", "In 10 sentences, “am” came after “I” 4 times. What share is that?", "10 वाक्यों में “मैं” के बाद “स्कूल” 4 बार आया। यह कितना हिस्सा है?", "10 వాక్యాల్లో “నేను” తర్వాత “బడికి” 4 సార్లు వచ్చింది. అది ఎంత వాటా?")
add("pre2.a", "4 out of 10", "10 में से 4", "10లో 4")
add("pre2.b", "10 out of 4", "4 में से 10", "4లో 10")
add("pre2.c", "4 out of 14", "14 में से 4", "14లో 4")
add("pre3.q", "A model’s guesses start out poor. What usually makes them better?", "किसी मॉडल के अनुमान शुरू में ख़राब होते हैं। आम तौर पर उन्हें क्या बेहतर बनाता है?", "ఒక మోడల్ అంచనాలు మొదట్లో సరిగా ఉండవు. సాధారణంగా వాటిని ఏది మెరుగుపరుస్తుంది?")
add("pre3.a", "It starts to understand the words", "वह शब्दों को समझने लगता है", "అది పదాలను అర్థం చేసుకోవడం మొదలుపెడుతుంది")
add("pre3.b", "Its settings change step by step to make it less wrong", "उसकी सेटिंग्स क़दम-दर-क़दम बदलती हैं ताकि वह कम ग़लत हो", "అది తక్కువ తప్పు చేసేలా దాని సెట్టింగ్‌లు అడుగు అడుగుకీ మారతాయి")
add("pre3.c", "Nothing: a model cannot get better", "कुछ नहीं: मॉडल बेहतर नहीं हो सकता", "ఏదీ కాదు: మోడల్ మెరుగుపడలేదు")

add("post1.q", "Your model wrote “i am going to school.” Why did it pick “going” after “am”?", "आपके मॉडल ने लिखा “मैं स्कूल जा रही हूँ।” उसने “स्कूल” के बाद “जा” क्यों चुना?", "మీ మోడల్ “నేను బడికి వెళ్తున్నాను.” అని రాసింది. “బడికి” తర్వాత “వెళ్తున్నాను” ఎందుకు ఎంచుకుంది?")
add("post1.a", "It wanted to say where it was going", "वह बताना चाहता था कि वह कहाँ जा रहा है", "అది ఎక్కడికి వెళ్తోందో చెప్పాలనుకుంది")
add("post1.b", "“going” came after “am” most often in its sentences", "उसके वाक्यों में “स्कूल” के बाद सबसे ज़्यादा बार “जा” आया", "దాని వాక్యాల్లో “బడికి” తర్వాత ఎక్కువసార్లు “వెళ్తున్నాను” వచ్చింది")
add("post1.c", "It chose the word that makes the most sense", "उसने वह शब्द चुना जिसका सबसे ज़्यादा मतलब बनता है", "అర్థవంతంగా ఉండే పదాన్ని అది ఎంచుకుంది")
add("post1.fb", "The model has no wishes and checks no meaning. It took the token with the biggest share after the last token.",
    "मॉडल की कोई इच्छा नहीं होती और वह मतलब नहीं जाँचता। उसने पिछले टोकन के बाद सबसे बड़े हिस्से वाला टोकन लिया।",
    "మోడల్‌కు కోరికలు లేవు, అది అర్థాన్ని చూడదు. చివరి టోకెన్ తర్వాత అతి పెద్ద వాటా ఉన్న టోకెన్‌ను తీసుకుంది.")
add("post2.q", "Cut “we play and we sing.” into tokens, as your model does. How many tokens, and how many different ones?",
    "“हम खेलें और हम गाएँ।” को अपने मॉडल की तरह टोकन में काटिए। कितने टोकन हैं, और उनमें अलग-अलग कितने?",
    "“మనం ఆడదాం, మనం పాడదాం.” అనే వాక్యాన్ని మీ మోడల్ లాగా టోకెన్లుగా కోయండి. ఎన్ని టోకెన్లు, వాటిలో వేర్వేరువి ఎన్ని?")
add("post2.a", "6 tokens, 5 different", "6 टोकन, 5 अलग-अलग", "6 టోకెన్లు, 5 వేర్వేరు")
add("post2.b", "5 tokens, 5 different", "5 टोकन, 5 अलग-अलग", "5 టోకెన్లు, 5 వేర్వేరు")
add("post2.c", "6 tokens, 6 different", "6 टोकन, 6 अलग-अलग", "6 టోకెన్లు, 6 వేర్వేరు")
add("post2.fb", "we | play | and | we | sing | . makes 6 tokens. “we” repeats, so there are 5 different ones.",
    "हम | खेलें | और | हम | गाएँ | । से 6 टोकन बनते हैं। “हम” दोहराया गया है, इसलिए अलग-अलग 5 हैं।",
    "మనం | ఆడదాం | , | మనం | పాడదాం | . అంటే 6 టోకెన్లు. “మనం” మళ్ళీ వచ్చింది, కాబట్టి వేర్వేరువి 5.")
add("post3.q", "After “see”, “you” came 6 times and “the” came 2 times. What is the probability of “you”?",
    "“फिर” के बाद “मिलेंगे” 6 बार आया और “से” 2 बार आया। “मिलेंगे” की प्रायिकता क्या है?",
    "“మళ్ళీ” తర్వాత “కలుద్దాం” 6 సార్లు, “రా” 2 సార్లు వచ్చాయి. “కలుద్దాం” సంభావ్యత ఎంత?")
add("post3.a", "6 out of 8, or 0.75", "8 में से 6, यानी 0.75", "8లో 6, అంటే 0.75")
add("post3.b", "6 out of 2", "2 में से 6", "2లో 6")
add("post3.c", "2 out of 8, or 0.25", "8 में से 2, यानी 0.25", "8లో 2, అంటే 0.25")
add("post3.fb", "6 + 2 = 8 times in all. The word came 6 of those 8 times: 6 ÷ 8 = 0.75.",
    "कुल 6 + 2 = 8 बार। वह शब्द इन 8 में से 6 बार आया: 6 ÷ 8 = 0.75।",
    "మొత్తం 6 + 2 = 8 సార్లు. ఆ పదం ఈ 8లో 6 సార్లు వచ్చింది: 6 ÷ 8 = 0.75.")
add("post4.q", "During training, a model’s error goes from 9 to 7 to 4. What is happening?",
    "ट्रेनिंग के दौरान किसी मॉडल की ग़लती 9 से 7, फिर 4 हो जाती है। क्या हो रहा है?",
    "ట్రైనింగ్ సమయంలో ఒక మోడల్ పొరపాటు 9 నుండి 7కి, తర్వాత 4కి తగ్గుతుంది. ఏం జరుగుతోంది?")
add("post4.a", "Its settings are changing step by step, so its guesses get less wrong", "उसकी सेटिंग्स क़दम-दर-क़दम बदल रही हैं, इसलिए अनुमान कम ग़लत हो रहे हैं", "దాని సెట్టింగ్‌లు అడుగు అడుగుకీ మారుతున్నాయి, అందుకే అంచనాలు తక్కువ తప్పుగా ఉన్నాయి")
add("post4.b", "It is starting to understand the words", "वह शब्दों को समझने लगा है", "అది పదాలను అర్థం చేసుకోవడం మొదలుపెట్టింది")
add("post4.c", "Someone is typing in the right answers for it", "कोई उसके लिए सही जवाब टाइप कर रहा है", "ఎవరో దాని కోసం సరైన జవాబులు టైప్ చేస్తున్నారు")
add("post4.fb", "Like your walk down the hill: each step changes the settings a little, and the error drops. No understanding is added.",
    "पहाड़ी से नीचे आपके रास्ते की तरह: हर क़दम सेटिंग्स को थोड़ा बदलता है, और ग़लती घटती है। कोई समझ नहीं जुड़ती।",
    "మీరు కొండ దిగినట్టే: ప్రతి అడుగు సెట్టింగ్‌లను కొద్దిగా మారుస్తుంది, పొరపాటు తగ్గుతుంది. కొత్తగా ఏ అవగాహనా రాదు.")


# ---------------------------------------------------------------- blocks
def block(id, type, config, **extra):
    return {"id": id, "type": type, "componentVersion": "1.0", "config": config, **extra}


stages = [
    {"stage": "hook", "blocks": [
        block("b1", "reveal", {"textKey": "hook.text", "steps": ["hook.s1"], "questionKey": "hook.q"}),
    ]},
    {"stage": "predict", "blocks": [
        block("b2", "predict", {"promptKey": "pr.prompt", "choices": ["pr.c1", "pr.c2", "pr.c3"], "answer": "pr.c2", "confidence": True,
                                "revealKey": "pr.reveal", "choiceFeedback": {"pr.c1": "pr.f1", "pr.c3": "pr.f3"}},
              classroom={"mode": "class-vote"}),
    ]},
    {"stage": "manipulate", "blocks": [
        block("b3", "your-data", {"promptKey": "yd.prompt", "kind": "list", "minItems": 3, "maxItems": 6, "maxLength": 100,
                                  "placeholderKey": "yd.placeholder", "exampleKeys": [f"yd.e{i}" for i in range(1, 7)]},
              classroom={"mode": "class-contributions", "promptKey": "yd.promptClass", "maxItems": 8}),
        block("b4", "predict", {"promptKey": "tk.prompt", "choices": ["tk.c1", "tk.c2", "tk.c3"], "answer": "tk.c2",
                                "revealKey": "tk.reveal", "choiceFeedback": {"tk.c1": "tk.f1", "tk.c3": "tk.f3"}},
              classroom={"mode": "class-vote"}, glossaryTerms=["token"]),
        block("b5", "check", {"promptKey": "vc.prompt", "options": ["vc.o1", "vc.o2", "vc.o3"], "answer": "vc.o2",
                              "feedback": {"vc.o1": "vc.f1", "vc.o3": "vc.f3"}, "hints": ["vc.h1", "vc.h2"], "explainKey": "vc.explain"},
              classroom={"mode": "class-vote"}, glossaryTerms=["vocabulary"]),
        block("b6", "by-hand-then-automate", {"introKey": "bh.intro", "ruleKey": "bh.rule", "process": {"type": "linear", "weight": 0.1, "bias": 0},
                                              "items": [{"id": f"w{i}", "labelKey": f"bh.i{i}", "value": v} for i, (*_, v) in enumerate(BH_ITEMS, start=1)],
                                              "manualCount": 2, "automateKey": "bh.auto", "valueLabelKey": "bh.value"},
              glossaryTerms=["probability"], detours=["fractions", "probability"]),
        block("b7", "next-word-model", {"promptKey": "nw.prompt", "fromBlock": "b3", "starterSentencesKey": "nw.starters", "maxSentences": 10, "explainKey": "nw.explain"},
              classroom={"mode": "class-contributions"}, glossaryTerms=["model", "prediction"]),
    ]},
    {"stage": "explain", "blocks": [
        block("b8", "analogy", {"concept": "prediction", "titleKey": "an1.title", "sourceKey": "an1.source",
                                "mappings": [{"sourceKey": f"an1.m{i}s", "targetKey": f"an1.m{i}t"} for i in range(1, 5)],
                                "breakPointKey": "an1.break", "fading": ["an1.f1", "an1.f2", "an1.f3"]},
              classroom={"mode": "teacher-led"}),
        block("b9", "analogy", {"concept": "prediction", "titleKey": "an2.title", "sourceKey": "an2.source",
                                "mappings": [{"sourceKey": f"an2.m{i}s", "targetKey": f"an2.m{i}t"} for i in range(1, 4)],
                                "breakPointKey": "an2.break", "fading": ["an2.f1", "an2.f2", "an2.f3"]},
              classroom={"mode": "teacher-led"}),
        block("b10", "check", {"promptKey": "pc1.prompt", "options": ["pc1.o1", "pc1.o2", "pc1.o3"], "answer": "pc1.o1",
                               "feedback": {"pc1.o2": "pc1.f2", "pc1.o3": "pc1.f3"}, "hints": ["pc1.h1", "pc1.h2"],
                               "explainKey": "pc1.explain", "detour": "probability"},
              classroom={"mode": "class-vote"}, detours=["probability", "fractions"]),
        block("b11", "predict", {"promptKey": "tr.prompt", "choices": ["tr.c1", "tr.c2", "tr.c3"], "answer": "tr.c1", "confidence": True,
                                 "revealKey": "tr.reveal", "choiceFeedback": {"tr.c2": "tr.f2", "tr.c3": "tr.f3"}},
              classroom={"mode": "class-vote"}, glossaryTerms=["training"]),
        block("b12", "hillside", {"promptKey": "hs.prompt", "landscape": {"type": "bowl", "min": 0, "max": 100}, "start": 8,
                                  "stepMin": 2, "stepMax": 20, "maxSteps": 10, "leftKey": "hs.left", "rightKey": "hs.right",
                                  "goalKey": "hs.goal", "fadeKey": "hs.fade", "breaksKey": "hs.breaks"},
              classroom={"maxSteps": 8}, glossaryTerms=["error"]),
    ]},
    {"stage": "break-it", "blocks": [
        block("b13", "break-it", {"challengeKey": "br.challenge", "target": "b7",
                                  "attempts": [{"id": f"t{i}", "labelKey": f"br.t{i}", "resultKey": f"br.r{i}", "breaks": i != 4} for i in range(1, 5)],
                                  "reflectKey": "br.reflect"},
              classroom={"mode": "class-suggests"}),
        block("b14", "analogy", {"concept": "token", "titleKey": "an3.title", "sourceKey": "an3.source",
                                 "mappings": [{"sourceKey": f"an3.m{i}s", "targetKey": f"an3.m{i}t"} for i in range(1, 5)],
                                 "breakPointKey": "an3.break", "fading": ["an3.f1", "an3.f2", "an3.f3"]},
              classroom={"mode": "teacher-led"}),
        block("b15", "check", {"promptKey": "pp.prompt", "options": ["pp.o1", "pp.o2", "pp.o3"], "answer": "pp.o2",
                               "feedback": {"pp.o1": "pp.f1", "pp.o3": "pp.f3"}, "explainKey": "pp.explain"},
              classroom={"mode": "class-vote"}),
        block("b16", "analogy", {"concept": "token", "titleKey": "an4.title", "sourceKey": "an4.source",
                                 "mappings": [{"sourceKey": f"an4.m{i}s", "targetKey": f"an4.m{i}t"} for i in range(1, 3)],
                                 "breakPointKey": "an4.break", "fading": ["an4.f1", "an4.f2", "an4.f3"]},
              depth="deeper", classroom={"mode": "teacher-led"}),
        block("b17", "reveal", {"textKey": "ix.text", "questionKey": "ix.q"}, depth="deeper"),
    ]},
    {"stage": "transfer-reflect", "blocks": [
        block("b18", "explain-back", {"mode": "choose", "promptKey": "eb1.prompt", "options": [
            {"id": "a", "textKey": "eb1.a", "feedbackKey": "eb1.afb"},
            {"id": "b", "textKey": "eb1.b", "feedbackKey": "eb1.bfb", "best": True},
            {"id": "c", "textKey": "eb1.c", "feedbackKey": "eb1.cfb"}]}),
        block("b19", "explain-back", {"mode": "own-words", "promptKey": "eb2.prompt", "breakPointPromptKey": "eb2.break", "modelAnswerKey": "eb2.model"}),
        block("b20", "takeaway", {"titleKey": "tw.title", "cardKey": "tw.card", "includes": ["b7", "b12", "b19"], "labelKeys": ["tw.l1", "tw.l2", "tw.l3"]},
              classroom={"mode": "class-card"}),
    ]},
]


def checks(prefix, items):
    return [{"id": f"{prefix}{n}", "objective": obj, "promptKey": f"{prefix}{n}.q", "options": [f"{prefix}{n}.a", f"{prefix}{n}.b", f"{prefix}{n}.c"],
             "answer": f"{prefix}{n}.{ans}", **({"feedbackKey": f"{prefix}{n}.fb"} if f"{prefix}{n}.fb" in S else {})} for n, obj, ans in items]


lesson = {
    "id": LESSON_ID,
    "schemaVersion": "1.0",
    "version": 1,
    "status": "draft",
    "meta": {
        "titleKey": "title", "subtitleKey": "subtitle", "subject": "ai", "course": "ai-for-kids", "module": "m4", "issue": "issue-01",
        "concepts": ["token", "vocabulary", "probability", "prediction", "error"],
        "objectives": [{"id": "o1", "textKey": "obj.o1"}, {"id": "o2", "textKey": "obj.o2"}, {"id": "o3", "textKey": "obj.o3"}],
        "prerequisites": [], "audiences": ["school-13-17"], "curriculumTags": [], "estimatedMinutes": 40,
        "teacherGuide": f"{LESSON_ID}.en",
        "provenance": "agent pipeline v1 (AI-assisted draft, adapted from the creator's Build a Language Model walkthrough); hi and te are unreviewed drafts; not yet creator-reviewed",
    },
    "stages": stages,
    "checks": {"pre": checks("pre", [(1, "o1", "b"), (2, "o2", "a"), (3, "o3", "b")]),
               "post": checks("post", [(1, "o1", "b"), (2, "o2", "a"), (3, "o2", "a"), (4, "o3", "a")])},
    "strings": {loc: {k: v[loc] for k, v in S.items()} for loc in ("en", "hi", "te")},
    "localeStatus": {"en": "draft", "hi": "draft", "te": "draft"},
}

if __name__ == "__main__":
    out = ROOT / "content" / "lessons" / f"{LESSON_ID}.json"
    out.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {out.relative_to(ROOT)}: {sum(len(s['blocks']) for s in stages)} blocks, {len(S)} strings x 3 locales")
