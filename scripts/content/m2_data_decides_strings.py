"""Strings for content/lessons/m2-data-decides.json, one entry per key with en, hi, te.
hi and te are unreviewed drafts: a native speaker and the creator must review them."""

S = {}


def add(key, en, hi, te):
    assert key not in S, key
    S[key] = {"en": en, "hi": hi, "te": te}


# ---------- meta ----------
add("title", "Data decides",
    "डेटा तय करता है",
    "డేటా నిర్ణయిస్తుంది")
add("subtitle", "Why a well-tested machine can still fail some people",
    "अच्छी तरह जाँची गई मशीन भी कुछ लोगों के लिए क्यों चूक सकती है",
    "బాగా పరీక్షించిన యంత్రం కూడా కొందరి విషయంలో ఎందుకు తప్పవచ్చు")
add("obj.o1", "Explain how a dataset that leaves out some kinds of examples makes a machine work worse for some people.",
    "समझाइए कि जिस डेटासेट में कुछ तरह के उदाहरण छूट जाते हैं, उससे मशीन कुछ लोगों के लिए ख़राब काम क्यों करती है।",
    "కొన్ని రకాల ఉదాహరణలు లేని డేటాసెట్ వల్ల యంత్రం కొందరి విషయంలో ఎందుకు సరిగా పనిచేయదో వివరించండి.")
add("obj.o2", "Work out accuracy as a percentage for each group, and show how one overall number can hide a gap.",
    "हर समूह के लिए सटीकता को प्रतिशत में निकालिए, और दिखाइए कि एक कुल संख्या कैसे किसी कमी को छिपा सकती है।",
    "ప్రతి సమూహానికి కచ్చితత్వాన్ని శాతంలో లెక్కించండి, ఒకే మొత్తం సంఖ్య ఒక లోటును ఎలా దాచగలదో చూపించండి.")
add("obj.o3", "Suggest a fair fix: add the missing examples and test each group, instead of adding more of the same.",
    "एक सही उपाय सुझाइए: छूटे हुए उदाहरण जोड़िए और हर समूह को अलग से जाँचिए, न कि वैसे ही और उदाहरण जोड़िए।",
    "న్యాయమైన పరిష్కారం సూచించండి: అవే రకం ఉదాహరణలు ఇంకా కలపడం కాదు, లేని ఉదాహరణలు కలిపి ప్రతి సమూహాన్నీ విడిగా పరీక్షించండి.")

# ---------- b1 hook ----------
add("hook.text",
    "Imagine a machine at a post office. It reads the handwritten numbers on letters. Its makers tested it on 100 numbers, and it read 97 correctly. That is its <term-accuracy>accuracy</term-accuracy>: 97 out of 100, or 97 <term-percentage>percent</term-percentage> (97%).",
    "सोचिए, डाकघर में एक मशीन है। वह चिट्ठियों पर हाथ से लिखे नंबर पढ़ती है। बनाने वालों ने उसे 100 नंबरों पर जाँचा, और उसने 97 सही पढ़े। यही उसकी <term-accuracy>सटीकता</term-accuracy> है: 100 में से 97, यानी 97 <term-percentage>प्रतिशत</term-percentage> (97%)।",
    "ఒక పోస్టాఫీసులో ఒక యంత్రం ఉందనుకోండి. అది ఉత్తరాల మీద చేతితో రాసిన అంకెలను చదువుతుంది. దాన్ని తయారు చేసినవాళ్లు 100 అంకెలపై పరీక్షించారు, అది 97 సరిగ్గా చదివింది. అదే దాని <term-accuracy>కచ్చితత్వం</term-accuracy>: 100లో 97, అంటే 97 <term-percentage>శాతం</term-percentage> (97%).")
add("hook.q",
    "Yet letters from some writers kept going to the wrong town. The machine was not broken. So what went wrong?",
    "फिर भी कुछ लोगों की चिट्ठियाँ बार-बार ग़लत शहर पहुँच रही थीं। मशीन ख़राब नहीं थी। तो गड़बड़ कहाँ हुई?",
    "అయినా కొందరు రాసిన ఉత్తరాలు మళ్లీ మళ్లీ తప్పు ఊరికి వెళ్తున్నాయి. యంత్రం పాడవలేదు. మరి తప్పు ఎక్కడ జరిగింది?")

# ---------- b2 predict ----------
add("predict.prompt",
    "Here is a clue. The machine was trained on a <term-dataset>dataset</term-dataset>: a collection of examples to learn from. Every example came from one school. Everyone there writes 1 and 7 the same way. Now it reads numbers from writers everywhere. What do you expect?",
    "एक सुराग लीजिए। मशीन को एक <term-dataset>डेटासेट</term-dataset> पर ट्रेन किया गया था: उदाहरणों का एक संग्रह, जिनसे वह सीखती है। सारे उदाहरण एक ही स्कूल से आए थे। वहाँ सब लोग 1 और 7 एक ही तरह लिखते हैं। अब मशीन हर जगह के लोगों के लिखे नंबर पढ़ती है। आपको क्या लगता है?",
    "ఒక ఆధారం చూడండి. యంత్రానికి ఒక <term-dataset>డేటాసెట్</term-dataset> మీద ట్రైనింగ్ ఇచ్చారు: అది నేర్చుకునే ఉదాహరణల సమూహం. ఉదాహరణలన్నీ ఒకే బడి నుండి వచ్చాయి. అక్కడ అందరూ 1, 7లను ఒకే విధంగా రాస్తారు. ఇప్పుడు యంత్రం అన్ని ప్రాంతాల వాళ్లు రాసిన అంకెలను చదువుతుంది. ఏం జరుగుతుందని మీరు అనుకుంటున్నారు?")
add("predict.c1", "It reads everyone's numbers well. It has been trained, after all.",
    "यह सबके नंबर अच्छी तरह पढ़ेगी। आख़िर इसे ट्रेन किया गया है।",
    "ఇది అందరి అంకెలనూ బాగా చదువుతుంది. దీనికి ట్రైనింగ్ ఇచ్చారు కదా.")
add("predict.c2", "It makes more mistakes for writers whose style is unlike the school's.",
    "जिन लोगों का लिखने का ढंग उस स्कूल से अलग है, उनके नंबरों में यह ज़्यादा ग़लतियाँ करेगी।",
    "రాసే విధానం ఆ బడి వాళ్లకు భిన్నంగా ఉన్నవారి అంకెలలో ఇది ఎక్కువ తప్పులు చేస్తుంది.")
add("predict.c3", "It makes a few mistakes at random, the same for everyone.",
    "यह कुछ ग़लतियाँ यूँ ही करेगी, सबके लिए बराबर।",
    "ఇది అక్కడక్కడా కొన్ని తప్పులు చేస్తుంది, అందరికీ సమానంగా.")
add("predict.f1", "Training helps with things like the examples. Let's see what happens with things unlike them.",
    "ट्रेनिंग उन चीज़ों में मदद करती है जो उदाहरणों जैसी हों। चलिए देखें, जो उनसे अलग हैं उनका क्या होता है।",
    "ఉదాహరణల లాంటి వాటికి ట్రైనింగ్ సహాయపడుతుంది. వాటికి భిన్నంగా ఉన్నవాటికి ఏమవుతుందో చూద్దాం.")
add("predict.f3", "A fair guess: every machine makes some mistakes. Let's see whether they fall evenly on everyone.",
    "अच्छा अनुमान है: हर मशीन कुछ ग़लतियाँ करती है। चलिए देखें, क्या वे सब पर बराबर पड़ती हैं।",
    "మంచి ఊహ: ప్రతి యంత్రం కొన్ని తప్పులు చేస్తుంది. అవి అందరిపై సమానంగా పడతాయో లేదో చూద్దాం.")
add("predict.reveal", "Let's find out. You will train the machine yourself, on the school's examples.",
    "चलिए पता करें। आप ख़ुद स्कूल के उदाहरणों पर मशीन को ट्रेन करेंगे।",
    "తెలుసుకుందాం. బడి ఉదాహరణలపై యంత్రానికి మీరే ట్రైనింగ్ ఇస్తారు.")

# ---------- shared by b3 and b5 ----------
add("g.one", "Number 1", "नंबर 1", "అంకె 1")
add("g.seven", "Number 7", "नंबर 7", "అంకె 7")
add("f.top", "Length of top line (0 to 10)", "ऊपर की लकीर की लंबाई (0 से 10)", "పై గీత పొడవు (0 నుండి 10)")
add("f.mid", "Length of middle line (0 to 10)", "बीच की लकीर की लंबाई (0 से 10)", "మధ్య గీత పొడవు (0 నుండి 10)")
add("t.p", "Writer P: a straight line with a tiny tick at the top (meant 1)",
    "व्यक्ति P: ऊपर छोटे-से निशान वाली सीधी लकीर (मतलब 1)",
    "వ్యక్తి P: పైన చిన్న వంపు ఉన్న నిలువు గీత (ఉద్దేశం 1)")
add("t.q", "Writer Q: a long top line, then a line down (meant 7)",
    "व्यक्ति Q: ऊपर लंबी लकीर, फिर नीचे की ओर लकीर (मतलब 7)",
    "వ్యక్తి Q: పైన పొడవాటి గీత, తర్వాత కిందికి గీత (ఉద్దేశం 7)")
