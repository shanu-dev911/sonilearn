
'use server';

import { NextResponse } from 'next/server';
import { generatePyqTest } from '@/ai/flows/pyq-test-generator';
import { z } from 'zod';
import { checkAndIncrementUsage } from '@/lib/subscription';

const PyqTestRequestSchema = z.object({
  exam: z.string(),
  subject: z.string(),
  userId: z.string(),
  year: z.string().optional(),
  limit: z.number().min(5).max(50).default(20),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid or empty request body' }, { status: 400 });
    }

    const validation = PyqTestRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { userId } = validation.data;

    await checkAndIncrementUsage(userId, 'test');
    
    const test = await generatePyqTest(validation.data);

    if (!test || !Array.isArray(test.questions) || test.questions.length === 0) {
      return NextResponse.json({ message: "Could not find or generate questions for this selection. Please try again." }, { status: 200 });
    }

    // This route returns the full { questions: [...] } object
    return NextResponse.json(test);

  } catch (error: any) {
    if (error.name === 'UsageLimitError') {
      return NextResponse.json({ error: error.message, upgrade: true }, { status: 429 });
    }
    console.error('PYQ Test API Error:', error);
    const errorMessage = error.message && error.message.includes('GEMINI_API_KEY')
      ? 'AI configuration error: The Gemini API Key is missing.'
      : 'An unexpected server error occurred while generating the test.';
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
