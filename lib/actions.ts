import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini setup
const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY || ""
);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

export async function askAIWithImage(
    prompt: string,
    imageBase64: string
) {
    try {

        // FIX IMAGE STRING
        const base64Image = imageBase64 || "";

        const cleanBase64 =
            typeof base64Image === "string"
                ? base64Image.split(",")[1] || base64Image
                : "";

        // IMAGE DATA
        const imageData = {
            inlineData: {
                data: cleanBase64,
                mimeType: "image/jpeg",
            },
        };

        // SEND TO AI
        const result = await model.generateContent([
            prompt,
            imageData,
        ]);

        const response = await result.response;

        const text = response.text();

        return {
            success: true,
            answer: text,
        };

    } catch (error) {

        console.error("AI IMAGE ERROR:", error);

        return {
            success: false,
            answer: "Something went wrong",
        };
    }
}