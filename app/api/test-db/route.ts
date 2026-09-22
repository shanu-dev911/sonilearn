import { getDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const db = getDb();
        await db.collection("test").add({
            name: "SoniLearn",
            createdAt: new Date(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Test database route error:", error);
        return NextResponse.json(
            { success: false, error: "Database test failed" },
            { status: 500 }
        );
    }
}