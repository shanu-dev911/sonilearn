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

    // Checking keys with trim to avoid space issues
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

    const options = {
      amount: Math.round(Number(amount) * 100), // Ensures it's converted to paise safely
      currency: "INR",
      receipt: `receipt_${userId.slice(0, 8)}_${Date.now()}`, // Shortened receipt ID for safety
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