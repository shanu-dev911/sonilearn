import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json({ success: false });
        }

        const db = getDb();
        const batch = db.batch();

        body.forEach((q: any) => {
            const ref = db.collection("questions").doc();

            batch.set(ref, {
                question: q.question,
                options: q.options,
                answer: q.answer,
                subject: q.subject,
                exam: q.exam,
                createdAt: new Date(),
            });
        });

        await batch.commit();

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ success: false });
    }
}