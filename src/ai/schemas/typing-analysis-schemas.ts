import { z } from 'zod';

export const TypingAnalysisInputSchema = z.object({
  wpm: z.number().describe("The user's final words per minute score."),
  accuracy: z.number().describe("The user's final accuracy percentage."),
});
export type TypingAnalysisInput = z.infer<typeof TypingAnalysisInputSchema>;

export const TypingAnalysisOutputSchema = z.object({
  feedback: z.string().describe('Personalized feedback based on the performance.'),
  tips: z
    .array(z.string())
    .min(2)
    .describe('A list of 2-3 actionable tips for improvement.'),
});
export type TypingAnalysisOutput = z.infer<typeof TypingAnalysisOutputSchema>;
