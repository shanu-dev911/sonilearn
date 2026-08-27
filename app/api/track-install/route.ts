import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, uid } = body;

    const BOT_TOKEN = process.env.TELEGRAM_INSTALL_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_INSTALL_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ success: false, message: 'Telegram credentials missing' });
    }

    const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const message = 
      `🎉 *New SoniLearn App Installed!*\n\n` +
      `👤 *User Name:* ${name}\n` +
      `📧 *Email:* ${email}\n` +
      `📞 *Phone:* ${phone}\n` +
      `🆔 *UID:* ${uid}\n` +
      `⏰ *Time:* ${time}`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Install track error:', error);
    return NextResponse.json({ success: false });
  }
}