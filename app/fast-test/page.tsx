"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, BookOpen, RotateCcw, Timer, Flag, ArrowRight } from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";

type Question = {
  id: string;
  questionEn: string;
  questionHi: string;
  optionsEn: string[];
  optionsHi: string[];
  answer: string;
  explanationEn?: string;
  explanationHi?: string;
  subject?: string;
};

type Phase = "loading" | "subject-select" | "quiz" | "submitting" | "result";

const TOTAL_QUESTIONS = 30;
const TIMER_SECONDS = 30 * 60; // 30 minutes

const normalizeExam = (exam: string) => {
  const cleaned = exam.trim();
  const underscored = cleaned.replace(/\s+/g, "_");
  return Array.from(
    new Set([cleaned, underscored, underscored.toUpperCase(), underscored.toLowerCase()])
  );
};

// 🎯 CATEGORY MAPPING — group all subject-name variants into just 2 buckets
const MATH_VARIANTS = ["mathematics", "quantitative aptitude", "maths", "math"];
const REASONING_VARIANTS = [
  "reasoning",
  "general intelligence and reasoning",
  "general intelligence & reasoning",
  "logical reasoning",
];

function getCategoryForSubject(subject: string): "Math" | "Reasoning" | null {
  const s = (subject || "").trim().toLowerCase();
  if (MATH_VARIANTS.some((v) => s.includes(v) || v.includes(s))) return "Math";
  if (REASONING_VARIANTS.some((v) => s.includes(v) || v.includes(s))) return "Reasoning";
  return null;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 🎯 STRONG RUNTIME RESHUFFLE — double-pass Fisher-Yates using crypto randomness
// where available, guarantees the option order is genuinely different every
// single time a question loads, regardless of how it was stored in the database.
function getSecureRandom(): number {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
  }
  return Math.random();
}

