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
import { Timer, CheckCircle, ArrowLeft, ArrowRight, Flag, HelpCircle } from "lucide-react";

interface Question {
  id: string;
  question: string;
  questionEn?: string;
  questionHi?: string;
  options: string[];
  optionsEn?: string[];
  optionsHi?: string[];
  answer: string;
  examName?: string; // Target track verification identifier
  topic?: string;
}

type Phase =
  | "loading"
  | "quiz"
  | "submitting"
  | "result";

// =========================
// PREMIUM METRIC CONFIGURATIONS
// =========================
const TOTAL_QUESTIONS = 30; // 🎯 30 Questions Locked
const TIMER_SECONDS = 10 * 60; // ⏱️ 10 Minutes Calibration

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DailyChallengePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [user, authLoading, authError] = useAuthState(auth);

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hook state tracking placement rule executed
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
        explanationEn: "",
        explanationHi: "",
        examName: targetExam,
        topic: ""
      }
    );
  }, [questions, current, targetExam]);

  // LOAD USER META DATA
  useEffect(() => {
    if (authLoading) return;

    if (authError) {
      setError("Authentication layer missing verification sync.");
      setPhase("result");
      return;
    }

    if (!user) {
      setError("Active operational token required. Please log in.");
      setPhase("result");
      return;
    }

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          setError("User schematic properties missing from database.");
          setPhase("result");
          return;
        }

        const exam = snap.data()?.targetExam?.trim();

        if (!exam) {
          setError("Configuration error: No target track set on profile routing module.");
          setPhase("result");
          return;
        }

        setTargetExam(exam);
      },
      (err) => {
        console.error(err);
        setError("Telemetry connection failure during profile resolution.");
        setPhase("result");
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, authError]);

  // ENGINE RESOLUTION: QUESTIONS RETRIEVAL LAYER
  useEffect(() => {
    if (!targetExam) return;

    async function loadQuestions() {
      try {
        setPhase("loading");
        setError("");
        setQuestions([]);
        setAnswers([]);
        setCurrent(0);
        setTimeLeft(TIMER_SECONDS);

        const examFilters = normalizeTargetExam(targetExam);

        // Mix dataset optimization retrieval logic
        const snap = await getDocs(
          query(
            collection(db, "questions"),
            where("exam", "in", examFilters),
            limit(100) // Excess metrics requested for optimization layout shuffling
          )
        );

        let arr: Question[] = [];

        snap.forEach((d) => {
          const data: any = d.data();
          const answerKey = data.answer?.toString().toUpperCase();
          const answerValue = data["option" + answerKey] || "";

          // Bi-lingual language variables safe string deployment
          const primaryText = data.questionEn || data.question || "";

          if (
            primaryText &&
            data.optionA &&
            data.optionB &&
            data.optionC &&
            data.optionD &&
            answerValue
          ) {
            const optionsEn = [data.optionA || "", data.optionB || "", data.optionC || "", data.optionD || ""];
            const optionsHi = [
              data.optionAHi || data.optionA || "",
              data.optionBHi || data.optionB || "",
              data.optionCHi || data.optionC || "",
              data.optionDHi || data.optionD || "",
            ];

            arr.push({
              id: d.id,
              question: primaryText,
              questionEn: primaryText,
              questionHi: data.questionHi || data.questionHindi || "",
              options: optionsEn,
              optionsEn,
              optionsHi,
              answer: answerValue,
              examName: data.exam || targetExam,
              topic: data.subject || data.topic || targetExam,
            });
          }
        });

        // Maximum random dispersion deployment architecture rule
        arr = arr
          .sort(() => Math.random() - 0.5)
          .slice(0, TOTAL_QUESTIONS);

        if (arr.length === 0) {
          setError(`No target evaluation entries resolved for profile metadata: ${targetExam}.`);
          setPhase("result");
          return;
        }

        setQuestions(arr);
        setAnswers(new Array(arr.length).fill(""));
        setPhase("quiz");
      } catch (err) {
        console.error(err);
        setError("Critical framework exception parsing standard database vectors.");
        setPhase("result");
      }
    }

    loadQuestions();
  }, [targetExam]);

  // MASTER TIMER REGULATION CONTROLLER
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

  // FINAL METRIC COMMIT OPERATION
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
      console.log("Database submission block error:", err);
    }

    setPhase("result");
  };

  // UI LOADER STATE DESIGN
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Calibrating 30 Challenge Nodes...
        </p>
      </div>
    );
  }

  // UI COMMITMENT TRANSACTION STATE DESIGN
  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Securing metric score logs...
        </p>
      </div>
    );
  }

  // PLATFORM RESULTS INTERFACE LAYOUT
  if (phase === "result") {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center">
            <p className="text-red-500 font-bold text-sm tracking-tight">{error}</p>
            <div className="flex gap-2 mt-4 justify-center">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Retry Pipeline Alignment
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4 antialiased">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 w-full max-w-lg shadow-xl shadow-slate-200/40 text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5 shadow-sm">
            🏆
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Assessment Concluded
          </h1>
          <p className="text-slate-400 mt-1 text-xs font-medium">
            Daily performance index for <span className="font-bold text-slate-700">{targetExam}</span> recorded.
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mt-6 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Evaluation Output</span>
              <span className="text-sm font-semibold text-slate-500 mt-1 block">Accurate Submissions</span>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-black text-blue-600 tracking-tight">
                {score} <span className="text-slate-400 text-xs font-bold">/ {questions.length}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={() => (window.location.href = "/leaderboard")}
            className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold text-xs shadow-md transition-all uppercase tracking-wider"
          >
            Review National Placement Grid
          </button>
        </div>
      </div>
    );
  }

  // SYSTEM TEST ENVIRONMENT INTERFACE LAYOUT
  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 antialiased text-slate-900 selection:bg-blue-600 selection:text-white">

      {/* BRAND INTERFACE APP BAR */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* BACK BUTTON */}
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                SoniLearn Core Engine
              </span>
              {/* 🎯 USER TRACK IDENTIFIER: Dynamic verification badge */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <h1 className="text-sm font-black tracking-tight text-slate-800 uppercase">
                  Challenge: {targetExam}
                </h1>
              </div>
            </div>
          </div>

          <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl font-black text-lg tracking-tight flex items-center gap-2 shadow-sm">
            <Timer size={16} className="animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* LINEAR HORIZONTAL PROGRESS TRACK */}
        <div className="h-1 w-full bg-slate-100 relative">
          <div
            className="h-full bg-blue-600 transition-all duration-300 rounded-r"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-6">

        {/* ITEM SELECTION PIPELINE CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Matrix Node {current + 1} of {questions.length}
              </span>
              {/* 🎯 CURRENT ITEM EXAM BADGE: Informs user which exam question belongs to */}
              <span className="inline-block mt-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[10px] font-black px-2 py-0.5 uppercase tracking-wide">
                Target: {q.examName || targetExam} Verification
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <CheckCircle size={12} className="text-blue-500" />
              <span>{answers.filter(Boolean).length} Synced</span>
            </div>
          </div>

          {/* BILINGUAL QUESTION SECTION */}
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

          {/* BILINGUAL OPTIONS SELECTION WRAPPER */}
          <div className="space-y-3">
            {q.optionsEn.map((optEn: string, i: number) => {
              const optHi = q.optionsHi?.[i] || "";
              const isSelected = answers[current] === optEn;
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(optEn)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 flex items-center gap-4 group ${isSelected
                      ? "border-blue-600 bg-blue-50/60 shadow-sm shadow-blue-600/5 text-blue-900"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40 text-slate-800"
                    }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs transition-all flex-shrink-0 ${isSelected
                        ? "bg-blue-600 text-white"
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

          {/* INTERACTIVE CONTROLS BOUNDARY */}
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
                  <Flag size={13} /> Complete Calibration
                </>
              ) : (
                <>
                  Next <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* COMPREHENSIVE SEGMENT INTERACTIVE PALETTE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3.5">
            Deployment Matrix Map
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
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-100"
                    : isAnswered
                      ? "bg-blue-50 border-blue-200 text-blue-600 font-black"
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