add("t.r", "Writer R: a line down with a long sloping flag at the top (meant 1)",
    "व्यक्ति R: नीचे की ओर लकीर, ऊपर लंबी तिरछी झंडी के साथ (मतलब 1)",
    "వ్యక్తి R: కిందికి గీత, పైన పొడవాటి వాలు జెండాతో (ఉద్దేశం 1)")
add("t.s", "Writer S: a long top line, a line down, and a line across the middle (meant 7)",
    "व्यक्ति S: ऊपर लंबी लकीर, नीचे की ओर लकीर, और बीच में आड़ी लकीर (मतलब 7)",
    "వ్యక్తి S: పైన పొడవాటి గీత, కిందికి గీత, మధ్యలో అడ్డ గీత (ఉద్దేశం 7)")

# ---------- b3 train on the skewed dataset ----------
add("tc1.prompt",
    "These are the school's 6 example cards. Each card says how the number was drawn and what the writer meant. Give each card its <term-label>label</term-label>, the number the writer meant. Then press “Train the machine” and see how it reads 4 new writers.",
    "ये स्कूल के 6 उदाहरण कार्ड हैं। हर कार्ड बताता है कि नंबर कैसे बना था और लिखने वाले का मतलब क्या था। हर कार्ड को उसका <term-label>लेबल</term-label> दीजिए, यानी वह नंबर जो लिखने वाले का मतलब था। फिर “मशीन को सिखाएँ” दबाइए और देखिए कि वह 4 नए लोगों के नंबर कैसे पढ़ती है।",
    "ఇవి బడికి చెందిన 6 ఉదాహరణ కార్డులు. ప్రతి కార్డు ఆ అంకెను ఎలా రాశారో, రాసినవారి ఉద్దేశం ఏమిటో చెబుతుంది. ప్రతి కార్డుకు దాని <term-label>లేబుల్</term-label> ఇవ్వండి, అంటే రాసినవారు ఉద్దేశించిన అంకె. తర్వాత “యంత్రానికి నేర్పండి” నొక్కి, అది 4 కొత్త వ్యక్తుల అంకెలను ఎలా చదువుతుందో చూడండి.")
SCHOOL = [("s1", "plain"), ("s2", "seven"), ("s3", "tick"), ("s4", "seven"), ("s5", "plain"), ("s6", "seven")]
DESC = {
    "plain": ("a plain straight line (meant 1)", "एक सादी सीधी लकीर (मतलब 1)", "ఒక సాదా నిలువు గీత (ఉద్దేశం 1)"),
    "tick": ("a straight line with a tiny tick at the top (meant 1)", "ऊपर छोटे-से निशान वाली सीधी लकीर (मतलब 1)", "పైన చిన్న వంపు ఉన్న నిలువు గీత (ఉద్దేశం 1)"),
    "seven": ("a long top line, then a line down (meant 7)", "ऊपर लंबी लकीर, फिर नीचे की ओर लकीर (मतलब 7)", "పైన పొడవాటి గీత, తర్వాత కిందికి గీత (ఉద్దేశం 7)"),
    "flag": ("a line down with a long sloping flag at the top (meant 1)", "नीचे की ओर लकीर, ऊपर लंबी तिरछी झंडी के साथ (मतलब 1)", "కిందికి గీత, పైన పొడవాటి వాలు జెండాతో (ఉద్దేశం 1)"),
    "flag2": ("a line down with a shorter sloping flag at the top (meant 1)", "नीचे की ओर लकीर, ऊपर थोड़ी छोटी तिरछी झंडी के साथ (मतलब 1)", "కిందికి గీత, పైన కొంచెం చిన్న వాలు జెండాతో (ఉద్దేశం 1)"),
    "cross": ("a long top line, a line down, and a line across the middle (meant 7)", "ऊपर लंबी लकीर, नीचे की ओर लकीर, और बीच में आड़ी लकीर (मतलब 7)", "పైన పొడవాటి గీత, కిందికి గీత, మధ్యలో అడ్డ గీత (ఉద్దేశం 7)"),
}
for i, (cid, kind) in enumerate(SCHOOL, start=1):
    en, hi, te = DESC[kind]
    add(f"sk.{cid}", f"School card {i}: {en}", f"स्कूल कार्ड {i}: {hi}", f"బడి కార్డు {i}: {te}")
add("tc1.explain",
    "If you labelled each card as its writer meant, look at Writer R. The machine said 7, and all 3 of its closest cards agreed. To the machine, R's long flag is a lot like a 7's top line. No card in its data was a flag-style 1. Writer R's 1 is not wrong. It is a different, correct way to write 1.",
    "अगर आपने हर कार्ड को लिखने वाले के मतलब के हिसाब से लेबल किया, तो व्यक्ति R को देखिए। मशीन ने 7 कहा, और उसके सबसे पास के तीनों कार्ड सहमत थे। मशीन के लिए R की लंबी झंडी, 7 की ऊपरी लकीर जैसी है। उसके डेटा में झंडी वाला 1 एक भी नहीं था। R का 1 ग़लत नहीं है। यह 1 लिखने का एक अलग, सही तरीका है।",
    "మీరు ప్రతి కార్డుకు రాసినవారి ఉద్దేశం ప్రకారం లేబుల్ ఇస్తే, వ్యక్తి R ను చూడండి. యంత్రం 7 అంది, దానికి అత్యంత దగ్గరి 3 కార్డులూ అదే చెప్పాయి. యంత్రానికి R పొడవాటి జెండా, 7 పై గీతలాగే ఉంది. దాని డేటాలో జెండా ఉన్న 1 ఒక్కటి కూడా లేదు. R రాసిన 1 తప్పు కాదు. అది 1ని రాసే మరో సరైన విధానం.")

# ---------- b4 check: percentages per group ----------
add("pc.prompt",
    "Count the results. Writers P and Q use the school's style: 2 of 2 read correctly, which is 100%. Writers R and S use another style: 1 of 2 read correctly. What percentage is 1 of 2?",
    "नतीजे गिनिए। व्यक्ति P और Q स्कूल वाले ढंग से लिखते हैं: 2 में से 2 सही पढ़े गए, यानी 100%। व्यक्ति R और S दूसरे ढंग से लिखते हैं: 2 में से 1 सही पढ़ा गया। 2 में से 1 कितने प्रतिशत है?",
    "ఫలితాలు లెక్కపెట్టండి. వ్యక్తులు P, Q బడి విధానంలో రాస్తారు: 2లో 2 సరిగ్గా చదివింది, అంటే 100%. వ్యక్తులు R, S వేరే విధానంలో రాస్తారు: 2లో 1 సరిగ్గా చదివింది. 2లో 1 అంటే ఎంత శాతం?")
add("pc.a", "50%", "50%", "50%")
add("pc.b", "75%", "75%", "75%")
add("pc.c", "12%", "12%", "12%")
add("pc.fb", "75% is for all 4 writers together: 3 of 4. Count only R and S: 1 right out of 2.",
    "75% चारों लोगों को मिलाकर है: 4 में से 3। सिर्फ़ R और S को गिनिए: 2 में से 1 सही।",
    "75% నలుగురినీ కలిపితే వచ్చేది: 4లో 3. R, S లను మాత్రమే లెక్కించండి: 2లో 1 సరైనది.")
add("pc.fc", "12 puts the digits 1 and 2 side by side. Try this instead: how many out of 100 is the same as 1 out of 2?",
    "12 में 1 और 2 के अंक पास-पास रख दिए गए हैं। ऐसे सोचिए: 100 में से कितने, 2 में से 1 के बराबर हैं?",
    "12 అంటే 1, 2 అంకెలను పక్కపక్కన పెట్టడం. ఇలా ఆలోచించండి: 2లో 1 అంటే 100లో ఎన్నికి సమానం?")
add("pc.h1", "Percent means “out of 100”.",
    "प्रतिशत का मतलब है “100 में से”।",
    "శాతం అంటే “100లో”.")
add("pc.h2", "Make the 2 into 100: 2 × 50 = 100. Do the same to the 1: 1 × 50 = 50. (“×” means “times”.)",
    "2 को 100 बनाइए: 2 × 50 = 100। 1 के साथ भी यही कीजिए: 1 × 50 = 50। (“×” का मतलब “गुणा”।)",
    "2ని 100 చేయండి: 2 × 50 = 100. 1కి కూడా అదే చేయండి: 1 × 50 = 50. (“×” అంటే “గుణించు”.)")
add("pc.explain",
    "1 of 2 is 50 of 100, so 50%. All 4 writers together give 3 of 4, which is 75%. That one number hides the gap: 100% for one style, 50% for the other.",
    "2 में से 1 यानी 100 में से 50, इसलिए 50%। चारों लोगों को मिलाकर 4 में से 3 आता है, यानी 75%। वह एक संख्या इस कमी को छिपा लेती है: एक ढंग के लिए 100%, दूसरे के लिए 50%।",
    "2లో 1 అంటే 100లో 50, కాబట్టి 50%. నలుగురినీ కలిపితే 4లో 3, అంటే 75%. ఆ ఒక్క సంఖ్య ఈ లోటును దాచేస్తుంది: ఒక విధానానికి 100%, మరో విధానానికి 50%.")

