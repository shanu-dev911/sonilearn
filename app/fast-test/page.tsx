"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, BookOpen, Globe, Trophy, RotateCcw } from "lucide-react";

import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db, auth } from "@/lib/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";

// =========================
// CONFIG
// =========================

const TOTAL_QUESTIONS = 30;
const TEST_DURATION_SECONDS = 10 * 60; // 10 minutes

// =========================
// TYPES
// =========================

type Lang = "en" | "hi";

type Question = {
  id: string;
  questionEn: string;
  questionHi?: string;
  optionsEn: string[];
  optionsHi?: string[];
  answerIndex: number; // index into options array (0-3)
  exam?: string;
  subject?: string;
};

// =========================
// NORMALIZE EXAM NAME TO DB FORMAT
// =========================

const normalizeExamToDBFormat = (exam: string): string => {
  return exam.trim().toUpperCase().replace(/\s+/g, "_");
};

const ANSWER_KEY_MAP: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

// =========================
// PAGE
// =========================

export default function FastTestPage() {
  const router = useRouter();
  const [user, authLoading, authError] = useAuthState(auth);

  // Profile / data
  const [targetExam, setTargetExam] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [error, setError] = useState("");

  // Flow stage: "subject-select" -> "in-progress" -> "finished"
  const [stage, setStage] = useState<"subject-select" | "in-progress" | "finished">("subject-select");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);

  // Test state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [score, setScore] = useState(0);
  const [lang, setLang] = useState<Lang>("en");
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);
  const [elapsedAtFinish, setElapsedAtFinish] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // =========================
  // LOAD TARGET EXAM (PROFILE)
  // =========================

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError("Please log in to access the fast test.");
      setLoadingProfile(false);
      return;
    }

    if (authError) {
      setError("Authentication failed. Please try again.");
      setLoadingProfile(false);
      return;
    }

    const userDocRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setError("User profile not found. Please set up your profile.");
          setLoadingProfile(false);
          return;
        }

        const userData = docSnap.data();
        const exam = userData?.targetExam?.trim();

        if (!exam) {
          setError("Target exam not set. Please update your profile with your target exam.");
          setLoadingProfile(false);
          return;
        }

        setTargetExam(exam);
        setError("");
        setLoadingProfile(false);
      },
      () => {
        setError("Unable to load your profile. Please try again.");
        setLoadingProfile(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, authError]);

  // =========================
  // LOAD QUESTIONS (ALL, FOR EXAM) + DERIVE SUBJECTS
  // =========================

  useEffect(() => {
    if (!targetExam || authLoading || !user) return;

    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        setError("");

        const normalizedExam = normalizeExamToDBFormat(targetExam);
        const questionsRef = collection(db, "questions");

        let rawDocs: any[] = [];

        try {
          const q = query(questionsRef, where("exam", "==", normalizedExam));
          const snap = await getDocs(q);
          snap.forEach((d) => rawDocs.push({ id: d.id, ...d.data() }));
        } catch {
          // ignore, fallback below
        }

        if (rawDocs.length === 0) {
          const allSnap = await getDocs(query(questionsRef, limit(2000)));
          allSnap.forEach((d) => {
            const data = d.data();
            if (normalizeExamToDBFormat(data.exam || "") === normalizedExam) {
              rawDocs.push({ id: d.id, ...data });
            }
          });
        }

        const parsed: Question[] = [];
        rawDocs.forEach((data) => {
          if (
            data.questionEn &&
            data.optionA &&
            data.optionB &&
            data.optionC &&
            data.optionD &&
            data.answer
          ) {
            const answerIndex = ANSWER_KEY_MAP[String(data.answer).toUpperCase()] ?? -1;
            if (answerIndex === -1) return;

            parsed.push({
              id: data.id,
              questionEn: data.questionEn,
              questionHi: data.questionHi || undefined,
              optionsEn: [data.optionA, data.optionB, data.optionC, data.optionD],
              optionsHi:
                data.optionA_hi && data.optionB_hi && data.optionC_hi && data.optionD_hi
                  ? [data.optionA_hi, data.optionB_hi, data.optionC_hi, data.optionD_hi]
                  : undefined,
              answerIndex,
              exam: data.exam,
              subject: data.subject || "General",
            });
          }
        });

        setAllQuestions(parsed);

        const uniqueSubjects = Array.from(
          new Set(parsed.map((q) => q.subject || "General"))
        ).sort();
        setSubjects(uniqueSubjects);

        if (parsed.length === 0) {
          setError(`No questions available for ${targetExam} yet. Please check back soon.`);
        }
      } catch (err) {
        setError("Failed to load questions. Please try again or contact support.");
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [targetExam, user, authLoading]);

  // =========================
  // TIMER
  // =========================

  useEffect(() => {
    if (stage !== "in-progress") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // =========================
  // START TEST FOR A SUBJECT
  // =========================

  const startTest = (subject: string) => {
    const pool = allQuestions.filter((q) => (q.subject || "General") === subject);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, TOTAL_QUESTIONS);

    setSelectedSubject(subject);
    setTestQuestions(picked);
    setAnswers(new Array(picked.length).fill(null));
    setCurrentQuestion(0);
    setSelectedOption(null);
    setScore(0);
    setTimeLeft(TEST_DURATION_SECONDS);
    startTimeRef.current = Date.now();
    setStage("in-progress");
  };

  // =========================
  // HANDLE ANSWER
  // =========================

  const handleAnswer = (optionIndex: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);

    const updated = [...answers];
    updated[currentQuestion] = optionIndex;
    setAnswers(updated);

    if (optionIndex === testQuestions[currentQuestion].answerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  // =========================
  // HANDLE NEXT
  // =========================

  const handleNext = () => {
    if (selectedOption === null) return;

    if (currentQuestion + 1 < testQuestions.length) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(answers[currentQuestion + 1] ?? null);
    } else {
      finishTest(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion === 0) return;
    setCurrentQuestion((prev) => prev - 1);
    setSelectedOption(answers[currentQuestion - 1] ?? null);
  };

  // =========================
  // FINISH TEST
  // =========================

  const finishTest = (timedOut: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsedMs = Date.now() - startTimeRef.current;
    const elapsedSeconds = Math.min(
      TEST_DURATION_SECONDS,
      Math.round(elapsedMs / 1000)
    );
    setElapsedAtFinish(timedOut ? TEST_DURATION_SECONDS : elapsedSeconds);
    setStage("finished");
  };

  // =========================
  // RESTART / BACK TO SUBJECTS
  // =========================

  const handleRestartSameSubject = () => {
    if (selectedSubject) startTest(selectedSubject);
  };

  const handleBackToSubjects = () => {
    setStage("subject-select");
    setSelectedSubject(null);
    setTestQuestions([]);
    setAnswers([]);
    setScore(0);
    setCurrentQuestion(0);
    setSelectedOption(null);
  };

  const handleBack = () => router.back();

  // =========================
  // SHARED: LOADING STATE
  // =========================

  if (loadingProfile || authLoading || loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220] p-4">
        <div className="text-center">
          <div className="w-14 h-14 border-[3px] border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <p className="text-base font-semibold text-slate-100 tracking-wide">
            Preparing your test environment
          </p>
          <p className="text-sm text-slate-400 mt-1.5">Fetching exam data securely…</p>
        </div>
      </div>
    );
  }

  // =========================
  // SHARED: ERROR STATE
  // =========================

  if (error && allQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220] p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#111A2E] rounded-2xl border border-red-500/20 p-7 sm:p-9 text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-50 mb-3">
              Unable to Load Test
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-7 whitespace-pre-line">
              {error}
            </p>
            <button
              onClick={handleBack}
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 rounded-xl transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // STAGE: SUBJECT SELECTION
  // =========================

  if (stage === "subject-select") {
    return (
      <div className="min-h-screen bg-[#0B1220] p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8 pt-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-100 font-medium transition-colors text-sm"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full">
              {targetExam}
            </span>
          </div>

          <div className="mb-9">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50 tracking-tight">
              Fast Test
            </h1>
            <p className="text-slate-400 text-sm sm:text-[15px] mt-2 leading-relaxed">
              Choose a subject to begin. Each test has {TOTAL_QUESTIONS} questions and a strict{" "}
              {TEST_DURATION_SECONDS / 60}-minute timer — just like the real exam.
            </p>
          </div>

          {/* SUBJECT GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map((subject) => {
              const count = allQuestions.filter(
                (q) => (q.subject || "General") === subject
              ).length;
              const questionsInTest = Math.min(count, TOTAL_QUESTIONS);

              return (
                <button
                  key={subject}
                  onClick={() => startTest(subject)}
                  className="group text-left bg-[#111A2E] border border-slate-700/60 hover:border-amber-400/60 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
                      <BookOpen size={18} className="text-amber-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-full">
                      {questionsInTest} Qs
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-50 group-hover:text-amber-300 transition-colors">
                    {subject}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {TEST_DURATION_SECONDS / 60} min · Bilingual (EN/HI)
                  </p>
                </button>
              );
            })}
          </div>

          {subjects.length === 0 && (
            <div className="text-center text-slate-500 text-sm mt-10">
              No subjects available yet for this exam.
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // STAGE: FINISHED / RESULT
  // =========================

  if (stage === "finished") {
    const totalQ = testQuestions.length;
    const percentage = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;
    const incorrect = answers.filter((a, i) => a !== null && a !== testQuestions[i].answerIndex).length;
    const unattempted = answers.filter((a) => a === null).length;

    const performanceMessage =
      percentage >= 80
        ? "Outstanding performance!"
        : percentage >= 60
          ? "Good effort — keep it up!"
          : "Keep practicing, you'll improve!";

    const timeTakenLabel = formatTime(elapsedAtFinish);

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220] p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#111A2E] rounded-2xl sm:rounded-3xl border border-slate-700/60 p-6 sm:p-9 shadow-2xl">
            <div className="text-center mb-7">
              <div className="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto mb-4">
                <Trophy size={26} className="text-amber-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-50">
                Test Completed
              </h1>
              <p className="text-slate-400 text-sm mt-1.5">{performanceMessage}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mt-2">
                {targetExam} · {selectedSubject}
              </p>
            </div>

            {/* SCORE BLOCK */}
            <div className="bg-[#0B1220] rounded-2xl p-6 mb-6 text-center border border-slate-700/50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Your Score
              </p>
              <div className="text-4xl sm:text-5xl font-black text-amber-400 mb-1">
                {score}/{totalQ}
              </div>
              <div className="text-lg font-bold text-slate-200">{percentage}%</div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-3 gap-3 mb-7">
              <div className="bg-[#0B1220] rounded-xl p-3 text-center border border-slate-700/50">
                <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Correct</p>
                <p className="text-lg font-bold text-emerald-400">{score}</p>
              </div>
              <div className="bg-[#0B1220] rounded-xl p-3 text-center border border-slate-700/50">
                <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Incorrect</p>
                <p className="text-lg font-bold text-red-400">{incorrect}</p>
              </div>
              <div className="bg-[#0B1220] rounded-xl p-3 text-center border border-slate-700/50">
                <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Skipped</p>
                <p className="text-lg font-bold text-slate-400">{unattempted}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-8">
              <Clock size={15} />
              <span>
                Time Taken: <span className="text-slate-200 font-semibold">{timeTakenLabel}</span>{" "}
                / {formatTime(TEST_DURATION_SECONDS)}
              </span>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRestartSameSubject}
                className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3.5 rounded-xl transition-colors"
              >
                <RotateCcw size={17} />
                Retake This Subject
              </button>
              <button
                onClick={handleBackToSubjects}
                className="w-full bg-slate-800/70 hover:bg-slate-800 text-slate-200 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen size={16} />
                Choose Another Subject
              </button>
              <button
                onClick={handleBack}
                className="w-full text-slate-500 hover:text-slate-300 font-medium py-2 text-sm transition-colors"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // STAGE: IN PROGRESS (QUESTION SCREEN)
  // =========================

  const currentQ = testQuestions[currentQuestion];
  const answerDisabled = selectedOption !== null;
  const options = lang === "hi" && currentQ.optionsHi ? currentQ.optionsHi : currentQ.optionsEn;
  const questionText = lang === "hi" && currentQ.questionHi ? currentQ.questionHi : currentQ.questionEn;
  const hasHindi = Boolean(currentQ.questionHi && currentQ.optionsHi);
  const timeUrgent = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-[#0B1220] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="mb-5 sm:mb-6">
          <div className="bg-[#111A2E] rounded-2xl border border-slate-700/60 p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-[0.12em]">
                  {targetExam} · {selectedSubject}
                </p>
                <p className="text-sm sm:text-base font-bold text-slate-50 mt-0.5">
                  Question {currentQuestion + 1} of {testQuestions.length}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {hasHindi && (
                  <button
                    onClick={() => setLang(lang === "en" ? "hi" : "en")}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 bg-slate-800/70 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Globe size={13} />
                    {lang === "en" ? "हिंदी" : "English"}
                  </button>
                )}
                <div
                  className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg ${
                    timeUrgent
                      ? "text-red-400 bg-red-500/10 animate-pulse"
                      : "text-slate-200 bg-slate-800/70"
                  }`}
                >
                  <Clock size={14} />
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / testQuestions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* QUESTION CARD */}
        <div className="bg-[#111A2E] rounded-2xl border border-slate-700/60 p-5 sm:p-7 shadow-xl mb-5">
          <h2 className="text-base sm:text-xl font-bold text-slate-50 leading-relaxed mb-7">
            {questionText}
          </h2>

          <div className="space-y-3 mb-7">
            {options.map((option, index) => {
              const isCorrect = index === currentQ.answerIndex;
              const isSelected = selectedOption === index;

              let bg = "bg-[#0B1220] hover:bg-slate-800/60";
              let border = "border-slate-700/60";
              let text = "text-slate-200";

              if (answerDisabled) {
                if (isCorrect) {
                  bg = "bg-emerald-500/10";
                  border = "border-emerald-500/60";
                  text = "text-emerald-300";
                } else if (isSelected) {
                  bg = "bg-red-500/10";
                  border = "border-red-500/60";
                  text = "text-red-300";
                } else {
                  bg = "bg-[#0B1220]";
                  border = "border-slate-800";
                  text = "text-slate-500";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={answerDisabled}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 font-medium min-h-[56px] flex items-center cursor-pointer disabled:cursor-default ${bg} ${border} ${text}`}
                >
                  <span className="flex items-center gap-3 w-full">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 text-sm sm:text-base">{option}</span>
                    {answerDisabled && isCorrect && <span className="flex-shrink-0">✓</span>}
                    {answerDisabled && isSelected && !isCorrect && (
                      <span className="flex-shrink-0">✗</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* NAV BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-5 py-3 rounded-xl font-semibold text-sm border border-slate-700/60 text-slate-300 hover:bg-slate-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className={`flex-1 py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 ${
                selectedOption !== null
                  ? "bg-amber-400 hover:bg-amber-300 text-slate-900"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              {currentQuestion + 1 === testQuestions.length ? "Finish Test" : "Next Question"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}