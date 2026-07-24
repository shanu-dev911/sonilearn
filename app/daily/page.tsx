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
import { Timer, CheckCircle, ArrowLeft, ArrowRight, Flag, BookOpen } from "lucide-react";

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
  | "subject-select"
  | "quiz"
  | "submitting"
  | "result";

const TOTAL_QUESTIONS = 30;
const TIMER_SECONDS = 10 * 60;

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// 🎯 RUNTIME SAFETY SHUFFLE — ensures options are always randomized fresh,
// regardless of how they were stored in the database. This guarantees the
// correct answer position is never predictable (e.g. never always "A").
function shuffleQuestionOptions(optEn: string[], optHi: string[], correctIndex: number) {
  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const newOptEn = indices.map((idx) => optEn[idx]);
  const newOptHi = indices.map((idx) => optHi[idx]);
  const newCorrectIndex = indices.indexOf(correctIndex);
  const newCorrectText = newOptEn[newCorrectIndex];

  return { newOptEn, newOptHi, newCorrectText };
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

  // 🎯 SUBJECT SELECTION STATE
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");

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

  // 🎯 STEP 1 — FETCH AVAILABLE SUBJECTS FOR THIS EXAM
  useEffect(() => {
    if (!targetExam) return;

    async function loadSubjects() {
      try {
        setError("");

        const examFilters = normalizeTargetExam(targetExam);

        const snap = await getDocs(
          query(
            collection(db, "questions"),
            where("exam", "in", examFilters),
            limit(500)
          )
        );

        const subjectSet = new Set<string>();
        snap.forEach((d) => {
          const data: any = d.data();
          const subj = data.subject || data.topic;
          if (subj) subjectSet.add(subj);
        });

        const subjectList = Array.from(subjectSet).sort();

        if (subjectList.length === 0) {
          setError(`No subjects found for ${targetExam}.`);
          setPhase("result");
          return;
        }

        setAvailableSubjects(subjectList);
        setPhase("subject-select");
      } catch (err) {
        console.error(err);
        setError("Failed to load subjects.");
        setPhase("result");
      }
    }

    loadSubjects();
  }, [targetExam]);

  // 🎯 STEP 2 — LOAD QUESTIONS FOR SELECTED SUBJECT (with runtime verification + reshuffle)
  const startQuizForSubject = async (subject: string) => {
    try {
      setSelectedSubject(subject);
      setPhase("loading");
      setError("");
      setQuestions([]);
      setAnswers([]);
      setCurrent(0);
      setTimeLeft(TIMER_SECONDS);

      const examFilters = normalizeTargetExam(targetExam);

      const snap = await getDocs(
        query(
          collection(db, "questions"),
          where("exam", "in", examFilters),
          where("subject", "==", subject),
          limit(150)
        )
      );

      let arr: Question[] = [];

      snap.forEach((d) => {
        const data: any = d.data();
        const answerKey = data.answer?.toString().toUpperCase();

        // 🎯 VERIFICATION — every question must have a valid answer key mapping
        // to one of the 4 options. If mapping is broken, question is skipped
        // entirely rather than shown with a wrong/blank answer.
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

        if (!primaryText || !allOptionsPresent || !answerValue) {
          // Invalid/incomplete question — skip, never show to user
          return;
        }

        const rawOptEn = [data.optionA, data.optionB, data.optionC, data.optionD];
        const rawOptHi = [
          data.optionAHi || data.optionA,
          data.optionBHi || data.optionB,
          data.optionCHi || data.optionC,
          data.optionDHi || data.optionD,
        ];

        const correctIndex = ["A", "B", "C", "D"].indexOf(answerKey);

        // 🎯 RUNTIME RESHUFFLE — options re-randomized fresh every load,
        // so the correct answer position is never predictable/patterned.
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

      arr = arr
        .sort(() => Math.random() - 0.5)
        .slice(0, TOTAL_QUESTIONS);

      if (arr.length === 0) {
        setError(`No verified questions found for ${subject} in ${targetExam}.`);
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

  // LOADING
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Calibrating Challenge Nodes...
        </p>
      </div>
    );
  }

  // 🎯 SUBJECT SELECTION SCREEN
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Daily Challenge
              </span>
              <h1 className="text-sm font-black tracking-tight text-slate-800 uppercase">
                {targetExam}
              </h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 mt-8">
          <h2 className="text-xl font-black text-slate-900 mb-1">Choose a Subject</h2>
          <p className="text-slate-500 text-sm mb-6">Ek subject select karo, 30 verified questions milenge practice ke liye.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => startQuizForSubject(subject)}
                className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
              >
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <BookOpen size={18} />
                </div>
                <span className="font-bold text-sm text-slate-800">{subject}</span>
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
          Securing metric score logs...
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
            {selectedSubject} performance for <span className="font-bold text-slate-700">{targetExam}</span> recorded.
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

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setPhase("subject-select")}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 h-12 rounded-xl font-bold text-xs shadow-sm transition-all uppercase tracking-wider"
            >
              Try Another Subject
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
    <div className="min-h-screen bg-slate-50/50 pb-32 antialiased text-slate-900 selection:bg-blue-600 selection:text-white">

      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhase("subject-select")}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {selectedSubject}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
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
            className="h-full bg-blue-600 transition-all duration-300 rounded-r"
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
              <span className="inline-block mt-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[10px] font-black px-2 py-0.5 uppercase tracking-wide">
                {selectedSubject}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <CheckCircle size={12} className="text-blue-500" />
              <span>{answers.filter(Boolean).length} Synced</span>
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