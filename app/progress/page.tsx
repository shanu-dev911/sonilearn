export const dynamic = 'force-dynamic';

"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flame, Trophy, Target, TrendingUp, Calendar } from "lucide-react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

type Result = {
    id: string;
    score: number;
    total: number;
    accuracy: number;
    subject?: string;
    exam?: string;
    createdAt: any;
};

export default function ProgressPage() {
    const [user] = useAuthState(auth);
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTests: 0,
        avgScore: 0,
        avgAccuracy: 0,
        bestScore: 0,
        currentStreak: 7, // abhi dummy, baad mein calculate kar sakte hain
    });

    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        const fetchResults = async () => {
            try {
                const resultsRef = collection(db, "results");
                const q = query(
                    resultsRef,
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc"),
                    limit(20)
                );

                const snapshot = await getDocs(q);
                const fetchedResults: Result[] = [];

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedResults.push({
                        id: doc.id,
                        score: data.score,
                        total: data.total,
                        accuracy: data.accuracy,
                        subject: data.subject,
                        exam: data.exam,
                        createdAt: data.createdAt,
                    });
                });

                setResults(fetchedResults);

                // Calculate Stats
                if (fetchedResults.length > 0) {
                    const totalTests = fetchedResults.length;
                    const totalScore = fetchedResults.reduce((sum, r) => sum + r.score, 0);
                    const avgScore = Math.round((totalScore / totalTests) * 10) / 10;
                    const avgAccuracy = Math.round(
                        fetchedResults.reduce((sum, r) => sum + r.accuracy, 0) / totalTests
                    );
                    const bestScore = Math.max(...fetchedResults.map(r => r.score));

                    setStats({
                        totalTests,
                        avgScore,
                        avgAccuracy,
                        bestScore,
                        currentStreak: 7, // TODO: Streak calculation later
                    });
                }
            } catch (error) {
                console.error("Error fetching progress:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [user, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white text-2xl">
                Loading your progress...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 px-6 py-12">
                <div className="flex items-center gap-4 max-w-5xl mx-auto">
                    <button onClick={() => router.back()} className="text-white">
                        <ArrowLeft size={28} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-bold">My Progress</h1>
                        <p className="text-blue-100 mt-1">Track your improvement</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                        <Target className="text-blue-400 mb-3" size={32} />
                        <h3 className="text-4xl font-bold">{stats.totalTests}</h3>
                        <p className="text-zinc-400">Tests Attempted</p>
                    </div>

                    <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                        <Trophy className="text-yellow-400 mb-3" size={32} />
                        <h3 className="text-4xl font-bold">{stats.bestScore}</h3>
                        <p className="text-zinc-400">Best Score</p>
                    </div>

                    <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                        <TrendingUp className="text-green-400 mb-3" size={32} />
                        <h3 className="text-4xl font-bold">{stats.avgAccuracy}%</h3>
                        <p className="text-zinc-400">Avg Accuracy</p>
                    </div>

                    <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                        <Flame className="text-orange-500 mb-3" size={32} />
                        <h3 className="text-4xl font-bold">{stats.currentStreak}</h3>
                        <p className="text-zinc-400">Day Streak 🔥</p>
                    </div>
                </div>

                {/* Subject-wise Performance */}
                <div className="mt-10 bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <TrendingUp size={24} /> Subject Wise Performance
                    </h2>

                    <div className="space-y-8">
                        {["General Knowledge", "Mathematics", "Reasoning", "English"].map((subject) => {
                            const subjResults = results.filter(r => r.subject === subject);
                            const avg = subjResults.length > 0
                                ? Math.round(subjResults.reduce((sum, r) => sum + r.accuracy, 0) / subjResults.length)
                                : 0;

                            return (
                                <div key={subject} className="flex items-center gap-6">
                                    <div className="w-44 font-medium text-zinc-300">{subject}</div>
                                    <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                            style={{ width: `${avg}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-16 text-right font-bold text-lg text-white">{avg}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Tests */}
                <div className="mt-10">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Calendar size={24} /> Recent Test Results
                    </h2>

                    {results.length === 0 ? (
                        <div className="bg-zinc-900 rounded-3xl p-12 text-center border border-zinc-800">
                            <p className="text-zinc-400 text-lg">No tests attempted yet.</p>
                            <p className="text-zinc-500 mt-2">Start practicing to see your progress here!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {results.map((result) => (
                                <div key={result.id} className="bg-zinc-900 rounded-3xl p-6 flex justify-between items-center border border-zinc-800 hover:border-zinc-700 transition">
                                    <div>
                                        <p className="font-semibold text-lg">{result.subject || "Mixed Practice"}</p>
                                        <p className="text-zinc-500 text-sm">
                                            {result.createdAt?.toDate ? result.createdAt.toDate().toLocaleDateString() : "Recent"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold">
                                            {result.score}<span className="text-xl text-zinc-500">/{result.total}</span>
                                        </p>
                                        <p className={`text-sm font-medium ${result.accuracy >= 80 ? 'text-green-400' : result.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {result.accuracy}% Accuracy
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}