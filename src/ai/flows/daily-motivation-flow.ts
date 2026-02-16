'use server';

/**
 * @fileOverview AI Daily Motivation Flow
 * Generates a daily motivational quote for the user.
 */

import { ai } from '@/ai/genkit';
import { runAIPrompt } from '../manager';
import { DailyMotivationInputSchema, DailyMotivationOutputSchema, type DailyMotivationInput, type DailyMotivationOutput } from '@/ai/schemas/daily-motivation-schemas';


const fallbackQuote: DailyMotivationOutput = {
    quote: "Koshish aakhri saans tak karni chahiye, ya toh lakshya haasil hoga ya anubhav. Dono hi cheezein amulya hain.",
};

const dailyMotivationPrompt = ai.definePrompt({
  name: 'dailyMotivationPrompt',
  input: { schema: DailyMotivationInputSchema },
  output: { schema: DailyMotivationOutputSchema },
  model: 'googleai/gemini-1.5-flash-preview',
  config: {
    temperature: 0.9, // A bit more creative
    safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
  system: `You are an AI motivation coach for students in India preparing for competitive government exams like SSC, JSSC, UPSC, and Railways. Your name is Soni.
Your task is to generate a powerful, original, and inspiring 2-line motivational quote or shayari.
- The quote MUST be in a conversational, easy-to-understand mix of Hindi and English (Hinglish).
- It should ignite a fire in the student to study hard and achieve their goal of getting a government job.
- Do not be generic. Be impactful and full of josh (energy).
- Keep it concise to two lines.`,
  prompt: `Generate a new, unique motivational quote for a student.`,
});

// Exported wrapper function
export async function getDailyMotivation(input: DailyMotivationInput): Promise<DailyMotivationOutput> {
  const result = await runAIPrompt(dailyMotivationPrompt, input, fallbackQuote);
  
  if (!result || typeof result.quote !== 'string') {
      console.warn('AI Manager returned invalid motivation response structure. Using fallback.');
      return fallbackQuote;
  }
  
  return result;
}
