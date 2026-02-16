
import { NextResponse } from 'next/server';
import { generateMockTest } from '@/ai/flows/daily-mock-test-generator';
import { MockTestInputSchema } from '@/ai/schemas/daily-mock-test-schemas';
import { checkAndIncrementUsage } from '@/lib/subscription';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: 'Invalid or empty request body' }, { status: 400 });
    }
    const validation = MockTestInputSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input for mock test generation.', details: validation.error.flatten() }, { status: 400 });
    }
    
    // Check for user ID before attempting usage check
    if(validation.data.userId) {
      await checkAndIncrementUsage(validation.data.userId, 'test');
    }
    
    const test = await generateMockTest(validation.data);
    
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

    return NextResponse.json({ questions: uniqueQuestions });

  } catch (error: any) {
    if (error.name === 'UsageLimitError') {
      return NextResponse.json({ error: error.message, upgrade: true }, { status: 429 });
    }
    console.error('Daily Mock Test API Error:', error);
    const errorMessage = error.message && error.message.includes('GEMINI_API_KEY')
      ? 'AI configuration error: The Gemini API Key is missing.'
      : 'An unexpected server error occurred while generating the mock test.';
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
