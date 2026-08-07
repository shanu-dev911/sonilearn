import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `Tum SoniLearn AI Doubt Solver ho — expert Indian competitive exam tutor.

Tumhara kaam: SSC, UPSC, Railway, Banking, State PSC ke students ke doubts clear karna.

Rules:
- Hinglish mein jawab do (Hindi + English mix) — simple aur clear
- Seedha point pe aao, unnecessary bakar mat karo
- Formulas, dates, facts — CAPS mein highlight karo
- Answer ke end mein ek line "Key Takeaway:" zaroor likho
- Maximum 200 words rakho jab tak poora explanation zaruri na ho`;

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Support both formats:
        // 1. Frontend bhejta hai: { messages: [...] }  (conversation history)
        // 2. Simple format:       { message: "..." }   (single message)
        const messages = body.messages ?? [
            { role: "user", content: [{ type: "text", text: body.message ?? "" }] },
        ];

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            systemInstruction: SYSTEM_PROMPT,
        });

        // Anthropic format → Gemini format
        const geminiHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: buildParts(m.content),
        }));

        const lastMessage = messages[messages.length - 1];
        const lastParts = buildParts(lastMessage.content);

        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(lastParts);
        const text = result.response.text();

        // Anthropic jaisa format return karo — frontend same rahega
        return Response.json({
            content: [{ type: "text", text }],
        });

    } catch (error: any) {
        console.error("Chat API error:", error);
        return Response.json(
            { content: [{ type: "text", text: "⚠️ Server error. Thodi der baad try karo." }] },
            { status: 500 }
        );
    }
}

// Anthropic content array → Gemini parts array
function buildParts(content: any[]): any[] {
    return content.map((c) => {
        if (c.type === "text") {
            return { text: c.text || "(koi message nahi)" };
        }
        if (c.type === "image") {
            return {
                inlineData: {
                    mimeType: c.source?.media_type ?? "image/jpeg",
                    data: c.source?.data ?? "",
                },
            };
        }
        return { text: "" };
    });
}