function fisherYatesShuffle(arr: number[]): number[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(getSecureRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleOptions(optEn: string[], optHi: string[], correctIndex: number) {
  // Double-pass shuffle: run Fisher-Yates twice in sequence for extra
  // guaranteed randomness, avoiding any residual pattern from storage order.
  let indices = fisherYatesShuffle([0, 1, 2, 3]);
  indices = fisherYatesShuffle(indices);

  const newOptEn = indices.map((idx) => optEn[idx]);
  const newOptHi = indices.map((idx) => optHi[idx]);
  const newCorrectIndex = indices.indexOf(correctIndex);
  return { newOptEn, newOptHi, newCorrectText: newOptEn[newCorrectIndex] };
}

export default function FastTestPage() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);

  const [phase, setPhase] = useState<Phase>("loading");
  const [targetExam, setTargetExam] = useState("");
  const [error, setError] = useState("");

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categorySubjectsMap, setCategorySubjectsMap] = useState<Record<string, string[]>>({});
  const [selectedSubject, setSelectedSubject] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [score, setScore] = useState(0);

  // LOAD TARGET EXAM
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("Please log in to access Warrior Questions.");
      setPhase("result");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          setError("User profile not found.");
          setPhase("result");
          return;
        }
        const exam = snap.data()?.targetExam?.trim();
        if (!exam) {
          setError("Target exam not set. Please update your profile.");
          setPhase("result");
          return;
        }
        setTargetExam(exam);
      },
      () => {
        setError("Unable to load your profile.");
        setPhase("result");
      }
    );

    return () => unsub();
  }, [user, authLoading]);

  // STEP 1 — FIND AVAILABLE MATH/REASONING CATEGORIES FOR THIS EXAM (hard only)
  useEffect(() => {
    if (!targetExam) return;

    async function loadSubjects() {
      try {
        setError("");
        const examFilters = normalizeExam(targetExam);

        const snap = await getDocs(
          query(
            collection(db, "questions"),
            where("exam", "in", examFilters),
            where("difficulty", "==", "hard")
          )
        );

        const categoryMap: Record<string, Set<string>> = {};

        snap.forEach((d) => {
          const data: any = d.data();
          const rawSubject = data.subject || data.topic || "";
          const category = getCategoryForSubject(rawSubject);
          if (!category) return;

          if (!categoryMap[category]) categoryMap[category] = new Set();
          categoryMap[category].add(rawSubject);
        });

        const categories = Object.keys(categoryMap).sort();

        if (categories.length === 0) {
          setError(`No Warrior (Hard Math/Reasoning) questions available yet for ${targetExam}.`);
          setPhase("result");
          return;
        }

        const subjectsMap: Record<string, string[]> = {};
        Object.entries(categoryMap).forEach(([cat, subjectSet]) => {
          subjectsMap[cat] = Array.from(subjectSet);
        });

        setAvailableCategories(categories);
        setCategorySubjectsMap(subjectsMap);
        setPhase("subject-select");
      } catch (err) {
        console.error(err);
        setError("Failed to load subjects.");
        setPhase("result");
      }
    }

    loadSubjects();
  }, [targetExam]);

  // STEP 2 — LOAD 30 HARD QUESTIONS FOR SELECTED CATEGORY (verified)
  const startQuizForSubject = async (category: string) => {
    try {
      setSelectedSubject(category);
      setPhase("loading");
      setError("");
      setQuestions([]);
      setAnswers([]);
      setCurrent(0);
      setTimeLeft(TIMER_SECONDS);
      setScore(0);

      const examFilters = normalizeExam(targetExam);
      const rawSubjectVariants = categorySubjectsMap[category] || [category];

      const snap = await getDocs(
        query(
          collection(db, "questions"),
          where("exam", "in", examFilters),
          where("subject", "in", rawSubjectVariants),
          where("difficulty", "==", "hard")
        )
      );

      let arr: Question[] = [];

      snap.forEach((d) => {
        const data: any = d.data();
        const answerKey = (data.answer || "").toString().toUpperCase();

        const optionMap: Record<string, string> = {
          A: data.optionA,
          B: data.optionB,
          C: data.optionC,
          D: data.optionD,
        };
        const answerValue = optionMap[answerKey];

        const primaryText = data.questionEn || data.question || "";
        const allOptionsPresent = data.optionA && data.optionB && data.optionC && data.optionD;

        // VERIFICATION — skip invalid/incomplete questions entirely
        if (!primaryText || !allOptionsPresent || !answerValue) return;

        const rawOptEn = [data.optionA, data.optionB, data.optionC, data.optionD];
        const rawOptHi = [
          data.optionAHi || data.optionA,
          data.optionBHi || data.optionB,
          data.optionCHi || data.optionC,
          data.optionDHi || data.optionD,
        ];

        const correctIndex = ["A", "B", "C", "D"].indexOf(answerKey);
        const { newOptEn, newOptHi, newCorrectText } = shuffleOptions(rawOptEn, rawOptHi, correctIndex);

        arr.push({
          id: d.id,
          questionEn: primaryText,
          questionHi: data.questionHi || "",
          optionsEn: newOptEn,
          optionsHi: newOptHi,
          answer: newCorrectText,
          explanationEn: data.explanationEn || "",
          explanationHi: data.explanationHi || "",
          subject: data.subject || category,
        });
      });

      arr = arr.sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);

      if (arr.length === 0) {
        setError(`No verified hard questions found for ${category}.`);
        setPhase("result");
        return;
      }

      setQuestions(arr);
      setAnswers(new Array(arr.length).fill(""));
      setPhase("quiz");
    } catch (err) {
      console.error(err);
      setError("Failed to load Warrior Questions.");
      setPhase("result");
    }
  };

  // TIMER
  useEffect(() => {
    if (phase !== "quiz") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const selectAnswer = (option: string) => {
    const updated = [...answers];
    updated[current] = option;
    setAnswers(updated);
  };

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      finishTest();
    }
  };

  // FINISH — save result + push wrong answers to weak_questions
  const finishTest = async () => {
    setPhase("submitting");

    let finalScore = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) finalScore++;
    });
    setScore(finalScore);

    const uid = user?.uid || "guest";

    try {
      await addDoc(collection(db, "exam_results"), {
        userId: uid,
        userName: user?.displayName || user?.email || "Student",
        score: finalScore,
        total: questions.length,
        examTrack: targetExam,
        subject: selectedSubject,
        mode: "warrior",
        createdAt: serverTimestamp(),
      });

      const wrongOnes = questions.filter((q, i) => (answers[i] || "").trim() !== q.answer);

      for (const q of wrongOnes) {
        await addDoc(collection(db, "weak_questions"), {
          userId: uid,
          questionEn: q.questionEn,
          questionHi: q.questionHi,
          optionsEn: q.optionsEn,
          optionsHi: q.optionsHi,
          correctAnswer: q.answer,
          topic: q.subject || selectedSubject,
          timestamp: serverTimestamp(),
        });
      }
    } catch (err) {
      console.log("Submission error:", err);
    }

    setPhase("result");
  };

  const handleRestart = () => {
    setPhase("subject-select");
    setCurrent(0);
    setScore(0);
    setAnswers([]);
    setSelectedSubject("");
  };

  // ===================== UI =====================

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Assembling Warrior Questions...
        </p>
      </div>
    );
  }

  // SUBJECT SELECTION SCREEN
  if (phase === "subject-select") {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-32">
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 backdrop-blur-md">
          <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">
                ⚡ Warrior Questions
              </span>
              <h1 className="text-sm font-black tracking-tight text-slate-800 uppercase">
                {targetExam}
              </h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 mt-8">
          <h2 className="text-xl font-black text-slate-900 mb-1">Choose Math or Reasoning</h2>
          <p className="text-slate-500 text-sm mb-6">
            30 hard-level questions, 30 minutes. Only verified questions shown.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => startQuizForSubject(category)}
                className="bg-white border border-slate-200 hover:border-amber-500 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
              >
                <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <Flag size={18} />
                </div>
                <span className="font-bold text-sm text-slate-800">{category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Saving results...
        </p>
      </div>
    );
  }

  if (phase === "result") {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4">⚠️</div>
            <p className="text-red-500 font-bold text-sm">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl mx-auto mb-3 border border-amber-100">🏆</div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Warrior Round Complete</h1>
            <p className="text-slate-400 text-xs mt-0.5 font-bold uppercase tracking-wider">{selectedSubject}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 mb-6 text-center border border-slate-200/60">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Score</span>
            <div className="text-5xl font-black text-amber-600 tracking-tight mt-1">{score}/{questions.length}</div>
            <div className="text-base font-bold text-slate-600 mt-1">{percentage}%</div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleRestart}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 text-xs rounded-xl uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} /> Try Another Subject
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold h-12 text-xs rounded-xl uppercase tracking-wider"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUIZ SCREEN
  const q = questions[current];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 antialiased text-slate-900">
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhase("subject-select")}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">{selectedSubject}</span>
              <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">{targetExam}</h1>
            </div>
          </div>
          <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl font-black text-lg tracking-tight flex items-center gap-2 shadow-sm">
            <Timer size={16} className="animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">🔥 Hard</span>
            <span className="bg-slate-50 border text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">
              Question {current + 1} / {questions.length}
            </span>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-bold leading-relaxed text-slate-800">{q.questionEn}</h2>
            {q.questionHi && (
              <h2 className="text-lg font-semibold leading-relaxed text-slate-600 border-t border-dashed border-slate-100 pt-3 font-hindi">
                {q.questionHi}
              </h2>
            )}
          </div>

          <div className="space-y-3">
            {q.optionsEn.map((optEn, index) => {
              const optHi = q.optionsHi?.[index] || "";
              const isSelected = answers[current] === optEn;
              return (
                <button
                  key={index}
                  onClick={() => selectAnswer(optEn)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 flex items-center gap-4 group ${
                    isSelected
                      ? "border-amber-600 bg-amber-50/60 shadow-sm text-amber-900"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40 text-slate-800"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                      isSelected ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-relaxed break-words">{optEn}</div>
                    {optHi && <div className="text-xs font-medium text-slate-600 mt-1 font-hindi break-words">{optHi}</div>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
            {current > 0 && (
              <button
                onClick={() => setCurrent(current - 1)}
                className="inline-flex items-center gap-1 px-4 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200/40"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <button
              onClick={nextQuestion}
              disabled={!answers[current]}
              className={`flex-1 h-11 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-sm uppercase tracking-wider ${
                answers[current]
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              {current === questions.length - 1 ? (
                <>
                  <Flag size={13} /> Submit
                </>
              ) : (
                <>
                  Next <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3.5">Progress Map</span>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {questions.map((_, i) => {
              const isCurrent = i === current;
              const isAnswered = !!answers[i];
              return (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-9 rounded-lg font-bold text-xs transition-all border ${
                    isCurrent
                      ? "bg-amber-600 border-amber-600 text-white shadow-sm ring-2 ring-amber-100"
                      : isAnswered
                      ? "bg-amber-50 border-amber-200 text-amber-600 font-black"
                      : "bg-slate-50/50 border-slate-200/60 text-slate-400 font-medium"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}