
import { NextResponse } from 'next/server';
import { generateMockTest } from '@/ai/flows/daily-mock-test-generator';
import { z } from 'zod';
import { checkAndIncrementUsage } from '@/lib/subscription';

const GenerateRequestSchema = z.object({
  exam: z.string(),
  subject: z.string(),
  userId: z.string(),
  questionCount: z.number().optional().default(10),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid or empty request body' }, { status: 400 });
    }

    // A simplified validation for this specific route
    const validation = GenerateRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input. "exam", "subject", and "userId" are required.', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { exam, subject, userId, questionCount } = validation.data;

    await checkAndIncrementUsage(userId, 'test');
    
    // Construct the full payload for the mock test generator
    const test = await generateMockTest({
        subjects: [subject],
        exam: exam,
        category: "General", // Use a default category as it's not provided
        seed: Date.now(),
        questionCount: questionCount,
        userId: userId,
    });

    if (!test || !Array.isArray(test.questions) || test.questions.length === 0) {
      return NextResponse.json({ error: 'The AI failed to generate questions. Please try again.' }, { status: 500 });
    }

    // The old endpoint returned { text: "..." }. The new standard is { questions: [...] }.
    // This is the correct, "updated" response.
    return NextResponse.json(test);

  } catch (error: any) {
    if (error.name === 'UsageLimitError') {
      return NextResponse.json({ error: error.message, upgrade: true }, { status: 429 });
    }
    console.error('Generate API Error:', error);
    const errorMessage = error.message && error.message.includes('GEMINI_API_KEY')
      ? 'AI configuration error: The Gemini API Key is missing.'
      : 'An unexpected server error occurred while generating questions.';
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
