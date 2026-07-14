"use client";
import { useState } from "react";

// ---- INTERNAL COPIED INTERFACE & UTILITY (Zero Import Error) ----
interface RawQuestion {
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

function shuffleOptionsPool(array: string[]): string[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function localSanitizeAndShuffle(rawQuestions: RawQuestion[]): RawQuestion[] {
  const cleanAndUniqueQuestions: RawQuestion[] = [];
  const seenQuestionTexts = new Set<string>();

  for (const q of rawQuestions) {
    if (!q.questionEn || !q.questionHi || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.answer) {
      continue;
    }

    const uniqueKey = q.questionEn.trim().toLowerCase();
    if (seenQuestionTexts.has(uniqueKey)) {
      continue;
    }
    seenQuestionTexts.add(uniqueKey);

    let realCorrectAnswerText = "";
    if (q.answer === "A") realCorrectAnswerText = q.optionA;
    else if (q.answer === "B") realCorrectAnswerText = q.optionB;
    else if (q.answer === "C") realCorrectAnswerText = q.optionC;
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

  return cleanAndUniqueQuestions.sort(() => Math.random() - 0.5);
}

// ---- MAIN TEST COMPONENT ----
export default function TestPage() {
  const [output, setOutput] = useState<RawQuestion[]>([]);

  const dummyRawQuestions: RawQuestion[] = [
    {
      exam: "RRB_ALP",
      subject: "General Science",
      difficulty: "easy",
      questionEn: "What is the chemical formula of Ozone?",
      questionHi: "ओजोन का सूत्र क्या है?",
      optionA: "O3 / ओजोन",
      optionB: "O2 / ऑक्सीजन",
      optionC: "CO2",
      optionD: "H2O",
      answer: "A",
      explanationEn: "O3 is ozone.",
      explanationHi: "O3 ओजोन है।"
    },
    {
      exam: "RRB_ALP",
      subject: "General Science",
      difficulty: "easy",
      questionEn: "What is the chemical formula of Ozone?", // Galti se aaya hua duplicate sawal
      questionHi: "ओजोन का सूत्र क्या है?",
      optionA: "O3 / ओजोन",
      optionB: "O2",
      optionC: "CO2",
      optionD: "H2O",
      answer: "A",
      explanationEn: "O3 is ozone.",
      explanationHi: "O3 ओजोन है।"
    }
  ];

  const handleTest = () => {
    const cleanData = localSanitizeAndShuffle(dummyRawQuestions);
    setOutput(cleanData);
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h2>SoniLearn Automatic Guard Tester 🚀</h2>
      <p>Neeche button par click karke check karein ki data automatic sahi aur filter ho raha hai ya nahi:</p>
      
      <button 
        onClick={handleTest} 
        style={{ padding: "10px 20px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
      >
        Run Live Test ⚡
      </button>

      {output.length > 0 && (
        <div style={{ marginTop: "30px", background: "#f4f4f4", padding: "20px", borderRadius: "8px" }}>
          <h3>🔥 Output Results:</h3>
          <p>Total questions allowed inside user screen: <strong>{output.length}</strong></p>
          
          <pre style={{ background: "#222", color: "#fff", padding: "15px", borderRadius: "5px", overflowX: "auto" }}>
            {JSON.stringify(output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}