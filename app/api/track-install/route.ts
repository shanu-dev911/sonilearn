import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, phone, uid } = body;

        // 🎯 Reuse the same Telegram bot already used for feedback notifications
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            console.error('Telegram credentials missing on server!');
            return NextResponse.json({ success: false, message: 'Telegram credentials missing' }, { status: 500 });
        }

        const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        // 🎯 Plain text — avoids Markdown parse failures from special characters
        const message =
            'New SoniLearn App Installed!\n\n' +
            'User Name: ' + (name || 'Unknown') + '\n' +
            'Email: ' + (email || 'N/A') + '\n' +
            'Phone: ' + (phone || 'N/A') + '\n' +
            'UID: ' + (uid || 'N/A') + '\n' +
            'Time: ' + time;

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const res = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
            }),
        });

        const data = await res.json();

        if (!data.ok) {
            console.error('Telegram API Rejection:', data);
            return NextResponse.json({ success: false, error: data.description }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Install track error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}