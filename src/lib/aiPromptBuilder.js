
import { EXAM_SCHEMA } from "./exam-schema.js";

export function buildPrompt(exam, subject, year) {
  const config = EXAM_SCHEMA[exam];
  if (!config) {
    throw new Error(`Exam configuration not found for: ${exam}`);
  }
  if (!config.subjects[subject]) {
    throw new Error(`Subject configuration not found for: ${subject} in exam ${exam}`);
  }
  const topics = config.subjects[subject].join(", ");

  // Conditionally add the year to the prompt
  const yearReference = year ? `Year Pattern Reference: ${year}` : '';

  return `
You are an Indian competitive exam paper setter.

Generate 20 MCQ questions for:
Exam: ${exam}
Subject: ${subject}
${yearReference}
Difficulty: ${config.level}

Topics must include: ${topics}

Rules:
- Follow SSC/Exam PYQ pattern style
- No repeated questions
- Mix topics properly
- Real exam level logic
- 4 options only
- One correct answer

Return ONLY in JSON format like:

[
  {
    "question": "",
    "options": ["A","B","C","D"],
    "answer": ""
  }
]
`;
}
