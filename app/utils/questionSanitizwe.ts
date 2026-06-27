// SoniLearn App: app/utils/questionSanitizer.ts

export interface RawQuestion {
  id?: string;
  exam: string;
  subject: string;
  difficulty: string;
  questionEn: string;
  questionHi: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  explanationEn: string;
  explanationHi: string;
}

// Options ko true random mix karne ka utility handler
function shuffleOptionsPool(array: string[]): string[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sanitizeAndShuffleQuestions(rawQuestions: RawQuestion[]): RawQuestion[] {
  const cleanAndUniqueQuestions: RawQuestion[] = [];
  const seenQuestionTexts = new Set<string>();

  for (const q of rawQuestions) {
    // ---- 1. BAD DATA FILTRATION GUARD ----
    if (!q.questionEn || !q.questionHi || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.answer) {
      continue; // Ganda data dropped!
    }

    // ---- 2. ZERO DUPLICATION FILTER ----
    const uniqueKey = q.questionEn.trim().toLowerCase();
    if (seenQuestionTexts.has(uniqueKey)) {
      continue; // Duplicate duplicate spotted, user ko nahi dikhega!
    }
    seenQuestionTexts.add(uniqueKey);

    // ---- 3. AUTOMATIC ANSWER KEY & OPTION SHUFFLING ----
    let realCorrectAnswerText = "";
    if (q.answer === "A") realCorrectAnswerText = q.optionA;
    else if (q.answer === "B") realCorrectAnswerText = q.optionB;
    else if (q.answer === "C") realCorrectAnswerText = q.optionC; // FIX Line 53: Text target synced properly
    else if (q.answer === "D") realCorrectAnswerText = q.optionD;
    
    if (!realCorrectAnswerText) realCorrectAnswerText = q.optionA;

    const optionsPool = [q.optionA, q.optionB, q.optionC, q.optionD];
    const randomizedOptions = shuffleOptionsPool(optionsPool);

    const sanitizedQuestion: RawQuestion = {
      ...q,
      optionA: randomizedOptions[0],
      optionB: randomizedOptions[1],
      optionC: randomizedOptions[2],
      optionD: randomizedOptions[3],
      answer: "A"
    };

    // FIX Line 77, 78, 79: Replaced 'elif' with valid TypeScript 'else if' statements
    if (sanitizedQuestion.optionA === realCorrectAnswerText) {
      sanitizedQuestion.answer = "A";
    } else if (sanitizedQuestion.optionB === realCorrectAnswerText) {
      sanitizedQuestion.answer = "B";
    } else if (sanitizedQuestion.optionC === realCorrectAnswerText) {
      sanitizedQuestion.answer = "C";
    } else if (sanitizedQuestion.optionD === realCorrectAnswerText) {
      sanitizedQuestion.answer = "D";
    }

    cleanAndUniqueQuestions.push(sanitizedQuestion);
  }

  // Pure list array ko ek final complete shake test dekar user view ke liye return karein
  return cleanAndUniqueQuestions.sort(() => Math.random() - 0.5);
}