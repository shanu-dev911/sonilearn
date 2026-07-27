import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON Payload" }, { status: 400 });
    }

    const { userName, userEmail, message } = body;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Check if env variables are defined on Vercel
    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Missing Telegram Env Variables on Server!");
      return NextResponse.json(
        { error: "Server Configuration Missing: Telegram Credentials" },
        { status: 500 }
      );
    }

    const textMessage = `🚀 *New Feedback Received!*\n\n👤 *Name:* ${userName || "Student"}\n📧 *Email:* ${userEmail || "N/A"}\n💬 *Message:* ${message}`;

    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const res = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: textMessage,
        parse_mode: "Markdown",
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      console.error("Telegram API Rejection:", data);
      return NextResponse.json({ error: data.description || "Telegram API Error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Internal Route Execution Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Failure" }, { status: 500 });
  }
}