import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-client";
import {
  collection,
  writeBatch,
  doc,
  serverTimestamp
} from "firebase/firestore";

export async function GET() {
  try {
    const questionsJSON = `[
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Identify the segment in the sentence which contains a grammatical error: 'Hardly had the legal arbitrator rendered the final structural decree than the corporate executives left the hall.'",
        "questionHi": "वाक्य में उस खंड की पहचान करें जिसमें व्याकरण की त्रुटि है: 'Hardly had the legal arbitrator rendered the final structural decree than the corporate executives left the hall.'",
        "optionA": "Hardly had the legal",
        "optionB": "arbitrator rendered the",
        "optionC": "than the corporate executives",
        "optionD": "left the hall completely",
        "answer": "C",
        "explanationEn": "The negative adverbial connector 'Hardly' must be structurally paired with 'when' or 'before', never with the comparative particle 'than'. 'Than' is used only with 'No sooner'.",
        "explanationHi": "कोरिलेटिव कंजंक्शंस के नियम के अनुसार 'Hardly' के बाद आने वाले क्लॉज में हमेशा 'when' या 'before' का उपयोग होता है, 'than' का नहीं। 'Than' का प्रयोग केवल 'No sooner' के साथ किया जाता है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate antonym of the given word: 'ABNEGATION'",
        "questionHi": "दिए गए शब्द का सबसे उपयुक्त विलोम शब्द चुनिए: 'ABNEGATION'",
        "optionA": "Renunciation",
        "optionB": "Indulgence",
        "optionC": "Denial",
        "optionD": "Refusal",
        "answer": "B",
        "explanationEn": "'Abnegation' means the act of renouncing or rejecting something, typically self-denial. Its exact antonym is 'Indulgence', which means allowing oneself to enjoy something.",
        "explanationHi": "'Abnegation' का अर्थ आत्म-अस्वीकार या किसी अधिकार/सुख का त्याग करना होता है। इसका सटीक विलोम 'Indulgence' (आसक्ति, भोग या लिप्तता) है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Improve the underlined part of the sentence: 'The backend infrastructure manager behaves <u>as if he knows</u> the full deployment algorithm.'",
        "questionHi": "वाक्य के रेखांकित भाग में सुधार करें: 'The backend infrastructure manager behaves <u>as if he knows</u> the full deployment algorithm.'",
        "optionA": "as if he know",
        "optionB": "as if he has known",
        "optionC": "as if he knew",
        "optionD": "No improvement",
        "answer": "C",
        "explanationEn": "The phrase 'as if' indicates an imaginary or hypothetical condition, which structurally requires the past subjunctive form ('knew') regardless of the singular subject.",
        "explanationHi": "वाक्यांश 'as if' (मानो जैसे) एक काल्पनिक या अवास्तविक स्थिति को दर्शाता है, जिसके साथ व्याकरण के नियमानुसार पास्ट सबजंक्टिव रूप ('knew') का प्रयोग किया जाता है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate synonym of the given word: 'PERSPICACIOUS'",
        "questionHi": "दिए गए शब्द का सबसे उपयुक्त पर्यायवाची चुनिए: 'PERSPICACIOUS'",
        "optionA": "Dull",
        "optionB": "Astute",
        "optionC": "Ignorant",
        "optionD": "Foolish",
        "answer": "B",
        "explanationEn": "'Perspicacious' means having a ready insight into and understanding of things; sharp or astute. 'Dull' and 'Ignorant' are opposite concepts.",
        "explanationHi": "'Perspicacious' का अर्थ कुशाग्र, सूक्ष्मदर्शी या बुद्धिमान होता है; इसलिए 'Astute' (चतुर/तीक्ष्ण बुद्धि) इसका सही पर्यायवाची है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the option that expresses the given sentence in passive voice: 'The technical auditor had systematically verified the entire data logs before deployment.'",
        "questionHi": "उस विकल्प का चयन करें जो दिए गए वाक्य को पैसिव वॉयस में व्यक्त करता है: 'The technical auditor had systematically verified the entire data logs before deployment.'",
        "optionA": "The entire data logs were systematically verified by the technical auditor before deployment.",
        "optionB": "The entire data logs has been systematically verified by the technical auditor before deployment.",
        "optionC": "The entire data logs had been systematically verified by the technical auditor before deployment.",
        "optionD": "The entire data logs were being systematically verified by the technical auditor before deployment.",
        "answer": "C",
        "explanationEn": "The active sentence uses the past perfect tense ('had + V3'). The corresponding passive structural layout must use 'had been + V3'. Hence, option C is correct.",
        "explanationHi": "सक्रिय वाक्य पास्ट परफेक्ट टेंस ('had + V3') में है। इसके पैसिव वॉयस रूपांतरण में हमेशा 'had been + V3' का प्रयोग किया जाता है। इसलिए, विकल्प C सही है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate one-word substitution for the given group of words: 'A state of remaining unmarried, especially due to strict religious vows'",
        "questionHi": "दिए गए शब्दों के समूह के लिए सबसे उपयुक्त एक-शब्द प्रतिस्थापन चुनिए: 'A state of remaining unmarried, especially due to strict religious vows'",
        "optionA": "Monogamy",
        "optionB": "Celibacy",
        "optionC": "Polygamy",
        "optionD": "Bigamy",
        "answer": "B",
        "explanationEn": "'Celibacy' is the structural state of abstaining from marriage and sexual relations, typically for religious reasons. Other terms represent structural marriage matrices.",
        "explanationHi": "'Celibacy' (ब्रह्मचर्य) विशेष रूप से धार्मिक प्रतिज्ञाओं के कारण अविवाहित रहने और वैवाहिक संबंधों से दूर रहने की स्थिति को कहा जाता है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Identify the segment in the sentence which contains a grammatical error: 'If the team would have analyzed the parameter logs earlier, they would not have suffered the production outage.'",
        "questionHi": "वाक्य में उस खंड की पहचान करें जिसमें व्याकरण की त्रुटि है: 'If the team would have analyzed the parameter logs earlier, they would not have suffered the production outage.'",
        "optionA": "If the team",
        "optionB": "would have analyzed the parameter logs",
        "optionC": "they would not have",
        "optionD": "suffered the production outage",
        "answer": "B",
        "explanationEn": "This is a Third Conditional sentence representing past unfulfilled actions. The 'if' clause must structurally contain the past perfect tense ('had analyzed') instead of 'would have'.",
        "explanationHi": "यह अतीत की अधूरी शर्त (Third Conditional) का वाक्य है। व्याकरण के नियमों के अनुसार 'if' वाले शर्तीय क्लॉज में 'would have' के स्थान पर पास्ट परफेक्ट टेंस ('had + V3') का प्रयोग होना चाहिए।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate meaning of the given idiom: 'Bite the bullet'",
        "questionHi": "दिए गए शब्द का सबसे उपयुक्त विलोम शब्द चुनिए: 'Bite the bullet'",
        "optionA": "To act in a highly aggressive parameter layout",
        "optionB": "To face a grim, painful or inevitable situation with absolute courage",
        "optionC": "To taste something highly metallic or toxic",
        "optionD": "To commit an unpardonable structural formatting mistake",
        "answer": "B",
        "explanationEn": "The idiom 'bite the bullet' means to accept a difficult, painful, or inevitable situation with absolute fortitude and endurance.",
        "explanationHi": "मुहावरे 'bite the bullet' का अर्थ होता है किसी बेहद कठिन, दर्दनाक या अपरिहार्य परिस्थिति का साहस और दृढ़ता के साथ सामना करना।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Fill in the blank with the most appropriate word: 'The administrative council found the candidate's arguments completely _______, leaving no scope for multiple interpretations.'",
        "questionHi": "रिक्त स्थान को भरने के लिए सबसे उपयुक्त शब्द का चयन करें: 'The administrative council found the candidate's arguments completely _______, leaving no scope for multiple interpretations.'",
        "optionA": "ambiguous",
        "optionB": "unequivocal",
        "optionC": "convoluted",
        "optionD": "vague",
        "answer": "B",
        "explanationEn": "'Unequivocal' means leaving no doubt; clear and unambiguous. This directly satisfies the context of leaving no scope for multiple interpretations.",
        "explanationHi": "'Unequivocal' का अर्थ स्पष्ट, असंदिग्ध या निश्चित होता है। चूंकि आगे लिखा है कि कोई भी अन्य व्याख्या करने की गुंजाइश नहीं छोड़ी गई, इसलिए यह शब्द यहाँ सबसे उपयुक्त है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the word with the correct spelling choice.",
        "questionHi": "सही वर्तनी वाले शब्द का चयन करें।",
        "optionA": "Conscientious",
        "optionB": "Consciouscious",
        "optionC": "Consientious",
        "optionD": "Conscientous",
        "answer": "A",
        "explanationEn": "The correct spelling is 'Conscientious', which means wishing to do what is right, especially to do one's work or duty well and thoroughly.",
        "explanationHi": "सही वर्तनी 'Conscientious' (कर्तव्यनिष्ठ/ईमानدار) है, जिसमें आंतरिक अक्षरों का क्रम '-scie-' और अंत में '-tious' होता है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Identify the segment in the sentence which contains a grammatical error: 'The report is due on Wednesday, and none of the project managers have submitted it yet.'",
        "questionHi": "वाक्य में उस खंड की पहचान करें जिसमें व्याकरण की त्रुटि है: 'The report is due on Wednesday, and none of the project managers have submitted it yet.'",
        "optionA": "The report is due",
        "optionB": "on Wednesday, and",
        "optionC": "none of the project managers",
        "optionD": "have submitted it yet",
        "answer": "D",
        "explanationEn": "The pronoun 'none' followed by 'of the + plural noun' formally requires a singular verb 'has' in strict traditional grammar rules, making 'have submitted' incorrect.",
        "explanationHi": "मानक व्याकरण के नियमों के अनुसार, जब 'none' का प्रयोग 'none of + plural noun' के रूप में होता है, तो औपचारिक संदर्भों में क्रिया हमेशा एकवचन ('has submitted') होनी चाहिए।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate synonym of the given word: 'EPHEMERAL'",
        "questionHi": "दिए गए शब्द का सबसे उपयुक्त पर्यायवाची चुनिए: 'EPHEMERAL'",
        "optionA": "Perpetual",
        "optionB": "Transient",
        "optionC": "Enduring",
        "optionD": "Everlasting",
        "answer": "B",
        "explanationEn": "'Ephemeral' means lasting for a very short time. 'Transient' is its exact synonym, whereas 'Perpetual', 'Enduring', and 'Everlasting' mean lasting forever.",
        "explanationHi": "'Ephemeral' का अर्थ क्षणभंगुर या बहुत कम समय तक रहने वाला होता है। 'Transient' इसका सटीक पर्यायवाची है, जबकि अन्य विकल्पों का अर्थ हमेशा रहने वाला होता है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Improve the underlined part of the sentence: 'The dangerous criminal was <u>hung till death</u> by the order of the apex court last night.'",
        "questionHi": "वाक्य के रेखांकित भाग में सुधार करें: 'The dangerous criminal was <u>hung till death</u> by the order of the apex court last night.'",
        "optionA": "hanged till death",
        "optionB": "hanging till death",
        "optionC": "been hung till death",
        "optionD": "No improvement",
        "answer": "A",
        "explanationEn": "When referring to execution by suspending a person by the neck, the past participle form of 'hang' is 'hanged'. 'Hung' is used exclusively for objects.",
        "explanationHi": "जब किसी व्यक्ति को फांसी पर लटकाने (मृत्युदंड) का संदर्भ होता है, तो 'hang' का पास्ट प्राप्त रूप 'hanged' होता है। वस्तुओं को लटकाने के लिए 'hung' का प्रयोग होता है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate antonym of the given word: 'CAPRICIOUS'",
        "questionHi": "दिए गए शब्द का सबसे उपयुक्त विलोम शब्द चुनिए: 'CAPRICIOUS'",
        "optionA": "Volatile",
        "optionB": "Fickle",
        "optionC": "Steadfast",
        "optionD": "Whimsical",
        "answer": "C",
        "explanationEn": "'Capricious' means given to sudden and unaccountable changes of mood or behavior. Its exact antonym is 'Steadfast', which means firm, resolute, and unwavering.",
        "explanationHi": "'Capricious' का अर्थ मनमौजी, अस्थिर या जल्दी-जल्दी बदलने वाला होता है। इसका सटीक विलोम 'Steadfast' (दृढ़, स्थिर या अडिग) है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the correct active voice form of the given sentence: 'The dynamic structural parameters were being systematically evaluated by the testing core team.'",
        "questionHi": "दिए गए वाक्य का सही एक्टिव वॉयस रूप चुनिए: 'The dynamic structural parameters were being systematically evaluated by the testing core team.'",
        "optionA": "The testing core team systematically evaluated the dynamic structural parameters.",
        "optionB": "The testing core team was systematically evaluating the dynamic structural parameters.",
        "optionC": "The testing core team has been systematically evaluating the dynamic structural parameters.",
        "optionD": "The testing core team had systematically evaluated the dynamic structural parameters.",
        "answer": "B",
        "explanationEn": "The passive sentence contains 'were being + V3', representing the past continuous passive layout. Its active voice form requires the structure 'was/were + V-ing'.",
        "explanationHi": "पैसिव वाक्य में 'were being + V3' (पास्ट कंटीन्यूअस पैसिव) का प्रयोग हुआ है। एक्टिव वॉयस में बदलते समय यह पास्ट कंटीन्यूअस टेंस की मूल संरचना ('was/were + V-ing') में बदला जाएगा।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate phrase to fill in the blank: 'The operational lead did not check the database metrics, nor _______ any interest in the server configurations.'",
        "questionHi": "रिक्त स्थान को भरने के लिए सबसे उपयुक्त वाक्यांश का चयन करें: 'The operational lead did not check the database metrics, nor _______ any interest in the server configurations.'",
        "optionA": "he showed",
        "optionB": "did he show",
        "optionC": "he did show",
        "optionD": "has he shown",
        "answer": "B",
        "explanationEn": "When a sentence clause starts with negative coordinating adverbs like 'nor' or 'neither', grammatical inversion must occur. Thus, auxiliary verb 'did' comes before subject 'he'.",
        "explanationHi": "जब कोई वाक्य खंड 'nor' या 'neither' जैसे नकारात्मक संयोजक से शुरू होता है, तो वहां इनवर्जन (Inversion) नियम लागू होता है, जिसके तहत सहायक क्रिया (did) कर्ता (he) से पहले आती है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate one-word substitution for the given group of words: 'A position or office requiring little or no actual work but yielding a highly profitable income'",
        "questionHi": "दिए गए शब्दों के समूह के लिए सबसे उपयुक्त एक-शब्द प्रतिस्थापन चुनिए: 'A position or office requiring little or no actual work but yielding a highly profitable income'",
        "optionA": "Honorary",
        "optionB": "Sinecure",
        "optionC": "Voluntary",
        "optionD": "Platitude",
        "answer": "B",
        "explanationEn": "A 'Sinecure' is an office or position requiring little or no work, especially one yielding a highly profitable or lucrative income infrastructure.",
        "explanationHi": "'Sinecure' (आराम की नौकरी) का तात्पर्य एक ऐसे पद या कार्यालय से है जिसमें काम बहुत कम या बिल्कुल नहीं होता, लेकिन वेतन/आय बहुत अच्छी मिलती है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Identify the segment in the sentence which contains a grammatical error: 'The structural performance of the new model was superior than any other layout analyzed last year.'",
        "questionHi": "वाक्य में उस खंड की पहचान करें जिसमें व्याकरण की त्रुटि है: 'The structural performance of the new model was superior than any other layout analyzed last year.'",
        "optionA": "The structural performance",
        "optionB": "of the new model",
        "optionC": "was superior than",
        "optionD": "any other layout analyzed",
        "answer": "C",
        "explanationEn": "Adjectives ending in '-ior' like superior, senior, junior, inferior structurally take the fixed preposition 'to' instead of the comparative particle 'than'.",
        "explanationHi": "'-ior' पर समाप्त होने वाले विशेषणों (जैसे superior, inferior, senior) के बाद तुलनात्मक संदर्भ में हमेशा प्रपोजिशन 'to' का प्रयोग किया जाता है, 'than' का नहीं।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate meaning of the given idiom: 'At the eleventh hour'",
        "questionHi": "दिए गए मुहावरे का सबसे उपयुक्त अर्थ चुनिए: 'At the eleventh hour'",
        "optionA": "Precisely at the stroke of midnight",
        "optionB": "At the very last possible moment before a deadline",
        "optionC": "One hour exactly before the scheduled event",
        "optionD": "Too early to execute a strategic process layout",
        "answer": "B",
        "explanationEn": "The idiom 'at the eleventh hour' means doing something at the very last possible moment or opportunity before a critical conclusion.",
        "explanationHi": "मुहावरे 'at the eleventh hour' का अर्थ होता है समय-सीमा समाप्त होने से ठीक पहले बिल्कुल अंतिम संभावित क्षण में कुछ करना।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Fill in the blank with the most appropriate preposition: 'The database administrator was completely oblivious _______ the critical alterations made to the security parameters.'",
        "questionHi": "रिक्त स्थान को भरने के लिए सबसे उपयुक्त प्रपोजिशन का चयन करें: 'The database administrator was completely oblivious _______ the critical alterations made to the security parameters.'",
        "optionA": "of",
        "optionB": "to",
        "optionC": "with",
        "optionD": "about",
        "answer": "B",
        "explanationEn": "The adjective 'oblivious' takes the fixed preposition 'to' structurally when indicating a lack of awareness or concern about surrounding parameters.",
        "explanationHi": "विशेषण 'oblivious' (बेखबर/अनजान) के साथ अंग्रेजी व्याकरण के नियमों के अनुसार हमेशा निश्चित प्रपोजिशन 'to' का प्रयोग किया जाता है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the word with the correct spelling from the options.",
        "questionHi": "विकल्पों में से सही वर्तनी वाले शब्द का चयन करें।",
        "optionA": "Accommodation",
        "optionB": "Accomodation",
        "optionC": "Acommodation",
        "optionD": "Accomodasion",
        "answer": "A",
        "explanationEn": "The correct spelling is 'Accommodation', which structurally features a double 'c' and a double 'm'.",
        "explanationHi": "सही वर्तनी 'Accommodation' (आवास) है, जिसमें नियम के अनुसार double 'c' और double 'm' दोनों का उपयोग होता है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate indirect speech option for: 'The manager said to the backend core team, \"Do not execute the deployment without double-checking.\"'",
        "questionHi": "दिए गए वाक्य का सबसे उपयुक्त इनडायरेक्ट स्पीच विकल्प चुनें: 'The manager said to the backend core team, \"Do not execute the deployment without double-checking.\"'",
        "optionA": "The manager told the backend core team to not execute the deployment without double-checking.",
        "optionB": "The manager forbade the backend core team not to execute the deployment without double-checking.",
        "optionC": "The manager forbade the backend core team to execute the deployment without double-checking.",
        "optionD": "The manager ordered the backend core team that they should not execute the deployment without double-checking.",
        "answer": "C",
        "explanationEn": "The verb 'forbade' inherently contains a negative meaning. Therefore, when utilizing 'forbade', a double negative ('not') must not be used in the reported clause. The structure is 'forbade someone to do something'.",
        "explanationHi": "चूंकि 'forbade' (मना किया) क्रिया अपने आप में ही एक नकारात्मक अर्थ रखती है, इसलिए इसके साथ रिपोर्टेड क्लॉज में दोबारा 'not' का प्रयोग वर्जित है। सही संरचना 'forbade someone to do something' होगी।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate synonym of the given word: 'CACOPHONY'",
        "questionHi": "दिए गए शब्द का सबसे उपयुक्त पर्यायवाची चुनिए: 'CACOPHONY'",
        "optionA": "Harmony",
        "optionB": "Harsh, discordant sound",
        "optionC": "Melody",
        "optionD": "Silence",
        "answer": "B",
        "explanationEn": "'Cacophony' means a harsh, discordant mixture of sounds. 'Harmony' and 'Melody' are complete musical antonyms.",
        "explanationHi": "'Cacophony' का अर्थ कोलाहल, कटु ध्वनि या बेसुरी आवाज होता है; इसलिए 'Harsh, discordant sound' इसका सही पर्यायवाची है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Identify the segment in the sentence which contains a grammatical error: 'Scarcely had the server rebooted than the network layer failed completely.'",
        "questionHi": "वाक्य में उस खंड की पहचान करें जिसमें व्याकरण की त्रुटि है: 'Scarcely had the server rebooted than the network layer failed completely.'",
        "optionA": "Scarcely had the server",
        "optionB": "rebooted than the network",
        "optionC": "layer failed completely",
        "optionD": "without any log entries",
        "answer": "B",
        "explanationEn": "The negative adverbial particle 'Scarcely' must be structurally paired with 'when or before', never with 'than'. 'Than' is reserved strictly for 'No sooner'.",
        "explanationHi": "कोरिलेटिव कंजंक्शंस के नियम के अनुसार 'Scarcely' के बाद आने वाले क्लॉज में 'when' या 'before' का उपयोग होता है, 'than' का नहीं। 'Than' का प्रयोग केवल 'No sooner' के साथ होता है।"
      },
      {
        "exam": "SSC_CGL",
        "subject": "English",
        "difficulty": "hard",
        "questionEn": "Select the most appropriate antonym of the given word: 'INDOLENT'",
        "questionHi": "दिए गए शब्द का सबसे उपयुक्त विलोम शब्द चुनिए: 'INDOLENT'",
        "optionA": "Lazy",
        "optionB": "Slothful",
        "optionC": "Industrious",
        "optionD": "Inactive",
        "answer": "C",
        "explanationEn": "'Indolent' means wanting to avoid activity or exertion; lazy. Its exact antonym is 'Industrious', which means hard-working and diligent.",
        "explanationHi": "'Indolent' का अर्थ आलसी या कामचोर होता है। इसका सटीक विलोम 'Industrious' (परिश्रमी या मेहनती) है।"
      }
    ]`;

    const questions = JSON.parse(questionsJSON);

    if (!Array.isArray(questions)) {
      throw new Error("Questions must be an array");
    }

    const batch = writeBatch(db);
    const questionsRef = collection(db, "questions");

    questions.forEach((q) => {
      const newDocRef = doc(questionsRef);
      batch.set(newDocRef, {
        ...q,
        category: "PYQ",
        createdAt: serverTimestamp()
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      totalInBatch: questions.length,
      currentlyUploaded: questions.length,
      message: `✅ ${questions.length} Questions Uploaded Successfully`
    });

  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "❌ Upload Failed",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}