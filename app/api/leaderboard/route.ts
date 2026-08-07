import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { getDb } from "@/lib/firebase-admin";

export async function GET() {

    try {

        const db = getDb();
        const snap = await db.collection("results").get();

        let leaderboard: any[] = [];

        snap.forEach((doc) => {

            leaderboard.push({

                id: doc.id,

                ...doc.data(),

            });

        });

        leaderboard.sort((a, b) => b.score - a.score);

        leaderboard = leaderboard.slice(0, 10);

        return NextResponse.json({

            success: true,

            leaderboard,

        });

    } catch (error) {

        console.log(error);

        return NextResponse.json({

            success: false,

            message: "Failed to load leaderboard",

        });

    }

}