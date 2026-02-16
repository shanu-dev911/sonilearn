import { z } from 'zod';

export const DailyMotivationInputSchema = z.object({
  name: z.string().optional(),
});
export type DailyMotivationInput = z.infer<typeof DailyMotivationInputSchema>;

export const DailyMotivationOutputSchema = z.object({
  quote: z.string().describe('A powerful 2-line motivational quote or shayari in Hinglish.'),
});
export type DailyMotivationOutput = z.infer<typeof DailyMotivationOutputSchema>;
