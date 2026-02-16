
import { z } from 'zod';

export const AIMentorInputSchema = z.string().describe("The user's question or doubt.");
export type AIMentorInput = z.infer<typeof AIMentorInputSchema>;

export const AIMentorOutputSchema = z.object({
  answer: z.string().describe('A helpful and detailed answer to the user\'s question, in a mix of English and Hindi (Hinglish).'),
});
export type AIMentorOutput = z.infer<typeof AIMentorOutputSchema>;