# ---------- b5 train on the fixed dataset ----------
add("tc2.prompt",
    "Now change only the data. Writers from many places sent in cards. This new dataset has 8 cards, 2 for each of the four styles. Label them, train the machine, and test it on the same 4 writers.",
    "अब सिर्फ़ डेटा बदलिए। कई जगहों के लोगों ने कार्ड भेजे। इस नए डेटासेट में 8 कार्ड हैं, चारों ढंगों के 2-2 कार्ड। इन पर लेबल लगाइए, मशीन को ट्रेन कीजिए, और उन्हीं 4 लोगों पर जाँचिए।",
    "ఇప్పుడు డేటాను మాత్రమే మార్చండి. చాలా ప్రాంతాల వాళ్లు కార్డులు పంపారు. ఈ కొత్త డేటాసెట్‌లో 8 కార్డులు ఉన్నాయి, నాలుగు విధానాలకు 2 చొప్పున. వాటికి లేబుల్ ఇచ్చి, యంత్రానికి ట్రైనింగ్ ఇచ్చి, అవే 4 వ్యక్తులపై పరీక్షించండి.")
FIXED = [("c1", "plain"), ("c2", "seven"), ("c3", "flag"), ("c4", "cross"), ("c5", "tick"), ("c6", "seven"), ("c7", "flag2"), ("c8", "cross")]
for i, (cid, kind) in enumerate(FIXED, start=1):
    en, hi, te = DESC[kind]
    add(f"fx.{cid}", f"Card {i}: {en}", f"कार्ड {i}: {hi}", f"కార్డు {i}: {te}")
add("tc2.explain",
    "Did you label each card as its writer meant? Then all 4 writers are now read correctly: 4 of 4, which is 100%. Writer R's 2 closest cards are now flag-style 1s. The machine's method did not change. Only the dataset did.",
    "क्या आपने हर कार्ड को लिखने वाले के मतलब के हिसाब से लेबल किया? तो अब चारों लोगों के नंबर सही पढ़े गए: 4 में से 4, यानी 100%। अब R के सबसे पास वाले 2 कार्ड झंडी वाले 1 हैं। मशीन का तरीका नहीं बदला। सिर्फ़ डेटासेट बदला।",
    "మీరు ప్రతి కార్డుకు రాసినవారి ఉద్దేశం ప్రకారం లేబుల్ ఇచ్చారా? అయితే ఇప్పుడు నలుగురి అంకెలూ సరిగ్గా చదివింది: 4లో 4, అంటే 100%. ఇప్పుడు R కి అత్యంత దగ్గరి 2 కార్డులు జెండా ఉన్న 1లు. యంత్రం పద్ధతి మారలేదు. డేటాసెట్ మాత్రమే మారింది.")

# ---------- b6 naming ----------
add("ex.text",
    "What you saw has names. The school's 6 cards were a <term-sample>sample</term-sample>: a small part picked to stand for a bigger group. But this sample left out a whole style of writing.",
    "आपने जो देखा, उसके नाम हैं। स्कूल के 6 कार्ड एक <term-sample>नमूना</term-sample> थे: किसी बड़े समूह की जगह चुना गया एक छोटा हिस्सा। पर इस नमूने में लिखने का एक पूरा ढंग छूट गया था।",
    "మీరు చూసినదానికి పేర్లు ఉన్నాయి. బడి 6 కార్డులు ఒక <term-sample>శాంపిల్</term-sample>: ఒక పెద్ద సమూహానికి ప్రతినిధిగా ఎంచుకున్న చిన్న భాగం. కానీ ఈ శాంపిల్‌లో రాసే ఒక విధానం పూర్తిగా లేదు.")
add("ex.s1",
    "Some datasets leave out some kinds of people or things, or have very few of them. A machine trained on such data tends to work worse for those kinds. This is called <term-bias>bias</term-bias> in the data.",
    "जब किसी डेटासेट में कुछ तरह के लोग या चीज़ें छूट जाती हैं, या बहुत कम होती हैं, तो मशीन अक्सर उनके लिए ख़राब काम करती है। इसे डेटा में <term-bias>बायस</term-bias> कहते हैं।",
    "ఒక డేటాసెట్‌లో కొన్ని రకాల మనుషులు లేదా వస్తువులు లేకపోతే, లేదా చాలా తక్కువగా ఉంటే, యంత్రం సాధారణంగా వారి విషయంలో సరిగా పనిచేయదు. దీన్ని డేటాలో <term-bias>బయాస్</term-bias> అంటారు.")
add("ex.s2",
    "Bias does not need anyone to mean harm. It can come from which examples were collected, and which were missed.",
    "बायस के लिए किसी का बुरा इरादा होना ज़रूरी नहीं। यह इससे भी आ सकता है कि कौन-से उदाहरण इकट्ठे किए गए, और कौन-से छूट गए।",
    "బయాస్ రావడానికి ఎవరికీ చెడు ఉద్దేశం ఉండనక్కర్లేదు. ఏ ఉదాహరణలు సేకరించారు, ఏవి వదిలేశారు అనే దాని నుండి కూడా అది రావచ్చు.")

# ---------- b7 analogy: the cook ----------
add("an1.title", "A cook who learned one family's recipes",
    "एक रसोइया जिसने एक ही परिवार के व्यंजन सीखे",
    "ఒకే కుటుంబం వంటకాలు నేర్చుకున్న వంటమనిషి")
add("an1.source",
    "A cook learned every dish from one family's recipe book. Ask for a dish from that book, and it comes out well. Ask for a dish from another home, and the cook makes the closest dish they know.",
    "एक रसोइये ने हर पकवान एक ही परिवार की रेसिपी की किताब से सीखा। उस किताब का कोई पकवान माँगिए, तो वह अच्छा बनता है। किसी दूसरे घर का पकवान माँगिए, तो रसोइया अपना जाना-पहचाना सबसे मिलता-जुलता पकवान बना देता है।",
    "ఒక వంటమనిషి ప్రతి వంటకాన్నీ ఒకే కుటుంబం వంటల పుస్తకం నుండి నేర్చుకున్నారు. ఆ పుస్తకంలోని వంటకం అడిగితే, బాగా వస్తుంది. వేరే ఇంటి వంటకం అడిగితే, తమకు తెలిసిన వాటిలో దానికి దగ్గరగా ఉండే వంటకం చేస్తారు.")
add("an1.m1s", "The one family's recipe book", "एक परिवार की रेसिपी की किताब", "ఒక కుటుంబం వంటల పుస్తకం")
add("an1.m1t", "The dataset from one school", "एक स्कूल का डेटासेट", "ఒకే బడి నుండి వచ్చిన డేటాసెట్")
add("an1.m2s", "Dishes from other homes, never in the book", "दूसरे घरों के पकवान, जो किताब में कभी थे ही नहीं", "పుస్తకంలో ఎప్పుడూ లేని ఇతర ఇళ్ల వంటకాలు")
add("an1.m2t", "Writing styles missing from the dataset", "लिखने के वे ढंग जो डेटासेट में नहीं हैं", "డేటాసెట్‌లో లేని రాత విధానాలు")
add("an1.m3s", "Making the closest dish the cook knows", "रसोइये का अपना सबसे मिलता-जुलता पकवान बना देना", "వంటమనిషికి తెలిసిన వాటిలో దగ్గరి వంటకం చేయడం")
add("an1.m3t", "Copying the label of the closest cards", "सबसे पास वाले कार्डों का लेबल लगा देना", "అత్యంత దగ్గరి కార్డుల లేబుల్‌నే పెట్టడం")
add("an1.m4s", "Learning recipes from many homes", "कई घरों की रेसिपी सीखना", "చాలా ఇళ్ల వంటకాలు నేర్చుకోవడం")
add("an1.m4t", "Adding the missing styles to the dataset", "छूटे हुए ढंगों को डेटासेट में जोड़ना", "లేని విధానాలను డేటాసెట్‌లో కలపడం")
add("an1.break",
    "Here the comparison stops working. A cook can taste the dish and notice that it is new to them. The machine has no way to notice its own gap. It gives an answer anyway, and its closest cards can all agree, as they did for Writer R.",
    "यहाँ यह तुलना काम करना बंद कर देती है। रसोइया पकवान चखकर समझ सकता है कि यह उसके लिए नया है। मशीन के पास अपनी कमी पहचानने का कोई तरीका नहीं है। वह फिर भी जवाब दे देती है, और उसके सबसे पास के सारे कार्ड सहमत भी हो सकते हैं, जैसे व्यक्ति R के लिए हुए।",
    "ఇక్కడ ఈ పోలిక పనిచేయడం ఆగిపోతుంది. వంటమనిషి రుచి చూసి, ఇది తనకు కొత్త అని గమనించగలరు. యంత్రానికి తన లోటును గమనించే మార్గమే లేదు. అయినా అది జవాబు ఇస్తుంది, దాని దగ్గరి కార్డులన్నీ ఏకీభవించవచ్చు కూడా, వ్యక్తి R విషయంలో జరిగినట్టు.")
add("an1.f1", "Cook: one family's recipes → the closest dish they know → a wrong dish for other homes. (“→” means “leads to”.)",
    "रसोइया: एक परिवार की रेसिपी → सबसे मिलता-जुलता जाना-पहचाना पकवान → दूसरे घरों के लिए ग़लत पकवान। (“→” का मतलब “नतीजा”।)",
    "వంటమనిషి: ఒక కుటుంబం వంటకాలు → తెలిసిన దగ్గరి వంటకం → ఇతర ఇళ్లకు తప్పు వంటకం. (“→” అంటే “దారి తీస్తుంది”.)")
