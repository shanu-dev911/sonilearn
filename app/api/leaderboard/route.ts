export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export async function GET() {
    try {
        const db = getDb();
        const snap = await db.collection("results").get();

        let allResults: any[] = [];

        snap.forEach((doc) => {
            allResults.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        // 🎯 KEEP ONLY BEST SCORE PER USER
        const bestPerUser: Record<string, any> = {};

        allResults.forEach((entry) => {
            const uid = entry.userId || entry.uid;
            if (!uid) return;

            if (!bestPerUser[uid] || entry.score > bestPerUser[uid].score) {
                bestPerUser[uid] = entry;
            }
        });

        let leaderboard = Object.values(bestPerUser);

        leaderboard.sort((a: any, b: any) => b.score - a.score);

        const totalUniqueStudents = leaderboard.length;

        leaderboard = leaderboard.slice(0, 10);

        return NextResponse.json({
            success: true,
            leaderboard,
            totalUniqueStudents,
        });

    } catch (error) {
        console.log(error);
        return NextResponse.json({
            success: false,
            message: "Failed to load leaderboard",
        });
    }
}