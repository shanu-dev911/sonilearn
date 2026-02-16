
'use server';

/**
 * @fileOverview AI Mentor Flow for answering user doubts.
 */

import { ai } from '@/ai/genkit';
import { runAIPrompt } from '../manager';
import { AIMentorInputSchema, AIMentorOutputSchema, type AIMentorInput, type AIMentorOutput } from '@/ai/schemas/ai-mentor-schemas';


const fallbackAnswer: AIMentorOutput = {
    answer: "Mujhe khed hai, main abhi is sawaal ka jawab nahi de paa raha hoon. Kripya apne sawaal ko doosre shabdon mein poochne ki koshish karein ya thodi der baad phir se prayas karein.",
};

const aiMentorPrompt = ai.definePrompt({
  name: 'aiMentorPrompt',
  input: { schema: AIMentorInputSchema },
  output: { schema: AIMentorOutputSchema },
  model: 'googleai/gemini-1.5-flash',
  config: {
    safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
  system: `You are an expert AI mentor for students preparing for competitive exams in India (like SSC, JSSC, BPSC, UPSC, Railways). Your name is Soni. A user has a doubt. Your task is to provide a clear, concise, accurate, and helpful answer.
- If the question is about a General Studies (GS) fact, provide context and related information.
- If it's a Math or Reasoning problem, provide the step-by-step solution and explain the logic or trick involved.
- If it's a general query, be encouraging and supportive.
- You MUST answer in a conversational, easy-to-understand mix of Hindi and English (Hinglish).`,
  prompt: `User's Question: '{{{this}}}'`,
});

// Exported wrapper function to be called from the frontend
export async function getAIMentorResponse(input: AIMentorInput): Promise<AIMentorOutput> {
  const result = await runAIPrompt(aiMentorPrompt, input, fallbackAnswer);
  
  if (!result || typeof result.answer !== 'string') {
      console.warn('AI Manager returned invalid mentor response structure. Using fallback.');
      return fallbackAnswer;
  }
  
  return result;
}
