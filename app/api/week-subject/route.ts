import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getDb } from "@/lib/firebase-admin";

export async function GET() {

    try {

        const uid = "demoUser";

        const db = getDb();

        // GET RESULTS
        const snap = await db
            .collection("results")
            .where("uid", "==", uid)
            .get();

        let stats: any = {};

        snap.forEach((doc) => {

            const data: any = doc.data();

            const subjectStats = data.subjectStats || {};

            for (const sub in subjectStats) {

                if (!stats[sub]) {

                    stats[sub] = {
                        correct: 0,
                        total: 0,
                    };

                }

                stats[sub].correct += subjectStats[sub].correct || 0;

                stats[sub].total += subjectStats[sub].total || 0;
            }
        });

        let weakest = "";

        let lowest = 100;

        for (const sub in stats) {

            const total = stats[sub].total || 1;

            const acc =
                (stats[sub].correct / total) * 100;

            if (acc < lowest) {

                lowest = acc;

                weakest = sub;
            }
        }

        return NextResponse.json({
            success: true,
            weakSubject: weakest,
            accuracy: Math.round(lowest),
        });

    } catch (error) {

        console.log(error);

        return NextResponse.json(
            {
                success: false,
            },
            {
                status: 500,
            }
        );
    }
}