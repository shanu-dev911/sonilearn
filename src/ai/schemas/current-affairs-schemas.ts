import { z } from 'zod';
import { MockTestSchema } from './daily-mock-test-schemas';

export const CurrentAffairsInputSchema = z.object({
  date: z.string().describe('The date for which to generate the current affairs quiz, in YYYY-MM-DD format.'),
  seed: z.number().describe('A random number to ensure the generated test is unique.'),
});
export type CurrentAffairsInput = z.infer<typeof CurrentAffairsInputSchema>;

export const CurrentAffairsOutputSchema = MockTestSchema;
export type CurrentAffairsOutput = z.infer<typeof CurrentAffairsOutputSchema>;