add("an1.f2", "Machine: one school's cards → the label of the closest cards → a wrong number for other styles.",
    "मशीन: एक स्कूल के कार्ड → सबसे पास वाले कार्डों का लेबल → दूसरे ढंगों के लिए ग़लत नंबर।",
    "యంత్రం: ఒకే బడి కార్డులు → అత్యంత దగ్గరి కార్డుల లేబుల్ → ఇతర విధానాలకు తప్పు అంకె.")
add("an1.f3", "Any dataset missing some kinds of examples → more mistakes for those kinds → bias in the data.",
    "कोई भी डेटासेट जिसमें कुछ तरह के उदाहरण नहीं हैं → उन्हीं के लिए ज़्यादा ग़लतियाँ → डेटा में बायस।",
    "కొన్ని రకాల ఉదాహరణలు లేని ఏ డేటాసెట్ అయినా → ఆ రకాలకే ఎక్కువ తప్పులు → డేటాలో బయాస్.")

# ---------- b8 analogy: one rainy week ----------
add("an2.title", "Judging the weather from one rainy week",
    "एक बरसाती हफ़्ते से मौसम का अंदाज़ा",
    "ఒక వర్షపు వారం చూసి వాతావరణాన్ని అంచనా వేయడం")
add("an2.source",
    "You visit a town for one week, and it rains every day. Back home, you tell everyone that it always rains there. Your week was a sample of the whole year, and a lopsided one.",
    "आप एक शहर में एक हफ़्ते के लिए जाते हैं, और हर दिन बारिश होती है। घर लौटकर आप सबसे कहते हैं कि वहाँ तो हमेशा बारिश होती है। आपका हफ़्ता पूरे साल का एक नमूना था, और वह भी एकतरफ़ा।",
    "మీరు ఒక ఊరికి ఒక వారం వెళ్తారు, ప్రతి రోజూ వర్షం పడుతుంది. ఇంటికి వచ్చి, అక్కడ ఎప్పుడూ వర్షమే అని అందరికీ చెబుతారు. మీ వారం ఏడాది మొత్తానికి ఒక శాంపిల్, అది కూడా ఒక వైపే మొగ్గిన శాంపిల్.")
add("an2.m1s", "Your one rainy week", "आपका वह एक बरसाती हफ़्ता", "మీరు చూసిన ఒక్క వర్షపు వారం")
add("an2.m1t", "The school's 6 cards", "स्कूल के 6 कार्ड", "బడి 6 కార్డులు")
add("an2.m2s", "The whole year, with dry and cold months too", "पूरा साल, जिसमें सूखे और ठंडे महीने भी हैं", "పొడి నెలలు, చలి నెలలతో కలిపి ఏడాది మొత్తం")
add("an2.m2t", "All the writers whose letters the machine will read", "वे सभी लोग जिनकी चिट्ठियाँ मशीन पढ़ेगी", "యంత్రం చదవబోయే ఉత్తరాలు రాసే వాళ్లందరూ")
add("an2.m3s", "“It always rains there.”", "“वहाँ हमेशा बारिश होती है।”", "“అక్కడ ఎప్పుడూ వర్షమే.”")
add("an2.m3t", "The machine reading every long flag as part of a 7", "मशीन का हर लंबी झंडी को 7 का हिस्सा मान लेना", "ప్రతి పొడవాటి జెండానూ యంత్రం 7లో భాగంగా చదవడం")
add("an2.m4s", "Visiting in every season", "हर मौसम में जाकर देखना", "ప్రతి కాలంలోనూ వెళ్లి చూడటం")
add("an2.m4t", "Collecting examples from every kind of writer, and testing each kind", "हर तरह के लिखने वालों से उदाहरण इकट्ठे करना, और हर तरह को जाँचना", "ప్రతి రకం రాసేవారి నుండి ఉదాహరణలు సేకరించడం, ప్రతి రకాన్నీ పరీక్షించడం")
add("an2.break",
    "Here this comparison stops working. You can remember that you stayed only one week. So you can say you are not sure about other months. The machine keeps no note of what its data left out. People have to check who is missing, by testing each group.",
    "यहाँ यह तुलना काम करना बंद कर देती है। आपको याद रह सकता है कि आप सिर्फ़ एक हफ़्ता रुके थे। इसलिए आप कह सकते हैं कि बाक़ी महीनों का आपको पक्का नहीं पता। मशीन के पास इसका कोई हिसाब नहीं होता कि उसके डेटा में क्या छूट गया। कौन छूटा है, यह लोगों को ही हर समूह को जाँचकर देखना होता है।",
    "ఇక్కడ ఈ పోలిక పనిచేయడం ఆగిపోతుంది. మీరు ఒక్క వారమే ఉన్నారని మీకు గుర్తుంటుంది. అందుకే మిగతా నెలల గురించి ఖచ్చితంగా తెలియదని చెప్పగలరు. తన డేటాలో ఏం లేదో యంత్రం దగ్గర ఎలాంటి లెక్కా ఉండదు. ఎవరు మిగిలిపోయారో మనుషులే ప్రతి సమూహాన్నీ పరీక్షించి చూడాలి.")
add("an2.f1", "One rainy week → “It always rains there.”",
    "एक बरसाती हफ़्ता → “वहाँ हमेशा बारिश होती है।”",
    "ఒక వర్షపు వారం → “అక్కడ ఎప్పుడూ వర్షమే.”")
add("an2.f2", "One school's cards → every long flag read as a 7.",
    "एक स्कूल के कार्ड → हर लंबी झंडी 7 पढ़ी गई।",
    "ఒకే బడి కార్డులు → ప్రతి పొడవాటి జెండా 7గా చదవబడింది.")
add("an2.f3", "A lopsided sample → a machine that works worse for the groups it left out.",
    "एकतरफ़ा नमूना → ऐसी मशीन जो छूटे हुए समूहों के लिए ख़राब काम करती है।",
    "ఒక వైపే మొగ్గిన శాంపిల్ → వదిలేసిన సమూహాల విషయంలో సరిగా పనిచేయని యంత్రం.")

# ---------- b9 deeper ----------
add("deep.text",
    "How did the first machine pick 7 for Writer R? R has top line 6 and middle line 0. School card 4 has 8 and 0. The top lines differ by 8 − 6 = 2, and the middle lines by 0. So they are 2 apart. The plain 1s are 5 or 6 apart from R. The three 7s are nearer, so their label wins. This method is called “nearest neighbours”. Real handwriting readers use many more numbers, many more examples and other methods. They can still do worse on writing unlike their data.",
    "पहली मशीन ने व्यक्ति R के लिए 7 क्यों चुना? R की ऊपरी लकीर 6 और बीच की लकीर 0 है। स्कूल कार्ड 4 के लिए ये 8 और 0 हैं। ऊपरी लकीरों में अंतर 8 − 6 = 2 है, और बीच की लकीरों में 0। इसलिए दोनों में दूरी 2 है। सादे 1 वाले कार्ड R से 5 या 6 दूर हैं। तीनों 7 ज़्यादा पास हैं, इसलिए उनका लेबल जीतता है। इस तरीके को “नियरेस्ट नेबर्स” (सबसे पास के पड़ोसी) कहते हैं। असली हैंडराइटिंग पढ़ने वाली मशीनें कहीं ज़्यादा संख्याएँ, कहीं ज़्यादा उदाहरण और दूसरे तरीके इस्तेमाल करती हैं। फिर भी, अपने डेटा से अलग लिखावट पर वे ख़राब कर सकती हैं।",
    "మొదటి యంత్రం వ్యక్తి R కి 7 ఎందుకు ఎంచుకుంది? R పై గీత 6, మధ్య గీత 0. బడి కార్డు 4కి ఇవి 8, 0. పై గీతల మధ్య తేడా 8 − 6 = 2, మధ్య గీతల మధ్య 0. కాబట్టి వాటి మధ్య దూరం 2. సాదా 1 కార్డులు R నుండి 5 లేదా 6 దూరంలో ఉన్నాయి. మూడు 7లు ఇంకా దగ్గరగా ఉన్నాయి, అందుకే వాటి లేబుల్ గెలుస్తుంది. ఈ పద్ధతిని “నియరెస్ట్ నైబర్స్” (దగ్గరి పొరుగులు) అంటారు. నిజమైన చేతిరాత చదివే యంత్రాలు ఇంకా ఎన్నో సంఖ్యలు, ఎన్నో ఉదాహరణలు, వేరే పద్ధతులు వాడతాయి. అయినా తమ డేటాకు భిన్నమైన రాతపై అవి తప్పులు చేయవచ్చు.")

# ---------- b10 check: why ----------
add("mc.prompt", "Why did the first machine read Writer R's 1 as a 7, with all 3 closest cards agreeing?",
    "पहली मशीन ने व्यक्ति R के 1 को 7 क्यों पढ़ा, और वह भी तब जब सबसे पास के तीनों कार्ड सहमत थे?",
    "మొదటి యంత్రం వ్యక్తి R రాసిన 1ని 7గా ఎందుకు చదివింది, అదీ దగ్గరి 3 కార్డులూ ఏకీభవిస్తూ?")
