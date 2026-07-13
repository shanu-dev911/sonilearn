export const dynamic = 'force-dynamic';

import { getDb } from "@/lib/firebase-admin";

export async function GET() {
    const db = getDb();
    await db.collection("test").add({
        name: "SoniLearn",
        createdAt: new Date(),
    });

    return Response.json({ success: true });
}