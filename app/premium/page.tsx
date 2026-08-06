"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Crown, Sparkles, Zap, Trophy, BookOpen,
    BarChart3, ShieldCheck, CheckCircle2, ArrowLeft, ShieldAlert, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { checkTrialStatus } from "@/lib/trial-check";

declare global {
    interface Window {
        Razorpay: any;
    }
}

const PRICE_INR = 49;

export default function PremiumPage() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
            } else {
           router.push("/?upgraded=true");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handlePayment = async () => {
        if (!user || !scriptLoaded) return;

        setProcessing(true);

        try {
            const orderRes = await fetch("/api/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: PRICE_INR,
                    userId: user.uid,
                    userName: userData?.name || user.displayName || "Student",
                    userEmail: user.email,
                }),
            });

            const orderData = await orderRes.json();

            if (!orderData.success) {
                alert("Failed to create payment order. Please try again.");
                setProcessing(false);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: "INR",
                name: "SoniLearn",
                description: "Premium Access — Unlock All Features",
                order_id: orderData.order.id,
                handler: async function (response: any) {
                    console.log("Razorpay success callback response:", response);
                    try {
                        const verifyRes = await fetch("/api/verify-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                userId: user.uid,
                            }),
                        });

                        console.log("Verify payment response status:", verifyRes.status);
                        const verifyData = await verifyRes.json();
                        console.log("Verify payment body:", verifyData);

                        if (verifyData.success) {
                            alert("🎉 Payment successful! Premium activated.");
                            window.location.href = "/?upgraded=true";
                        } else {
                            alert(`Payment verification failed. ${verifyData.error || "Please contact support."}`);
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                        alert("Something went wrong verifying your payment. Contact support.");
                    } finally {
                        setProcessing(false);
                    }
                },
                prefill: {
                    name: userData?.name || user.displayName || "",
                    email: user.email || "",
                },
                theme: {
                    color: "#2563eb",
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Payment initiation error:", error);
            alert("Failed to start payment. Please try again.");
            setProcessing(false);
        }
    };

    const features = [
        { icon: Zap, text: " Warrior Battal Ground ", desc: "No cooling-down period between assessment cycles." },
        { icon: Trophy, text: "All India Leaderboard Matrix", desc: "Compare target scores across live peer metrics." },

        { icon: BarChart3, text: "Weak Topic Performance Analysis", desc: "Isolate structural evaluation errors instantly." },
        { icon: ShieldCheck, text: "100% Ad-Free Experience", desc: "Zero telemetry distraction during test execution." },
        { icon: CheckCircle2, text: "Daily Premium Challenge Access", desc: "Execute hyper-focused exclusive daily items." },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    // 🎯 If already premium, show a simple confirmation instead of the pricing card
    const trialStatus = userData
        ? checkTrialStatus(userData)
        : {
            isPremium: false,
            isPremiumExpired: false,
            isTrialActive: false,
            hasAccess: false,
            daysRemaining: 0,
        };

    if (trialStatus.isPremium) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">You're Premium! 🎉</h1>
                    <p className="text-slate-500 text-sm mb-6">You already have full access to all features.</p>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full bg-slate-900 text-white h-12 rounded-xl font-bold text-sm"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-32 font-sans antialiased selection:bg-blue-600 selection:text-white">

            {/* TOP NAVIGATION HEADER */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between relative z-50">
                <button
                    onClick={() => router.push("/")}
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200/60 shadow-sm"
                >
                    <ArrowLeft size={14} /> Back to Space
                </button>
            </div>

            {/* PRESTIGE MESH HERO PANEL */}
            <section className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-900 -mt-16 pt-24 pb-28">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.4),transparent_50%)] pointer-events-none"></div>
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full backdrop-blur-md text-blue-400 mb-6"
                    >
                        <Sparkles size={14} className="animate-pulse" />
                        <span className="font-bold text-[10px] tracking-widest uppercase">
                            SoniLearn Premium Upgrade
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none"
                    >
                        Accelerate Your <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">Exam Velocity</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed"
                    >
                        Deploy high-precision analytical tools, unlock elite database access metrics, and isolate score deficiencies on an unthrottled framework.
                    </motion.p>

                    {/* 🎯 TRIAL STATUS BANNER */}
                    {trialStatus.isTrialActive ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="mt-6 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-300 text-xs font-bold"
                        >
                            🎁 {trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? "s" : ""} left in your free trial
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="mt-6 inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-full text-rose-300 text-xs font-bold"
                        >
                            ⏰ Your free trial has ended — upgrade to continue
                        </motion.div>
                    )}
                </div>
            </section>

            {/* PRICING SCHEMATICS WRAPPER */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-30">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 items-stretch max-w-5xl mx-auto">

                    {/* PRICING ENGINE CARD */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white border border-slate-200/90 rounded-3xl shadow-xl overflow-hidden flex flex-col justify-between"
                    >
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-center text-white">
                            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase">
                                <Crown size={12} /> Launch Promotion Plan
                            </div>
                            <div className="flex items-baseline justify-center gap-1 mt-4">
                                <span className="text-5xl font-black tracking-tight">₹{PRICE_INR}</span>
                                <span className="text-slate-100/80 text-xs font-bold uppercase tracking-wider">/ Month</span>
                            </div>
                            <p className="text-[11px] font-bold text-amber-100 mt-2 tracking-wide">
                                Restricted allocation: First 200 users only
                            </p>
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                                <p className="text-blue-800 font-black text-sm flex items-center gap-2">
                                    <span>🎉</span> 72-Hour Evaluation Window
                                </p>
                                <p className="text-slate-600 text-xs mt-1.5 font-medium leading-relaxed">
                                    Initiate full environment calibration. Complete feature deployment unlocks instantly for 3 days. Cancel anytime.
                                </p>
                            </div>

                            <div>
                                <button
                                    onClick={handlePayment}
                                    disabled={processing || !scriptLoaded}
                                    className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 transition-all text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 group disabled:opacity-60"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        "PAY NOW"
                                    )}
                                </button>

                                <p className="mt-4 text-center text-[11px] text-slate-400 font-medium leading-relaxed">
                                    Post quota consumption, baseline standard pricing normalizes to <span className="font-bold text-slate-600">₹99/month</span>.
                                </p>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    Security Assurance Powered by Razorpay
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* VALUE METRICS EXPANSION NODE */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between"
                    >
                        <div>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Architecture Features</span>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Included Architecture Matrix</h3>
                            <p className="text-slate-400 text-xs mt-0.5 font-medium">Enterprise tools engineered for modern scaling.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                                {features.map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100/30">
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-xs tracking-tight">{item.text}</h4>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-[10px] text-slate-400 font-medium leading-relaxed">
                            <ShieldAlert size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <span>System configurations auto-renew monthly unless operation parameters are manually terminated in workspace configurations panel.</span>
                        </div>
                    </motion.div>

                </div>
            </section>

        </div>
    );
}