add("mc.o1", "Its 3 closest cards were all 7s. No card in its data looked like a flag-style 1.",
    "उसके सबसे पास के तीनों कार्ड 7 थे। उसके डेटा में कोई कार्ड झंडी वाले 1 जैसा नहीं था।",
    "దానికి దగ్గరి 3 కార్డులూ 7లే. దాని డేటాలో ఏ కార్డూ జెండా ఉన్న 1 లాగా లేదు.")
add("mc.o2", "It judged that the flag style is a wrong way to write 1.",
    "उसने तय किया कि झंडी वाला ढंग 1 लिखने का ग़लत तरीका है।",
    "జెండా విధానం 1ని రాసే తప్పు పద్ధతి అని అది తీర్పు ఇచ్చింది.")
add("mc.o3", "It was tired after reading so many numbers.",
    "इतने सारे नंबर पढ़कर वह थक गई थी।",
    "అన్ని అంకెలు చదివి అది అలసిపోయింది.")
add("mc.f2", "The machine makes no judgement about writers. It compares numbers and copies the label of the closest cards.",
    "मशीन लिखने वालों के बारे में कोई राय नहीं बनाती। वह संख्याओं की तुलना करती है और सबसे पास वाले कार्डों का लेबल लगा देती है।",
    "యంత్రం రాసేవారి గురించి ఏ అభిప్రాయమూ ఏర్పరచుకోదు. అది సంఖ్యలను పోల్చి, దగ్గరి కార్డుల లేబుల్‌నే పెడుతుంది.")
add("mc.f3", "A machine does not get tired. Give it the same numbers and it gives the same answer every time.",
    "मशीन थकती नहीं। उसे वही संख्याएँ दीजिए, तो वह हर बार वही जवाब देगी।",
    "యంత్రం అలసిపోదు. అవే సంఖ్యలు ఇస్తే, ప్రతిసారీ అదే జవాబు ఇస్తుంది.")
add("mc.explain", "All 3 closest cards agreeing only means they had the same label. It does not mean the answer was right.",
    "सबसे पास के तीनों कार्डों के सहमत होने का मतलब सिर्फ़ इतना है कि उनका लेबल एक था। इसका मतलब यह नहीं कि जवाब सही था।",
    "దగ్గరి 3 కార్డులూ ఏకీభవించడం అంటే వాటి లేబుల్ ఒకటే అని అర్థం. జవాబు సరైనదని అర్థం కాదు.")

# ---------- b11 check: the hidden 0% ----------
add("hs.prompt",
    "Back to the post office. Say the makers' 100 test numbers were 97 school-style and 3 flag-style. All 97 school-style ones were read correctly. All 3 flag-style ones were read wrongly. What was the accuracy for flag-style writers?",
    "फिर से डाकघर चलें। मान लीजिए बनाने वालों के 100 जाँच वाले नंबरों में 97 स्कूल वाले ढंग के थे और 3 झंडी वाले ढंग के। स्कूल वाले ढंग के सभी 97 सही पढ़े गए। झंडी वाले ढंग के तीनों ग़लत पढ़े गए। झंडी वाले ढंग से लिखने वालों के लिए सटीकता कितनी थी?",
    "మళ్లీ పోస్టాఫీసుకు వద్దాం. తయారీదారుల 100 పరీక్ష అంకెలలో 97 బడి విధానంలో, 3 జెండా విధానంలో ఉన్నాయనుకోండి. బడి విధానంలోని 97 అన్నీ సరిగ్గా చదివింది. జెండా విధానంలోని 3 అన్నీ తప్పుగా చదివింది. జెండా విధానంలో రాసేవారికి కచ్చితత్వం ఎంత?")
add("hs.a", "0%", "0%", "0%")
add("hs.b", "97%", "97%", "97%")
add("hs.c", "3%", "3%", "3%")
add("hs.fb", "97% is for all 100 numbers together. Look only at the 3 flag-style numbers. How many of them were right?",
    "97% सभी 100 नंबरों को मिलाकर है। सिर्फ़ झंडी वाले 3 नंबरों को देखिए। उनमें से कितने सही थे?",
    "97% అంటే 100 అంకెలనూ కలిపి. జెండా విధానంలోని 3 అంకెలను మాత్రమే చూడండి. వాటిలో ఎన్ని సరైనవి?")
add("hs.fc", "3 is how many flag-style numbers there were. How many of those 3 were read correctly?",
    "3 तो झंडी वाले नंबरों की गिनती है। उन 3 में से कितने सही पढ़े गए?",
    "3 అంటే జెండా విధానంలోని అంకెల సంఖ్య. ఆ 3లో ఎన్ని సరిగ్గా చదివింది?")
add("hs.h1", "Count only the flag-style numbers. There are 3.",
    "सिर्फ़ झंडी वाले नंबर गिनिए। वे 3 हैं।",
    "జెండా విధానంలోని అంకెలను మాత్రమే లెక్కించండి. అవి 3.")
add("hs.h2", "0 right out of 3 means none of them. None out of 100 is 0%.",
    "3 में से 0 सही का मतलब है एक भी नहीं। 100 में से एक भी नहीं, यानी 0%।",
    "3లో 0 సరైనవి అంటే ఒక్కటి కూడా కాదు. 100లో ఒక్కటీ కాదు అంటే 0%.")
add("hs.explain",
    "0 of 3 is 0%. The overall 97% looked great because the test had so few flag-style numbers. A fair test checks each group of writers on its own, with enough examples from each.",
    "3 में से 0 यानी 0%। कुल 97% इसलिए अच्छा दिखा क्योंकि जाँच में झंडी वाले नंबर बहुत कम थे। सही जाँच हर समूह को अलग से परखती है, हर समूह के काफ़ी उदाहरणों के साथ।",
    "3లో 0 అంటే 0%. పరీక్షలో జెండా విధానం అంకెలు చాలా తక్కువగా ఉన్నందుకే మొత్తం 97% బాగా కనిపించింది. న్యాయమైన పరీక్ష ప్రతి సమూహాన్నీ విడిగా, ప్రతి సమూహం నుండి తగినన్ని ఉదాహరణలతో పరీక్షిస్తుంది.")

# ---------- b12 break-it ----------
add("br.challenge",
    "The fixed machine read all 4 writers correctly. Can you still fool it? Try each new writer and see what it says.",
    "ठीक की गई मशीन ने चारों लोगों के नंबर सही पढ़े। क्या आप अब भी उसे चकमा दे सकते हैं? हर नए व्यक्ति को आज़माइए और देखिए वह क्या कहती है।",
    "సరిచేసిన యంత్రం నలుగురి అంకెలనూ సరిగ్గా చదివింది. ఇప్పటికీ మీరు దాన్ని మోసం చేయగలరా? ప్రతి కొత్త వ్యక్తినీ ప్రయత్నించి, అది ఏమంటుందో చూడండి.")
add("br.t1", "A left-handed student writes a plain 1, in the school's style.",
    "बाएँ हाथ से लिखने वाला एक विद्यार्थी स्कूल वाले ढंग से सादा 1 लिखता है।",
    "ఎడమ చేతితో రాసే ఒక విద్యార్థి బడి విధానంలో సాదా 1 రాస్తారు.")
add("br.r1", "It reads 1, and all 3 closest cards agree. The machine never sees who wrote a number. It sees only the two line lengths.",
    "यह 1 पढ़ती है, और सबसे पास के तीनों कार्ड सहमत हैं। मशीन कभी नहीं देखती कि नंबर किसने लिखा। वह सिर्फ़ दो लकीरों की लंबाई देखती है।",
    "ఇది 1 అని చదువుతుంది, దగ్గరి 3 కార్డులూ ఏకీభవిస్తాయి. అంకెను ఎవరు రాశారో యంత్రం ఎప్పుడూ చూడదు. రెండు గీతల పొడవులను మాత్రమే చూస్తుంది.")
add("br.t2", "Someone writes a 7 in a hurry, with a short top line (4) and no middle line.",
    "कोई जल्दी में 7 लिखता है, छोटी ऊपरी लकीर (4) के साथ और बीच की लकीर के बिना।",
    "ఎవరో తొందరగా 7 రాస్తారు, చిన్న పై గీత (4)తో, మధ్య గీత లేకుండా.")
add("br.r2", "It reads 1, and all 3 closest cards agree. That is wrong. No card in the data was a 7 with a short top.",
    "यह 1 पढ़ती है, और सबसे पास के तीनों कार्ड सहमत हैं। यह ग़लत है। डेटा में छोटी ऊपरी लकीर वाला 7 एक भी नहीं था।",
    "ఇది 1 అని చదువుతుంది, దగ్గరి 3 కార్డులూ ఏకీభవిస్తాయి. అది తప్పు. డేటాలో చిన్న పై గీత ఉన్న 7 ఒక్కటి కూడా లేదు.")
add("br.t3", "Someone writes a 4: no top line, and a long middle line (8).",
    "कोई 4 लिखता है: ऊपर कोई लकीर नहीं, और बीच में लंबी लकीर (8)।",
    "ఎవరో 4 రాస్తారు: పై గీత లేదు, మధ్యలో పొడవాటి గీత (8).")
