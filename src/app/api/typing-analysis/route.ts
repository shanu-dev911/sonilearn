
import { NextResponse } from 'next/server';
import { getTypingAnalysis } from '@/ai/flows/typing-analysis';
import { TypingAnalysisInputSchema } from '@/ai/schemas/typing-analysis-schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: 'Invalid or empty request body' }, { status: 400 });
    }
    const validation = TypingAnalysisInputSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input.', details: validation.error.flatten() }, { status: 400 });
    }
    
    const analysis = await getTypingAnalysis(validation.data);

    if (!analysis) {
        return NextResponse.json({ error: 'The AI analysis service is currently unavailable. Please try again in a moment.' }, { status: 503 });
    }

    return NextResponse.json(analysis);

  } catch (error: any)
{
    console.error('Typing Analysis API Error:', error);
    const errorMessage = error.message && error.message.includes('GEMINI_API_KEY')
        ? 'AI configuration error: The Gemini API Key is missing.'
        : 'An unexpected server error occurred during typing analysis.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
