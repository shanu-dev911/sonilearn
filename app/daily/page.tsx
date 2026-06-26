"use client";

import {
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";

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
} from "firebase/firestore";

import { useAuthState } from "react-firebase-hooks/auth";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

type Phase =
  | "loading"
  | "quiz"
  | "submitting"
  | "result";

// =========================
// SETTINGS
// =========================

const TOTAL_QUESTIONS = 20;

const TIMER_SECONDS = 25 * 60;

// =========================
// TIMER FORMAT
// =========================

function formatTime(sec: number) {

  const m = Math.floor(sec / 60);

  const s = sec % 60;

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

}

// =========================
// PAGE
// =========================

export default function DailyChallengePage() {

  const [phase, setPhase] =
    useState<Phase>("loading");

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [answers, setAnswers] =
    useState<string[]>([]);

  const [current, setCurrent] =
    useState(0);

  const [timeLeft, setTimeLeft] =
    useState(TIMER_SECONDS);

  const [score, setScore] =
    useState(0);

  const [error, setError] =
    useState("");

  const [targetExam, setTargetExam] =
    useState("");

  const [user, authLoading, authError] =
    useAuthState(auth);

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

  const timerRef =
    useRef<NodeJS.Timeout | null>(null);

  // =========================
  // LOAD QUESTIONS
  // =========================

  useEffect(() => {
    if (authLoading) return;

    if (authError) {
      setError("Authentication failed.");
      setPhase("result");
      return;
    }

    if (!user) {
      setError("Please log in to access the Daily Challenge.");
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

        const exam = snap.data()?.targetExam?.trim();

        if (!exam) {
          setError(
            "Please select your target exam in your profile."
          );
          setPhase("result");
          return;
        }

        setTargetExam(exam);
      },
      (err) => {
        console.error(err);
        setError("Unable to load the user target exam.");
        setPhase("result");
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, authError]);

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

        const snap = await getDocs(
          query(
            collection(db, "questions"),
            where("exam", "in", examFilters),
            limit(TOTAL_QUESTIONS)
          )
        );

        let arr: Question[] = [];

        snap.forEach((d) => {
          const data: any = d.data();
          const answerKey =
            data.answer?.toString().toUpperCase();
          const answerValue =
            data["option" + answerKey] || "";

          if (
            data.questionEn &&
            data.optionA &&
            data.optionB &&
            data.optionC &&
            data.optionD &&
            answerValue
          ) {
            arr.push({
              id: d.id,
              question: data.questionEn,
              options: [
                data.optionA,
                data.optionB,
                data.optionC,
                data.optionD,
              ],
              answer: answerValue,
            });
          }
        });

        arr = arr
          .sort(() => Math.random() - 0.5)
          .slice(0, TOTAL_QUESTIONS);

        if (arr.length === 0) {
          setError(
            `No questions found for ${targetExam}.`
          );
          setPhase("result");
          return;
        }

        setQuestions(arr);
        setAnswers(new Array(arr.length).fill(""));
        setPhase("quiz");
      } catch (err) {
        console.error(err);
        setError("Questions failed to load.");
        setPhase("result");
      }
    }

    loadQuestions();
  }, [targetExam]);

  // =========================
  // TIMER
  // =========================

  useEffect(() => {

    if (phase !== "quiz")
      return;

    timerRef.current =
      setInterval(() => {

        setTimeLeft((prev) => {

          if (prev <= 1) {

            clearInterval(
              timerRef.current!
            );

            finishTest();

            return 0;

          }

          return prev - 1;

        });

      }, 1000);

    return () => {

      if (timerRef.current) {

        clearInterval(
          timerRef.current
        );

      }

    };

  }, [phase]);

  // =========================
  // SELECT ANSWER
  // =========================

  const selectAnswer = (
    option: string
  ) => {

    const updated = [
      ...answers,
    ];

    updated[current] = option;

    setAnswers(updated);

  };

  // =========================
  // NEXT QUESTION
  // =========================

  const nextQuestion = () => {

    if (!answers[current])
      return;

    if (
      current <
      questions.length - 1
    ) {

      setCurrent(current + 1);

    } else {

      finishTest();

    }

  };

  // =========================
  // FINISH TEST
  // =========================

  const finishTest =
    async () => {

      if (timerRef.current) {

        clearInterval(
          timerRef.current
        );

      }

      setPhase("submitting");

      let finalScore = 0;

      questions.forEach(
        (q, i) => {

          if (
            answers[i] === q.answer
          ) {

            finalScore++;

          }

        }
      );

      setScore(finalScore);

      try {

        const user =
          auth.currentUser;

        await addDoc(
          collection(
            db,
            "exam_results"
          ),
          {

            userId:
              user?.uid ||
              "guest",

            userName:
              user?.displayName ||
              user?.email ||
              "Student",

            score: finalScore,

            total:
              questions.length,

            createdAt:
              serverTimestamp(),

          }
        );

      } catch (err) {

        console.log(err);

      }

      setPhase("result");

    };

  // =========================
  // LOADING
  // =========================

  if (phase === "loading") {

    return (

      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">

        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>

        <p className="mt-6 text-lg font-bold text-gray-500">

          Loading Daily Challenge...

        </p>

      </div>

    );

  }

  // =========================
  // SUBMITTING
  // =========================

  if (
    phase === "submitting"
  ) {

    return (

      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">

        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>

        <p className="mt-6 text-lg font-bold text-gray-500">

          Saving Result...

        </p>

      </div>

    );

  }

  // =========================
  // RESULT
  // =========================

  if (phase === "result") {

    if (error) {

      return (

        <div className="min-h-screen flex items-center justify-center bg-white">

          <p className="text-red-500 font-bold text-xl">

            {error}

          </p>

        </div>

      );

    }

    return (

      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-5">

        <div className="bg-white rounded-[2rem] p-10 w-full max-w-xl shadow-2xl text-center">

          <div className="text-7xl mb-6">
            🎯
          </div>

          <h1 className="text-4xl font-black text-gray-800">

            Daily Challenge Completed

          </h1>

          <p className="text-gray-500 mt-3 text-lg">

            You completed today's challenge 🚀

          </p>

          <div className="bg-blue-50 rounded-3xl p-8 mt-8">

            <p className="text-gray-500 text-lg">

              Your Score

            </p>

            <h2 className="text-7xl font-black text-blue-600 mt-3">

              {score}

            </h2>

            <p className="text-gray-400 mt-2 text-lg">

              out of {questions.length}

            </p>

          </div>

          <button
            onClick={() =>
            (window.location.href =
              "/leaderboard")
            }
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-lg transition-colors shadow-lg"
          >

            🏆 View Leaderboard

          </button>

        </div>

      </div>

    );

  }

  // =========================
  // CURRENT QUESTION
  // =========================

  const q = useMemo(() => {

    return (
      questions[current] || {
        question: "",
        options: [],
      }
    );

  }, [questions, current]);
  // =========================
  // MAIN UI
  // =========================

  return (

    <div className="min-h-screen bg-slate-50 pb-32 antialiased text-gray-800">

      {/* HEADER */}

      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">

        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">

          <div>

            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">

              SONILEARN

            </p>

            <h1 className="text-2xl font-black text-gray-900 mt-1">

              🔥 Daily Challenge

            </h1>

          </div>

          <div className="bg-red-50 text-red-600 px-5 py-2 rounded-2xl font-black text-xl">

            {formatTime(timeLeft)}

          </div>

        </div>

      </header>

      {/* PROGRESS */}

      <div className="h-2 bg-gray-200 sticky top-[72px] z-40">

        <div
          className="h-full bg-blue-600 transition-all"
          style={{
            width:
              `${((current + 1) /
                questions.length) *
              100}%`,
          }}
        />

      </div>

      {/* MAIN */}

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-6">

        {/* QUESTION CARD */}

        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">

          <div className="flex items-center justify-between mb-6">

            <div>

              <p className="text-xs font-black uppercase tracking-widest text-slate-400">

                Question {current + 1} / {questions.length}

              </p>

              <p className="mt-1 text-sm text-slate-500 font-semibold">

                Practice Mode

              </p>

            </div>

            <div className="bg-blue-50 px-4 py-2 rounded-full text-sm font-bold text-blue-700">

              {answers.filter(Boolean).length} Answered

            </div>

          </div>

          {/* QUESTION */}

          <h2 className="text-2xl font-black leading-relaxed text-gray-900 mb-8">

            {q.question}

          </h2>

          {/* OPTIONS */}

          <div className="space-y-4">

            {q.options.map(
              (
                opt: string,
                i: number
              ) => {

                const isSelected =
                  answers[current] === opt;

                return (

                  <button
                    key={i}
                    onClick={() =>
                      selectAnswer(opt)
                    }
                    className={`
                      w-full
                      text-left
                      rounded-2xl
                      border-2
                      p-5
                      transition-all
                      flex
                      gap-4

                      ${isSelected
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 bg-white"
                      }
                    `}
                  >

                    <div
                      className={`
                        w-11 h-11 rounded-full flex items-center justify-center font-black flex-shrink-0

                        ${isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                        }
                      `}
                    >

                      {String.fromCharCode(
                        65 + i
                      )}

                    </div>

                    <div className="text-lg font-semibold leading-relaxed">

                      {opt}

                    </div>

                  </button>

                );

              }
            )}

          </div>
          {/* ACTIONS */}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            {current > 0 && (

              <button
                onClick={() =>
                  setCurrent(current - 1)
                }
                className="sm:w-auto w-full px-6 py-4 rounded-2xl bg-slate-100 font-bold hover:bg-slate-200 transition"
              >

                ← Back

              </button>

            )}

            <button
              onClick={nextQuestion}
              disabled={!answers[current]}
              className={`
                w-full
                py-4
                rounded-2xl
                font-black
                text-lg
                transition-all

                ${answers[current]
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
            >

              {current ===
                questions.length - 1
                ? "✓ Finish Test"
                : "Next Question →"}

            </button>

          </div>

        </div>

        {/* QUESTION PALETTE */}

        <div className="bg-white rounded-[2rem] border border-slate-200 p-5 shadow-sm">

          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">

            Question Palette

          </p>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">

            {questions.map(
              (_, i) => {

                const isCurrent =
                  i === current;

                const isAnswered =
                  !!answers[i];

                return (

                  <button
                    key={i}
                    onClick={() =>
                      setCurrent(i)
                    }
                    className={`
                      h-12
                      rounded-xl
                      font-bold
                      text-sm
                      transition-all

                      ${isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : isAnswered
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "bg-gray-50 text-gray-400 border border-gray-100"
                      }
                    `}
                  >

                    {i + 1}

                  </button>

                );

              }
            )}

          </div>

        </div>

      </main>

    </div>

  );

}