add("br.r3", "It reads 1, with 2 of its 3 closest cards agreeing. It can only ever answer 1 or 7. It has no way to say “I have never seen this.”",
    "यह 1 पढ़ती है, और सबसे पास के 3 में से 2 कार्ड सहमत हैं। यह हमेशा 1 या 7 ही जवाब दे सकती है। इसके पास यह कहने का कोई तरीका नहीं कि “मैंने ऐसा पहले कभी नहीं देखा।”",
    "ఇది 1 అని చదువుతుంది, దగ్గరి 3 కార్డులలో 2 ఏకీభవిస్తాయి. ఇది ఎప్పుడూ 1 లేదా 7 అనే జవాబు ఇవ్వగలదు. “ఇలాంటిది నేను ఎప్పుడూ చూడలేదు” అని చెప్పే మార్గం దీనికి లేదు.")
add("br.t4", "A new writer's flag-style 1, with a shorter flag (5).",
    "एक नए व्यक्ति का झंडी वाला 1, थोड़ी छोटी झंडी (5) के साथ।",
    "ఒక కొత్త వ్యక్తి రాసిన జెండా ఉన్న 1, కొంచెం చిన్న జెండా (5)తో.")
add("br.r4", "It reads 1, with 2 of its 3 closest cards agreeing. Those 2 are flag-style 1s. That style is now in the data.",
    "यह 1 पढ़ती है, और सबसे पास के 3 में से 2 कार्ड सहमत हैं। वे 2 कार्ड झंडी वाले 1 हैं। अब यह ढंग डेटा में है।",
    "ఇది 1 అని చదువుతుంది, దగ్గరి 3 కార్డులలో 2 ఏకీభవిస్తాయి. ఆ 2 జెండా ఉన్న 1లు. ఇప్పుడు ఆ విధానం డేటాలో ఉంది.")
add("br.reflect", "What do the writers that fooled it have in common? Could the machine have warned you about them?",
    "जिन लोगों ने इसे चकमा दिया, उनमें क्या बात एक जैसी है? क्या मशीन आपको उनके बारे में पहले से चेता सकती थी?",
    "దాన్ని మోసం చేసినవారిలో ఉమ్మడిగా ఉన్నది ఏమిటి? యంత్రం వారి గురించి మిమ్మల్ని ముందే హెచ్చరించగలదా?")

# ---------- b13 check: more of the same ----------
add("md.prompt",
    "Someone suggests a fix for the first machine. “Add 1,000 more cards from the same school.” Will that help it read Writer R's flag-style 1?",
    "कोई पहली मशीन के लिए एक उपाय सुझाता है: “उसी स्कूल के 1,000 और कार्ड जोड़ दो।” क्या इससे वह व्यक्ति R का झंडी वाला 1 पढ़ पाएगी?",
    "మొదటి యంత్రానికి ఎవరో ఒక పరిష్కారం సూచిస్తారు: “అదే బడి నుండి ఇంకో 1,000 కార్డులు కలపండి.” దానివల్ల అది వ్యక్తి R జెండా ఉన్న 1ని చదవగలదా?")
add("md.a", "Yes. More data always makes a machine better.",
    "हाँ। ज़्यादा डेटा से मशीन हमेशा बेहतर होती है।",
    "అవును. ఎక్కువ డేటాతో యంత్రం ఎప్పుడూ మెరుగవుతుంది.")
add("md.b", "No. 1,000 more school cards still have no flag-style 1s.",
    "नहीं। स्कूल के 1,000 और कार्डों में भी झंडी वाला 1 नहीं होगा।",
    "లేదు. బడి నుండి వచ్చే ఇంకో 1,000 కార్డులలో కూడా జెండా ఉన్న 1లు ఉండవు.")
add("md.c", "Yes, if the machine is trained again for longer.",
    "हाँ, अगर मशीन को फिर से ज़्यादा देर तक ट्रेन किया जाए।",
    "అవును, యంత్రానికి మళ్లీ ఎక్కువసేపు ట్రైనింగ్ ఇస్తే.")
add("md.fa", "More data helps only if it includes what is missing. Here, the new cards would all look like the old ones.",
    "ज़्यादा डेटा तभी मदद करता है जब उसमें छूटी हुई चीज़ें हों। यहाँ नए कार्ड भी पुराने जैसे ही होंगे।",
    "లేనివి అందులో ఉంటేనే ఎక్కువ డేటా సహాయపడుతుంది. ఇక్కడ కొత్త కార్డులన్నీ పాత వాటిలాగే ఉంటాయి.")
add("md.fc", "For this machine, training again on the same kind of cards gives the same closest cards. Writer R's closest cards would still be 7s.",
    "इस मशीन के लिए, उसी तरह के कार्डों पर फिर से ट्रेन करने से सबसे पास वाले कार्ड वही रहते हैं। व्यक्ति R के सबसे पास वाले कार्ड तब भी 7 ही होंगे।",
    "ఈ యంత్రానికి, అదే రకం కార్డులపై మళ్లీ ట్రైనింగ్ ఇచ్చినా దగ్గరి కార్డులు అవే ఉంటాయి. వ్యక్తి R కి దగ్గరి కార్డులు అప్పుడు కూడా 7లే.")
add("md.explain", "The fix is not more data. It is the missing data: flag-style 1s, labelled with what their writers meant.",
    "उपाय ज़्यादा डेटा नहीं है। उपाय है छूटा हुआ डेटा: झंडी वाले 1, जिन पर उनके लिखने वालों के मतलब का लेबल लगा हो।",
    "పరిష్కారం ఎక్కువ డేటా కాదు. లేని డేటానే: జెండా ఉన్న 1లు, రాసినవారి ఉద్దేశం ప్రకారం లేబుల్‌తో.")

# ---------- b14 check: transfer to voices ----------
add("vt.prompt",
    "A new case. A voice app was trained mostly on recordings of adults. It often mishears children. Which change would help most?",
    "एक नया मामला। एक वॉइस ऐप को ज़्यादातर बड़ों की रिकॉर्डिंग पर ट्रेन किया गया। वह बच्चों की बात अक्सर ग़लत सुनता है। कौन-सा बदलाव सबसे ज़्यादा मदद करेगा?",
    "ఒక కొత్త సందర్భం. ఒక వాయిస్ యాప్‌కి ఎక్కువగా పెద్దవాళ్ల రికార్డింగ్‌లపై ట్రైనింగ్ ఇచ్చారు. అది పిల్లల మాటలను తరచుగా తప్పుగా వింటుంది. ఏ మార్పు ఎక్కువగా సహాయపడుతుంది?")
add("vt.a", "With permission, record many children speaking, label what they said, and add them to the dataset.",
    "अनुमति लेकर, बहुत-से बच्चों को बोलते हुए रिकॉर्ड करना, उन्होंने जो कहा उसका लेबल लगाना, और उन्हें डेटासेट में जोड़ना।",
    "అనుమతి తీసుకుని, చాలా మంది పిల్లలు మాట్లాడేది రికార్డు చేసి, వాళ్లు ఏమన్నారో లేబుల్ ఇచ్చి, డేటాసెట్‌లో కలపడం.")
add("vt.b", "Ask children to speak more like adults.",
    "बच्चों से कहना कि वे बड़ों की तरह बोलें।",
    "పిల్లలను పెద్దవాళ్లలాగా మాట్లాడమని చెప్పడం.")
add("vt.c", "Add many more recordings of adults.",
    "बड़ों की और बहुत-सी रिकॉर्डिंग जोड़ना।",
    "పెద్దవాళ్ల రికార్డింగ్‌లు ఇంకా చాలా కలపడం.")
add("vt.fb", "That asks people to change for the machine. The children speak correctly. The gap is in the data.",
    "इसमें लोगों से मशीन के लिए बदलने को कहा जा रहा है। बच्चे सही बोलते हैं। कमी डेटा में है।",
    "ఇది యంత్రం కోసం మనుషులను మారమని అడగడం. పిల్లలు సరిగ్గానే మాట్లాడతారు. లోటు డేటాలో ఉంది.")
add("vt.fc", "More of the same kind does not fill the gap. Which kind of voice is missing?",
    "उसी तरह की और चीज़ें जोड़ने से कमी नहीं भरती। कौन-सी आवाज़ें छूटी हुई हैं?",
    "అదే రకం ఇంకా కలిపితే లోటు పూడదు. ఏ రకం గొంతులు లేవు?")
add("vt.explain", "Add the missing voices to the dataset. Then test the app on children and adults, and check each group separately.",
    "छूटी हुई आवाज़ें डेटासेट में जोड़िए। फिर ऐप को बच्चों और बड़ों, दोनों पर जाँचिए, और हर समूह को अलग से परखिए।",
    "లేని గొంతులను డేటాసెట్‌లో కలపండి. తర్వాత యాప్‌ను పిల్లలు, పెద్దలు ఇద్దరిపైనా పరీక్షించి, ప్రతి సమూహాన్నీ విడిగా చూడండి.")

# ---------- b15 predict: who is responsible ----------
add("rs.prompt",
    "The post office machine misread some people's letters for months. Who should be responsible for fixing unfair data? Pick the answer closest to your view.",
    "डाकघर की मशीन महीनों तक कुछ लोगों की चिट्ठियाँ ग़लत पढ़ती रही। अनुचित डेटा को ठीक करने की ज़िम्मेदारी किसकी होनी चाहिए? वह जवाब चुनिए जो आपकी राय के सबसे क़रीब हो।",
    "పోస్టాఫీసు యంత్రం నెలల తరబడి కొందరి ఉత్తరాలను తప్పుగా చదివింది. అన్యాయమైన డేటాను సరిచేసే బాధ్యత ఎవరిది కావాలి? మీ అభిప్రాయానికి దగ్గరగా ఉన్న జవాబు ఎంచుకోండి.")
