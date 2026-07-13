export const dynamic = 'force-dynamic';

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db} from "@/lib/firebase-client";

export default function SubscriptionPage() {
    const [user] = useAuthState(auth);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        setLoading(true);

        // Payment Simulation (Real Razorpay baad mein add karenge)
        setTimeout(() => {
            alert("✅ Payment Successful!\n\n₹149 Received\n\nYou are now a SoniLearn PRO Member!\n\nAll features have been unlocked.");

            // Yahan baad mein Firestore mein isPremium: true update karenge
            router.push("/dashboard");   // Ya root "/" 
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-16 text-white">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 text-white mb-6 font-medium hover:underline"
                >
                    ← Back to Dashboard
                </button>

                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-3">Unlock Full Power</h1>
                    <p className="text-blue-100 text-lg">Join SoniLearn PRO and prepare without limits</p>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 -mt-10">

                {/* Trial Info */}
                <div className="bg-white rounded-3xl p-6 shadow-md mb-8 text-center border border-slate-100">
                    <p className="text-sm text-gray-500">Your 3-Day Free Trial has ended</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">Upgrade to PRO Now</p>
                </div>

                {/* Pricing Card */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
                    <div className="text-center mb-8">
                        <div className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-4">
                            MOST POPULAR
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">Monthly PRO Plan</h2>
                        <div className="flex items-baseline justify-center gap-1 mt-4">
                            <span className="text-5xl font-bold text-blue-600">₹149</span>
                            <span className="text-gray-500">/ month</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Cancel anytime • No hidden charges</p>
                    </div>

                    <div className="space-y-5 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="text-green-500 text-2xl">✅</div>
                            <div>
                                <p className="font-medium">Unlimited Practice Tests</p>
                                <p className="text-sm text-gray-500">50+ questions daily with AI</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-green-500 text-2xl">✅</div>
                            <div>
                                <p className="font-medium">All Full Mock Tests</p>
                                <p className="text-sm text-gray-500">Complete exam simulation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-green-500 text-2xl">✅</div>
                            <div>
                                <p className="font-medium">24/7 Support</p>
                                <p className="text-sm text-gray-500">Instant explanation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-green-500 text-2xl">✅</div>
                            <div>
                                <p className="font-medium">Sunday Live All India Exam</p>
                                <p className="text-sm text-gray-500">Compete with thousands</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-green-500 text-2xl">✅</div>
                            <div>
                                <p className="font-medium">Detailed Performance Analytics</p>
                                <p className="text-sm text-gray-500">Track your progress</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-green-500 text-2xl">✅</div>
                            <div>
                                <p className="font-medium">Ad-Free Experience</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-5 rounded-3xl text-xl shadow-lg transition-all active:scale-95 disabled:opacity-70"
                    >
                        {loading ? "Processing Payment..." : "Pay Now"}
                    </button>

                    <p className="text-center text-xs text-gray-500 mt-6">
                        Secure Payment • Instant Activation • Cancel Anytime
                    </p>
                </div>

                <div className="text-center mt-10">
                    <p className="text-gray-500 text-sm">Already a PRO member?</p>
                    <button
                        onClick={() => router.push("/")}
                        className="text-blue-600 font-medium mt-2 hover:underline"
                    >
                        Go to Dashboard →
                    </button>
                </div>
            </div>
        </div>
    );
}