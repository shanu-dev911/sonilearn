import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const PLAN_DETAILS = {
  MONTHLY: { validityDays: 30, commission: 10 },
  QUARTERLY: { validityDays: 90, commission: 20 },
  YEARLY: { validityDays: 365, commission: 50 },
} as const;
type PlanType = keyof typeof PLAN_DETAILS;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      referralCode,
      amountPaid,
      planType,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

    // 🎯 SIGNATURE VERIFICATION — confirms this payment genuinely came from Razorpay
    const body_to_sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body_to_sign)
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      console.error("Payment signature mismatch — possible tampering attempt.");
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // 🎯 SIGNATURE VALID — Process in Database
    const db = getDb();
    const now = new Date();
    const savedPlanType: PlanType = planType === "QUARTERLY" || planType === "YEARLY"
      ? planType
      : "MONTHLY";
    const { validityDays, commission } = PLAN_DETAILS[savedPlanType];
    const premiumExpiresAt = new Date(now.getTime() + validityDays * MS_PER_DAY).toISOString();

    const buyerRef = db.collection("users").doc(userId);
    const buyerSnap = await buyerRef.get();
    const buyerData = buyerSnap.data() || {};

    // 1. Activate Premium for Buyer
    await buyerRef.set(
      {
        isPremium: true,
        premiumSince: now.toISOString(),
        premiumExpiresAt,
        lastPaymentId: razorpay_payment_id,
        lastOrderId: razorpay_order_id,
        planType: savedPlanType,
        amountPaid: amountPaid || 49,
        updatedAt: now.toISOString(),
      },
      { merge: true }
    );

    // 2. Process plan-based referrer commission (Only on First Verified Paid Conversion)
    const codeToReward = (referralCode || buyerData.referredBy || "").trim().toUpperCase();

    if (codeToReward && !buyerData.referralRewarded) {
      const referrersQuery = await db
        .collection("users")
        .where("referralCode", "==", codeToReward)
        .limit(1)
        .get();

      if (!referrersQuery.empty) {
        const referrerDoc = referrersQuery.docs[0];
        const referrerId = referrerDoc.id;

        // Prevent self-referral reward
        if (referrerId !== userId) {
          const referrerRef = db.collection("users").doc(referrerId);

          // Atomic credit update to avoid race conditions
          await db.runTransaction(async (transaction) => {
            transaction.update(referrerRef, {
              walletBalance: FieldValue.increment(commission),
              totalReferralEarnings: FieldValue.increment(commission),
              successfulReferralsCount: FieldValue.increment(1),
              updatedAt: now.toISOString(),
            });

            // Mark buyer so reward cannot be re-triggered
            transaction.update(buyerRef, {
              referralRewarded: true,
              rewardedReferrerId: referrerId,
            });

            // Log referral payout transaction for admin bookkeeping
            const auditRef = db.collection("referral_transactions").doc();
            transaction.set(auditRef, {
              referrerId,
              buyerId: userId,
              buyerName: buyerData.name || "Student",
              referralCode: codeToReward,
              commissionAmount: commission,
              paymentId: razorpay_payment_id,
              orderId: razorpay_order_id,
              createdAt: now.toISOString(),
            });
          });

          console.log(`[Referral Payout] Credited ₹${commission} to referrer: ${referrerId}`);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Payment verified, premium activated" });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}