add("rs.c1", "The people who collected the examples", "जिन लोगों ने उदाहरण इकट्ठे किए", "ఉదాహరణలు సేకరించినవాళ్లు")
add("rs.c2", "The company that built and sold the machine", "वह कंपनी जिसने मशीन बनाई और बेची", "యంత్రాన్ని తయారు చేసి అమ్మిన కంపెనీ")
add("rs.c3", "The post office that chose to use it", "वह डाकघर जिसने इसे इस्तेमाल करना चुना", "దాన్ని వాడాలని ఎంచుకున్న పోస్టాఫీసు")
add("rs.c4", "The machine itself", "ख़ुद मशीन", "యంత్రమే")
add("rs.c5", "All the people who made, sold and use it, each for their part",
    "वे सभी लोग जिन्होंने इसे बनाया, बेचा और इस्तेमाल किया, हर कोई अपने हिस्से के लिए",
    "దాన్ని తయారు చేసినవాళ్లు, అమ్మినవాళ్లు, వాడేవాళ్లు అందరూ, ఎవరి భాగానికి వారు")
add("rs.f1", "They chose which examples to collect. Checking who is missing is part of their job. Do others share the job too?",
    "उन्होंने चुना कि कौन-से उदाहरण इकट्ठे हों। कौन छूटा है, यह देखना उनके काम का हिस्सा है। क्या दूसरों का भी इसमें हिस्सा है?",
    "ఏ ఉదాహరణలు సేకరించాలో వాళ్లే ఎంచుకున్నారు. ఎవరు లేరో చూడటం వాళ్ల పనిలో భాగం. ఇతరులకూ ఇందులో భాగం ఉందా?")
add("rs.f2", "They decided which data and tests were good enough before selling. Should the buyer also check?",
    "बेचने से पहले उन्होंने तय किया कि कौन-सा डेटा और कौन-सी जाँच काफ़ी है। क्या ख़रीदने वाले को भी जाँचना चाहिए?",
    "అమ్మే ముందు ఏ డేటా, ఏ పరీక్షలు సరిపోతాయో వాళ్లే నిర్ణయించారు. కొనేవాళ్లు కూడా పరీక్షించాలా?")
add("rs.f3", "They chose to use it on everyone's letters. Should they test it on letters from all their customers first?",
    "उन्होंने इसे सबकी चिट्ठियों पर इस्तेमाल करना चुना। क्या उन्हें पहले अपने सभी ग्राहकों की चिट्ठियों पर इसे जाँचना चाहिए?",
    "అందరి ఉత్తరాలపై దాన్ని వాడాలని వాళ్లు ఎంచుకున్నారు. ముందుగా తమ వినియోగదారులందరి ఉత్తరాలపై పరీక్షించాలా?")
add("rs.f4", "A machine cannot be responsible. It does not choose its data or notice its mistakes. People do both.",
    "मशीन ज़िम्मेदार नहीं हो सकती। वह न अपना डेटा चुनती है, न अपनी ग़लतियाँ पहचानती है। ये दोनों काम लोग करते हैं।",
    "యంత్రం బాధ్యత వహించలేదు. అది తన డేటాను ఎంచుకోదు, తన తప్పులను గమనించదు. ఈ రెండూ మనుషులే చేస్తారు.")
add("rs.f5", "This view shares the job. Each group can do something: collect fairly, test each group, and act when mistakes are reported.",
    "इस राय में काम सब बाँटते हैं। हर समूह कुछ कर सकता है: सही ढंग से इकट्ठा करना, हर समूह को जाँचना, और ग़लतियों की शिकायत मिलने पर कदम उठाना।",
    "ఈ అభిప్రాయంలో పని అందరూ పంచుకుంటారు. ప్రతి సమూహం ఏదో ఒకటి చేయగలదు: న్యాయంగా సేకరించడం, ప్రతి సమూహాన్నీ పరీక్షించడం, తప్పుల గురించి ఫిర్యాదు వస్తే చర్య తీసుకోవడం.")
add("rs.reveal", "There is no single right answer here. But notice one thing: the writers who were misread did nothing wrong. Their handwriting was correct.",
    "यहाँ कोई एक सही जवाब नहीं है। पर एक बात पर ध्यान दीजिए: जिन लोगों के नंबर ग़लत पढ़े गए, उन्होंने कुछ ग़लत नहीं किया। उनकी लिखावट सही थी।",
    "ఇక్కడ ఒకే ఒక సరైన జవాబు లేదు. కానీ ఒక విషయం గమనించండి: ఎవరి అంకెలు తప్పుగా చదవబడ్డాయో, వాళ్లు ఏ తప్పూ చేయలేదు. వాళ్ల రాత సరైనదే.")

# ---------- b16 explain-back ----------
add("eb.prompt",
    "In your own words: when data is unfair, who should be responsible, and what should they do? What you type stays on this device.",
    "अपने शब्दों में लिखिए: जब डेटा अनुचित हो, तो ज़िम्मेदारी किसकी होनी चाहिए, और उन्हें क्या करना चाहिए? आप जो लिखेंगे, वह इसी डिवाइस पर रहेगा।",
    "మీ సొంత మాటల్లో రాయండి: డేటా అన్యాయంగా ఉన్నప్పుడు బాధ్యత ఎవరిది కావాలి, వాళ్లు ఏం చేయాలి? మీరు టైప్ చేసేది ఈ పరికరంలోనే ఉంటుంది.")
add("eb.model",
    "One possible answer: the company should test the machine on each group of writers before selling it. The people collecting data should check who is missing. The post office should report mistakes, and stop using it if it stays unfair.",
    "एक संभव जवाब: कंपनी को मशीन बेचने से पहले उसे लिखने वालों के हर समूह पर जाँचना चाहिए। डेटा इकट्ठा करने वालों को देखना चाहिए कि कौन छूटा है। डाकघर को ग़लतियों की शिकायत करनी चाहिए, और अगर मशीन अनुचित ही रहे तो उसका इस्तेमाल बंद करना चाहिए।",
    "ఒక సాధ్యమైన జవాబు: కంపెనీ యంత్రాన్ని అమ్మే ముందు రాసేవారి ప్రతి సమూహంపై పరీక్షించాలి. డేటా సేకరించేవాళ్లు ఎవరు లేరో చూడాలి. పోస్టాఫీసు తప్పుల గురించి ఫిర్యాదు చేయాలి, అది అన్యాయంగానే ఉంటే వాడటం ఆపేయాలి.")

# ---------- b17 takeaway ----------
add("take.title", "My card: data decides", "मेरा कार्ड: डेटा तय करता है", "నా కార్డు: డేటా నిర్ణయిస్తుంది")
add("take.card",
    "A machine trained on one school's cards read that school's style well and another style badly. I fixed it by fixing the data, not the machine. A machine cannot notice its own gap, so people have to check every group.",
    "एक स्कूल के कार्डों पर ट्रेन की गई मशीन ने उस स्कूल का ढंग अच्छी तरह पढ़ा और दूसरा ढंग ख़राब। मैंने मशीन नहीं, डेटा ठीक करके उसे सुधारा। मशीन अपनी कमी नहीं पहचान सकती, इसलिए लोगों को हर समूह को जाँचना होता है।",
    "ఒకే బడి కార్డులపై ట్రైనింగ్ పొందిన యంత్రం ఆ బడి విధానాన్ని బాగా, వేరే విధానాన్ని తప్పుగా చదివింది. నేను యంత్రాన్ని కాదు, డేటాను సరిచేసి దాన్ని బాగుచేశాను. యంత్రం తన లోటును గమనించలేదు, అందుకే మనుషులు ప్రతి సమూహాన్నీ పరీక్షించాలి.")
add("take.l1", "The machine I trained on fairer data", "जिस मशीन को मैंने बेहतर डेटा पर ट्रेन किया", "మెరుగైన డేటాపై నేను ట్రైనింగ్ ఇచ్చిన యంత్రం")
add("take.l2", "Who I think should be responsible", "मेरे हिसाब से ज़िम्मेदारी किसकी है", "నా అభిప్రాయంలో బాధ్యత ఎవరిది")
add("take.l3", "In my own words", "मेरे अपने शब्दों में", "నా సొంత మాటల్లో")

# ---------- pre-check ----------
add("pre1.q", "A machine learned to read handwriting only from examples written at one school. Whose writing will it most likely misread?",
    "एक मशीन ने लिखावट पढ़ना सिर्फ़ एक स्कूल में लिखे उदाहरणों से सीखा। वह सबसे ज़्यादा किसकी लिखावट ग़लत पढ़ेगी?",
    "ఒక యంత్రం ఒకే బడిలో రాసిన ఉదాహరణల నుండి మాత్రమే చేతిరాత చదవడం నేర్చుకుంది. అది ఎక్కువగా ఎవరి రాతను తప్పుగా చదువుతుంది?")
