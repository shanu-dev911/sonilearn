import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const MINIMUM_WITHDRAWAL_INR = 80;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, upiId } = body;

        if (!userId || !upiId || typeof upiId !== "string") {
            return NextResponse.json(
                { success: false, error: "User ID और मान्य UPI ID अनिवार्य है।" },
                { status: 400 }
            );
        }

        const cleanUpi = upiId.trim();

        // Basic UPI ID validation (e.g. name@bank)
        if (!cleanUpi.includes("@")) {
            return NextResponse.json(
                { success: false, error: "कृपया सही UPI ID दर्ज करें (उदा. username@oksbi या 9876543210@paytm)।" },
                { status: 400 }
            );
        }

        const db = getDb();
        const userRef = db.collection("users").doc(userId);

        let payoutAmount = 0;
        let studentName = "Student";
        let studentEmail = "";

        // 🎯 Atomic Transaction: Deduct wallet balance safely
        await db.runTransaction(async (transaction) => {
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists) {
                throw new Error("User account not found.");
            }

            const userData = userSnap.data() || {};
            const currentBalance = userData.walletBalance || 0;
            studentName = userData.name || "Student";
            studentEmail = userData.email || "";

            if (currentBalance < MINIMUM_WITHDRAWAL_INR) {
                throw new Error(`निकासी के लिए कम से कम ₹${MINIMUM_WITHDRAWAL_INR} का बैलेंस होना आवश्यक है।`);
            }

            payoutAmount = currentBalance;

            // 1. Reset user wallet balance
            transaction.update(userRef, {
                walletBalance: 0,
                lastWithdrawalAt: new Date().toISOString(),
                upiId: cleanUpi,
            });

            // 2. Create pending payout request entry
            const payoutRef = db.collection("payout_requests").doc();
            transaction.set(payoutRef, {
                userId,
                userName: studentName,
                userEmail: studentEmail,
                upiId: cleanUpi,
                amount: payoutAmount,
                status: "PENDING", // PENDING -> COMPLETED
                createdAt: new Date().toISOString(),
            });
        });

        // 🎯 Admin Email Notification (Non-blocking background call)
        fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY || ""}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "SoniLearn Alerts <onboarding@resend.dev>",
                to: ["supportsonilearn@gmail.com"],
                subject: `💰 New Payout Request: ₹${payoutAmount} to ${cleanUpi}`,
                html: `
          <h3>New ₹${payoutAmount} Withdrawal Request!</h3>
          <p><strong>Student:</strong> ${studentName} (${studentEmail})</p>
          <p><strong>Amount:</strong> ₹${payoutAmount}</p>
          <p><strong>UPI ID:</strong> <span style="color: blue; font-weight: bold;">${cleanUpi}</span></p>
          <p>PhonePe / GPay खोलें और ₹${payoutAmount} भेजें।</p>
        `,
            }),
        }).catch((err) => console.log("Withdrawal alert notification skipped:", err));

        return NextResponse.json({
            success: true,
            message: `₹${payoutAmount} की निकासी रिक्वेस्ट दर्ज कर ली गई है! 24 घंटे में आपके UPI पर पैसे क्रेडिट हो जाएँगे।`,
            amountWithdrawn: payoutAmount,
        });
    } catch (error: any) {
        console.error("Withdrawal Request Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Withdrawal failed" },
            { status: 400 }
        );
    }
}