"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, Bot } from "lucide-react";

export default function AIDoubtSolver() {
    const [user] = useAuthState(auth);
    const router = useRouter();

    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [dailyCount, setDailyCount] = useState(0);
    const [error, setError] = useState("");

    const MAX_DOUBTS_PER_DAY = 10;

    // Fetch today's doubt count
    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        const fetchCount = async () => {
            const today = new Date().toISOString().split("T")[0];
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
                const data = snap.data();
                setDailyCount(data.doubtCount?.[today] || 0);
            }
        };

        fetchCount();
    }, [user, router]);

    const askAI = async () => {
        if (!question.trim()) return;
        if (dailyCount >= MAX_DOUBTS_PER_DAY) {
            setError("Aaj ke 10 doubts khatam ho gaye. Kal try karo ya PRO upgrade karo.");
            return;
        }

        setLoading(true);
        setError("");
        setAnswer("");

        try {
            const res = await fetch("/api/ai-doubt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });

            const data = await res.json();

            if (data.success && data.answer) {
                setAnswer(data.answer);

                // Update daily count
                const today = new Date().toISOString().split("T")[0];
                const userRef = doc(db, "users", user!.uid);
                await updateDoc(userRef, {
                    [`doubtCount.${today}`]: dailyCount + 1
                });

                setDailyCount(dailyCount + 1);
            } else {
                setError("AI se jawab nahi mil paya. Thodi der baad try karo.");
            }
        } catch (err) {
            setError("Network error. Internet check karo.");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">
                    <button onClick={() => router.push("/")} className="text-gray-600 hover:text-black">
                        <ArrowLeft size={28} />
                    </button>
                    <div className="flex items-center gap-3">
                        <Bot className="text-blue-600" size={32} />
                        <h1 className="text-2xl font-bold text-gray-900">24/7 AI Doubt Solver</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 pt-8">
                {/* Daily Limit */}
                <div className="bg-white rounded-3xl p-6 mb-8 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-500">Today's Doubts</p>
                            <p className="text-4xl font-bold text-gray-900">{dailyCount} / {MAX_DOUBTS_PER_DAY}</p>
                        </div>
                        <div className="text-right">
                            {dailyCount >= MAX_DOUBTS_PER_DAY ? (
                                <p className="text-red-600 font-medium">Limit Reached</p>
                            ) : (
                                <p className="text-green-600 font-medium">
                                    {MAX_DOUBTS_PER_DAY - dailyCount} left
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Apna doubt yahan likho... (e.g. Newton's Third Law kya hai?)"
                        className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-gray-800 placeholder-gray-400 resize-y"
                    />

                    <button
                        onClick={askAI}
                        disabled={loading || !question.trim() || dailyCount >= MAX_DOUBTS_PER_DAY}
                        className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 text-lg transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                AI Soch Raha Hai...
                            </>
                        ) : (
                            <>
                                <Send size={24} /> Get AI Explanation
                            </>
                        )}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl mb-6 text-center">
                        {error}
                    </div>
                )}

                {/* Answer */}
                {answer && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm">
                        <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-900">
                            <Bot className="text-blue-600" /> AI ka Jawab:
                        </h3>
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[17px]">
                            {answer}
                        </div>
                    </div>
                )}

                {/* Limit Message */}
                {dailyCount >= MAX_DOUBTS_PER_DAY && (
                    <div className="mt-12 text-center">
                        <p className="text-gray-600 text-lg">Aaj ke 10 doubts khatam ho gaye.</p>
                        <button
                            onClick={() => router.push("/subscription")}
                            className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-3xl font-semibold text-lg"
                        >
                            Upgrade to PRO for Unlimited Doubts
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
