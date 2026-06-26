import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ Safe API key check
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing in .env.local");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateAIQuestion(exam: string, subject: string) {
    try {
        // ✅ FIXED MODEL NAME
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            generationConfig: {
                temperature: 0.7,
                topP: 1,
                topK: 1,
                maxOutputTokens: 4096,
            },
        });

        const prompt = `
Generate 1 SSC level multiple choice question.

Exam: ${exam}
Subject: ${subject}

Return ONLY pure JSON:

{
  "questionEn": "Question in English",
  "questionHi": "Question in Hindi",
  "optionA": "Option A",
  "optionB": "Option B",
  "optionC": "Option C",
  "optionD": "Option D",
  "answer": "A",
  "explanationEn": "Explanation in English",
  "explanationHi": "Explanation in Hindi"
}

Rules:
- Hindi + English both
- No markdown
- No extra text
`;

        const result = await model.generateContent(prompt);

        const text = result.response.text();

        if (!text) {
            throw new Error("Empty AI response");
        }

        // 🧹 Clean response
        const cleaned = text.replace(/```json|```/g, "").trim();

        let parsed;

        try {
            parsed = JSON.parse(cleaned);
        } catch (err) {
            console.error("JSON Parse Error:", cleaned);
            throw new Error("Invalid JSON from AI");
        }

        return parsed;

    } catch (error) {
        console.error("Gemini Error:", error);

        // 🔥 STRONG fallback (production safe)
        return {
            questionEn: "What is 2 + 2?",
            questionHi: "2 + 2 कितना होता है?",
            optionA: "2",
            optionB: "3",
            optionC: "4",
            optionD: "5",
            answer: "C",
            explanationEn: "2 + 2 = 4",
            explanationHi: "2 + 2 = 4 होता है",
        };
    }
}