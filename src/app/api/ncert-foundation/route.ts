
import { NextResponse } from 'next/server';
import { generateNCERTTest } from '@/ai/flows/ncert-foundation-generator';
import { NCERTTestInputSchema } from '@/ai/schemas/ncert-foundation-schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: 'Invalid or empty request body' }, { status: 400 });
    }
    
    const validation = NCERTTestInputSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input for NCERT test generation.', details: validation.error.flatten() }, { status: 400 });
    }
    
    const test = await generateNCERTTest(validation.data);

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
    console.error('NCERT Foundation API Error:', error);
    const errorMessage = error.message && error.message.includes('GEMINI_API_KEY')
      ? 'AI configuration error: The Gemini API Key is missing.'
      : 'An unexpected server error occurred while generating the NCERT test.';
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
