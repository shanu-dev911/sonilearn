export async function sendErrorToPhone(fileName: string, errorMessage: string) {
    // ⚠️ Isko baad mein Telegram API se connect karenge
    // Abhi ke liye hum ek Free Webhook ya Email/Telegram Alert yahan setup kar sakte hain.

    // Telegram Bot Details (Main aapko aage bataunga ye kahan se milega, 100% Free hai)
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const messageText = `
🚨 *SoniLearn Error Alert* 🚨
📂 *File:* ${fileName}
❌ *Error:* ${errorMessage}
⏰ *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
    `;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log("⚠️ Telegram Setup missing. Error Alert Console mein print ho raha hai:");
        console.log(messageText);
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: messageText,
                parse_mode: "Markdown"
            })
        });
    } catch (err) {
        console.error("❌ Alert bhejne mein galti hui:", err);
    }
}