add("pre1.a", "People whose style is unlike that school's", "जिनका ढंग उस स्कूल से अलग है", "ఆ బడి విధానానికి భిన్నంగా రాసేవాళ్లు")
add("pre1.b", "People with very neat handwriting", "जिनकी लिखावट बहुत सुंदर है", "చాలా అందంగా రాసేవాళ్లు")
add("pre1.c", "Nobody: a trained machine reads everyone equally well", "कोई नहीं: ट्रेन की गई मशीन सबको बराबर अच्छा पढ़ती है", "ఎవరూ కాదు: ట్రైనింగ్ పొందిన యంత్రం అందరినీ సమానంగా బాగా చదువుతుంది")
add("pre2.q", "A machine reads 90 of 100 test numbers correctly. What can you be sure of?",
    "एक मशीन 100 जाँच वाले नंबरों में से 90 सही पढ़ती है। आप किस बात पर पक्के हो सकते हैं?",
    "ఒక యంత్రం 100 పరీక్ష అంకెలలో 90 సరిగ్గా చదువుతుంది. మీరు దేని గురించి ఖచ్చితంగా చెప్పగలరు?")
add("pre2.a", "It is 90% accurate for every group of writers", "यह लिखने वालों के हर समूह के लिए 90% सटीक है", "రాసేవారి ప్రతి సమూహానికీ ఇది 90% కచ్చితం")
add("pre2.b", "It got 90% right overall; some groups may do much worse", "कुल मिलाकर इसने 90% सही किया; कुछ समूहों के लिए यह काफ़ी ख़राब हो सकता है", "మొత్తంగా 90% సరైనవి; కొన్ని సమూహాలకు చాలా తక్కువ ఉండవచ్చు")
add("pre2.c", "It will be right 9 times out of 10 for you", "यह आपके लिए 10 में से 9 बार सही होगी", "మీ విషయంలో ఇది 10లో 9 సార్లు సరిగ్గా ఉంటుంది")
add("pre3.q", "A fruit-sorting machine learned only from big red apples. It rejects small green apples. What would fix this best?",
    "फल छाँटने वाली एक मशीन ने सिर्फ़ बड़े लाल सेबों से सीखा। वह छोटे हरे सेबों को अलग कर देती है। इसे सबसे अच्छा कैसे ठीक करेंगे?",
    "పండ్లను వేరు చేసే ఒక యంత్రం పెద్ద ఎర్ర యాపిల్స్ నుండి మాత్రమే నేర్చుకుంది. అది చిన్న పచ్చ యాపిల్స్‌ను తిరస్కరిస్తుంది. దీన్ని సరిచేయడానికి ఉత్తమ మార్గం ఏది?")
add("pre3.a", "Add many small green apples, labelled “apple”, to its dataset", "इसके डेटासेट में बहुत-से छोटे हरे सेब जोड़ना, “सेब” लेबल के साथ", "దాని డేటాసెట్‌లో “యాపిల్” లేబుల్‌తో చాలా చిన్న పచ్చ యాపిల్స్ కలపడం")
add("pre3.b", "Add 1,000 more big red apples", "1,000 और बड़े लाल सेब जोड़ना", "ఇంకో 1,000 పెద్ద ఎర్ర యాపిల్స్ కలపడం")
add("pre3.c", "Ask farmers to grow only big red apples", "किसानों से कहना कि वे सिर्फ़ बड़े लाल सेब उगाएँ", "పెద్ద ఎర్ర యాపిల్స్ మాత్రమే పండించమని రైతులను అడగడం")

# ---------- post-check ----------
add("post1.q", "A plant app learned from leaf photos taken in bright sunlight. Its answers are often wrong for photos taken in shade. Why?",
    "एक पौधों वाले ऐप ने तेज़ धूप में खींची पत्तियों की फ़ोटो से सीखा। छाँव में खींची फ़ोटो पर उसके जवाब अक्सर ग़लत होते हैं। क्यों?",
    "ఒక మొక్కల యాప్ ఎండలో తీసిన ఆకుల ఫోటోల నుండి నేర్చుకుంది. నీడలో తీసిన ఫోటోలకు దాని జవాబులు తరచుగా తప్పు. ఎందుకు?")
add("post1.a", "The people taking photos in shade are using it wrongly", "छाँव में फ़ोटो खींचने वाले इसे ग़लत तरीके से इस्तेमाल कर रहे हैं", "నీడలో ఫోటోలు తీసేవాళ్లు దాన్ని తప్పుగా వాడుతున్నారు")
add("post1.b", "Shade photos were missing from its dataset, so it has no close examples for them", "इसके डेटासेट में छाँव वाली फ़ोटो नहीं थीं, इसलिए उनके लिए इसके पास कोई मिलते-जुलते उदाहरण नहीं हैं", "దాని డేటాసెట్‌లో నీడ ఫోటోలు లేవు, అందుకే వాటికి దగ్గరి ఉదాహరణలు దాని దగ్గర లేవు")
add("post1.c", "The app prefers sunny photos", "ऐप को धूप वाली फ़ोटो ज़्यादा पसंद हैं", "యాప్‌కి ఎండ ఫోటోలే ఇష్టం")
add("post1.fb", "The app has no likes or dislikes, and the people did nothing wrong. Its dataset left out shade photos.",
    "ऐप की कोई पसंद-नापसंद नहीं होती, और लोगों ने कुछ ग़लत नहीं किया। उसके डेटासेट में छाँव वाली फ़ोटो छूट गई थीं।",
    "యాప్‌కి ఇష్టాయిష్టాలు ఉండవు, మనుషులు ఏ తప్పూ చేయలేదు. దాని డేటాసెట్‌లో నీడ ఫోటోలు లేవు.")
add("post2.q", "A machine was tested on 100 numbers: 90 plain-style and 10 flag-style. It read all 90 plain ones correctly, and 5 of the 10 flag ones. What was its accuracy for flag-style writers?",
    "एक मशीन को 100 नंबरों पर जाँचा गया: 90 सादे ढंग के और 10 झंडी वाले ढंग के। उसने सादे ढंग के सभी 90 सही पढ़े, और झंडी वाले 10 में से 5। झंडी वाले ढंग से लिखने वालों के लिए उसकी सटीकता कितनी थी?",
    "ఒక యంత్రాన్ని 100 అంకెలపై పరీక్షించారు: 90 సాదా విధానం, 10 జెండా విధానం. సాదా విధానంలోని 90 అన్నీ సరిగ్గా చదివింది, జెండా విధానంలోని 10లో 5. జెండా విధానంలో రాసేవారికి దాని కచ్చితత్వం ఎంత?")
add("post2.a", "95%", "95%", "95%")
add("post2.b", "50%", "50%", "50%")
add("post2.c", "5%", "5%", "5%")
add("post2.fb", "Count only the flag-style numbers: 5 right out of 10. 10 × 10 = 100, and 5 × 10 = 50, so 50%. The 95% is for all 100 together: 90 + 5 = 95 right.",
    "सिर्फ़ झंडी वाले नंबर गिनिए: 10 में से 5 सही। 10 × 10 = 100, और 5 × 10 = 50, इसलिए 50%। 95% सभी 100 को मिलाकर है: 90 + 5 = 95 सही।",
    "జెండా విధానం అంకెలను మాత్రమే లెక్కించండి: 10లో 5 సరైనవి. 10 × 10 = 100, 5 × 10 = 50, కాబట్టి 50%. 95% అంటే 100 అంకెలనూ కలిపి: 90 + 5 = 95 సరైనవి.")
add("post3.q", "A company says: “Our machine is 98% accurate, so it is fair to everyone.” What should you ask first?",
    "एक कंपनी कहती है: “हमारी मशीन 98% सटीक है, इसलिए यह सबके लिए सही है।” आपको सबसे पहले क्या पूछना चाहिए?",
    "ఒక కంపెనీ అంటుంది: “మా యంత్రం 98% కచ్చితం, కాబట్టి అది అందరికీ న్యాయంగా ఉంటుంది.” మీరు ముందుగా ఏం అడగాలి?")
add("post3.a", "“How accurate is it for each group, when each group is tested on its own?”",
    "“जब हर समूह को अलग से जाँचा जाए, तो हर समूह के लिए यह कितनी सटीक है?”",
    "“ప్రతి సమూహాన్నీ విడిగా పరీక్షిస్తే, ఒక్కో సమూహానికి ఇది ఎంత కచ్చితం?”")
add("post3.b", "“Can you reach 100% by adding more of the same data?”",
    "“क्या वैसा ही और डेटा जोड़कर आप 100% तक पहुँच सकते हैं?”",
    "“అదే రకం డేటా ఇంకా కలిపి 100%కి చేరగలరా?”")
add("post3.c", "“Is the machine trying its best?”",
    "“क्या मशीन पूरी कोशिश कर रही है?”",
    "“యంత్రం తన శాయశక్తులా ప్రయత్నిస్తోందా?”")
add("post3.fb", "An overall number can hide a group with many mistakes. Ask for each group's accuracy, and how many examples of each group were tested.",
    "एक कुल संख्या ऐसे समूह को छिपा सकती है जिसमें बहुत ग़लतियाँ हों। हर समूह की सटीकता पूछिए, और यह भी कि हर समूह के कितने उदाहरण जाँचे गए।",
    "ఒక మొత్తం సంఖ్య ఎక్కువ తప్పులున్న సమూహాన్ని దాచగలదు. ప్రతి సమూహం కచ్చితత్వం అడగండి, ప్రతి సమూహం నుండి ఎన్ని ఉదాహరణలు పరీక్షించారో కూడా అడగండి.")
