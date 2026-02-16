
'use server';

import { NextResponse } from 'next/server';
import { generateMockTest } from '@/ai/flows/daily-mock-test-generator';
import { z } from 'zod';
import { checkAndIncrementUsage } from '@/lib/subscription';

// Updated schema to include 'limit' as per user request
const GenerateTestRequestSchema = z.object({
  exam: z.string(),
  subject: z.string(),
  userId: z.string(),
  year: z.coerce.number().optional(),
  limit: z.number().min(5).max(50).optional().default(20), // 'limit' replaces hardcoded question count
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid or empty request body' }, { status: 400 });
    }

    const validation = GenerateTestRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { exam, subject, userId, year, limit } = validation.data;

    await checkAndIncrementUsage(userId, 'test');
    
    // This payload calls our master engine, using the logic from your aiPromptBuilder.
    const test = await generateMockTest({
        subjects: [subject],
        exam: exam,
        category: "General", // Default category for this simplified endpoint
        seed: Date.now(),
        questionCount: limit, // Use the 'limit' from the request body
        userId: userId,
        year: year, // Pass the year for pattern simulation
    });

    if (!test || !Array.isArray(test.questions) || test.questions.length === 0) {
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

    // Your original code expected { questions: ... }, which our flow provides.
    return NextResponse.json({ questions: uniqueQuestions });

  } catch (error: any) {
    if (error.name === 'UsageLimitError') {
      return NextResponse.json({ error: error.message, upgrade: true }, { status: 429 });
    }
    console.error('generateTest API Error:', error);
    const errorMessage = error.message && error.message.includes('GEMINI_API_KEY')
      ? 'AI configuration error: The Gemini API Key is missing.'
      : 'An unexpected server error occurred while generating the test.';
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
