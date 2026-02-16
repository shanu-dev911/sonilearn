import { z } from 'zod';

// Re-using the same question schema as it's a good fit.
export const NCERTQuestionSchema = z.object({
  question: z.string().describe("The question text in 'English / हिंदी' format."),
  options: z.array(z.string()).length(4).describe("An array of 4 possible answers, each in 'English / हिंदी' format."),
  answer: z.string().describe("The correct answer from the options in 'English / हिंदी' format."),
  explanation: z.string().describe("A brief, accurate explanation of the correct answer in 'English / हिंदी' format, referencing the NCERT chapter."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty level of the question based on the chapter content, e.g., 'Easy', 'Medium', 'Hard'."),
});
export type NCERTQuestion = z.infer<typeof NCERTQuestionSchema>;

export const NCERTTestSchema = z.object({
  questions: z
    .array(NCERTQuestionSchema)
    .min(1)
    .max(20)
    .describe('An array of 15-20 high-quality bilingual questions based on the NCERT chapter.'),
});
export type NCERTTest = z.infer<typeof NCERTTestSchema>;

export const NCERTTestInputSchema = z.object({
    selectedClass: z.string().describe('The class selected by the user, e.g., "Class 10".'),
    subject: z.string().describe('The subject selected by the user, e.g., "History".'),
    chapter: z.string().describe('The chapter name or number, e.g., "Chapter 1: The Rise of Nationalism in Europe".'),
    seed: z.number().describe('A random number to ensure the generated test is unique.'),
});
export type NCERTTestInput = z.infer<typeof NCERTTestInputSchema>;
