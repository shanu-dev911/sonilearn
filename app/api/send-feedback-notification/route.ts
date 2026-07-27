import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userName, userEmail, message } = body;

    // .trim() lagane se aage-peeche ke extra spaces remove ho jate hain
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim();

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Missing Env Variables in Vercel!");
      return NextResponse.json({ error: "Missing Env Variables" }, { status: 500 });
    }

    const text = `🚀 *New Feedback*\n\n👤 *Name:* ${userName || "User"}\n📧 *Email:* ${userEmail || "N/A"}\n💬 *Message:* ${message}`;

    // Exact standard Telegram URL
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("Telegram API Rejection:", data);
      return NextResponse.json({ error: data.description }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}