import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Body must be an array" });
    }

    const db = getDb();
    const batch = db.batch();

    body.forEach((q: any) => {
      const ref = db.collection("questions").doc();
      
      // ✅ Yahan saari bilingual fields aur distributed options map kar diye hain
      batch.set(ref, {
        exam: q.exam,
        subject: q.subject,
        difficulty: q.difficulty || "medium",
        questionEn: q.questionEn,
        questionHi: q.questionHi,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        answer: q.answer,
        explanationEn: q.explanationEn || "",
        explanationHi: q.explanationHi || "",
        createdAt: new Date(),
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true, count: body.length });

  } catch (error: any) {
    console.error("Upload error details:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}