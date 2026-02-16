import { z } from 'zod';

export const QuestionSchema = z.object({
  question: z.string().describe("The question text in 'English / हिंदी' format."),
  options: z.array(z.string()).length(4).describe("An array of 4 possible answers, each in 'English / हिंदी' format."),
  answer: z.string().describe("The correct answer from the options in 'English / हिंदी' format."),
  explanation: z.string().describe("A brief, accurate explanation of the correct answer in 'English / हिंदी' format."),
  subject: z.string().describe("The specific subject of the question, e.g., 'Maths', 'Reasoning', 'Jharkhand GK'."),
  topic: z.string().describe("The specific topic within the subject, e.g., 'Percentage', 'Venn Diagram', 'Rivers of Jharkhand'."),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The difficulty level of the question, e.g., 'Easy', 'Medium', 'Hard', based on the exam pattern."),
});
export type Question = z.infer<typeof QuestionSchema>;


export const MockTestSchema = z.object({
  questions: z
    .array(QuestionSchema)
    .min(1)
    .max(100)
    .describe('An array of high-quality bilingual questions covering the requested subjects.'),
});
export type MockTest = z.infer<typeof MockTestSchema>;

export const MockTestInputSchema = z.object({
    subjects: z.array(z.string()).min(1),
    exam: z.string(),
    category: z.string().describe('The exam category, e.g., "ssc", "railways", "banking", "state".'),
    year: z.number().optional().describe("The specific year to simulate for the paper's pattern and difficulty."),
    seed: z.number().describe('A random number to ensure the generated test is unique and not from a cache.'),
    questionCount: z.number().describe('The number of questions to generate.'),
    userId: z.string().optional(), // Added for future use, e.g. user-specific generation
    // Adaptive Learning Parameters
    weakTopics: z.array(z.string()).optional().describe('An array of weak topics for the user to focus on.'),
    overallAccuracy: z.number().optional().describe('The user\'s overall performance accuracy to adjust difficulty.'),
    practiceWeakTopics: z.boolean().optional().describe('Flag to indicate a special practice session for weak topics only.'),
    // Internal flag for prompting
    isState: z.boolean().optional().describe('Flag to indicate if the exam is for a specific state for special prompting.'),
});
export type MockTestInput = z.infer<typeof MockTestInputSchema>;

export const CreateQuestionInputSchema = z.object({
  questionText: z.string().describe("The user-provided question text."),
  imageDataUri: z.string().optional().describe("An optional image of the question as a data URI."),
});
export type CreateQuestionInput = z.infer<typeof CreateQuestionInputSchema>;
