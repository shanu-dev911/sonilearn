import { NextResponse } from "next/server";

import { db } from "@/lib/firebase-client";

import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";

export async function GET(req: Request) {

    try {

        const { searchParams } = new URL(req.url);

        const subject = searchParams.get("subject");

        let q: any;

        if (subject && subject !== "All") {

            q = query(
                collection(db, "questions"),
                where("subject", "==", subject)
            );

        } else {

            q = collection(db, "questions");

        }

        const snapshot = await getDocs(q);

        let questions: any[] = snapshot.docs.map((doc: any) => {

            const data = doc.data();

            return {

                id: doc.id,

                ...data,

            };

        });

        // shuffle
        questions = questions.sort(() => Math.random() - 0.5);

        // remove duplicate
        const seen = new Set();

        const unique: any[] = [];

        for (const q of questions) {

            if (!seen.has(q.questionEn)) {

                seen.add(q.questionEn);

                unique.push(q);

            }

        }

        const limit = !subject || subject === "All"
            ? 50
            : 20;

        return NextResponse.json(unique.slice(0, limit));

    } catch (error) {

        console.error(error);

        return NextResponse.json([]);

    }

}