import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const subject = searchParams.get("subject");

        let q;

        if (subject && subject !== "All") {
            q = query(
                collection(db, "questions"),
                where("subject", "==", subject)
            );
        } else {
            q = collection(db, "questions");
        }

        const snapshot = await getDocs(q);

        let questions: any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        // shuffle
        questions = questions.sort(() => Math.random() - 0.5);

        // safe duplicate remove
        const seen = new Set<string>();
        const unique: any[] = [];

        for (const item of questions) {
            const key = item?.questionEn ?? Math.random().toString();

            if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        }

        const limit = subject === "All" ? 50 : 20;

        return NextResponse.json(unique.slice(0, limit));

    } catch (error) {
        console.error(error);
        return NextResponse.json([]);
    }
}