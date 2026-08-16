"use client";

export const dynamic = 'force-dynamic';

import {
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";

import { useRouter } from "next/navigation";

import {
  db,
  auth,
} from "@/lib/firebase-client";

import {
  collection,
  doc,
  getDocs,
  addDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  limit,
  writeBatch,
} from "firebase/firestore";

import { useAuthState } from "react-firebase-hooks/auth";
import { Timer, CheckCircle, ArrowLeft, ArrowRight, Flag, ScrollText, Lock, Crown } from "lucide-react";
import { checkTrialStatus } from "@/lib/trial-check";

interface Question {
  id: string;
  question: string;
  questionEn?: string;
  questionHi?: string;
  options: string[];
  optionsEn?: string[];
  optionsHi?: string[];
  answer: string;
  examName?: string;
  topic?: string;
}

type Phase =
  | "loading"
  | "locked"
  | "intro"
  | "quiz"
  | "submitting"
  | "result";

const TOTAL_QUESTIONS = 30;
const TIMER_SECONDS = 30 * 60; // 30 minutes
const FETCH_POOL_LIMIT = 500; // pull a big pool per exam so the 30 shown are genuinely random

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 🎯 STRONG RUNTIME RESHUFFLE — double-pass Fisher-Yates using crypto randomness
// where available. Guarantees option order is genuinely randomized fresh every
// single load, regardless of any pattern the questions were saved with.
function getSecureRandom(): number {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] / (0xffffffff + 1);
  }
  return Math.random();
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(getSecureRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleQuestionOptions(optEn: string[], optHi: string[], correctIndex: number) {
  let indices = fisherYatesShuffle([0, 1, 2, 3]);
  indices = fisherYatesShuffle(indices);

  const newOptEn = indices.map((idx) => optEn[idx]);
  const newOptHi = indices.map((idx) => optHi[idx]);
  const newCorrectIndex = indices.indexOf(correctIndex);
  const newCorrectText = newOptEn[newCorrectIndex];

  return { newOptEn, newOptHi, newCorrectText };
}

const normalizeTargetExam = (exam: string) => {
  const cleaned = exam.trim();
  const underscored = cleaned.replace(/\s+/g, "_");
  return Array.from(
    new Set([
      cleaned,
      underscored,
      underscored.toUpperCase(),
      underscored.toLowerCase(),
    ])
  );
};

export default function PYQPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [poolSize, setPoolSize] = useState(0);
  const [user, authLoading, authError] = useAuthState(auth);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const q = useMemo(() => {
    return (
      questions[current] || {
        id: "",
        question: "",
        questionEn: "",
        questionHi: "",
        options: [],
        optionsEn: [],
        optionsHi: [],
        answer: "",
        examName: targetExam,
        topic: "",
      }
    );
  }, [questions, current, targetExam]);

  // LOAD USER META DATA (target exam)
  useEffect(() => {
    if (authLoading) return;

    if (authError) {
      setError("Authentication failed. Please try logging in again.");
      setPhase("result");
      return;
    }

    if (!user) {
      setError("Please log in to access Previous Year Questions.");
      setPhase("result");
      return;
    }

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          setError("User profile not found.");
          setPhase("result");
          return;
        }

        const data = snap.data();

        // 🔒 PAYWALL — PYQ Practice is premium/trial-gated content.
        const trialStatus = checkTrialStatus(data);
        if (!trialStatus.hasAccess) {
          setPhase("locked");
          return;
        }

        const exam = data?.targetExam?.trim();

        if (!exam) {
          setError("Target exam not set. Please update your profile.");
          setPhase("result");
          return;
        }

        setTargetExam(exam);
      },
      (err) => {
        console.error(err);
        setError("Unable to load your profile.");
        setPhase("result");
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, authError]);

  // STEP 1 — CHECK HOW MANY QUESTIONS EXIST FOR THIS EXAM, SHOW INTRO SCREEN
  useEffect(() => {
    if (!targetExam) return;

    async function checkPool() {
      try {
        setError("");
        const examFilters = normalizeTargetExam(targetExam);

        const snap = await getDocs(
          query(
            collection(db, "questions"),
            where("exam", "in", examFilters),
            limit(FETCH_POOL_LIMIT)
          )
        );

        if (snap.size === 0) {
          setError(`No questions available yet for ${targetExam}. Check back soon.`);
          setPhase("result");
          return;
        }

        setPoolSize(snap.size);
        setPhase("intro");
      } catch (err) {
        console.error(err);
        setError("Failed to load question bank.");
        setPhase("result");
      }
    }

    checkPool();
  }, [targetExam]);

  // STEP 2 — PULL A RANDOM MIX OF QUESTIONS ACROSS ALL SUBJECTS
  const startPYQSet = async () => {
    try {
      setPhase("loading");
      setError("");
      setQuestions([]);
      setAnswers([]);
      setCurrent(0);
      setTimeLeft(TIMER_SECONDS);

      const examFilters = normalizeTargetExam(targetExam);

      // 🎯 No subject filter — pull from EVERY subject for this exam so PYQ
      // practice mixes Math, Reasoning, English, GK, etc. together, just
      // like a real previous-year paper would.
      const snap = await getDocs(
        query(
          collection(db, "questions"),
          where("exam", "in", examFilters),
          limit(FETCH_POOL_LIMIT)
        )
      );

      let arr: Question[] = [];

      snap.forEach((d) => {
        const data: any = d.data();
        const answerKey = data.answer?.toString().toUpperCase();

        const optionMap: Record<string, string> = {
          A: data.optionA,
          B: data.optionB,
          C: data.optionC,
          D: data.optionD,
        };
        const answerValue = optionMap[answerKey];

        const primaryText = data.questionEn || data.question || "";
        const allOptionsPresent =
          data.optionA && data.optionB && data.optionC && data.optionD;

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

        // 🎯 RUNTIME RESHUFFLE — options re-randomized fresh every load, so
        // the correct answer is never always "A" or always the same slot.
        const { newOptEn, newOptHi, newCorrectText } = shuffleQuestionOptions(
          rawOptEn,
          rawOptHi,
          correctIndex
        );

        arr.push({
          id: d.id,
          question: primaryText,
          questionEn: primaryText,
          questionHi: data.questionHi || data.questionHindi || "",
          options: newOptEn,
          optionsEn: newOptEn,
          optionsHi: newOptHi,
          answer: newCorrectText,
          examName: data.exam || targetExam,
          topic: data.subject || data.topic || targetExam,
        });
      });

      // 🎯 RUNTIME RESHUFFLE — the whole question set order is re-randomized
      // fresh every time, so refreshing genuinely gives a different mix.
      arr = fisherYatesShuffle(arr).slice(0, TOTAL_QUESTIONS);

      if (arr.length === 0) {
        setError(`No verified questions found for ${targetExam}.`);
        setPhase("result");
        return;
      }

      setQuestions(arr);
      setAnswers(new Array(arr.length).fill(""));
      setPhase("quiz");
    } catch (err) {
      console.error(err);
      setError("Failed to load PYQ set.");
      setPhase("result");
    }
  };

  // MASTER TIMER
  useEffect(() => {
    if (phase !== "quiz") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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

  const finishTest = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("submitting");

    let finalScore = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) finalScore++;
    });

    setScore(finalScore);

    const activeUserId = user?.uid || auth.currentUser?.uid || "guest";

    try {
      await addDoc(collection(db, "exam_results"), {
        userId: activeUserId,
        userName: user?.displayName || user?.email || "Student",
        score: finalScore,
        total: questions.length,
        examTrack: targetExam,
        subject: "PYQ Mixed",
        mode: "pyq",
        createdAt: serverTimestamp(),
      });

      const weakQuestionsToLog = questions.flatMap((q, i) => {
        const selectedAnswer = (answers[i] || "").trim();

        if (selectedAnswer === q.answer) {
          return [];
        }

        return [{
          userId: activeUserId,
          questionEn: q.questionEn || q.question || "",
          questionHi: q.questionHi || "",
          optionsEn: q.optionsEn || q.options || [],
          optionsHi: q.optionsHi || q.options || [],
          correctAnswer: q.answer,
          topic: q.topic || targetExam,
          timestamp: serverTimestamp(),
        }];
      });

      if (weakQuestionsToLog.length > 0) {
        const batch = writeBatch(db);

        weakQuestionsToLog.forEach((entry) => {
          const ref = doc(collection(db, "weak_questions"));
          batch.set(ref, entry);
        });

        await batch.commit();
      }
    } catch (err) {
      console.log("Database submission error:", err);
    }

    setPhase("result");
  };

  // ===================== UI =====================

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Assembling PYQ Set...
        </p>
      </div>
    );
  }

  // 🔒 LOCKED — trial ended, not premium
  if (phase === "locked") {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-7 shadow-xl text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Lock size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900">PYQ Practice is Premium</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Your free trial has ended. Unlock unlimited PYQ Practice, Warrior Battleground, Leaderboard, and every premium feature with SoniLearn Premium.
          </p>

          <button
            onClick={() => router.push("/premium")}
            className="w-full mt-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold h-12 rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Crown size={16} /> Unlock Premium — ₹49/month
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold h-11 rounded-xl text-xs uppercase tracking-wider"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // INTRO SCREEN — explains PYQ mode, no subject picking needed
  if (phase === "intro") {
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
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">
                📜 Previous Year Questions
              </span>
              <h1 className="text-sm font-black tracking-tight text-slate-800 uppercase">
                {targetExam}
              </h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 mt-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ScrollText size={26} />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">PYQ Practice Set</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-1">
              {TOTAL_QUESTIONS} random questions mixed across every subject for {targetExam} — Math, Reasoning, English, GK, all together, just like a real paper.
            </p>
            <p className="text-slate-400 text-xs mb-6">
              {poolSize}+ questions in the bank • fresh random mix every attempt
            </p>

            <button
              onClick={startPYQSet}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ScrollText size={16} /> Start PYQ Set
            </button>
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
            <p className="text-red-500 font-bold text-sm tracking-tight">{error}</p>
            <div className="flex gap-2 mt-4 justify-center">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4 antialiased">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 w-full max-w-lg shadow-xl shadow-slate-200/40 text-center">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5 shadow-sm">
            📜
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            PYQ Set Complete
          </h1>
          <p className="text-slate-400 mt-1 text-xs font-medium">
            Mixed-subject performance for <span className="font-bold text-slate-700">{targetExam}</span> recorded.
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mt-6 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Score</span>
              <span className="text-sm font-semibold text-slate-500 mt-1 block">Correct Answers</span>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-black text-indigo-600 tracking-tight">
                {score} <span className="text-slate-400 text-xs font-bold">/ {questions.length}</span>
              </h2>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setPhase("intro")}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 h-12 rounded-xl font-bold text-xs shadow-sm transition-all uppercase tracking-wider"
            >
              New PYQ Set
            </button>
            <button
              onClick={() => (window.location.href = "/leaderboard")}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold text-xs shadow-md transition-all uppercase tracking-wider"
            >
              Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUIZ SCREEN
  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 antialiased text-slate-900 selection:bg-indigo-600 selection:text-white">

      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhase("intro")}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">
                {q.topic || "PYQ"}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <h1 className="text-sm font-black tracking-tight text-slate-800 uppercase">
                  {targetExam}
                </h1>
              </div>
            </div>
          </div>

          <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl font-black text-lg tracking-tight flex items-center gap-2 shadow-sm">
            <Timer size={16} className="animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="h-1 w-full bg-slate-100 relative">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 rounded-r"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-6">

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Question {current + 1} of {questions.length}
              </span>
              <span className="inline-block mt-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-md text-[10px] font-black px-2 py-0.5 uppercase tracking-wide">
                {q.topic}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <CheckCircle size={12} className="text-indigo-500" />
              <span>{answers.filter(Boolean).length} Answered</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-black leading-relaxed text-slate-900 tracking-tight mb-4">
              {q.questionEn || q.question}
            </h2>
            {q.questionHi && (
              <>
                <div className="border-t border-slate-200 my-4"></div>
                <h2 className="text-xl font-bold leading-relaxed text-slate-700 tracking-tight font-hindi">
                  {q.questionHi}
                </h2>
              </>
            )}
          </div>

          <div className="space-y-3">
            {q.optionsEn.map((optEn: string, i: number) => {
              const optHi = q.optionsHi?.[i] || "";
              const isSelected = answers[current] === optEn;
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(optEn)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 flex items-center gap-4 group ${isSelected
                      ? "border-indigo-600 bg-indigo-50/60 shadow-sm shadow-indigo-600/5 text-indigo-900"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40 text-slate-800"
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs transition-all flex-shrink-0 ${isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-relaxed break-words">
                      {optEn}
                    </div>
                    {optHi && (
                      <div className="text-xs font-medium text-slate-600 mt-1 font-hindi break-words">
                        {optHi}
                      </div>
                    )}
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
              className={`flex-1 h-11 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-sm uppercase tracking-wider ${answers[current]
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
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3.5">
            Progress Map
          </span>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {questions.map((_, i) => {
              const isCurrent = i === current;
              const isAnswered = !!answers[i];
              return (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-9 rounded-lg font-bold text-xs transition-all border ${isCurrent
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-100"
                    : isAnswered
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-black"
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