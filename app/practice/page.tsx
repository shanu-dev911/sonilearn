export const dynamic = 'force-dynamic';

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ✅ MAIN PAGE
export default function PracticePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    Loading...
                </div>
            }
        >
            <PracticeContent />
        </Suspense>
    );
}

// ✅ PRACTICE CONTENT
function PracticeContent() {

    const router = useRouter();
    const searchParams = useSearchParams();

    const subject = searchParams.get("subject") || "All";

    const [questions, setQuestions] = useState<any[]>([]);
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState("");
    const [answers, setAnswers] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    const [timeLeft, setTimeLeft] = useState(
        subject === "All" ? 3600 : 1200
    );

    // LOAD QUESTIONS
    useEffect(() => {

        fetch(`/api/questions?subject=${subject}`)
            .then((res) => res.json())
            .then((data) => {

                setQuestions(data);

                setAnswers(
                    new Array(data.length).fill("")
                );
            });

    }, [subject]);

    // TIMER
    useEffect(() => {

        if (timeLeft <= 0 || finished) return;

        const t = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(t);

    }, [timeLeft, finished]);

    // FORMAT TIME
    const formatTime = (sec: number) => {

        const m = Math.floor(sec / 60);

        const s = sec % 60;

        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    // SELECT OPTION
    const handleSelect = (opt: string) => {

        setSelected(opt);

        const arr = [...answers];

        arr[index] = opt;

        setAnswers(arr);
    };

    // NEXT QUESTION
    const next = () => {

        if (!selected) return;

        if (selected === questions[index]?.answer) {
            setScore((prev) => prev + 1);
        }

        if (index < questions.length - 1) {

            setIndex(index + 1);

            setSelected(
                answers[index + 1] || ""
            );

        } else {

            setFinished(true);
        }
    };

    // RESULT PAGE
    if (finished) {

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">

                <h2 className="text-3xl font-bold text-green-600">
                    🎉 Test Completed
                </h2>

                <p className="mt-4 text-xl font-semibold">
                    Score: {score} / {questions.length}
                </p>

                <p className="mt-2 text-gray-600">
                    Accuracy:{" "}
                    {questions.length > 0
                        ? (
                            (score / questions.length) * 100
                        ).toFixed(1)
                        : 0}
                    %
                </p>

                <button
                    onClick={() => router.push("/")}
                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl shadow"
                >
                    Go Home
                </button>

            </div>
        );
    }

    const q = questions[index] || {};

    return (
        <div className="min-h-screen bg-slate-50">

            {/* HEADER */}
            <div className="bg-white shadow p-4 flex justify-between items-center">

                <button
                    onClick={() => router.push("/")}
                >
                    ←
                </button>

                <h2 className="font-bold text-sm">
                    {subject} Practice
                </h2>

                <div className="text-red-500 text-sm font-semibold">
                    {formatTime(timeLeft)}
                </div>

            </div>

            {/* CONTENT */}
            <div className="p-4 max-w-xl mx-auto">

                <p className="text-sm text-gray-500">
                    Question {index + 1} / {questions.length}
                </p>

                <h3 className="mt-3 font-semibold text-lg">
                    {q.questionEn}
                </h3>

                {/* OPTIONS */}
                <div className="mt-5 space-y-3">

                    {["A", "B", "C", "D"].map((opt) => {

                        const isCorrect =
                            q.answer === opt;

                        const isSelected =
                            selected === opt;

                        return (

                            <button
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                className={`w-full p-4 rounded-xl border text-left transition

                                ${selected
                                        ? isCorrect
                                            ? "bg-green-100 border-green-500"
                                            : isSelected
                                                ? "bg-red-100 border-red-500"
                                                : "bg-white"
                                        : isSelected
                                            ? "bg-blue-100 border-blue-500"
                                            : "bg-white"
                                    }
                                `}
                            >

                                <span className="font-semibold">
                                    ({opt})
                                </span>{" "}

                                {q[`option${opt}`]}

                            </button>
                        );
                    })}
                </div>

                {/* ANSWER */}
                {selected && (

                    <div className="mt-5 p-4 rounded-xl bg-white border">

                        <p className="text-green-600 font-semibold">
                            ✅ Correct Answer: {q.answer}
                        </p>

                        {q.explanationEn && (

                            <p className="mt-2 text-gray-700 text-sm">
                                💡 {q.explanationEn}
                            </p>

                        )}

                    </div>
                )}

                {/* NEXT */}
                <button
                    onClick={next}
                    className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold shadow"
                >

                    {index === questions.length - 1
                        ? "Submit"
                        : "Next"}

                </button>

            </div>
        </div>
    );
}