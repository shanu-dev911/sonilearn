export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-client";
import { doc, setDoc } from "firebase/firestore";

// Array ke options ko live shake/shuffle karne ki utility
function shuffleOptions(array: string[]): string[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export async function GET() {
    try {
        // ==========================================
        // 👇 👇 BATCH 2 QUESTIONS PASTED HERE 👇 👇
        // ==========================================
        const questions = [
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "easy",
                "questionEn": "Which of the following blood groups is known as the Universal Donor?",
                "questionHi": "निम्नलिखित में से किस रक्त समूह को 'सार्वभौमिक दाता' (Universal Donor) कहा जाता है?",
                "optionA": "AB+",
                "optionB": "O-",
                "optionC": "A+",
                "optionD": "B-",
                "answer": "B",
                "explanationEn": "Blood group O-negative (O-) does not have any antigens on the red blood cells, making it safe to give to anyone in an emergency.",
                "explanationHi": "रक्त समूह ओ-नेगेटिव (O-) की लाल रक्त कोशिकाओं पर कोई एंटीजन नहीं होता है, जिससे आपातकालीन स्थिति में इसे किसी को भी देना सुरक्षित होता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "medium",
                "questionEn": "What is the commercial unit of electrical energy?",
                "questionHi": "विद्युत ऊर्जा की व्यावसायिक इकाई (Commercial Unit) क्या है?",
                "optionA": "Watt / वाट",
                "optionB": "Joule / जूल",
                "optionC": "Kilowatt-hour / किलोवाट-घंटा",
                "optionD": "Volt / वोल्ट",
                "answer": "C",
                "explanationEn": "The commercial unit of electric energy is Kilowatt-hour (kWh), commonly known as a 'unit'.",
                "explanationHi": "विद्युत ऊर्जा की व्यावसायिक इकाई किलोवाट-घंटा (kWh) है, जिसे आमतौर पर 'यूनिट' कहा जाता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "easy",
                "questionEn": "Which organ in the human body is primarily affected by the disease Hepatitis?",
                "questionHi": "हेपेटाइटिस रोग से मानव शरीर का कौन सा अंग मुख्य रूप से प्रभावित होता है?",
                "optionA": "Lungs / फेफड़े",
                "optionB": "Kidneys / गुर्दे",
                "optionC": "Heart / हृदय",
                "optionD": "Liver / यकृत (लीवर)",
                "answer": "D",
                "explanationEn": "Hepatitis refers to the inflammation of the liver, which can be caused by viral infections or toxins.",
                "explanationHi": "हेपेटाइटिस का तात्पर्य लीवर की सूजन से है, जो वायरल संक्रमण या विषाक्त पदार्थों के कारण हो सकता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "medium",
                "questionEn": "What is the focal length of a flat plane mirror?",
                "questionHi": "एक समतल दर्पण (Plane Mirror) की फोकस दूरी क्या होती है?",
                "optionA": "Zero / शून्य",
                "optionB": "Infinity / अनंत",
                "optionC": "25 cm / 25 सेमी",
                "optionD": "10 cm / 10 सेमी",
                "answer": "B",
                "explanationEn": "A plane mirror has no curvature, so its focal length is considered to be infinity.",
                "explanationHi": "एक समतल दर्पण में कोई वक्रता नहीं होती है, इसलिए इसकी फोकस दूरी को अनंत माना जाता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "easy",
                "questionEn": "Which planet is known as the 'Red Planet' due to the presence of iron oxide on its surface?",
                "questionHi": "सतह पर आयरन ऑक्साइड की उपस्थिति के कारण किस ग्रह को 'लाल ग्रह' कहा जाता है?",
                "optionA": "Venus / शुक्र",
                "optionB": "Saturn / शनि",
                "optionC": "Mars / मंगल",
                "optionD": "Jupiter / बृहस्पति",
                "answer": "C",
                "explanationEn": "Mars is known as the Red Planet because iron minerals in its soil oxidize, or rust, making the soil and atmosphere look red.",
                "explanationHi": "मंगल को लाल ग्रह के रूप में जाना जाता है क्योंकि इसकी मिट्टी में मौजूद लोहे के खनिज ऑक्सीकृत (जंग) हो जाते हैं, जिससे मिट्टी और वातावरण लाल दिखाई देता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "medium",
                "questionEn": "What is the chemical name of Bleaching Powder?",
                "questionHi": "ब्लीचिंग पाउडर का रासायनिक नाम क्या है?",
                "optionA": "Sodium Carbonate / सोडियम कार्बोनेट",
                "optionB": "Calcium Sulfate / कैल्शियम सल्फेट",
                "optionC": "Calcium Oxychloride / कैल्शियम ऑक्सीक्लोराइड",
                "optionD": "Calcium Hydroxide / कैल्शियम हाइड्रोक्साइड",
                "answer": "C",
                "explanationEn": "Bleaching powder is chemically known as Calcium Oxychloride with the formula CaOCl2.",
                "explanationHi": "ब्लीचिंग पाउडर को रासायनिक रूप से कैल्शियम ऑक्सीक्लोराइड कहा जाता है जिसका सूत्र CaOCl2 है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "easy",
                "questionEn": "Which component of blood is responsible for clotting at the site of an injury?",
                "questionHi": "चोट लगने के स्थान पर रक्त का थक्का (Clotting) बनाने के लिए रक्त का कौन सा घटक जिम्मेदार है?",
                "optionA": "Red Blood Cells / लाल रक्त कोशिकाएं",
                "optionB": "White Blood Cells / सफेद रक्त कोशिकाएं",
                "optionC": "Plasma / प्लाज्मा",
                "optionD": "Platelets / प्लेटलेट्स",
                "answer": "D",
                "explanationEn": "Platelets circulate in our blood and bind together at the site of damaged blood vessels to form a clot and stop bleeding.",
                "explanationHi": "प्लेटलेट्स हमारे रक्त में प्रवाहित होते हैं और क्षतिग्रस्त रक्त वाहिकाओं के स्थान पर आपस में जुड़कर थक्का बनाते हैं और रक्तस्राव को रोकते हैं।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "medium",
                "questionEn": "Which law states that the current flowing through a conductor is directly proportional to the potential difference across its ends?",
                "questionHi": "कौन सा नियम बताता है कि किसी चालक से बहने वाली धारा उसके सिरों के बीच विभवांतर के सीधे आनुपातिक होती है?",
                "optionA": "Newton's Law / न्यूटन का नियम",
                "optionB": "Ohm's Law / ओम का नियम",
                "optionC": "Coulomb's Law / कूलाम का नियम",
                "optionD": "Faraday's Law / फैराडे का नियम",
                "answer": "B",
                "explanationEn": "Ohm's Law states that V = IR, meaning voltage (V) and current (I) are directly proportional under constant physical conditions.",
                "explanationHi": "ओम का नियम बताता है कि V = IR, जिसका अर्थ है कि स्थिर भौतिक परिस्थितियों में वोल्टेज (V) और धारा (I) सीधे आनुपातिक होते हैं।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "easy",
                "questionEn": "Deficiency of Vitamin A in the human body leads to which of the following diseases?",
                "questionHi": "मानव शरीर में विटामिन A की कमी से निम्नलिखित में से कौन सा रोग होता है?",
                "optionA": "Night Blindness / रतौंधी",
                "optionB": "Scurvy / स्कर्वी",
                "optionC": "Rickets / सूखा रोग",
                "optionD": "Beriberi / बेरीबेरी",
                "answer": "A",
                "explanationEn": "Vitamin A deficiency affects the production of rhodopsin, a pigment necessary for seeing in low light, causing night blindness.",
                "explanationHi": "विटामिन A की कमी रोडोप्सिन के उत्पादन को प्रभावित करती है, जो कम रोशनी में देखने के लिए आवश्यक पिगमेंट है, जिससे रतौंधी रोग होता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "medium",
                "questionEn": "Which of the following mirrors is used by dentists to see a magnified image of teeth?",
                "questionHi": "दांतों का बड़ा (Magnified) प्रतिबिंब देखने के लिए दंत चिकित्सकों द्वारा निम्नलिखित में से किस दर्पण का उपयोग किया जाता है?",
                "optionA": "Convex Mirror / उत्तल दर्पण",
                "optionB": "Plane Mirror / समतल दर्पण",
                "optionC": "Concave Mirror / अवतल दर्पण",
                "optionD": "Cylindrical Mirror / बेलनाकार दर्पण",
                "answer": "C",
                "explanationEn": "A concave mirror forms an erect and magnified image of an object when placed close to it, helping dentists see details clearly.",
                "explanationHi": "एक अवतल दर्पण किसी वस्तु को पास रखने पर उसका सीधा और बड़ा प्रतिबिंब बनाता है, जिससे दंत चिकित्सकों को विवरण स्पष्ट रूप से देखने में मदद मिलती है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "easy",
                "questionEn": "What is the primary gas present in Natural Gas and CNG?",
                "questionHi": "प्राकृतिक गैस (Natural Gas) और सीएनजी (CNG) में मौजूद मुख्य गैस कौन सी है?",
                "optionA": "Methane / मीथेन",
                "optionB": "Butane / ब्यूटेन",
                "optionC": "Propane / प्रोपेन",
                "optionD": "Ethane / ईथेन",
                "answer": "A",
                "explanationEn": "Methane (CH4) makes up around 70-90% of the composition of compressed natural gas (CNG).",
                "explanationHi": "संपीड़ित प्राकृतिक गैस (CNG) के संयोजन में लगभग 70-90% हिस्सा मीथेन (CH4) का होता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "medium",
                "questionEn": "What is the chemical name of Rust?",
                "questionHi": "जंग (Rust) का रासायनिक नाम क्या है?",
                "optionA": "Ferrous Sulfate / फेरस सल्फेट",
                "optionB": "Iron Chloride / आयरन क्लोराइड",
                "optionC": "Hydrated Ferric Oxide / हाइड्रेटेड फेरिक ऑक्साइड",
                "optionD": "Iron Carbonate / आयरन कार्बोनेट",
                "answer": "C",
                "explanationEn": "Rust is formed by the reaction of iron with oxygen in the presence of water, chemically known as Hydrated Ferric Oxide (Fe2O3·nH2O).",
                "explanationHi": "पानी की उपस्थिति में ऑक्सीजन के साथ लोहे की प्रतिक्रिया से जंग का निर्माण होता है, जिसे रासायनिक रूप से हाइड्रेटेड फेरिक ऑक्साइड (Fe2O3·nH2O) कहा जाता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "easy",
                "questionEn": "Which acid is present in the sting of an ant, causing a burning sensation?",
                "questionHi": "चींटी के डंक में कौन सा अम्ल मौजूद होता है, जिसके कारण जलन का अनुभव होता है?",
                "optionA": "Formic Acid / फॉर्मिक अम्ल",
                "optionB": "Citric Acid / साइट्रिक अम्ल",
                "optionC": "Acetic Acid / एसिटिक अम्ल",
                "optionD": "Oxalic Acid / ऑक्जेलिक अम्ल",
                "answer": "A",
                "explanationEn": "Ant stings contain formic acid (also called methanoic acid), which injected into the skin causes irritation.",
                "explanationHi": "चींटी के डंक में फॉर्मिक अम्ल (जिसे मेथेनोइक अम्ल भी कहा जाता है) होता है, जो त्वचा में जाने पर जलन और दर्द पैदा करता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "medium",
                "questionEn": "Sound waves are what type of waves based on their propagation?",
                "questionHi": "ध्वनि तरंगें अपने संचरण के आधार पर किस प्रकार की तरंगें हैं?",
                "optionA": "Transverse Waves / अनुप्रस्थ तरंगें",
                "optionB": "Electromagnetic Waves / विद्युत चुंबकीय तरंगें",
                "optionC": "Longitudinal Mechanical Waves / अनुदैर्ध्य यांत्रिक तरंगें",
                "optionD": "Non-mechanical Waves / अयांत्रिक तरंगें",
                "answer": "C",
                "explanationEn": "Sound waves are longitudinal waves because the particles of the medium vibrate parallel to the direction of wave propagation.",
                "explanationHi": "ध्वनि तरंगें अनुदैर्ध्य (Longitudinal) तरंगें हैं क्योंकि माध्यम के कण तरंग संचरण की दिशा के समानांतर कंपन करते हैं।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "easy",
                "questionEn": "Which standard metal is kept immersed in kerosene oil due to its extreme reactivity with air and water?",
                "questionHi": "हवा और पानी के साथ अत्यधिक प्रतिक्रियाशीलता के कारण किस मानक धातु को मिट्टी के तेल (Kerosene) में डुबोकर रखा जाता है?",
                "optionA": "Sodium / सोडियम",
                "optionB": "Magnesium / मैग्नीशियम",
                "optionC": "Calcium / कैल्शियम",
                "optionD": "Zinc / जस्ता",
                "answer": "A",
                "explanationEn": "Sodium is highly reactive and catches fire instantly when it comes into contact with moisture in the air, so it is stored in kerosene.",
                "explanationHi": "सोडियम अत्यधिक प्रतिक्रियाशील होता है और हवा में नमी के संपर्क में आते ही तुरंत आग पकड़ लेता है, इसलिए इसे मिट्टी के तेल में रखा जाता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "medium",
                "questionEn": "What type of energy conversion takes place inside a dry cell (battery)?",
                "questionHi": "एक सूखे सेल (बैटरी) के भीतर किस प्रकार का ऊर्जा परिवर्तन होता है?",
                "optionA": "Electrical to Chemical / विद्युत से रासायनिक",
                "optionB": "Chemical to Electrical / रासायनिक से विद्युत",
                "optionC": "Mechanical to Electrical / यांत्रिक से विद्युत",
                "optionD": "Heat to Electrical / ऊष्मा से विद्युत",
                "answer": "B",
                "explanationEn": "A battery or cell stores energy in chemical form and converts it into electrical energy during a redox reaction.",
                "explanationHi": "एक बैटरी या सेल रासायनिक रूप में ऊर्जा को संग्रहीत करता है और रेडॉक्स प्रतिक्रिया के दौरान इसे विद्युत ऊर्जा में परिवर्तित करता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "easy",
                "questionEn": "What is the powerhouse of the cell called?",
                "questionHi": "कोशिका का पावरहाउस (ऊर्जा गृह) किसे कहा जाता है?",
                "optionA": "Mitochondria / माइटोकॉन्ड्रिया",
                "optionB": "Nucleus / केंद्रक",
                "optionC": "Ribosome / राइबोसोम",
                "optionD": "Golgi Bodies / गोल्गी काय",
                "answer": "A",
                "explanationEn": "Mitochondria are called the powerhouses of the cell because they produce ATP, the energy currency of the cell.",
                "explanationHi": "माइटोकॉन्ड्रिया को कोशिका का पावरहाउस कहा जाता है क्योंकि वे ATP का उत्पादन करते हैं, जो कोशिका की ऊर्जा मुद्रा है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "medium",
                "questionEn": "Which atmospheric layer contains the Ozone layer that protects us from harmful UV rays?",
                "questionHi": "किस वायुमंडलीय परत में ओजोन परत होती है जो हमें हानिकारक यूवी (UV) किरणों से बचाती है?",
                "optionA": "Troposphere / क्षोभमंडल",
                "optionB": "Stratosphere / समतापमंडल",
                "optionC": "Mesosphere / मध्यमंडल",
                "optionD": "Thermosphere / बाह्यवायुमंडल",
                "answer": "B",
                "explanationEn": "The ozone layer is found in the lower region of the Stratosphere, absorbing most of the Sun's harmful ultraviolet radiation.",
                "explanationHi": "ओजोन परत समतापमंडल (Stratosphere) के निचले क्षेत्र में पाई जाती है, जो सूर्य के हानिकारक पराबैंगनी विकिरण के अधिकांश हिस्से को अवशोषित करती है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "easy",
                "questionEn": "What is the normal temperature of a healthy human body on the Celsius scale?",
                "questionHi": "सेल्सियस स्केल पर एक स्वस्थ मानव शरीर का सामान्य तापमान कितना होता है?",
                "optionA": "37°C",
                "optionB": "98.6°C",
                "optionC": "32°C",
                "optionD": "40°C",
                "answer": "A",
                "explanationEn": "The standard average body temperature of a healthy human is 37°C (98.6°F) on the Celsius scale.",
                "explanationHi": "एक स्वस्थ मानव शरीर का मानक औसत तापमान सेल्सियस स्केल पर 37°C (और फ़ारेनहाइट पर 98.6°F) होता है।"
            },
            {
                "exam": "RRB_Technician",
                "subject": "General Science",
                "difficulty": "medium",
                "questionEn": "Which metal is liquid at room temperature?",
                "questionHi": "कमरे के तापमान पर कौन सी धातु तरल (द्रव) अवस्था में होती है?",
                "optionA": "Bromine / ब्रोमीन",
                "optionB": "Mercury / पारा",
                "optionC": "Gallium / गैलियम",
                "optionD": "Sodium / सोडियम",
                "answer": "B",
                "explanationEn": "Mercury is the only metallic element that is liquid at standard conditions for temperature and pressure.",
                "explanationHi": "पारा (Mercury) एकमात्र ऐसा धातु तत्व है जो तापमान और दबाव की मानक स्थितियों में तरल अवस्था में रहता है।"
            }
        ]

        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json({ success: false, message: "❌ Code ke andar array khali hai!" }, { status: 400 });
        }

        let uploadCount = 0;

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            // ---- 1. BAD DATA FILTER ----
            if (!q.questionEn || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.answer) {
                continue;
            }

            // ---- 2. BACKEND LIVE AUTO-CORRECT ENGINE ----
            // Pata lagao ki raw answer key string ke mutabik correct text kya hai
            let realCorrectAnswerText = "";
            if (q.answer === "A") realCorrectAnswerText = q.optionA;
            else if (q.answer === "B") realCorrectAnswerText = q.optionB;
            else if (q.answer === "C") realCorrectAnswerText = q.optionC;
            else if (q.answer === "D") realCorrectAnswerText = q.optionD;

            if (!realCorrectAnswerText) realCorrectAnswerText = q.optionA;

            // Options ko strict clean dynamic mix karo
            const optionsPool = [q.optionA, q.optionB, q.optionC, q.optionD];
            const randomizedOptions = shuffleOptions(optionsPool);

            const sanitizedQuestion = {
                ...q,
                optionA: randomizedOptions[0],
                optionB: randomizedOptions[1],
                optionC: randomizedOptions[2],
                optionD: randomizedOptions[3],
                answer: "A" // Safe default assignation
            };

            // Correct string target update tracker logic
            if (sanitizedQuestion.optionA === realCorrectAnswerText) sanitizedQuestion.answer = "A";
            else if (sanitizedQuestion.optionB === realCorrectAnswerText) sanitizedQuestion.answer = "B";
            else if (sanitizedQuestion.optionC === realCorrectAnswerText) sanitizedQuestion.answer = "C";
            else if (sanitizedQuestion.optionD === realCorrectAnswerText) sanitizedQuestion.answer = "D";

            // ---- 3. SECURE WRITE TO FIRESTORE ----
            // Hum har doc ki ID pure manual standard fix parameter par match karenge
            const uniqueDocId = `q_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const docRef = doc(db, "questions", uniqueDocId);

            await setDoc(docRef, {
                ...sanitizedQuestion,
                createdAt: new Date().toISOString()
            });

            uploadCount++;
        }

        return NextResponse.json({
            success: true,
            uploaded: uploadCount,
            message: `✅ Gazab Shanu bhai! Pure ${uploadCount} questions autoshuffled aur sanitized hokar direct database mein load ho gaye!`
        });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({
            success: false,
            message: "❌ Upload failed",
            error: error.message
        }, { status: 500 });
    }
}