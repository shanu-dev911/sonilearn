
'use server';

/**
 * @fileOverview NCERT Foundation Question Generator Flow
 * This file defines the Genkit flow for generating practice questions from NCERT books.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { runAIPrompt } from '../manager';
import {
    NCERTTestInputSchema,
    NCERTTestSchema,
    NCERTQuestionSchema,
    type NCERTTestInput,
    type NCERTTest
} from '@/ai/schemas/ncert-foundation-schemas';

const fallbackNCERTTest: NCERTTest = {
    questions: []
};

const generateNCERTTestPrompt = ai.definePrompt({
    name: 'generateNCERTTestPrompt',
    input: { schema: NCERTTestInputSchema },
    output: { schema: NCERTTestSchema },
    model: 'googleai/gemini-1.5-flash-preview',
    config: {
        temperature: 0.5,
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
    },
    system: `You are an expert AI Question Generator specializing in Indian NCERT textbooks. Your sole purpose is to create high-quality, objective-style (MCQ) questions based on specific NCERT chapters. Your accuracy is paramount.

**Request ID:** {{seed}}. This is a unique request. Do not use cached data.

**Primary Directive:** Generate a practice test containing EXACTLY 15 multiple-choice questions from the specified NCERT book chapter.

**Data Source & Accuracy Mandate:**
- Your ONLY source of information MUST be the official NCERT textbook content for the given class, subject, and chapter.
- Class: **{{selectedClass}}**
- Subject: **{{subject}}**
- Chapter: **{{chapter}}**
- You are FORBIDDEN from using any external knowledge or inventing facts. Every question, option, and explanation must be directly derivable from the specified chapter's text.
- **Self-Correction:** Before finalizing the output, you MUST internally re-verify your own generated questions, answers, and explanations against the chapter content to ensure 100% accuracy.

**Content Rules:**
- Generate 15 unique MCQs.
- Each question must have 4 plausible options, with one being the single correct answer.
- The explanation MUST be concise and directly reference the concept from the chapter (e.g., 'As explained in section 3.2 of the chapter...').
- Each question must have a 'difficulty' level ('Easy', 'Medium', or 'Hard') based on the complexity of the topic within the chapter.
- EVERY text field ('question', all 'options', 'answer', 'explanation') MUST be bilingual in the format: 'English Text / हिंदी टेक्स्ट'. This is non-negotiable.

**Output Format Mandate:**
- Your entire response MUST be a single, raw, valid JSON object that conforms to the output schema.
- It MUST start with \`{\` and end with \`}\`.
- DO NOT include ANY extra text, markdown like \`\`\`json\`, apologies, or explanations. Just the raw JSON.
`,
    prompt: `Generate the 15-question test for {{selectedClass}} {{subject}}, Chapter: "{{chapter}}" now.`,
});


export async function generateNCERTTest(input: NCERTTestInput): Promise<NCERTTest> {
    const result = await runAIPrompt(generateNCERTTestPrompt, input, fallbackNCERTTest);

    if (!result || !Array.isArray(result.questions) || result.questions.length === 0) {
      console.warn('AI Manager returned invalid NCERT test structure or empty questions. Returning empty array.');
      return { questions: [] };
    }
    
    // Enforce the strict count rule. If the AI fails, it's better to return an empty array to signify failure.
    if (result.questions.length !== 15) {
        console.warn(`AI returned ${result.questions.length} questions, but 15 were requested. This is a critical prompt compliance failure. Returning empty array.`);
        return { questions: [] };
    }

    return result;
}

    
