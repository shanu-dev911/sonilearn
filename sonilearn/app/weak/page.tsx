"use client";

import { useEffect, useState } from "react";

import { db, auth } from "@/lib/firebase-client";

import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  topic?: string;
};

type Status = "idle" | "correct" | "wrong";

export default function WeakPage() {

  const [questions, setQuestions] = useState<Question[]>([]);

  const [current, setCurrent] = useState(0);

  const [selected, setSelected] = useState("");

  const [status, setStatus] = useState<Status>("idle");

  const [loading, setLoading] = useState(true);

  const [mastered, setMastered] = useState(0);

  // LOAD QUESTIONS
  useEffect(() => {

    async function loadQuestions() {

      try {

        const user = auth.currentUser;

        if (!user) {

          setLoading(false);

          return;

        }

        const q = query(
          collection(db, "weak_questions"),
          where("userId", "==", user.uid)
        );

        const snap = await getDocs(q);

        let arr: Question[] = [];

        snap.forEach((d) => {

          const data = d.data();

          arr.push({

            id: d.id,

            question: data.question || "",

            options: data.options || [],

            correctAnswer:
              data.correctAnswer ||
              data.answer ||
              "",

            explanation: data.explanation || "",

            topic: data.topic || "General",

          });

        });

        setQuestions(arr);

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);

      }

    }

    loadQuestions();

  }, []);

  // RESET
  const resetQuestion = () => {

    setSelected("");

    setStatus("idle");

  };

  // SELECT ANSWER
  const selectAnswer = (option: string) => {

    if (status === "correct") return;

    setSelected(option);

    if (option === questions[current].correctAnswer) {

      setStatus("correct");

    } else {

      setStatus("wrong");

    }

  };

  // MASTERED
  const handleMastered = async () => {

    try {

      const q = questions[current];

      await deleteDoc(
        doc(db, "weak_questions", q.id)
      );

      const updated = questions.filter(
        (_, index) => index !== current
      );

      setQuestions(updated);

      setMastered((prev) => prev + 1);

      resetQuestion();

      if (current >= updated.length) {

        setCurrent(
          Math.max(updated.length - 1, 0)
        );

      }

    } catch (error) {

      console.log(error);

    }

  };

  // NAVIGATION
  const nextQuestion = () => {

    if (current < questions.length - 1) {

      setCurrent(current + 1);

      resetQuestion();

    }

  };

  const prevQuestion = () => {

    if (current > 0) {

      setCurrent(current - 1);

      resetQuestion();

    }

  };

  // LOADING
  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="w-14 h-14 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>

          <p className="mt-5 text-sm font-bold uppercase tracking-widest text-gray-500">
            Loading Weak Practice...
          </p>

        </div>

      </div>

    );

  }

  // EMPTY
  if (!questions.length) {

    return (

      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">

        <div className="bg-white border rounded-[2rem] p-8 shadow-xl text-center max-w-md w-full">

          <div className="text-6xl mb-5">
            🏆
          </div>

          <h1 className="text-3xl font-black text-gray-800">
            All Topics Mastered
          </h1>

          <p className="text-gray-500 mt-3">
            Great work! You cleared all weak questions 🚀
          </p>

          <div className="bg-green-50 rounded-3xl p-6 mt-8">

            <p className="text-sm text-gray-500">
              Total Mastered
            </p>

            <h2 className="text-5xl font-black text-green-600 mt-2">

              {mastered}

            </h2>

          </div>

          <button
            onClick={() => window.location.href = "/daily"}
            className="w-full mt-8 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition"
          >
            🔥 Take Daily Challenge
          </button>

        </div>

      </div>

    );

  }

  const q = questions[current];

  return (

    <div className="min-h-screen bg-slate-50 pb-10">

      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-40">

        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              SONILEARN
            </p>

            <h1 className="text-2xl font-black text-red-600 mt-1">
              📊 Weak Practice
            </h1>

          </div>

          <div className="bg-red-50 text-red-600 px-5 py-2 rounded-2xl">

            <p className="text-xs font-black uppercase tracking-widest">
              Remaining
            </p>

            <h2 className="text-2xl font-black">

              {questions.length}

            </h2>

          </div>

        </div>

      </div>

      {/* PROGRESS */}
      <div className="h-2 bg-gray-200">

        <div
          className="h-full bg-red-500 transition-all"
          style={{
            width: `${((current + 1) / questions.length) * 100}%`,
          }}
        ></div>

      </div>

      {/* BODY */}
      <div className="max-w-3xl mx-auto px-4 mt-6">

        {/* TOP CARD */}
        <div className="bg-white border rounded-3xl p-5 shadow-sm mb-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500 font-semibold">
                Question {current + 1} of {questions.length}
              </p>

            </div>

            <div>

              <p className="text-sm font-black text-green-600">
                {mastered} Mastered
              </p>

            </div>

          </div>

        </div>

        {/* QUESTION CARD */}
        <div className="bg-white border rounded-[2rem] p-6 shadow-sm">

          {/* BADGE */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">

            <span className="bg-red-100 text-red-700 px-4 py-1 rounded-full text-xs font-black">
              {q.topic}
            </span>

          </div>

          {/* QUESTION */}
          <h2 className="text-xl md:text-2xl font-black text-gray-800 leading-relaxed mb-8">

            {q.question}

          </h2>

          {/* OPTIONS */}
          <div className="space-y-4">

            {(q.options || []).map((option, index) => {

              const isCorrect =
                option === q.correctAnswer;

              const isSelected =
                selected === option;

              return (

                <button
                  key={index}
                  onClick={() => selectAnswer(option)}
                  disabled={status === "correct"}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition font-semibold

                  ${isCorrect && status !== "idle"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : isSelected && status === "wrong"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-red-300"
                    }`}
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <span className="font-black mr-3">

                        {String.fromCharCode(65 + index)}.

                      </span>

                      {option}
                    </div>

                    {isCorrect &&
                      status !== "idle" && (

                        <span className="text-xs font-black text-green-600">
                          ✓ Correct
                        </span>

                      )}

                    {isSelected &&
                      status === "wrong" && (

                        <span className="text-xs font-black text-red-600">
                          ✗ Wrong
                        </span>

                      )}

                  </div>

                </button>

              );

            })}

          </div>

          {/* EXPLANATION */}
          {status !== "idle" && (

            <div
              className={`mt-6 rounded-2xl p-5 border

              ${status === "correct"
                  ? "bg-blue-50 border-blue-100"
                  : "bg-red-50 border-red-100"
                }`}
            >

              <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Explanation
              </p>

              <p className="text-sm leading-relaxed text-gray-700">

                {q.explanation ||

                  `Correct answer is "${q.correctAnswer}". Revise this topic carefully.`}

              </p>

            </div>

          )}

          {/* ACTION BUTTON */}
          <div className="mt-8">

            {status === "correct" ? (

              <button
                onClick={handleMastered}
                className="w-full bg-green-600 hover:bg-green-700 transition text-white py-4 rounded-2xl font-black"
              >
                ✅ Mastered — Next Question
              </button>

            ) : status === "wrong" ? (

              <button
                onClick={resetQuestion}
                className="w-full bg-gray-900 hover:bg-black transition text-white py-4 rounded-2xl font-black"
              >
                🔄 Try Again
              </button>

            ) : (

              <div className="text-center text-sm text-gray-400 font-medium">

                Select the correct answer

              </div>

            )}

          </div>

        </div>

        {/* NAVIGATION */}
        <div className="grid grid-cols-2 gap-4 mt-5">

          <button
            onClick={prevQuestion}
            disabled={current === 0}
            className="bg-white border py-4 rounded-2xl font-black text-gray-600 disabled:opacity-40"
          >
            ← Previous
          </button>

          <button
            onClick={nextQuestion}
            disabled={current === questions.length - 1}
            className="bg-white border py-4 rounded-2xl font-black text-gray-600 disabled:opacity-40"
          >
            Next →
          </button>

        </div>

        {/* PALETTE */}
        <div className="bg-white border rounded-[2rem] p-5 shadow-sm mt-5">

          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
            Question Palette
          </p>

          <div className="flex flex-wrap gap-3">

            {questions.map((_, i) => (

              <button
                key={i}
                onClick={() => {

                  setCurrent(i);

                  resetQuestion();

                }}
                className={`w-11 h-11 rounded-xl font-black text-sm transition

                ${i === current
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-500"
                  }`}
              >

                {i + 1}

              </button>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

}