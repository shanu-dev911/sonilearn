import { NextResponse } from 'next/server';
import { getDailyMotivation } from '@/ai/flows/daily-motivation-flow';
import { DailyMotivationInputSchema } from '@/ai/schemas/daily-motivation-schemas';

export async function POST(request: Request) {
  try {
    // The request body might be empty, which is fine.
    // We'll just pass an empty object to the flow.
    const body = await request.json().catch(() => ({}));
    const validation = DailyMotivationInputSchema.safeParse(body);

    if (!validation.success) {
      // Even if validation fails, we can proceed with an empty object.
      // This makes the API robust.
      const response = await getDailyMotivation({});
      return NextResponse.json(response);
    }
    
    const response = await getDailyMotivation(validation.data);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Daily Motivation API Error:', error);
    const errorMessage = error.message && error.message.includes('GEMINI_API_KEY')
      ? 'AI configuration error: The Gemini API Key is missing.'
      : 'An unexpected server error occurred while getting motivation.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
