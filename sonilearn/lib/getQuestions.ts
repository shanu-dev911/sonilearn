import "server-only";
import { getDb } from "@/lib/firebase-admin";

export const getQuestions = async (limit = 25, subject?: string) => {

    const db = getDb();
    const snapshot = await db.collection("questions").get(); 

    let questions = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
    }));

    // SUBJECT FILTER
    if (subject) {
        questions = questions.filter((q: any) => q.subject === subject);
    }

    // RANDOM
    questions = questions.sort(() => Math.random() - 0.5);

    // LIMIT
    questions = questions.slice(0, limit);

    return questions;
};