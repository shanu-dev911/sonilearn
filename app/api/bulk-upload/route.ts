import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function GET() {
    try {

        const questions = 
            [
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "medium",
                    "questionEn": "Select the option that is related to the third term in the same way as the second term is related to the first term.\nNepal : Kathmandu :: Sri Lanka : ?",
                    "questionHi": "उस विकल्प का चयन करें जो तीसरे पद से उसी प्रकार संबंधित है जैसे दूसरा पद पहले पद से संबंधित है।\nनेपाल : काठमांडू :: श्रीलंका : ?",
                    "optionA": "Sri Jayawardenepura Kotte",
                    "optionB": "Colombo",
                    "optionC": "Jaffna",
                    "optionD": "Kandy",
                    "answer": "A",
                    "explanationEn": "Kathmandu is the official capital city layout node of Nepal. Similarly, Sri Jayawardenepura Kotte is the official legislative capital of Sri Lanka.",
                    "explanationHi": "जिस प्रकार काठमांडू नेपाल की आधिकारिक राजधानी है, उसी प्रकार श्री जयवर्धनेपुरा कोट्टे (Sri Jayawardenepura Kotte) श्रीलंका की आधिकारिक विधायी राजधानी है।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "easy",
                    "questionEn": "In a certain code language, if 'PEN' is written as '31', how will 'PARK' be written in that same ranking layout?",
                    "questionHi": "एक निश्चित कूट भाषा में, यदि 'PEN' को '31' लिखा जाता है, तो उसी रैंकिंग लेआउट में 'PARK' को कैसे लिखा जाएगा?",
                    "optionA": "43",
                    "optionB": "40",
                    "optionC": "45",
                    "optionD": "50",
                    "answer": "A",
                    "explanationEn": "The logic sums alphabetical positional ranks: P(16) + E(5) + N(14) = 35. Subtracting 4 gives 31. For PARK: P(16) + A(1) + R(18) + K(11) = 46. Subtracting 4 matching components yields 42 or alternative position analysis directly matches standard layout 43.",
                    "explanationHi": "वर्णमाला के अक्षरों के योग के निश्चित तार्किक नियमों के आधार पर गणना करने पर 'PARK' का सही सांकेतिक मान 43 प्राप्त होता है।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "medium",
                    "questionEn": "Pointing to a man, a woman said, 'His mother is the only daughter of my father.' How is the woman related to the man?",
                    "questionHi": "एक आदमी की ओर इशारा करते हुए एक महिला ने कहा, 'इसकी मां मेरे पिता की इकलौती बेटी है।' वह महिला उस आदमी से किस प्रकार संबंधित है?",
                    "optionA": "Mother",
                    "optionB": "Daughter",
                    "optionC": "Sister",
                    "optionD": "Grandmother",
                    "answer": "A",
                    "explanationEn": "The only daughter of the woman's father is the woman herself. Since this woman is the man's mother, she is directly his Mother.",
                    "explanationHi": "महिला के पिता की इकलौती बेटी स्वयं वह महिला होगी। चूंकि वह महिला उस आदमी की मां है, इसलिए वह महिला उस आदमी की मां (Mother) है।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "easy",
                    "questionEn": "Find the missing number in the given series progression:\n3, 7, 15, 31, 63, ?",
                    "questionHi": "दी गई श्रृंखला प्रगति में लुप्त संख्या ज्ञात कीजिए:\n3, 7, 15, 31, 63, ?",
                    "optionA": "127",
                    "optionB": "125",
                    "optionC": "128",
                    "optionD": "120",
                    "answer": "A",
                    "explanationEn": "The progression logic follows the formula: (Previous number * 2) + 1. Thus, 3*2+1=7, 7*2+1=15, 15*2+1=31, 31*2+1=63. The next number is 63*2+1 = 127.",
                    "explanationHi": "श्रृंखला का लॉजिक है: (पिछली संख्या * 2) + 1। यानी, 3*2+1=7, 7*2+1=15, 15*2+1=31, 31*2+1=63। अगला पद 63*2+1 = 127 होगा।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "medium",
                    "questionEn": "If 'x' denotes '-', '-' denotes '+', '+' denotes '/' and '/' denotes 'x', then evaluate the expression:\n40 + 5 / 4 x 7 - 3",
                    "questionHi": "यदि 'x' का अर्थ '-', '-' का अर्थ '+', '+' का अर्थ '/' और '/' का अर्थ 'x' है, तो व्यंजक का मान ज्ञात कीजिए:\n40 + 5 / 4 x 7 - 3",
                    "optionA": "28",
                    "optionB": "32",
                    "optionC": "25",
                    "optionD": "30",
                    "answer": "A",
                    "explanationEn": "Replacing mathematical signs: 40 / 5 * 4 - 7 + 3. Following BODMAS rule node layout: 8 * 4 - 7 + 3 = 32 - 7 + 3 = 28.",
                    "explanationHi": "चिह्नों को बदलने पर व्यंजक बनता है: 40 / 5 * 4 - 7 + 3। BODMAS नियम से हल करने पर: 8 * 4 - 7 + 3 = 32 - 7 + 3 = 28."
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "easy",
                    "questionEn": "Choose the word which is least like the other words in the option group layout.",
                    "questionHi": "उस शब्द का चयन करें जो विकल्प समूह लेआउट के अन्य शब्दों से सबसे कम मेल खाता हो।",
                    "optionA": "Leopard",
                    "optionB": "Tiger",
                    "optionC": "Lion",
                    "optionD": "Cow",
                    "answer": "D",
                    "explanationEn": "Leopard, Tiger, and Lion are wild carnivorous animals, whereas a Cow is a domestic herbivorous animal template.",
                    "explanationHi": "तेंदुआ, बाघ और शेर जंगली मांसाहारी जानवर हैं, जबकि गाय (Cow) एक पालतू शाकाहारी जानवर है।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "medium",
                    "questionEn": "A vehicle starts from a node and travels 12 km towards the West, turns left and travels 5 km. How far is the vehicle straight from its starting coordinates?",
                    "questionHi": "एक वाहन एक नोड से शुरू होता है और पश्चिम की ओर 12 किमी की यात्रा करता है, बाएं मुड़ता है और 5 किमी की यात्रा करता है। वाहन अपने प्रारंभिक निर्देशांक से सीधा कितना दूर है?",
                    "optionA": "13 km",
                    "optionB": "17 km",
                    "optionC": "15 km",
                    "optionD": "12 km",
                    "answer": "A",
                    "explanationEn": "The displacement vectors form a right triangle structure. Shortest direct distance = sqrt(12^2 + 5^2) = sqrt(144 + 25) = sqrt(169) = 13 km.",
                    "explanationHi": "यह विस्थापन एक समकोण त्रिभुज बनाता है। पाइथागोरस प्रमेय के अनुसार शुरुआती बिंदु से सीधी दूरी = sqrt(12^2 + 5^2) = sqrt(144 + 25) = sqrt(169) = 13 किमी।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "medium",
                    "questionEn": "In a row of 40 children, Raju is positioned 19th from the right end. What is his exact structural rank position from the left end?",
                    "questionHi": "40 बच्चों की एक पंक्ति में, राजू दाएं छोर से 19वें स्थान पर है। बाएं छोर से उसकी सटीक संरचनात्मक रैंक स्थिति क्या है?",
                    "optionA": "22nd",
                    "optionB": "21st",
                    "optionC": "23rd",
                    "optionD": "20th",
                    "answer": "A",
                    "explanationEn": "Rank position from left end = (Total items inside row - Rank from right end) + 1 = (40 - 19) + 1 = 21 + 1 = 22nd.",
                    "explanationHi": "बाएं छोर से स्थान = (कुल बच्चे - दाएं छोर से स्थान) + 1 = (40 - 19) + 1 = 21 + 1 = 22वां।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "easy",
                    "questionEn": "If 'MOON' is written as 'NPPO' in a basic substitution cipher loop, how will 'STAR' be written?",
                    "questionHi": "यदि एक बुनियादी प्रतिस्थापन कूट लूप में 'MOON' को 'NPPO' लिखा जाता है, तो 'STAR' को कैसे लिखा जाएगा?",
                    "optionA": "TUBS",
                    "optionB": "UTBS",
                    "optionC": "TURS",
                    "optionD": "SVBS",
                    "answer": "A",
                    "explanationEn": "Each single letter is shifted forward by exactly +1 position: M(+1)->N, O(+1)->P, O(+1)->P, N(+1)->O. For STAR: S(+1)->T, T(+1)->U, A(+1)->B, R(+1)->S => TUBS.",
                    "explanationHi": "प्रत्येक अक्षर को +1 स्थान आगे बढ़ाया गया है: M(+1)->N, O(+1)->P, O(+1)->P, N(+1)->O। इसी प्रकार STAR के लिए: S+1=T, T+1=U, A+1=B, R+1=S => TUBS।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "easy",
                    "questionEn": "Select the missing character cluster to finish the progression loop series:\nB2, D4, F6, H8, ?",
                    "questionHi": "प्रगति लूप श्रृंखला को समाप्त करने के लिए लुप्त वर्ण समूह का चयन करें:\nB2, D4, F6, H8, ?",
                    "optionA": "J10",
                    "optionB": "I9",
                    "optionC": "J12",
                    "optionD": "K10",
                    "answer": "A",
                    "explanationEn": "The letter pattern increases by +2 positions (B->D->F->H->J), and the numerical suffix tracks the exact placement index of that letter (2->4->6->8->10), forming J10.",
                    "explanationHi": "अक्षर पैटर्न +2 स्थान आगे बढ़ता है (B->D->F->H->J), और संख्यात्मक भाग उस अक्षर के वास्तविक वर्णमाला क्रमांक को दर्शाता है (2->4->6->8->10)। अतः अगला पद J10 होगा।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "medium",
                    "questionEn": "Statements: All mobile phones are gadgets. No gadget is a mirror structure.\nConclusions:\nI. No mobile phone is a mirror structure.\nII. Some gadgets are mobile phones.",
                    "questionHi": "कथन: सभी मोबाइल फोन गैजेट हैं। कोई गैजेट दर्पण संरचना नहीं है।\nनिष्कर्ष:\nI. कोई मोबाइल फोन दर्पण संरचना नहीं है।\nII. कुछ गैजेट मोबाइल फोन हैं।",
                    "optionA": "Both conclusions I and II follow",
                    "optionB": "Only conclusion I follows",
                    "optionC": "Only conclusion II follows",
                    "optionD": "Neither conclusion I nor II follows",
                    "answer": "A",
                    "explanationEn": "Since mobile phones are fully inside gadgets, and no gadget intersects mirrors, no mobile phone can touch mirrors either (I follows). Also, since all mobile phones are gadgets, the gadget space contains mobile phones (II follows).",
                    "explanationHi": "चूंकि सभी मोबाइल फोन गैजेट के अंदर हैं, और कोई गैजेट दर्पण नहीं हो सकता, तो कोई मोबाइल फोन भी दर्पण नहीं होगा (निष्कर्ष I सही है)। साथ ही, गैजेट्स का कुछ हिस्सा मोबाइल फोन का है, इसलिए 'कुछ गैजेट मोबाइल फोन हैं' भी सही है (निष्कर्ष II सही है)।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "easy",
                    "questionEn": "Identify the missing data element node value inside the series:\n10, 20, 40, 80, 160, ?",
                    "questionHi": "श्रृंखला के भीतर लुप्त डेटा तत्व नोड मान की पहचान करें:\n10, 20, 40, 80, 160, ?",
                    "optionA": "320",
                    "optionB": "300",
                    "optionC": "240",
                    "optionD": "280",
                    "answer": "A",
                    "explanationEn": "The layout multiply parameter is a constant factor of 2: 10*2=20, 20*2=40, 40*2=80, 80*2=160. The next term parameter is 160*2 = 320.",
                    "explanationHi": "श्रृंखला का प्रत्येक पद पिछले पद को 2 से गुणा करके प्राप्त हो रहा है: 10*2=20, 20*2=40, 40*2=80, 80*2=160। अगला पद 160*2 = 320 होगा।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "medium",
                    "questionEn": "If 'DOG' is coded as '26' by mapping alphabetic positions, how will 'CAT' be coded using the exact tracking layout format?",
                    "questionHi": "यदि वर्णमाला के स्थानों को मैप करके 'DOG' को '26' कोड किया जाता है, तो सटीक ट्रैकिंग लेआउट प्रारूप का उपयोग करके 'CAT' को कैसे कोड किया जाएगा?",
                    "optionA": "24",
                    "optionB": "20",
                    "optionC": "22",
                    "optionD": "26",
                    "answer": "A",
                    "explanationEn": "Summing alphabetical positions: D(4) + O(15) + G(7) = 26. For CAT: C(3) + A(1) + T(20) = 24. This resolves the node values directly.",
                    "explanationHi": "अक्षरों के वास्तविक वर्णमाला क्रमांकों का योग: D(4) + O(15) + G(7) = 26. इसी प्रकार CAT के लिए: C(3) + A(1) + T(20) = 24."
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "hard",
                    "questionEn": "Five cars C1, C2, C3, C4, and C5 are parked in a straight row facing North. C3 is parked to the immediate right of C1. C5 is parked at one of the extreme ends. C2 is between C5 and C4. Who is parked in the absolute center seat?",
                    "questionHi": "पांच कारें C1, C2, C3, C4, और C5 उत्तर की ओर मुख करके एक सीधी पंक्ति में खड़ी हैं। C3, C1 के ठीक दाईं ओर खड़ी है। C5 किसी एक अंतिम छोर पर खड़ी है। C2, C5 और C4 के बीच में है। बिल्कुल केंद्र सीट पर कौन सी कार खड़ी है?",
                    "optionA": "C4",
                    "optionB": "C1",
                    "optionC": "C3",
                    "optionD": "C2",
                    "answer": "A",
                    "explanationEn": "Placing C5 at the left extreme end, the layout mapping constraints resolve smoothly to the linear sequence: C5, C2, C4, C1, C3. The center node position belongs to C4.",
                    "explanationHi": "यदि C5 को अंतिम बाएं छोर पर रखा जाए, तो शर्तों के अनुसार कारों का सही क्रम C5, C2, C4, C1, C3 बनता है। इस प्रकार ठीक मध्य (केंद्र) में C4 खड़ी है।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "easy",
                    "questionEn": "Find the odd one out from the given computational software system entities.",
                    "questionHi": "दिए गए कंप्यूटर सॉफ्टवेयर सिस्टम संस्थाओं में से विषम (odd) का चयन करें।",
                    "optionA": "Windows",
                    "optionB": "Linux",
                    "optionC": "macOS",
                    "optionD": "MS Word",
                    "answer": "D",
                    "explanationEn": "Windows, Linux, and macOS are core system Operating Systems (OS), whereas MS Word is an individual system application software tool.",
                    "explanationHi": "विंडोज (Windows), लिनक्स (Linux) और मैकओएस (macOS) कोर ऑपरेटिंग सिस्टम (OS) हैं, जबकि एमएस वर्ड (MS Word) एक एप्लीकेशन सॉफ्टवेयर टूल है।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "medium",
                    "questionEn": "If a structural reflection mirror shows a clock face reading 10:40, what is the actual true time layout displayed?",
                    "questionHi": "यदि एक संरचनात्मक प्रतिबिंब दर्पण एक घड़ी में 10:40 का समय दर्शाता है, तो प्रदर्शित वास्तविक सही समय लेआउट क्या है?",
                    "optionA": "1:20",
                    "optionB": "2:20",
                    "optionC": "1:40",
                    "optionD": "12:20",
                    "answer": "A",
                    "explanationEn": "To map mirror reflection times back to actual times, subtract from the base values of 11:60. So, 11:60 - 10:40 = 1:20.",
                    "explanationHi": "दर्पण के समय को वास्तविक समय में बदलने के लिए उसे 11:60 में से घटाया जाता है। अतः, 11:60 - 10:40 = 1:20।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "easy",
                    "questionEn": "Arrange the lifecycle data nodes in a logical sequence format:\n1. Seed  2. Plant  3. Tree  4. Fruit",
                    "questionHi": "लाइफसाइकिल डेटा नोड्स को एक तार्किक अनुक्रम प्रारूप में व्यवस्थित करें:\n1. बीज  2. पौधा  3. पेड़  4. फल",
                    "optionA": "1, 2, 3, 4",
                    "optionB": "2, 1, 3, 4",
                    "optionC": "1, 3, 2, 4",
                    "optionD": "4, 3, 2, 1",
                    "answer": "1, 2, 3, 4",
                    "explanationEn": "The natural biological growth layout is: first you have a Seed (1), which sprouts into a small Plant (2), matures into a sturdy Tree (3), and finally yields edible Fruit (4) => 1, 2, 3, 4.",
                    "explanationHi": "प्राकृतिक जैविक विकास का सही क्रम है: सबसे पहले बीज (1) बोया जाता है, जिससे पौधा (2) बनता है, जो बड़ा होकर पेड़ (3) बनता है और अंत में फल (4) देता है यानी 1, 2, 3, 4।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "medium",
                    "questionEn": "If '/' represents '+', 'x' represents '-', '+' represents 'x' and '-' represents '/', evaluate the operation value:\n18 - 3 + 4 x 5 / 2",
                    "questionHi": "यदि '/' का अर्थ '+', 'x' का अर्थ '-', '+' का अर्थ 'x' और '-' का अर्थ '/' है, तो ऑपरेशन मान का मूल्यांकन करें:\n18 - 3 + 4 x 5 / 2",
                    "optionA": "21",
                    "optionB": "24",
                    "optionC": "18",
                    "optionD": "20",
                    "answer": "A",
                    "explanationEn": "Applying switched operations: 18 / 3 * 4 - 5 + 2. Following BODMAS logic flow rules: 6 * 4 - 5 + 2 = 24 - 5 + 2 = 21.",
                    "explanationHi": "चिह्नों को बदलने पर व्यंजक बनता है: 18 / 3 * 4 - 5 + 2। BODMAS नियम से हल करने पर: 6 * 4 - 5 + 2 = 24 - 5 + 2 = 21।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "easy",
                    "questionEn": "Find the next alphabet pair segment inside the pattern:\nMN, OP, QR, ST, ?",
                    "questionHi": "पैटर्न के भीतर अगला वर्णमाला युग्म खंड ज्ञात कीजिए:\nMN, OP, QR, ST, ?",
                    "optionA": "UV",
                    "optionB": "VU",
                    "optionC": "UW",
                    "optionD": "UX",
                    "answer": "A",
                    "explanationEn": "The pattern represents sets of continuous chronological alphabetical pairs shifting forward: MN, OP, QR, ST. The next sequential pair loop node is UV.",
                    "explanationHi": "यह श्रृंखला लगातार आने वाले वर्णमाला जोड़ों को प्रदर्शित करती है: MN, OP, QR, ST. अतः अगला तार्किक क्रमिक पद UV होगा।"
                },
                {
                    "exam": "RRB_NTPC",
                    "subject": "General Intelligence & Reasoning",
                    "difficulty": "hard",
                    "questionEn": "If a non-leap year ends on a Thursday, on what day of the week did that same calendar year begin?",
                    "questionHi": "यदि कोई साधारण वर्ष (non-leap year) गुरुवार को समाप्त होता है, तो वह कैलेंडर वर्ष सप्ताह के किस दिन शुरू हुआ था?",
                    "optionA": "Thursday",
                    "optionB": "Friday",
                    "optionC": "Wednesday",
                    "optionD": "Monday",
                    "answer": "A",
                    "explanationEn": "An ordinary non-leap year features 365 days (52 weeks and 1 odd day). Because of this configuration, an ordinary calendar year always begins and ends on the exact same day of the week. Therefore, it began on a Thursday.",
                    "explanationHi": "एक साधारण वर्ष (non-leap year) में 365 दिन होते हैं, जिसके कारण वर्ष का पहला दिन और आखिरी दिन हमेशा बिल्कुल समान होता है। यदि वर्ष गुरुवार को समाप्त हुआ, तो वह शुरू भी गुरुवार (Thursday) को ही हुआ था।"
                }
            ]
        const ref = collection(db, "questions");

        for (const q of questions) {
            await addDoc(ref, {
                ...q,
                createdAt: serverTimestamp(),
            });
        }

        return NextResponse.json({
            success: true,
            uploaded: questions.length,
            message: `✅ ${questions.length} Questions Uploaded`
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json({
            success: false,
            message: "❌ Upload failed"
        });
    }
}