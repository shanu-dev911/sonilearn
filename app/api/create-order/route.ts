import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, userId, userName, userEmail } = body;

    if (!amount || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing amount or userId" },
        { status: 400 }
      );
    }

    const key_id = (
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID
    )?.trim();
    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!key_id || !key_secret) {
      console.error("❌ CRITICAL ERROR: Razorpay keys missing in Vercel Environment Variables!");
      return NextResponse.json(
        { success: false, error: "Server configuration issue: Razorpay keys missing." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: key_id,
      key_secret: key_secret,
    });

    // Safely trim receipt to stay well within Razorpay's 40-character limit
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `rcpt_${safeUserId}_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: String(userId),
        userName: userName || "Student",
        userEmail: userEmail || "",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error("❌ Razorpay Order Creation Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.description || error?.message || "Failed to create order",
      },
      { status: 500 }
    );
  }
}