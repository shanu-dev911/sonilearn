"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    motion,
    AnimatePresence,
} from "framer-motion";

import {
    Clock3,
    ChevronLeft,
    ChevronRight,
    Bookmark,
} from "lucide-react";

import {
    collection,
    getDocs,
    limit,
    query,
    where,
} from "firebase/firestore";

import { db } from "@/lib/firebase-client";

type Question = {
    id: string;
    exam: string;
    year: string;
    shift: string;
    subject: string;
    question: string;
    options: string[];
    answer: number;
};

const SUBJECTS = [
    "Reasoning",
    "Math",
    "GS",
    "English",
];

export default function PYQPage() {

    const [subject, setSubject] =
        useState("Reasoning");

    const [questions, setQuestions] =
        useState<Question[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [current, setCurrent] =
        useState(0);

    const [selected, setSelected] =
        useState<Record<number, number>>({});

    const [submitted, setSubmitted] =
        useState(false);

    const [timeLeft, setTimeLeft] =
        useState(20 * 60);

    // FETCH QUESTIONS
    useEffect(() => {

        fetchQuestions();

    }, [subject]);

    const fetchQuestions = async () => {

        try {

            setLoading(true);

            const subjectFilter =
                subject === "GS"
                    ? ["GS", "GK"]
                    : [subject];

            const q =
                subjectFilter.length === 1
                    ? query(
                          collection(db, "questions"),
                          where("subject", "==", subjectFilter[0]),
                          limit(50)
                      )
                    : query(
                          collection(db, "questions"),
                          where("subject", "in", subjectFilter),
                          limit(50)
                      );

            const snapshot =
                await getDocs(q);

            const fetchedQuestions:
                Question[] = [];

            snapshot.forEach((doc) => {

                const data: any =
                    doc.data();

                if (
                    data.questionEn &&
                    data.optionA &&
                    data.optionB &&
                    data.optionC &&
                    data.optionD
                ) {

                    fetchedQuestions.push({

                        id: doc.id,

                        exam:
                            data.exam || "SSC",

                        year:
                            data.year || "2024",

                        shift:
                            data.shift || "Shift",

                        subject:
                            data.subject || "",

                        question:
                            data.questionEn || "",

                        options: [
                            data.optionA || "",
                            data.optionB || "",
                            data.optionC || "",
                            data.optionD || "",
                        ],

                        answer:
                            (data.answer || "A")
                                .charCodeAt(0) - 65,

                    });

                }

            });

            // PERFORMANCE FIX
            const shuffled =
                fetchedQuestions
                    .slice(0, 50)
                    .sort(
                        () =>
                            Math.random() - 0.5
                    )
                    .slice(0, 20);

            setQuestions(shuffled);

            setCurrent(0);

            setSelected({});

            setSubmitted(false);

            setTimeLeft(20 * 60);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }

    };

    // TIMER
    useEffect(() => {

        if (submitted) return;

        const timer = setInterval(() => {

            setTimeLeft((prev) => {

                if (prev <= 1) {

                    handleSubmit();

                    return 0;

                }

                return prev - 1;

            });

        }, 1000);

        return () =>
            clearInterval(timer);

    }, [submitted]);

    // CURRENT QUESTION
    const currentQuestion =
        useMemo(() => {

            return (
                questions[current] || null
            );

        }, [questions, current]);

    // SELECT OPTION
    const handleOption = (
        index: number
    ) => {

        setSelected((prev) => ({
            ...prev,
            [current]: index,
        }));

    };

    // SUBMIT
    const handleSubmit = () => {

        setSubmitted(true);

    };

    const handleRestart = () => {

        setSubmitted(false);

        setCurrent(0);

        setSelected({});

        setTimeLeft(20 * 60);

    };

    // FORMAT TIMER
    const formatTime = (
        seconds: number
    ) => {

        const m =
            Math.floor(seconds / 60);

        const s = seconds % 60;

        return `${m}:${s
            .toString()
            .padStart(2, "0")}`;

    };

    // SCORE
    const score = useMemo(() => {

        let correct = 0;

        questions.forEach((q, i) => {

            if (
                selected[i] === q.answer
            ) {

                correct++;

            }

        });

        return correct;

    }, [questions, selected]);

    const attempted =
        Object.keys(selected).length;

    const percentage =
        questions.length > 0
            ? Math.round((score / questions.length) * 100)
            : 0;

    const incorrect =
        Math.max(0, attempted - score);

    // RESULT
    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center bg-slate-100">

                <div className="text-center">

                    <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>

                    <p className="mt-4 text-gray-500 font-bold">

                        Loading PYQs...

                    </p>

                </div>

            </div>

        );

    }

    if (!loading && questions.length === 0) {

        return (

            <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">

                <div className="max-w-3xl w-full bg-white rounded-[2rem] p-10 shadow-xl text-center">

                    <h2 className="text-3xl font-black text-gray-800 mb-4">

                        No questions found for {subject}

                    </h2>

                    <p className="text-gray-500 mb-8">

                        We could not load any previous year questions for the selected subject. Try another subject or refresh the page.

                    </p>

                    <button
                        onClick={fetchQuestions}
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-600 text-white px-6 py-3 font-bold"
                    >
                        Reload Questions
                    </button>

                </div>

            </div>

        );

    }

    if (submitted) {

        return (

            <div className="min-h-screen bg-slate-100 pb-32">

                <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b shadow-sm">

                    <div className="max-w-4xl mx-auto px-4 py-5">

                        <div className="flex items-center justify-between">

                            <div>

                                <h1 className="text-3xl font-black text-blue-700">

                                    SoniLearn

                                </h1>

                                <p className="text-sm text-gray-500 font-medium">

                                    Previous Year Questions

                                </p>

                            </div>

                            <div className="bg-red-50 px-5 py-3 rounded-2xl flex items-center gap-2">

                                <Clock3 className="w-5 h-5 text-red-600" />

                                <span className="font-black text-red-600 text-lg">

                                    {formatTime(timeLeft)}

                                </span>

                            </div>

                        </div>

                    </div>

                </div>

                <div className="max-w-4xl mx-auto px-4 mt-8">

                    <div className="bg-white rounded-[2rem] p-8 shadow-xl text-center">

                        <h2 className="text-3xl font-black text-gray-800 mb-3">

                            Test Submitted

                        </h2>

                        <p className="text-gray-500 mb-8">

                            You completed the {subject} PYQ test.

                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                            <div className="rounded-3xl bg-blue-50 p-6">

                                <div className="text-sm text-gray-500 uppercase font-bold mb-2">Score</div>

                                <div className="text-4xl font-black text-blue-700">{score}</div>

                            </div>

                            <div className="rounded-3xl bg-green-50 p-6">

                                <div className="text-sm text-gray-500 uppercase font-bold mb-2">Attempted</div>

                                <div className="text-4xl font-black text-green-700">{attempted}</div>

                            </div>

                            <div className="rounded-3xl bg-red-50 p-6">

                                <div className="text-sm text-gray-500 uppercase font-bold mb-2">Incorrect</div>

                                <div className="text-4xl font-black text-red-700">{incorrect}</div>

                            </div>

                        </div>

                        <div className="text-xl font-bold text-gray-800 mb-10">

                            {percentage}% correct out of {questions.length} questions

                        </div>

                        <button
                            onClick={handleRestart}
                            className="rounded-2xl bg-blue-600 text-white px-6 py-4 font-black"
                        >
                            Retake {subject}
                        </button>

                    </div>

                </div>

            </div>

        );

    }

    return (

        <div className="min-h-screen bg-slate-100 pb-32">

            {/* HEADER */}
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b shadow-sm">

                <div className="max-w-4xl mx-auto px-4 py-5">

                    <div className="flex items-center justify-between">

                        <div>

                            <h1 className="text-3xl font-black text-blue-700">

                                SoniLearn

                            </h1>

                            <p className="text-sm text-gray-500 font-medium">

                                Previous Year Questions

                            </p>

                        </div>

                        <div className="bg-red-50 px-5 py-3 rounded-2xl flex items-center gap-2">

                            <Clock3 className="w-5 h-5 text-red-600" />

                            <span className="font-black text-red-600 text-lg">

                                {formatTime(timeLeft)}

                            </span>

                        </div>

                    </div>

                    {/* PROGRESS */}
                    <div className="mt-5">

                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">

                            <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{
                                    width:
                                        `${((current + 1) /
                                            questions.length) *
                                        100}%`,
                                }}
                            />

                        </div>

                        <div className="flex justify-between mt-2 text-sm text-gray-500">

                            <span>

                                Question {current + 1}/20

                            </span>

                            <span>

                                {subject}

                            </span>

                        </div>

                    </div>

                </div>

            </div>

            {/* SUBJECTS */}
            <div className="max-w-4xl mx-auto px-4 mt-5">

                <div className="flex gap-3 overflow-x-auto pb-2">

                    {SUBJECTS.map((sub) => (

                        <button
                            key={sub}
                            onClick={() =>
                                setSubject(sub)
                            }
                            className={`px-5 py-3 rounded-2xl whitespace-nowrap font-bold transition

              ${subject === sub
                                    ? "bg-blue-600 text-white"
                                    : "bg-white border border-gray-200 text-gray-700"
                                }`}
                        >

                            {sub}

                        </button>

                    ))}

                </div>

            </div>

            {/* QUESTION */}
            <div className="max-w-4xl mx-auto px-4 mt-5">

                <AnimatePresence mode="wait">

                    {currentQuestion && (

                        <motion.div
                            key={current}
                            initial={{
                                opacity: 0,
                                x: 20,
                            }}
                            animate={{
                                opacity: 1,
                                x: 0,
                            }}
                            exit={{
                                opacity: 0,
                                x: -20,
                            }}
                            className="bg-white rounded-[2rem] p-6 shadow-xl"
                        >
                            {/* TOP */}
                            <div className="flex items-center justify-between">

                                <div className="bg-blue-50 text-blue-700 text-sm px-4 py-2 rounded-full font-bold">

                                    {currentQuestion.exam}
                                    {" • "}
                                    {currentQuestion.year}

                                </div>

                                <button>

                                    <Bookmark className="w-5 h-5 text-gray-400" />

                                </button>

                            </div>

                            {/* QUESTION */}
                            <h2 className="mt-6 text-2xl md:text-3xl leading-relaxed font-black text-gray-800">

                                {currentQuestion.question}

                            </h2>

                            {/* OPTIONS */}
                            <div className="mt-8 space-y-4">

                                {currentQuestion.options.map(
                                    (option, i) => {

                                        const active =
                                            selected[current]
                                            === i;

                                        return (

                                            <button
                                                key={i}
                                                onClick={() =>
                                                    handleOption(i)
                                                }
                                                className={`w-full rounded-2xl border p-5 text-left transition-all

                        ${active
                                                        ? "bg-blue-600 border-blue-600 text-white"
                                                        : "bg-white border-gray-200 hover:border-blue-300"
                                                    }`}
                                            >

                                                <div className="flex items-center gap-4">

                                                    <div
                                                        className={`w-12 h-12 rounded-full flex items-center justify-center font-black

                            ${active
                                                                ? "bg-white text-blue-700"
                                                                : "bg-blue-50 text-blue-700"
                                                            }`}
                                                    >

                                                        {String.fromCharCode(
                                                            65 + i
                                                        )}

                                                    </div>

                                                    <span className="text-lg font-semibold">

                                                        {option}

                                                    </span>

                                                </div>

                                            </button>

                                        );

                                    }
                                )}

                            </div>

                        </motion.div>

                    )}

                </AnimatePresence>

            </div>

            {/* FOOTER */}
            <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t p-4">

                <div className="max-w-4xl mx-auto flex gap-3">

                    <button
                        disabled={current === 0}
                        onClick={() =>
                            setCurrent((p) => p - 1)
                        }
                        className="flex-1 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >

                        <ChevronLeft className="w-5 h-5" />

                        Previous

                    </button>

                    {current ===
                        questions.length - 1 ? (

                        <button
                            onClick={handleSubmit}
                            className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black"
                        >

                            Submit Test

                        </button>

                    ) : (

                        <button
                            onClick={() =>
                                setCurrent((p) => p + 1)
                            }
                            className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center gap-2"
                        >

                            Next

                            <ChevronRight className="w-5 h-5" />

                        </button>

                    )}

                </div>

            </div>

        </div>

    );

}