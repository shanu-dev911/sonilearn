import { NextResponse } from "next/server"
import { getDb } from "@/lib/firebase-admin"

export async function GET() {
    try {

        const db = getDb();

        // ❌ SERVER me auth.currentUser use nahi hota
        // 👉 temporarily hata diya

        const snapshot = await db.collection("results").get()

        let results: any[] = []

        snapshot.forEach((doc: any) => {
            results.push({
                id: doc.id,
                ...doc.data(),
            })
        })

        return NextResponse.json({
            success: true,
            results,
        })

    } catch (error: any) {
        console.error("Error:", error)

        return NextResponse.json({
            success: false,
            message: "Server error",
        })
    }
}