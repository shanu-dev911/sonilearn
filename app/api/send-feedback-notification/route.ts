import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userName, userEmail, message } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: "Telegram config missing" }, { status: 500 });
    }

    const text = `📩 *New Feedback Received!*\n\n👤 *Name:* ${userName}\n📧 *Email:* ${userEmail}\n\n💬 *Message:*\n${message}`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram notification error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}