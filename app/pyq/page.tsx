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
import { Timer, CheckCircle, ArrowLeft, ArrowRight, Flag, ScrollText, Lock, Crown, Calendar, Layers, Sparkles } from "lucide-react";
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
  year?: string | number;
  shift?: string;
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
const FETCH_POOL_LIMIT = 500;

// 🎯 COMPLETE 2016 - 2026 TIMELINE (Always Available on Screen)
const ALL_EXAM_YEARS = [
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
];

const DEFAULT_SHIFTS = ["All Shifts", "Shift 1", "Shift 2", "Shift 3"];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 🎯 Crypto Random Shuffler
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

const getAnswerKey = (answer: unknown, options: string[]) => {
  const normalizedAnswer = String(answer ?? "").trim();
  const answerKey = normalizedAnswer.toUpperCase();

  if (["A", "B", "C", "D"].includes(answerKey)) {
    return answerKey;
  }

  const answerIndex = options.findIndex(
    (option) => option.trim().toLowerCase() === normalizedAnswer.toLowerCase()
  );

  return answerIndex >= 0 ? ["A", "B", "C", "D"][answerIndex] : "";
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

  // Dynamic Filters (With 2016-2026 Guaranteed Display)
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [availableYears, setAvailableYears] = useState<string[]>(ALL_EXAM_YEARS);
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [availableShifts, setAvailableShifts] = useState<string[]>(DEFAULT_SHIFTS);
  const [selectedShift, setSelectedShift] = useState("All Shifts");

  const [rawDocsData, setRawDocsData] = useState<any[]>([]);

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

  // LOAD USER META DATA & VERIFY LOCK/TRIAL STATUS
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

  // STEP 1 — PULL QUESTION POOL AND MAP SUBJECTS & SHIFTS
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

        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRawDocsData(docs);

        // Extract Subjects from docs
        const subjects: string[] = Array.from(
          new Set<string>(
            docs
              .map((data: any) => String(data.subject || data.topic || "").trim())
              .filter((s: string): s is string => s.length > 0)
          )
        ).sort();

        // Extract any DB years and merge with standard 2016-2026
        const dbYears: string[] = Array.from(
          new Set<string>(
            docs
              .map((data: any) => String(data.year || "").trim())
              .filter((y: string): y is string => y.length > 0)
          )
        );

        const mergedYears = Array.from(new Set([...ALL_EXAM_YEARS, ...dbYears])).sort(
          (a, b) => Number(b) - Number(a)
        );

        // Extract Shifts from docs or keep default shifts
        const dbShifts: string[] = Array.from(
          new Set<string>(
            docs
              .map((data: any) => String(data.shift || data.shiftName || "").trim())
              .filter((sh: string): sh is string => sh.length > 0)
          )
        ).sort();

        const mergedShifts = Array.from(new Set(["All Shifts", ...DEFAULT_SHIFTS.slice(1), ...dbShifts]));

        setPoolSize(snap.size);
        setAvailableSubjects(subjects);
        setAvailableYears(mergedYears);
        setAvailableShifts(mergedShifts);

        setPhase("intro");
      } catch (err) {
        console.error(err);
        setError("Failed to load question bank.");
        setPhase("result");
      }
    }

    checkPool();
  }, [targetExam]);

  // STEP 2 — START TEST WITH ACTIVE FILTERS
  const startPYQSet = async () => {
    try {
      setPhase("loading");
      setError("");
      setQuestions([]);
      setAnswers([]);
      setCurrent(0);
      setTimeLeft(TIMER_SECONDS);

      let arr: Question[] = [];

      rawDocsData.forEach((data: any) => {
        const optionMap: Record<string, string> = {
          A: String(data.optionA ?? "").trim(),
          B: String(data.optionB ?? "").trim(),
          C: String(data.optionC ?? "").trim(),
          D: String(data.optionD ?? "").trim(),
        };
        const rawOptions = [optionMap.A, optionMap.B, optionMap.C, optionMap.D];
        const answerKey = getAnswerKey(data.answer, rawOptions);
        const answerValue = optionMap[answerKey];

        const primaryText = String(data.questionEn || data.question || "").trim();
        const allOptionsPresent = rawOptions.every(Boolean);

        if (!primaryText || !allOptionsPresent || !answerValue) return;

        // Filter by Subject
        const subject = String(data.subject || data.topic || "").trim();
        if (selectedSubject !== "All Subjects" && subject !== selectedSubject) {
          return;
        }

        // Filter by Year (Checks exact year match if specified)
        const questionYear = String(data.year || "").trim();
        if (selectedYear !== "All Years" && questionYear && questionYear !== selectedYear) {
          return;
        }

        // Filter by Shift
        const questionShift = String(data.shift || data.shiftName || "").trim();
        if (selectedShift !== "All Shifts" && questionShift && questionShift !== selectedShift) {
          return;
        }

        const rawOptEn = rawOptions;
        const rawOptHi = [
          String(data.optionAHi || optionMap.A),
          String(data.optionBHi || optionMap.B),
          String(data.optionCHi || optionMap.C),
          String(data.optionDHi || optionMap.D),
        ];

        const correctIndex = ["A", "B", "C", "D"].indexOf(answerKey);

        const { newOptEn, newOptHi, newCorrectText } = shuffleQuestionOptions(
          rawOptEn,
          rawOptHi,
          correctIndex
        );

        arr.push({
          id: data.id,
          question: primaryText,
          questionEn: primaryText,
          questionHi: data.questionHi || data.questionHindi || "",
          options: newOptEn,
          optionsEn: newOptEn,
          optionsHi: newOptHi,
          answer: newCorrectText,
          examName: data.exam || targetExam,
          topic: subject || targetExam,
          year: data.year || selectedYear,
          shift: data.shift || selectedShift,
        });
      });

      arr = fisherYatesShuffle(arr).slice(0, TOTAL_QUESTIONS);

      if (arr.length === 0) {
        setError(`No questions matched "${selectedYear}" with "${selectedSubject}". Try selecting "All Years" or "All Subjects".`);
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
        subject: selectedSubject,
        year: selectedYear,
        shift: selectedShift,
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
          Assembling Official PYQ Papers...
        </p>
      </div>
    );
  }

  // LOCKED SCREEN UI
  if (phase === "locked") {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-7 shadow-xl text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Lock size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900">PYQ Practice is Premium</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Your free trial has ended. Unlock unlimited PYQ Practice, 2016-2026 Shift Papers, Warrior Battle, and Leaderboard with SoniLearn Premium.
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

  // INTRO SCREEN WITH 2016-2026 TIMELINE
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
                📜 Official PYQ Papers
              </span>
              <h1 className="text-sm font-black tracking-tight text-slate-800 uppercase">
                {targetExam}
              </h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 mt-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ScrollText size={26} />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Authentic PYQ Practice</h2>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-1">
              Select Year (2016–2026), Shift and Subject to practice exactly like real exam environment.
            </p>
            <p className="text-slate-400 text-[11px] mb-6 font-medium">
              {poolSize}+ questions loaded • 30 Questions • 30 Minutes Timer
            </p>

            {/* 1. YEAR SELECTOR (Guaranteed 2016 - 2026 Display) */}
            <div className="text-left mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar size={12} className="text-indigo-600" /> Select Exam Year (2016 - 2026)
                </label>
                {selectedYear === "2026" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles size={10} /> Latest 2026 Papers
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {["All Years", ...availableYears].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedYear === yr
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm ring-2 ring-slate-200"
                        : yr === "2026"
                          ? "bg-emerald-50/60 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    {yr === "2026" ? "🔥 2026 (New)" : yr}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. SHIFT SELECTOR */}
            <div className="text-left mb-5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                <Layers size={12} className="text-indigo-600" /> Select Shift / Paper
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {availableShifts.map((sh) => (
                  <button
                    key={sh}
                    type="button"
                    onClick={() => setSelectedShift(sh)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${selectedShift === sh
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    {sh}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. SUBJECT SELECTOR */}
            <div className="text-left mb-6">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Choose Subject
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["All Subjects", ...availableSubjects].map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setSelectedSubject(subject)}
                    className={`min-h-10 rounded-xl border px-3 py-2 text-xs font-bold transition-all text-center ${selectedSubject === subject
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startPYQSet}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <ScrollText size={16} /> Start Real PYQ Test ({selectedYear})
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
          Saving official test results...
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
                onClick={() => {
                  setSelectedYear("All Years");
                  setSelectedSubject("All Subjects");
                  setPhase("intro");
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Reset Filters
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
            Performance for <span className="font-bold text-slate-700">{targetExam}</span> ({selectedYear} • {selectedShift}) recorded.
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
                {q.topic || "PYQ"} • {q.year || selectedYear}
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
                {q.topic} • {q.shift || selectedShift}
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
                  <Flag size={13} /> Submit Test
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