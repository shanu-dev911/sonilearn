
'use server';

/**
 * @fileOverview PYQ Test Generator Flow
 * Implements a "database-first, AI-fallback" strategy for generating PYQ tests.
 */
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { generateMockTest } from './daily-mock-test-generator';
import type { MockTestInput, Question } from '@/ai/schemas/daily-mock-test-schemas';
import { z } from 'zod';

const PyqTestGeneratorInputSchema = z.object({
  exam: z.string(),
  subject: z.string(),
  userId: z.string(),
  year: z.string().optional(),
  limit: z.number().min(5).max(50),
});
export type PyqTestGeneratorInput = z.infer<typeof PyqTestGeneratorInputSchema>;

export async function generatePyqTest(input: PyqTestGeneratorInput): Promise<{ questions: Question[] }> {
    const { firestore } = initializeFirebase();
    const { exam, subject, year, limit: requestedLimit, userId } = input;

    // 1. Database Check
    console.log(`PYQ Generator: Checking database for ${exam} - ${subject} - ${year || 'any year'}`);
    const pyqCollectionRef = collection(firestore, 'pyq_questions');
    
    const queryConstraints = [
        where('exam', '==', exam),
        where('subject', '==', subject)
    ];
    if (year) {
        queryConstraints.push(where('year', '==', parseInt(year)));
    }
    
    const dbQuery = query(pyqCollectionRef, ...queryConstraints, firestoreLimit(requestedLimit));
    
    const querySnapshot = await getDocs(dbQuery);

    // 2. If enough questions found, serve from DB
    if (querySnapshot.size >= requestedLimit) {
        console.log(`PYQ Generator: Found ${querySnapshot.size} questions in DB. Serving directly.`);
        const questionsFromDb: Question[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Adapt the Firestore schema to the frontend's expected Question schema
            return {
                question: `${data.question_en} / ${data.question_hi || data.question_en}`,
                options: data.options.map((opt: string) => `${opt} / ${opt}`),
                answer: data.answer,
                explanation: `${data.solution} / ${data.solution}`,
                subject: data.subject,
                topic: 'PYQ', // Set a default topic for DB questions
                difficulty: 'Medium', // Set a default difficulty
            };
        });
        return { questions: questionsFromDb };
    }

    // 3. If not found, fallback to AI
    console.log(`PYQ Generator: Found only ${querySnapshot.size}/${requestedLimit} questions in DB. Falling back to AI.`);
    
    // The AI flow needs a slightly different input structure
    const aiInput: MockTestInput = {
        subjects: [subject],
        exam: exam,
        category: "General", // This can be refined if more category info is available
        seed: Date.now(),
        questionCount: requestedLimit,
        userId: userId,
        ...(year && { year: parseInt(year) })
    };

    const aiQuestions = await generateMockTest(aiInput);

    // The user's logic mentioned `db.save(aiQuestions)`.
    // The `generateMockTest` flow already caches the *entire test* in `generatedMockTests` collection.
    // Saving individual AI questions to the `pyq_questions` collection could mix real and generated data.
    // So, we'll rely on the existing caching mechanism within `generateMockTest`.
    console.log(`PYQ Generator: AI generated ${aiQuestions.questions.length} questions.`);

    // 4. Return AI-generated questions
    return aiQuestions;
}
