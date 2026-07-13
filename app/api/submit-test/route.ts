export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {

    const {
        score,
        total,
        accuracy,
        type,
        subjectStats
    } = await req.json();

    try {

        const db = getDb();

        // DEMO USER
        const uid = "demoUser";

        // SAVE RESULT
        await db.collection("results").add({
            uid,
            score,
            total,
            accuracy,
            type: type || "practice",
            subjectStats: subjectStats || {},
            createdAt: Date.now(),
        });

        // USER REF
        const userRef = db.collection("users").doc(uid);

        const snap = await userRef.get();

        let streak = 1;

        if (snap.exists) {

            const data = snap.data();

            const last = data?.lastPractice || 0;

            const now = Date.now();

            const diff = now - last;

            const oneDay = 86400000;

            if (diff < oneDay * 2) {
                streak = (data?.streak || 0) + 1;
            } else {
                streak = 1;
            }
        }

        // UPDATE USER
        await userRef.set(
            {
                streak,
                lastPractice: Date.now(),
            },
            { merge: true }
        );

        return NextResponse.json({
            success: true,
        });

    } catch (err) {

        console.log(err);

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