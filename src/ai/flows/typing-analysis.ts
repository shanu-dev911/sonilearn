'use server';

/**
 * @fileOverview AI Typing Analysis Flow
 * This file defines the Genkit flow for analyzing a user's typing performance
 * and providing personalized feedback. It uses the central AIManager for robustness.
 */

import { ai } from '@/ai/genkit';
import { runAIPrompt } from '../manager';
import { TypingAnalysisInputSchema, TypingAnalysisOutputSchema, type TypingAnalysisInput, type TypingAnalysisOutput } from '@/ai/schemas/typing-analysis-schemas';

const fallbackAnalysis: TypingAnalysisOutput = {
    feedback: "You've completed the test! This is a good start. Consistency is key to improving your speed and accuracy.",
    tips: [
        "Practice for at least 15 minutes every day.",
        "Focus on accuracy first, then speed will follow.",
        "Make sure your posture is correct and your fingers are on the home row (ASDF JKL;)."
    ]
};

const typingAnalysisPrompt = ai.definePrompt({
  name: 'typingAnalysisPrompt',
  input: { schema: TypingAnalysisInputSchema },
  output: { schema: TypingAnalysisOutputSchema },
  model: 'googleai/gemini-1.5-flash-preview',
  config: {
    safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
  system: `You are an expert typing coach for students preparing for competitive exams in India (like JSSC/SSC). Your tone should be encouraging and motivational. Analyze the user's typing performance based on the WPM and accuracy provided. Provide one line of personalized feedback and 2-3 specific, actionable tips for improvement. Keep the feedback and tips concise and easy to understand. For example, if accuracy is low, suggest focusing on not making mistakes rather than speed. If WPM is low, suggest practicing common words.`,
  prompt: `User's Performance:
    - Words Per Minute (WPM): {{{wpm}}}
    - Accuracy: {{{accuracy}}}%
    `,
});

// Exported wrapper function to be called from the frontend
export async function getTypingAnalysis(input: TypingAnalysisInput): Promise<TypingAnalysisOutput> {
  const result = await runAIPrompt(typingAnalysisPrompt, input, fallbackAnalysis);
  
  // Final validation to ensure the result is usable
  if (!result || !Array.isArray(result.tips) || result.tips.length < 2) {
      console.warn('AI Manager returned invalid typing analysis structure. Using fallback.');
      return fallbackAnalysis;
  }
  
  return result;
}
