
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const ReportErrorSchema = z.object({
    userId: z.string().min(1),
    questionId: z.string().min(1),
    questionText: z.string().min(1),
    examName: z.string().min(1),
    reportType: z.string(), // Loosened from enum to accept any string
    reportNote: z.string().optional(),
});

export async function POST(request: Request) {
    const { firestore } = initializeFirebase(); 

    try {
        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: 'Invalid or empty request body' }, { status: 400 });
        }
        const validation = ReportErrorSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid input.', details: validation.error.flatten() }, { status: 400 });
        }

        const { userId, questionId, questionText, examName, reportType, reportNote } = validation.data;
        
        const reportsCollectionRef = collection(firestore, 'reportedQuestions');
        const newReportRef = doc(reportsCollectionRef); // Creates a new doc with a unique ID

        const reportData = {
            id: newReportRef.id,
            userId,
            questionId,
            questionText,
            examName,
            reportType,
            reportNote: reportNote || '',
            status: 'new',
            timestamp: serverTimestamp(),
        };

        await setDoc(newReportRef, reportData);
        
        return NextResponse.json({ message: 'Report submitted successfully.' }, { status: 201 });

    } catch (error: any) {
        console.error('Report Error API Error:', error);
        return NextResponse.json({ error: 'An unexpected server error occurred while submitting the report.' }, { status: 500 });
    }
}
