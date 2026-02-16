
'use server';

/**
 * @fileOverview Daily Mock Test Generator Flow (Adaptive Learning Engine)
 * This file defines the Genkit flow for generating adaptive mock tests using AI.
 * It now incorporates user performance data and caching to create personalized and efficient tests.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { runAIPrompt } from '../manager';
import {
    QuestionSchema,
    MockTestSchema,
    MockTestInputSchema,
    CreateQuestionInputSchema,
    type MockTestInput,
    type CreateQuestionInput,
    type MockTest,
    type Question
} from '@/ai/schemas/daily-mock-test-schemas';
import { examBlueprints } from '@/lib/exam-blueprints';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


// --- Single Question Generation ---

const fallbackSingleQuestion: Question = {
    question: "",
    options: [],
    answer: "",
    explanation: "",
    subject: "",
    topic: "",
    difficulty: "Medium",
};

const createQuestionPrompt = ai.definePrompt({
    name: 'createQuestionPrompt',
    input: { schema: CreateQuestionInputSchema },
    output: { schema: QuestionSchema },
    model: 'googleai/gemini-1.5-flash-preview',
    config: {
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
    },
    prompt: `You are an AI Question Generator for Indian competitive exams. Your task is to take a user's raw question (as text and/or an image) and convert it into a complete, structured mock test question object.

**Accuracy & Content Rules:**
1.  **Analyze Input:** Carefully analyze the user's provided question from the text and/or image.
2.  **Generate Full Object:** Based on the user's question, you MUST generate a complete question object that includes:
    - \`question\`: The question itself.
    - \`options\`: An array of 4 plausible options. One must be correct.
    - \`answer\`: The single correct answer from the options.
    - \`explanation\`: A clear, step-by-step explanation written in your own words, including 2-3 related facts.
    - \`difficulty\`: The difficulty of the question ('Easy', 'Medium', 'Hard') based on PYQ analysis.
3.  **Fact-Checking:** You MUST internally re-verify your generated answer and explanation for 100% accuracy before finalizing the output.
4.  **Originality:** For math/reasoning, use original numbers and values.
5.  **PYQ Pattern:** The style, difficulty, and format of the generated question and options should strictly match the pattern of previous 25 years' official papers for exams like SSC, JPSC, BPSC etc.
6.  **Strict Bilingual Format:** EVERY text field ('question', all 'options', 'answer', 'explanation', 'subject', 'topic') MUST be bilingual in a natural, conversational format: 'English Text / हिंदी टेक्स्ट'. This is non-negotiable.
7.  **Output Format:** Your entire response MUST be a single, raw JSON object. Do NOT include any explanatory text or markdown.

**User's Raw Question:**
Text: {{{questionText}}}
{{#if imageDataUri}}
Image: {{media url=imageDataUri}}
{{/if}}
`,
});

export async function createQuestionFromUserInput(input: CreateQuestionInput): Promise<z.infer<typeof QuestionSchema>> {
    const result = await runAIPrompt(createQuestionPrompt, input, fallbackSingleQuestion);
    if (!result || !result.question || !result.options || result.options.length !== 4) {
      console.warn('AI Manager returned invalid single question structure. Using fallback.');
      return fallbackSingleQuestion;
    }
    return result;
}

// --- Full Mock Test Generation (Non-Streaming) ---

const fallbackFullTest: MockTest = {
    questions: []
};

const generateMockTestPrompt = ai.definePrompt({
    name: 'generateMockTestPrompt',
    input: { schema: MockTestInputSchema },
    output: { schema: MockTestSchema },
    model: 'googleai/gemini-1.5-flash-preview',
    config: {
        temperature: 0.7,
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
    },
    system: `You are an Indian competitive exam question generator. Your purpose is to create high-quality, original, and ADAPTIVE mock test questions with 100% accuracy.

**Request ID:** {{seed}}. This is a unique, one-time request. Do NOT use cached data.

--- STRICT RULES (NO EXCEPTIONS) ---
1.  **Exam & Subject Focus:**
    - Exam: {{exam}}
    - Subject(s): {{#each subjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    - Year Pattern Simulation: {{#if year}}Your question style and difficulty MUST strictly simulate the exam trend of **{{year}}**. For context, use the PYQ trend from the 25 years leading up to that year.{{else}}Follow the latest exam pattern.{{/if}}
    - Difficulty Level: All questions must be of Previous Year Question (PYQ) level.

2.  **Content & Quality:**
    - **Relevance:** All questions must be highly relevant to the specified exam and subject. Do NOT generate basic questions like '2+2' or 'capital of India'.
    - **Originality:** Create **completely new and original questions**. The core concept and difficulty must be similar to PYQs, but the language, values, and scenarios MUST be unique. Do NOT repeat questions.

3.  **Formatting (ONLY JSON, NOTHING ELSE):**
    - Your entire response MUST be a single, raw, valid JSON object that conforms to the output schema.
    - The JSON object must have a single key "questions", which is an array of question objects. Example: \`{"questions": [...]}\`.
    - **Bilingual Mandate:** EVERY text field ('question', all 'options', 'answer', 'explanation', 'subject', 'topic') MUST be bilingual: 'English Text / हिंदी टेक्स्ट'.
    - Each question object must have: a 'question', an array of 4 'options', a correct 'answer' (full text), an 'explanation', the 'subject', the 'topic', and a 'difficulty' ('Easy', 'Medium', 'Hard').

4.  **Adaptive Learning Engine:**
    {{#if practiceWeakTopics}}
    - **WEAK TOPIC PRACTICE MODE:** Generate questions ONLY from these weak topics: {{#each weakTopics}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}.
    {{else}}
    - **STANDARD ADAPTIVE MODE:**
      {{#if weakTopics.length}}
      - **Prioritize Weak Topics:** The user's weak topics are {{#each weakTopics}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}. Include more questions from these topics.
      {{/if}}
      {{#if overallAccuracy}}
      - **Adjust Difficulty:** The user's accuracy is {{overallAccuracy}}%. Adjust the difficulty mix accordingly:
        - >75% Acc: 40% Hard, 50% Medium, 10% Easy.
        - <40% Acc: 40% Easy, 50% Medium, 10% Hard.
        - Default: 30% Easy, 50% Medium, 20% Hard.
      {{else}}
      - **Default Mix:** 30% Easy, 50% Medium, 20% Hard.
      {{/if}}
    {{/if}}

5.  **Exam-Specific Instructions:**
    {{#if isState}}
    - **State-Specific Content (25-30%):** For this State Exam, ensure 25-30% of questions are from the General Knowledge of the relevant state.
    {{else}}
    - **Central Exam Content:** For this Central Exam ({{exam}}), DO NOT include any state-specific GK.
    {{/if}}
    
If you cannot generate proper questions, RETURN A JSON OBJECT WITH AN EMPTY ARRAY: \`{"questions": []}\`.
`,
    prompt: `Generate the mock test with {{questionCount}} questions now for the exam: {{exam}}.`,
});


export async function generateMockTest(input: MockTestInput): Promise<MockTest> {
    const isPersonalized = !!input.weakTopics?.length || !!input.practiceWeakTopics;
    const { firestore } = initializeFirebase();
    let cacheKey: string | null = null;
    let docRef: any = null;

    if (!isPersonalized) {
        const sortedSubjects = [...input.subjects].sort().join('-');
        cacheKey = `mock-test-${input.exam}-${sortedSubjects}-${input.year || 'latest'}-${input.questionCount}`;
        docRef = doc(firestore, 'generatedMockTests', cacheKey);

        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log(`AI Manager: Serving mock test from Firestore cache with key: ${cacheKey}`);
                return docSnap.data() as MockTest;
            }
        } catch (error) {
            console.error(`AI Manager: Error reading mock test from cache for key ${cacheKey}. Proceeding to generate.`, error);
        }
        console.log(`AI Manager: No cache found for ${cacheKey}. Generating new mock test.`);
    } else {
        console.log("AI Manager: Generating a personalized test (bypassing cache).");
    }

    const blueprint = examBlueprints[input.exam];
    const isBlueprintTest = blueprint && input.subjects.length > 1;
    let allQuestions: Question[] = [];

    if (isBlueprintTest) {
        // --- NEW BLUEPRINT-BASED GENERATION LOGIC ---
        console.log(`AI Manager: Using blueprint for '${input.exam}'. Total questions: ${blueprint.totalQuestions}`);

        const generationPromises = blueprint.distribution.map(part => {
            const singleSubjectInput: MockTestInput = {
                ...input,
                subjects: [part.subject],
                questionCount: part.count,
                seed: Date.now() + Math.random(),
                practiceWeakTopics: false,
            };
            
            console.log(`AI Manager: Requesting ${part.count} questions for subject '${part.subject}'.`);
            return runAIPrompt(generateMockTestPrompt, singleSubjectInput, { questions: [] as Question[] });
        });

        const results = await Promise.all(generationPromises);
        
        let failed = false;
        results.forEach((result, index) => {
            const part = blueprint.distribution[index];
            if (!result || !Array.isArray(result.questions) || result.questions.length !== part.count) {
                console.error(`AI Manager: Generation failed for subject '${part.subject}'. Expected ${part.count}, got ${result?.questions?.length || 0}.`);
                failed = true;
            } else {
                allQuestions.push(...result.questions);
            }
        });

        if (failed || allQuestions.length !== blueprint.totalQuestions) {
            console.error(`AI Manager: Final generated count (${allQuestions.length}) does not match blueprint total (${blueprint.totalQuestions}). Aborting.`);
            throw new Error(`AI failed to generate a complete test according to the exam blueprint. Please try again.`);
        }
        
        for (let i = allQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
        }

        console.log(`AI Manager: Successfully generated and assembled ${allQuestions.length} questions.`);

    } else {
        // --- EXISTING BATCHING LOGIC FOR SUBJECT-WISE/NON-BLUEPRINT TESTS ---
        console.log(`AI Manager: No blueprint found for '${input.exam}' or it's a single-subject test. Using standard batch generation.`);
        const categoryLower = input.category.toLowerCase();
        const isStateExam = categoryLower.includes('state') || categoryLower.includes('jssc') || categoryLower.includes('bpsc') || categoryLower.includes('police');
        const promptReadyInput = { ...input, isState: isStateExam };

        const totalQuestionsToGenerate = input.questionCount;
        const batchSize = 20; // Generate in stable batches of 20 for reliability
        const numBatches = Math.ceil(totalQuestionsToGenerate / batchSize);

        console.log(`AI Manager: Planning to generate ${totalQuestionsToGenerate} questions in ${numBatches} batches.`);

        for (let i = 0; i < numBatches; i++) {
            const questionsInThisBatch = Math.min(batchSize, totalQuestionsToGenerate - allQuestions.length);
            if (questionsInThisBatch <= 0) break;

            console.log(`AI Manager: Generating batch ${i + 1}/${numBatches} with ${questionsInThisBatch} questions...`);
            
            const batchInput = { 
                ...promptReadyInput, 
                questionCount: questionsInThisBatch, 
                seed: Date.now() + i 
            };
            
            const batchResult = await runAIPrompt(generateMockTestPrompt, batchInput, fallbackFullTest);

            if (!batchResult || !Array.isArray(batchResult.questions) || batchResult.questions.length !== questionsInThisBatch) {
                console.error(`AI Manager: Batch ${i + 1} failed or returned incorrect number of questions (${batchResult?.questions?.length || 0}/${questionsInThisBatch}). Aborting generation.`);
                throw new Error(`AI failed to generate a complete test batch. Please try again.`);
            }
            
            allQuestions.push(...batchResult.questions);
            console.log(`AI Manager: Batch ${i + 1} successful. Total questions so far: ${allQuestions.length}`);
        }

        if (allQuestions.length !== totalQuestionsToGenerate) {
            console.error(`AI Manager: Final generated count (${allQuestions.length}) does not match requested count (${totalQuestionsToGenerate}).`);
            throw new Error("Failed to generate the complete set of questions.");
        }
    }

    const generatedTest: MockTest = { questions: allQuestions };

    // Save to cache if it wasn't personalized and generation was successful
    if (!isPersonalized && docRef && generatedTest.questions.length > 0) {
        try {
            await setDoc(docRef, generatedTest);
            console.log(`AI Manager: Saved new mock test to Firestore cache with key: ${cacheKey}`);
        } catch (error) {
            console.error(`AI Manager: Error saving mock test to Firestore cache for key: ${cacheKey}`, error);
            // Don't fail the request, just log the error.
        }
    }

    return generatedTest;
}
