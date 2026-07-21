import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userName, userEmail, message } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("Telegram env vars missing!", { botToken: !!botToken, chatId: !!chatId });
      return NextResponse.json({ error: "Telegram config missing" }, { status: 500 });
    }

    const safeName = (userName || "Unknown").replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
    const safeEmail = (userEmail || "N/A").replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
    const safeMessage = (message || "").replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");

    const text = "New Feedback Received!\n\nName: " + safeName + "\nEmail: " + safeEmail + "\n\nMessage:\n" + safeMessage;

    const telegramUrl = "https://api.telegram.org/bot" + botToken + "/sendMessage";

    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error("Telegram API error:", result);
      return NextResponse.json({ error: "Telegram send failed", details: result }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram notification error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}