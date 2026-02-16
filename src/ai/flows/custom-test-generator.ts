
'use server';

/**
 * @fileOverview Custom Test Generator Flow
 * This file defines the Genkit flow for generating a custom practice test based on user-defined topics.
 */
import { ai } from '@/ai/genkit';
import { runAIPrompt } from '../manager';
import { 
    CustomTestInputSchema, 
    CustomTestOutputSchema,
    type CustomTestInput, 
    type CustomTestOutput 
} from '@/ai/schemas/custom-test-schemas';

// Fallback
const fallbackCustomTest: CustomTestOutput = {
    questions: []
};

// Prompt
const generateCustomTestPrompt = ai.definePrompt({
    name: 'generateCustomTestPrompt',
    input: { schema: CustomTestInputSchema },
    output: { schema: CustomTestOutputSchema },
    model: 'googleai/gemini-1.5-flash-preview',
    config: {
        temperature: 0.6,
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
    },
    system: `You are an expert AI Question Generator for Indian competitive exams. Your sole purpose is to create a focused, high-quality practice test on a specific topic. Your accuracy is paramount.

**Request ID:** {{seed}}. This is a unique request. Do not use cached data.

**Primary Directive:** Generate a practice test containing EXACTLY {{questionCount}} multiple-choice questions based on the specified subject and topic.

**Accuracy & Content Rules:**
- **Fact-Checking:** Before finalizing the output, you MUST internally re-verify every question, answer, and explanation for factual accuracy. Use only verified information from official sources like NCERT or standard reference books.
- **Topic Focus:** All questions MUST be strictly about the topic: **{{topic}}** within the subject: **{{subject}}**.
- **Originality:** Create **completely new and original questions**. The logic and difficulty must be similar to PYQs, but the language, numbers, names, and scenarios MUST be unique to avoid any copyright issues.
- **Strict Question Count:** You MUST generate EXACTLY {{questionCount}} questions.
- **Bilingual Format:** EVERY text field ('question', all 'options', 'answer', 'explanation', 'subject', 'topic') MUST be bilingual in the format: 'English Text / हिंदी टेक्स्ट'. This is non-negotiable.
- **Question Structure:** Each question must have 4 plausible options, a single correct answer, a clear, mandatory explanation, and a 'difficulty' level ('Easy', 'Medium', or 'Hard').

**Output Format Mandate:**
- Your entire response MUST be a single, raw, valid JSON object that conforms to the output schema.
- It MUST start with \`{\` and end with \`}\`.
- DO NOT include ANY extra text, markdown, or apologies. Just the raw JSON.
`,
    prompt: `Generate the {{questionCount}}-question test for Subject: "{{subject}}", Topic: "{{topic}}" now.`,
});

// Exported wrapper function
export async function generateCustomTest(input: CustomTestInput): Promise<CustomTestOutput> {
    const result = await runAIPrompt(generateCustomTestPrompt, input, fallbackCustomTest);

    if (!result || !Array.isArray(result.questions)) {
      console.warn('AI Manager returned invalid custom test structure. Returning empty array.');
      return fallbackCustomTest;
    }
    
    // Enforce the strict count rule.
    if (result.questions.length !== input.questionCount) {
        console.warn(`AI returned ${result.questions.length} questions, but ${input.questionCount} were requested. Critical failure. Returning empty array.`);
        return fallbackCustomTest;
    }

    return result;
}

    
