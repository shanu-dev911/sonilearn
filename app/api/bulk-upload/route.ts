
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-client";
import { doc, setDoc } from "firebase/firestore";

export async function GET() {
    try {
        // ==========================================
        // 👇 👇 YAHAN QUESTIONS PASTE KARO 👇 👇
        // ==========================================
        const questions =[
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "easy",
    "questionEn": "Which planet in our solar system takes the shortest time to complete one full revolution around the Sun?",
    "questionHi": "हमारे सौरमंडल का कौन सा ग्रह सूर्य के चारों ओर एक पूर्ण परिक्रमा पूरी करने में सबसे कम समय लेता है?",
    "optionA": "Mercury",
    "optionB": "Venus",
    "optionC": "Mars",
    "optionD": "Earth",
    "answer": "A",
    "explanationEn": "Mercury is the closest planet to the Sun and has the shortest orbital period of approximately 88 Earth days.",
    "explanationHi": "बुध (Mercury) सूर्य के सबसे निकट स्थित ग्रह है, इसलिए इसकी परिक्रमा अवधि सबसे कम यानी लगभग 88 पृथ्वी दिनों की होती है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "medium",
    "questionEn": "Who was the first Indian woman to be crowned Miss World?",
    "questionHi": "मिस वर्ल्ड (Miss World) का खिताब जीतने वाली पहली भारतीय महिला कौन थीं?",
    "optionA": "Reita Faria",
    "optionB": "Aishwarya Rai",
    "optionC": "Sushmita Sen",
    "optionD": "Priyanka Chopra",
    "answer": "A",
    "explanationEn": "Reita Faria Powell became the first Indian and Asian woman to win the Miss World title in the year 1966.",
    "explanationHi": "रीता फारिया (Reita Faria) वर्ष 1966 में मिस वर्ल्ड का प्रतिष्ठित खिताब जीतने वाली पहली भारतीय और एशियाई महिला बनी थीं।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "easy",
    "questionEn": "Which city is globally known as the capital of the state of Jharkhand?",
    "questionHi": "झारखंड राज्य की राजधानी के रूप में विश्व स्तर पर किस शहर को जाना जाता है?",
    "optionA": "Ranchi",
    "optionB": "Jamshedpur",
    "optionC": "Dhanbad",
    "optionD": "Deoghar",
    "answer": "A",
    "explanationEn": "Ranchi is the official capital city of Jharkhand, while Dumka serves as the sub-capital of the state.",
    "explanationHi": "रांची (Ranchi) झारखंड राज्य की आधिकारिक राजधानी है, जबकि दुमका को राज्य की उप-राजधानी का दर्जा प्राप्त है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "medium",
    "questionEn": "Where is the permanent headquarters of the National Bank for Agriculture and Rural Development (NABARD) located?",
    "questionHi": "राष्ट्रीय कृषि और ग्रामीण विकास बैंक (NABARD) का स्थायी मुख्यालय कहाँ स्थित है?",
    "optionA": "Mumbai",
    "optionB": "New Delhi",
    "optionC": "Bengaluru",
    "optionD": "Lucknow",
    "answer": "A",
    "explanationEn": "NABARD, established in 1982 to manage rural credit architecture, is headquartered permanently in Mumbai, Maharashtra.",
    "explanationHi": "नाबार्ड (NABARD) की स्थापना 1982 में ग्रामीण ऋण ढांचे को मजबूत करने के लिए की गई थी, और इसका मुख्यालय मुंबई, महाराष्ट्र में स्थित है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "easy",
    "questionEn": "Who was the first President of independent India?",
    "questionHi": "स्वतंत्र भारत के पहले राष्ट्रपति कौन थे?",
    "optionA": "Dr. Rajendra Prasad",
    "optionB": "Dr. S. Radhakrishnan",
    "optionC": "Dr. Zakir Husain",
    "optionD": "Jawaharlal Nehru",
    "answer": "A",
    "explanationEn": "Dr. Rajendra Prasad served as the first President of the Republic of India from 1950 to 1962, holding office for the longest duration.",
    "explanationHi": "डॉ. राजेंद्र प्रसाद (Dr. Rajendra Prasad) स्वतंत्र भारत के पहले राष्ट्रपति थे, जो 1950 से 1962 तक इस सर्वोच्च पद पर रहे।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "medium",
    "questionEn": "In which Indian state is the famous Bandhavgarh National Park located?",
    "questionHi": "प्रसिद्ध बांधवगढ़ राष्ट्रीय उद्यान (Bandhavgarh National Park) भारत के किस राज्य में स्थित है?",
    "optionA": "Madhya Pradesh",
    "optionB": "Rajasthan",
    "optionC": "Maharashtra",
    "optionD": "Chhattisgarh",
    "answer": "A",
    "explanationEn": "Bandhavgarh National Park is located in the Umaria district of Madhya Pradesh and is known for its high density of Royal Bengal Tigers.",
    "explanationHi": "बांधवगढ़ राष्ट्रीय उद्यान मध्य प्रदेश (Madhya Pradesh) के उमरिया जिले में स्थित है और यह रॉयल बंगाल टाइगर्स की उच्च आबादी के लिए जाना जाता है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "easy",
    "questionEn": "Which day is celebrated as National Farmers' Day (Kisan Diwas) in India every year?",
    "questionHi": "भारत में हर साल किस दिन को 'राष्ट्रीय किसान दिवस' (Kisan Diwas) के रूप में मनाया जाता है?",
    "optionA": "23rd December",
    "optionB": "23rd October",
    "optionC": "15th January",
    "optionD": "2nd October",
    "answer": "A",
    "explanationEn": "National Farmers' Day is celebrated on 23rd December to honor the birth anniversary of the fifth Prime Minister of India, Choudhary Charan Singh.",
    "explanationHi": "भारत के पांचवें प्रधानमंत्री चौधरी चरण सिंह की जयंती के उपलक्ष्य में हर साल 23 दिसंबर को राष्ट्रीय किसान दिवस मनाया जाता है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "medium",
    "questionEn": "Who wrote the famous ancient historical play 'Mudrarakshasa' in Sanskrit?",
    "questionHi": "संस्कृत में प्रसिद्ध प्राचीन ऐतिहासिक नाटक 'मुद्राराक्षस' के लेखक कौन थे?",
    "optionA": "Vishakhadatta",
    "optionB": "Kalidasa",
    "optionC": "Shudraka",
    "optionD": "Bhana",
    "answer": "A",
    "explanationEn": "Mudrarakshasa is a historical play written in Sanskrit by Vishakhadatta, detailing the ascent of King Chandragupta Maurya to power in India.",
    "explanationHi": "'मुद्राराक्षस' गुप्त काल के प्रसिद्ध लेखक विशाखदत्त (Vishakhadatta) द्वारा रचित संस्कृत का एक ऐतिहासिक नाटक है, जो चंद्रगुप्त मौर्य के सत्ता में आने की कहानी बताता है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "easy",
    "questionEn": "Which city is known as the 'Coal Capital of India' due to its massive coal reserves and mining networks?",
    "questionHi": "विशाल कोयला भंडार और खनन नेटवर्क के कारण किस शहर को 'भारत की कोयला राजधानी' कहा जाता है?",
    "optionA": "Dhanbad",
    "optionB": "Ranchi",
    "optionC": "Bokaro",
    "optionD": "Jamshedpur",
    "answer": "A",
    "explanationEn": "Dhanbad is called the Coal Capital of India because of its rich coal fields, including the massive Jharia coal mines.",
    "explanationHi": "झारखंड के धनबाद (Dhanbad) शहर को भारत की कोयला राजधानी कहा जाता है क्योंकि यहाँ देश की सबसे समृद्ध झरिया कोयला खदानें स्थित हैं।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "medium",
    "questionEn": "What is the total number of members currently nominated by the President of India to the Rajya Sabha?",
    "questionHi": "भारत के राष्ट्रपति द्वारा वर्तमान में राज्यसभा में मनोनीत किए जाने वाले सदस्यों की कुल संख्या कितनी है?",
    "optionA": "12",
    "optionB": "10",
    "optionC": "15",
    "optionD": "2",
    "answer": "A",
    "explanationEn": "The President nominations count stands at 12 members to the Rajya Sabha, selected based on outstanding contributions in art, literature, science, and social service.",
    "explanationHi": "राष्ट्रपति द्वारा राज्यसभा में कुल 12 सदस्यों (12 members) को मनोनीत किया जाता है, जो कला, साहित्य, विज्ञान और समाज सेवा के क्षेत्र से जुड़े प्रतिष्ठित व्यक्ति होते हैं।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "easy",
    "questionEn": "Which historical temple monument is located in Deoghar and is famous as one of the twelve Jyotirlingas?",
    "questionHi": "देवघर में कौन सा ऐतिहासिक मंदिर स्मारक स्थित है जो बारह ज्योतिर्लिंगों में से एक के रूप में प्रसिद्ध है?",
    "optionA": "Baba Baidyanath Temple",
    "optionB": "Jagannath Temple",
    "optionC": "Kashi Vishwanath",
    "optionD": "Somnath Temple",
    "answer": "A",
    "explanationEn": "The Baba Baidyanath Temple, located in Deoghar, Jharkhand, is highly revered as a sacred Jyotirlinga site during Shrawan month.",
    "explanationHi": "देवघर में स्थित बाबा बैद्यनाथ मंदिर (Baba Baidyanath Temple) भगवान शिव के पवित्र बारह ज्योतिर्लिंगों में से एक है, जहाँ सावन के महीने में लाखों श्रद्धालु आते हैं।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "medium",
    "questionEn": "Who was the first Indian cricketer to score a double century in One Day International (ODI) matches?",
    "questionHi": "एक दिवसीय अंतर्राष्ट्रीय (ODI) मैचों में दोहरा शतक (Double Century) बनाने वाले पहले भारतीय क्रिकेटर कौन थे?",
    "optionA": "Sachin Tendulkar",
    "optionB": "Rohit Sharma",
    "optionC": "Virender Sehwag",
    "optionD": "Virat Kohli",
    "answer": "A",
    "explanationEn": "Sachin Tendulkar scored 200 not out against South Africa in Gwalior in 2010, becoming the first male player to hit an ODI double century.",
    "explanationHi": "मास्टर ब्लास्टर सचिन तेंदुलकर (Sachin Tendulkar) ने 2010 में ग्वालियर में दक्षिण अफ्रीका के खिलाफ नाबाद 200 रन बनाकर वनडे इतिहास का पहला दोहरा शतक लगाया था।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "easy",
    "questionEn": "What is the capital city of Germany?",
    "questionHi": "जर्मनी की राजधानी शहर कौन सी है?",
    "optionA": "Berlin",
    "optionB": "Frankfurt",
    "optionC": "Munich",
    "optionD": "Hamburg",
    "answer": "A",
    "explanationEn": "Berlin is the capital and largest city of Germany, acting as a major global hub for politics, culture, science, and media networks.",
    "explanationHi": "बर्लिन (Berlin) जर्मनी की आधिकारिक राजधानी है, जो अपने समृद्ध इतिहास और सांस्कृतिक महत्व के लिए प्रसिद्ध है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "medium",
    "questionEn": "Which prestigious literature honor is recognized as the highest literary award in the Republic of India?",
    "questionHi": "भारत गणराज्य में सर्वोच्च साहित्यिक सम्मान के रूप में किस पुरस्कार को मान्यता दी गई है?",
    "optionA": "Jnanpith Award",
    "optionB": "Sahitya Akademi Award",
    "optionC": "Saraswati Samman",
    "optionD": "Vyas Samman",
    "answer": "A",
    "explanationEn": "The Jnanpith Award, instituted in 1961, is presented annually by the Bharatiya Jnanpith to an author for their outstanding contribution towards literature.",
    "explanationHi": "ज्ञानपीठ पुरस्कार (Jnanpith Award) भारत का सर्वोच्च साहित्यिक सम्मान है, जो भारतीय संविधान की 8वीं अनुसूची में शामिल भाषाओं के लेखकों को उनके उत्कृष्ट योगदान के लिए दिया जाता है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "easy",
    "questionEn": "In which year did the historic Jallianwala Bagh Massacre take place in Amritsar?",
    "questionHi": "अमृतसर में ऐतिहासिक जलियाँवाला बाग हत्याकांड (Jallianwala Bagh Massacre) किस वर्ष हुआ था?",
    "optionA": "1919",
    "optionB": "1920",
    "optionC": "1915",
    "optionD": "1931",
    "answer": "A",
    "explanationEn": "The Jallianwala Bagh Massacre occurred on 13th April 1919, when British troops under General Dyer opened fire on a crowd of peaceful protesters.",
    "explanationHi": "13 अप्रैल 1919 को बैसाखी के दिन अमृतसर के जलियाँवाला बाग में ब्रिगेडियर जनरल डायर के आदेश पर ब्रिटिश सेना ने निहत्थे प्रदर्शनकारियों पर अंधाधुंध गोलियां चलाई थीं।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "medium",
    "questionEn": "Which operational water channel separates the Andaman Islands from the Nicobar Islands dynamically?",
    "questionHi": "कौन सा जलमार्ग (water channel) अंडमान द्वीप समूह को निकोबार द्वीप समूह से अलग करता है?",
    "optionA": "Ten Degree Channel",
    "optionB": "Nine Degree Channel",
    "optionC": "Eight Degree Channel",
    "optionD": "Palk Strait",
    "answer": "A",
    "explanationEn": "The Ten Degree Channel is a channel that separates the Andaman Islands and Nicobar Islands from each other in the Bay of Bengal.",
    "explanationHi": "10 डिग्री चैनल (Ten Degree Channel) बंगाल की खाड़ी में स्थित एक जलमार्ग है जो अंडमान द्वीप समूह और निकोबार द्वीप समूह को एक-दूसरे से भौगोलिक रूप से अलग करता है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "easy",
    "questionEn": "What is the official currency of the European Union member states using the shared zone system?",
    "questionHi": "साझा क्षेत्र प्रणाली का उपयोग करने वाले यूरोपीय संघ के सदस्य देशों की आधिकारिक मुद्रा क्या है?",
    "optionA": "Euro",
    "optionB": "Pound",
    "optionC": "Dollar",
    "optionD": "Franc",
    "answer": "A",
    "explanationEn": "The Euro (€) is the official currency of 20 of the 27 member states of the European Union, collectively known as the Eurozone.",
    "explanationHi": "यूरो (Euro - €) यूरोपीय संघ (EU) के 27 में से 20 सदस्य देशों की आधिकारिक साझा कानूनी मुद्रा है, जिसे यूरोज़ोन कहा जाता है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "medium",
    "questionEn": "Who has the final constitutional authority to decide whether a particular bill is a Money Bill or not in the Parliament?",
    "questionHi": "संसद में कोई विशेष विधेयक 'धन विधेयक' (Money Bill) है या नहीं, इसका अंतिम संवैधानिक निर्णय लेने का अधिकार किसके पास है?",
    "optionA": "The Speaker of Lok Sabha",
    "optionB": "The President of India",
    "optionC": "The Prime Minister",
    "optionD": "The Chairman of Rajya Sabha",
    "answer": "A",
    "explanationEn": "According to Article 110(3) of the Indian Constitution, the decision of the Speaker of the Lok Sabha on whether a bill is a Money Bill is final.",
    "explanationHi": "भारतीय संविधान के अनुच्छेद 110(3) के तहत, कोई विधेयक धन विधेयक है या नहीं, इसका अंतिम निर्णय लेने की पूर्ण शक्ति केवल लोकसभा अध्यक्ष (Speaker) के पास होती है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "easy",
    "questionEn": "Which dynamic river is famously known as the lifeline of the state of Goa?",
    "questionHi/": "किस गतिशील नदी को लोकप्रिय रूप से गोवा राज्य की जीवन रेखा (lifeline) कहा जाता है?",
    "optionA": "Mandovi River",
    "optionB": "Zuari River",
    "optionC": "Periyar River",
    "optionD": "Krishna River",
    "answer": "A",
    "explanationEn": "The Mandovi River (also called Mahadayi) is recognized as the lifeline of Goa due to its vital role in drinking water, agriculture, and transit.",
    "explanationHi": "मांडवी नदी (Mandovi River) को गोवा राज्य की जीवन रेखा माना जाता है, जो राज्य के पीने के पानी और कृषि सिंचाई के लिए सबसे मुख्य स्रोत है।"
  },
  {
    "exam": "RRB_ALP",
    "subject": "General Awareness",
    "difficulty": "hard",
    "questionEn": "Who founded the historic social reform organization 'Satyashodhak Samaj' in Maharashtra in 1873?",
    "questionHi": "1873 में महाराष्ट्र में प्रसिद्ध सामाजिक सुधार संगठन 'सत्यशोधक समाज' (Satyashodhak Samaj) की स्थापना किसने की थी?",
    "optionA": "Jyotirao Phule",
    "optionB": "Dr. B.R. Ambedkar",
    "optionC": "Atmaram Pandurang",
    "optionD": "Mahadev Govind Ranade",
    "answer": "A",
    "explanationEn": "Satyashodhak Samaj was founded by Mahatma Jyotirao Phule in Pune, Maharashtra, in 1875 to eliminate caste discrimination and empower women and lower classes.",
    "explanationHi": "सत्यशोधक समाज की स्थापना महात्मा ज्योतिराव फुले (Jyotirao Phule) द्वारा 1873 में पुणे, महाराष्ट्र में की गई थी, जिसका मुख्य उद्देश्य शोषित वर्गों और महिलाओं को शिक्षित एवं सशक्त बनाना था।"
  }
]
        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json({ success: false, message: "❌ Code ke andar array khali hai!" }, { status: 400 });
        }

        // Exact utni hi baar chalega jitne questions aapne paste kiye hain
        for (let i = 0; i < questions.length; i++) {
            // Har ek question ki exact unique ID generate hogi taaki koi data overwrite na ho
            const uniqueDocId = `q_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const docRef = doc(db, "questions", uniqueDocId);
            
            await setDoc(docRef, {
                ...questions[i],
                createdAt: new Date().toISOString()
            });
        }

        return NextResponse.json({
            success: true,
            uploaded: questions.length,
            message: `✅ Perfect! Exact ${questions.length} Questions ek hi jagah 'questions' collection mein upload ho gaye!`
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