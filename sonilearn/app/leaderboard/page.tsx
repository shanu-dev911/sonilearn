"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "@/lib/firebase-client";

import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
} from "firebase/firestore";

import { onAuthStateChanged, User } from "firebase/auth";

interface LeaderboardEntry {
    id: string;
    userId: string;
    displayName: string;
    score: number;
    accuracy: number;
    rank: number;
}

export default function LeaderboardPage() {

    const [data, setData] = useState<LeaderboardEntry[]>([]);

    const [userRank, setUserRank] =
        useState<LeaderboardEntry | null>(null);

    const [cutoff, setCutoff] = useState(0);

    const [loading, setLoading] = useState(true);

    const [totalCount, setTotalCount] = useState(0);

    const currentUserRef = useRef<User | null>(null);

    useEffect(() => {

        const unsubAuth = onAuthStateChanged(auth, (user) => {
            currentUserRef.current = user;
        });

        const q = query(
            collection(db, "exam_results"),
            orderBy("score", "desc"),
            orderBy("createdAt", "desc"),
            limit(500)
        );

        const unsubSnapshot = onSnapshot(

            q,

            (snap) => {

                const currentUserId =
                    currentUserRef.current?.uid || null;

                const allEntries: LeaderboardEntry[] = [];

                const scores: number[] = [];

                let foundUser: LeaderboardEntry | null = null;

                snap.docs.forEach((d, index) => {

                    const res = d.data();

                    const rawUserId = res.userId || "";
                    const rawDisplayName =
                        res.userName || res.displayName || "Student";

                    const isDummyEntry =
                        !rawUserId ||
                        rawUserId === "guest" ||
                        rawUserId.startsWith("guest_") ||
                        rawDisplayName === "Student" ||
                        rawDisplayName === "Shanu";

                    if (isDummyEntry) {
                        return;
                    }

                    const totalQs =
                        typeof res.total === "number" &&
                            res.total > 0
                            ? res.total
                            : 50;

                    const accuracy = Math.min(
                        Math.round(
                            ((Number(res.score || 0)) / totalQs) * 100
                        ),
                        100
                    );

                    const entry: LeaderboardEntry = {
                        id: d.id,

                        userId: rawUserId,

                        displayName: rawDisplayName,

                        score: Number(res.score || 0),

                        accuracy,

                        rank: allEntries.length + 1,
                    };

                    allEntries.push(entry);

                    scores.push(entry.score);

                    if (
                        currentUserId &&
                        rawUserId === currentUserId &&
                        !foundUser
                    ) {
                        foundUser = entry;
                    }

                });

                // CUTOFF
                if (scores.length > 0) {

                    const sorted = [...scores].sort(
                        (a, b) => b - a
                    );

                    const idx = Math.min(
                        Math.floor(sorted.length * 0.3),
                        sorted.length - 1
                    );

                    setCutoff(sorted[idx]);
                }

                setTotalCount(allEntries.length);

                setData(allEntries.slice(0, 50));

                setUserRank(foundUser);

                setLoading(false);

            },

            (error) => {

                console.log("Leaderboard Error:", error);

                setLoading(false);

            }
        );

        return () => {
            unsubAuth();
            unsubSnapshot();
        };

    }, []);

    const userInTop50 =
        userRank !== null && userRank.rank <= 50;

    // LOADING
    if (loading) {

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">

                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>

                <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Loading Rankings...
                </p>

            </div>
        );

    }

    return (

        <div className="min-h-screen bg-slate-50 pb-32">

            {/* HEADER */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-5 pt-14 pb-10 text-center">

                <h1 className="text-4xl font-black text-white">
                    🏆 Leaderboard
                </h1>

                <p className="text-slate-300 text-sm mt-2 font-medium">
                    {totalCount} students participated
                </p>

            </div>

            {/* USER CARD */}
            <div className="px-4 -mt-6">

                {userRank ? (

                    <div
                        className={`rounded-[2rem] p-5 shadow-xl text-white flex items-center justify-between gap-4

            ${userRank.score >= cutoff
                                ? "bg-gradient-to-r from-green-600 to-emerald-700"
                                : "bg-gradient-to-r from-blue-600 to-indigo-700"
                            }`}
                    >

                        {/* LEFT */}
                        <div className="flex items-center gap-4">

                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center font-black text-2xl">
                                #{userRank.rank}
                            </div>

                            <div>

                                <p className="text-lg font-black">
                                    {userRank.displayName}
                                </p>

                                <p className="text-xs text-white/70 font-semibold">
                                    {userRank.accuracy}% accuracy
                                </p>

                            </div>

                        </div>

                        {/* RIGHT */}
                        <div className="text-right">

                            <p className="text-3xl font-black">
                                {userRank.score}
                            </p>

                            <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                                points
                            </p>

                            <div
                                className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black

                ${userRank.score >= cutoff
                                        ? "bg-white/20"
                                        : "bg-red-500/30"
                                    }`}
                            >
                                {userRank.score >= cutoff
                                    ? "✅ Qualified"
                                    : "❌ Below Cutoff"}
                            </div>

                        </div>

                    </div>

                ) : (

                    <div className="bg-white rounded-[2rem] p-5 border shadow-sm text-center">

                        <p className="text-gray-500 font-semibold">
                            Login to see your rank
                        </p>

                    </div>

                )}

            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4 px-4 mt-5">

                <div className="bg-white rounded-[2rem] p-5 border shadow-sm text-center">

                    <div className="text-3xl mb-2">
                        🎯
                    </div>

                    <p className="text-xs uppercase tracking-widest text-gray-400 font-black">
                        Cutoff
                    </p>

                    <h2 className="text-3xl font-black text-gray-800 mt-2">
                        {cutoff}
                    </h2>

                    <p className="text-xs text-gray-400 mt-1">
                        points required
                    </p>

                </div>

                <div className="bg-white rounded-[2rem] p-5 border shadow-sm text-center">

                    <div className="text-3xl mb-2">
                        👥
                    </div>

                    <p className="text-xs uppercase tracking-widest text-gray-400 font-black">
                        Students
                    </p>

                    <h2 className="text-3xl font-black text-gray-800 mt-2">
                        {totalCount}
                    </h2>

                    <p className="text-xs text-gray-400 mt-1">
                        participated
                    </p>

                </div>

            </div>

            {/* TITLE */}
            <div className="px-5 mt-8 mb-3">

                <h2 className="text-lg font-black text-gray-800">
                    📋 Top Performers
                </h2>

            </div>

            {/* LIST */}
            <div className="px-4 space-y-3">

                {data.length === 0 ? (

                    <div className="bg-white rounded-3xl p-10 text-center border">

                        <p className="text-gray-400 font-semibold">
                            No rankings available
                        </p>

                    </div>

                ) : (

                    data.map((u, i) => {

                        const isMe =
                            userRank &&
                            u.userId === userRank.userId;

                        const medal =
                            i === 0
                                ? "🥇"
                                : i === 1
                                    ? "🥈"
                                    : i === 2
                                        ? "🥉"
                                        : null;
                        return (

                            <div
                                key={u.id}
                                className={`rounded-[1.5rem] p-4 border shadow-sm flex items-center justify-between

                ${isMe
                                        ? "bg-blue-50 border-blue-200"
                                        : "bg-white border-gray-100"
                                    }`}
                            >

                                {/* LEFT */}
                                <div className="flex items-center gap-4">

                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg

                    ${medal
                                                ? "bg-yellow-50"
                                                : isMe
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                    >

                                        {medal || `#${u.rank}`}

                                    </div>

                                    <div>

                                        <p
                                            className={`font-black text-sm

                      ${isMe
                                                    ? "text-blue-700"
                                                    : "text-gray-800"
                                                }`}
                                        >

                                            {u.displayName}

                                            {isMe && (
                                                <span className="ml-2 text-[9px] bg-blue-600 text-white px-2 py-1 rounded-md uppercase tracking-widest">
                                                    YOU
                                                </span>
                                            )}

                                        </p>

                                        <p className="text-[11px] text-gray-400 font-semibold mt-1">
                                            {u.accuracy}% accuracy
                                        </p>

                                    </div>

                                </div>

                                {/* RIGHT */}
                                <div className="text-right">

                                    <p className="text-2xl font-black text-gray-800">
                                        {u.score}
                                    </p>

                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                        pts
                                    </p>

                                    <p
                                        className={`text-[10px] mt-1 font-black

                    ${u.score >= cutoff
                                                ? "text-green-600"
                                                : "text-red-500"
                                            }`}
                                    >

                                        {u.score >= cutoff
                                            ? "✓ Qualified"
                                            : "✗ Below"}

                                    </p>

                                </div>

                            </div>

                        );

                    })

                )}

            </div>

            {/* STICKY BAR */}
            {userRank && !userInTop50 && (

                <div className="fixed bottom-20 left-4 right-4 max-w-xl mx-auto bg-slate-900 text-white rounded-[2rem] p-4 flex items-center justify-between shadow-2xl z-50">

                    <div className="flex items-center gap-3">

                        <div className="text-2xl font-black text-blue-400">
                            #{userRank.rank}
                        </div>

                        <div>

                            <p className="font-black text-sm">
                                {userRank.displayName}
                            </p>

                            <p className="text-[11px] text-slate-400">
                                {userRank.score} pts • {userRank.accuracy}% accuracy
                            </p>

                        </div>

                    </div>

                    <div
                        className={`px-3 py-1 rounded-full text-[10px] font-black

            ${userRank.score >= cutoff
                                ? "bg-green-600"
                                : "bg-red-600"
                            }`}
                    >

                        {userRank.score >= cutoff
                            ? "Qualified"
                            : "Below"}

                    </div>

                </div>

            )}

        </div>

    );
}