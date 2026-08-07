import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/firebase-admin";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const PREMIUM_DAYS = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 });
    }

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

    const db = getDb();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PREMIUM_DAYS * MS_PER_DAY);

    await db.collection("users").doc(userId).set(
      {
        isPremium: true,
        premiumSince: now.toISOString(),
        premiumExpiresAt: expiresAt.toISOString(),
        lastPaymentId: razorpay_payment_id,
        lastOrderId: razorpay_order_id,
        updatedAt: now.toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, message: "Payment verified, premium activated" });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}