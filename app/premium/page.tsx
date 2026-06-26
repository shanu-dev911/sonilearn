"use client";

import { motion } from "framer-motion";

import {
    Crown,
    Sparkles,
    Zap,
    Trophy,
    BookOpen,
    BarChart3,
    ShieldCheck,
    CheckCircle2,
} from "lucide-react";

export default function PremiumPage() {

    const features = [
        {
            icon: Zap,
            text: "Unlimited Fast Tests",
        },
        {
            icon: Trophy,
            text: "All India Leaderboard",
        },
        {
            icon: BookOpen,
            text: "Premium PYQ Access",
        },
        {
            icon: BarChart3,
            text: "Weak Topic Analysis",
        },
        {
            icon: ShieldCheck,
            text: "Ad-Free Experience",
        },
        {
            icon: CheckCircle2,
            text: "Daily Premium Challenges",
        },
    ];

    return (

        <div className="min-h-screen bg-slate-50 pb-28">

            {/* HERO */}

            <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">

                {/* BLUR BG */}

                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,white,transparent_40%)]"></div>

                <div className="relative px-5 pt-16 pb-20 text-center">

                    {/* BADGE */}

                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.5,
                        }}
                        className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-5 py-2 rounded-full backdrop-blur-xl"
                    >

                        <Sparkles size={18} />

                        <span className="font-bold text-sm tracking-wide">

                            SONILEARN PREMIUM

                        </span>

                    </motion.div>

                    {/* TITLE */}

                    <motion.h1
                        initial={{
                            opacity: 0,
                            y: 25,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            delay: 0.1,
                        }}
                        className="mt-7 text-4xl leading-tight font-black"
                    >

                        Crack Exams
                        <br />

                        Faster 🚀

                    </motion.h1>

                    {/* SUBTITLE */}

                    <motion.p
                        initial={{
                            opacity: 0,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            delay: 0.2,
                        }}
                        className="mt-5 text-blue-100 text-[15px] leading-relaxed max-w-md mx-auto"
                    >

                        Practice smarter with premium PYQs,
                        unlimited tests, weak topic analysis,
                        and detailed performance tracking.

                    </motion.p>

                </div>

            </section>

            {/* PRICING CARD */}

            <section className="px-4 -mt-12 relative z-20">

                <motion.div
                    initial={{
                        opacity: 0,
                        y: 35,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        delay: 0.3,
                    }}
                    className="
            bg-white
            rounded-[2rem]
            shadow-2xl
            border border-slate-200
            overflow-hidden
            max-w-md
            mx-auto
          "
                >

                    {/* TOP */}

                    <div className="bg-gradient-to-r from-amber-400 to-yellow-500 p-6 text-center text-black">

                        <div className="inline-flex items-center gap-2 bg-black/10 px-4 py-2 rounded-full">

                            <Crown size={18} />

                            <span className="font-black text-sm">

                                EARLY SUPPORTER OFFER

                            </span>

                        </div>

                        {/* PRICE */}

                        <h2 className="mt-6 text-5xl font-black">

                            ₹49

                        </h2>

                        <p className="mt-2 font-semibold text-black/70">

                            First 200 Users Only

                        </p>

                    </div>

                    {/* BODY */}

                    <div className="p-6">

                        {/* FREE TRIAL */}

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">

                            <p className="text-blue-700 font-black text-lg">

                                🎉 3 Days Free Trial

                            </p>

                            <p className="text-sm text-blue-600 mt-1 leading-relaxed">

                                Start free and unlock all premium
                                features instantly.

                            </p>

                        </div>

                        {/* FEATURES */}

                        <div className="mt-8 space-y-5">

                            {features.map(
                                (item, i) => {

                                    const Icon =
                                        item.icon;

                                    return (

                                        <div
                                            key={i}
                                            className="flex items-center gap-4"
                                        >

                                            <div className="
                        w-11 h-11
                        rounded-2xl
                        bg-blue-50
                        flex items-center justify-center
                        text-blue-600
                        flex-shrink-0
                      ">

                                                <Icon size={21} />

                                            </div>

                                            <p className="font-semibold text-slate-700 leading-relaxed">

                                                {item.text}

                                            </p>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                        {/* BUY BUTTON */}

                        <button
                            className="
                w-full
                h-14
                mt-10
                rounded-2xl
                bg-blue-600
                hover:bg-blue-700
                active:scale-[0.98]
                transition-all
                text-white
                font-black
                text-lg
                shadow-lg
              "
                        >

                            Buy Now 🚀

                        </button>

                        {/* SMALL TEXT */}

                        <p className="mt-5 text-center text-sm text-slate-500 leading-relaxed">

                            After first 200 users,
                            premium price becomes
                            <span className="font-bold text-slate-800">
                                {" "}₹99/month
                            </span>

                        </p>

                        <p className="mt-2 text-center text-xs text-slate-400">

                            Secure payments powered by Razorpay

                        </p>

                    </div>

                </motion.div>

            </section>

        </div>

    );

}