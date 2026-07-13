"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";

type Question = {
    questionEn: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    answer: string;
    explanationHi?: string;
};

export default function LiveMockTest() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const subject = searchParams.get("subject") || "All";

    const [questions, setQuestions] = useState<Question[]>([]);
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState("");
    const [answers, setAnswers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const initialTime = subject === "All" ? 3600 : 1200;
    const [timeLeft, setTimeLeft] = useState(initialTime);

    const [finished, setFinished] = useState(false);

    useEffect(() => {
        const newTime = subject === "All" ? 3600 : 1200;
        setTimeLeft(newTime);
    }, [subject]);

    useEffect(() => {
        fetch(`/api/mock-test?subject=${subject}`)
            .then((res) => res.json())
            .then((data) => {
                setQuestions(data || []);
                setAnswers(new Array(data.length).fill(""));
                setLoading(false);
            });
    }, [subject]);

    useEffect(() => {
        if (timeLeft <= 0 || finished) return;
        const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, finished]);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleSelect = (opt: string) => {
        setSelected(opt);
        const updated = [...answers];
        updated[index] = opt;
        setAnswers(updated);
    };

    const nextQuestion = () => {
        if (!selected) return;
        if (index < questions.length - 1) {
            setIndex(index + 1);
            setSelected(answers[index + 1] || "");
        }
    };

    const prevQuestion = () => {
        if (index > 0) {
            setIndex(index - 1);
            setSelected(answers[index - 1] || "");
        }
    };

    const submitTest = () => {
        setFinished(true);
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.answer) score += 2;
            else if (answers[i]) score -= 0.5;
        });
        return score;
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!questions.length) {
        return <div className="min-h-screen flex items-center justify-center">No Questions 😢</div>;
    }

    const q = questions[index] || {};

    // ✅ RESULT PAGE (same + clean)
    if (finished) {
        return (
            <div className="min-h-screen p-4 text-center">
                <h2 className="text-2xl font-bold">Test Completed 🎉</h2>

                <p className="mt-3 text-lg">
                    Score: {calculateScore()} / {questions.length * 2}
                </p>

                <div className="mt-6 space-y-4 max-w-2xl mx-auto text-left">
                    {questions.map((ques, i) => (
                        <div key={i} className="p-4 bg-white rounded-xl shadow">

                            <p className="font-semibold">
                                Q{i + 1}. {ques.questionEn}
                            </p>

                            <p className={`mt-2 ${answers[i] === ques.answer ? "text-green-600" : "text-red-600"}`}>
                                Your Answer: {answers[i] || "Not Attempted"}
                            </p>

                            <p className="text-green-600">
                                Correct: {ques.answer}
                            </p>

                            {ques.explanationHi && (
                                <p className="text-sm mt-2 text-gray-600">
                                    👉 {ques.explanationHi}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => router.push("/")}
                    className="mt-6 bg-blue-600 text-white px-6 py-2 rounded"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">

            {/* HEADER */}
            <div className="bg-white shadow p-4 flex justify-between items-center">
                <button onClick={() => router.push("/")}>
                    <ArrowLeft />
                </button>

                <h2 className="font-bold text-sm">{subject} Mock</h2>

                <div className="text-red-500 text-sm font-semibold">
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* QUESTION */}
            <div className="p-4 max-w-xl mx-auto">

                <p className="text-sm text-gray-500">
                    Question {index + 1} / {questions.length}
                </p>

                <h2 className="mt-3 font-semibold text-lg">
                    {q.questionEn}
                </h2>

                {/* OPTIONS */}
                <div className="mt-5 space-y-3">
                    {["A", "B", "C", "D"].map((opt) => {
                        const isCorrect = q.answer === opt;
                        const isSelected = selected === opt;

                        return (
                            <button
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                className={`w-full text-left p-4 rounded-xl border transition
                                
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
                                ({opt}) {q?.[`option${opt}` as keyof Question]}
                            </button>
                        );
                    })}
                </div>

                {/* ✅ EXPLANATION SHOW */}
                {selected && (
                    <div className="mt-4 p-3 bg-white rounded-xl border">
                        <p className="text-green-600 font-semibold">
                            Correct Answer: {q.answer}
                        </p>

                        {q.explanationHi && (
                            <p className="text-sm text-gray-600 mt-1">
                                👉 {q.explanationHi}
                            </p>
                        )}
                    </div>
                )}

                {/* BUTTONS */}
                <div className="flex justify-between mt-6">
                    <button onClick={prevQuestion} className="bg-gray-300 px-4 py-2 rounded">
                        Prev
                    </button>

                    {index === questions.length - 1 ? (
                        <button onClick={submitTest} className="bg-green-600 text-white px-4 py-2 rounded">
                            Submit
                        </button>
                    ) : (
                        <button onClick={nextQuestion} className="bg-blue-600 text-white px-4 py-2 rounded">
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}