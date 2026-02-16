
import { NextResponse } from 'next/server';
import { getAIMentorResponse } from '@/ai/flows/ai-mentor-flow';
import { AIMentorInputSchema } from '@/ai/schemas/ai-mentor-schemas';
import { checkAndIncrementUsage } from '@/lib/subscription';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: 'Invalid or empty request body' }, { status: 400 });
    }
    const { prompt, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
    }

    const validation = AIMentorInputSchema.safeParse(prompt);

    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input. The prompt must be a string.', details: validation.error.flatten() }, { status: 400 });
    }

    await checkAndIncrementUsage(userId, 'doubt');
    
    const response = await getAIMentorResponse(validation.data);

    return NextResponse.json(response);

  } catch (error: any) {
    if (error.name === 'UsageLimitError') {
      return NextResponse.json({ error: error.message, upgrade: true }, { status: 429 });
    }
    console.error('AI Mentor API Error:', error);
    const errorMessage = error.message && error.message.includes('GEMINI_API_KEY')
      ? 'AI configuration error: The Gemini API Key is missing.'
      : 'An unexpected server error occurred while getting a response.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
