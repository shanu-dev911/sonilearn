
import { NextResponse } from 'next/server';
import { generateDailyCurrentAffairsTest } from '@/ai/flows/daily-current-affairs-generator';
import { z } from 'zod';

const RequestSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.").optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = RequestSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input.', details: validation.error.flatten() }, { status: 400 });
    }

    const targetDate = validation.data.date || new Date().toISOString().split('T')[0];
    
    const payload = {
        date: targetDate,
        seed: Date.now(),
    };

    const test = await generateDailyCurrentAffairsTest(payload);

    if (!test || test.questions.length === 0) {
        console.warn(`AI could not generate a quiz for ${targetDate}. It might be in preparation.`);
        return NextResponse.json({ message: "Questions are being prepared. Please try again in a moment." });
    }

    // Filter out duplicate questions before sending to the client
    const previousQuestions = new Set<string>();
    const uniqueQuestions = test.questions.filter(q => {
      const questionKey = q.question.split('/')[0].trim();
      if (previousQuestions.has(questionKey)) {
        return false;
      }
      previousQuestions.add(questionKey);
      return true;
    });

    return NextResponse.json({ ...test, questions: uniqueQuestions, isFallback: false });

  } catch (error: any) {
    console.error('Current Affairs API Unhandled Error:', error);
    return NextResponse.json({ error: 'An unexpected server error occurred while generating the quiz.' }, { status: 500 });
  }
}
