
'use server';

/**
 * @fileOverview Daily Current Affairs Quiz Generator Flow
 * This file defines the Genkit flow for generating a daily quiz based on the day's news.
 */
import { ai } from '@/ai/genkit';
import { runAIPrompt } from '../manager';
import { 
    CurrentAffairsInputSchema, 
    CurrentAffairsOutputSchema,
    type CurrentAffairsInput, 
    type CurrentAffairsOutput 
} from '@/ai/schemas/current-affairs-schemas';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const fallbackCurrentAffairs: CurrentAffairsOutput = {
    questions: []
};

const generateCurrentAffairsPrompt = ai.definePrompt({
    name: 'generateCurrentAffairsPrompt',
    input: { schema: CurrentAffairsInputSchema },
    output: { schema: CurrentAffairsOutputSchema },
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
    system: `You are an expert AI News Analyst and Content Creator for Indian competitive exams (like SSC, Banking, Railways, State PSCs). Your sole purpose is to create a daily current affairs quiz.

**Request ID:** {{seed}}. This is a unique request. Do not use cached data.

**Primary Directive:**
1.  **Analyze News:** For the given date **{{date}}**, identify the top 10 most important national and international news headlines that are relevant for exam aspirants in India.
2.  **Generate Quiz:** Based on these headlines, generate a high-quality quiz containing EXACTLY 10 multiple-choice questions.

**Content & Accuracy Rules:**
- **Relevance:** Questions must be directly related to significant events, appointments, schemes, awards, or reports from the specified date or the day before.
- **Fact-Checking:** Before finalizing the output, you MUST internally re-verify every question, answer, and explanation for 100% factual accuracy against reliable news sources.
- **Originality:** Create **completely new and original questions**. The phrasing must be unique.
- **Bilingual Format:** EVERY text field ('question', all 'options', 'answer', 'explanation', 'subject', 'topic') MUST be bilingual in the format: 'English Text / हिंदी टेक्स्ट'. For subject and topic, use 'Current Affairs' / 'समसामयिकी'.
- **Question Structure:** Each question must have 4 plausible options, a single correct answer, a clear, mandatory explanation that provides context about the news event, and a 'difficulty' level ('Easy', 'Medium', 'Hard').

**Output Format Mandate:**
- Your entire response MUST be a single, raw, valid JSON object that conforms to the output schema.
- It MUST start with \`{\` and end with \`}\`.
- DO NOT include ANY extra text, markdown, or apologies. Just the raw JSON.
`,
    prompt: `Generate the 10-question Current Affairs quiz for the date: {{date}}.`,
});

export async function generateDailyCurrentAffairsTest(input: CurrentAffairsInput): Promise<CurrentAffairsOutput> {
    const { firestore } = initializeFirebase();
    const cacheKey = `current-affairs-${input.date}`;
    const docRef = doc(firestore, 'generatedMockTests', cacheKey);

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log("AI Manager: Serving current affairs quiz from Firestore cache.");
            return docSnap.data() as CurrentAffairsOutput;
        }
    } catch (error) {
        console.error("AI Manager: Error reading current affairs from cache. Proceeding to generate.", error);
    }
    
    console.log(`AI Manager: No cache found for ${cacheKey}. Generating new current affairs quiz.`);
    const result = await runAIPrompt(generateCurrentAffairsPrompt, input, fallbackCurrentAffairs);

    if (!result || !Array.isArray(result.questions) || result.questions.length !== 10) {
      console.warn(`AI returned invalid current affairs test structure or wrong number of questions (${result?.questions?.length || 0}/10). Returning empty array.`);
      return fallbackCurrentAffairs;
    }

    try {
        await setDoc(docRef, result);
        console.log(`AI Manager: Saved new current affairs quiz to Firestore cache with key: ${cacheKey}`);
    } catch (error) {
        console.error("AI Manager: Error saving current affairs quiz to Firestore cache.", error);
    }

    return result;
}
