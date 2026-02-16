import { z } from 'zod';
import { MockTestSchema } from '@/ai/schemas/daily-mock-test-schemas';

// Schemas
export const CustomTestInputSchema = z.object({
    subject: z.string().describe('The subject for the test, e.g., "Maths".'),
    topic: z.string().describe('The specific topic for the test, e.g., "Profit and Loss".'),
    questionCount: z.number().min(5).max(50).describe('The number of questions to generate.'),
    seed: z.number().describe('A random number to ensure the generated test is unique.'),
});
export type CustomTestInput = z.infer<typeof CustomTestInputSchema>;

export const CustomTestOutputSchema = MockTestSchema;
export type CustomTestOutput = z.infer<typeof CustomTestOutputSchema>;
