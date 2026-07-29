import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/firebase-admin";

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

    // 🎯 SIGNATURE VERIFICATION — confirms this payment genuinely came from Razorpay
    // and was not tampered with, using our secret key to re-generate and compare.
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

    // 🎯 SIGNATURE VALID — mark user as premium in Firestore
    const db = getDb();

    await db.collection("users").doc(userId).update({
      isPremium: true,
      premiumSince: new Date().toISOString(),
      lastPaymentId: razorpay_payment_id,
      lastOrderId: razorpay_order_id,
    });

    return NextResponse.json({ success: true, message: "Payment verified, premium activated" });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}