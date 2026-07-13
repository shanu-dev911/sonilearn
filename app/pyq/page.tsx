export const dynamic = 'force-dynamic';

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
    // 🎯 STRICT SINGLE EXAM SYSTEM: Yahan hum user ka login exam load karenge. 
    // Agar local storage ya session mein exam save hai toh wo uthayega, nahi toh abhi ke liye "RRB NTPC" ko lock kar diya hai.
    const [targetExam, setTargetExam] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("userExam") || "RRB NTPC";
        }
        return "RRB NTPC";
    });

    const [subject, setSubject] = useState("Reasoning");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(20 * 60);

    // FETCH QUESTIONS FROM BACKEND API
    useEffect(() => {
        fetchQuestions();
    }, [subject, targetExam]);

    const fetchQuestions = async () => {
        try {
            setLoading(true);

            const res = await fetch(`/api/questions?subject=${subject}&exam=${targetExam}`);
            const data = await res.json();

            if (data && data.length > 0) {
                const fetchedQuestions: Question[] = [];

                data.forEach((q: any) => {
                    const docExam = q.exam || "";

                    // Absolute textual validation filter
                    const normalizedDocExam = docExam.trim().toLowerCase().replace(/[\s_]/g, "");
                    const normalizedTargetExam = targetExam.trim().toLowerCase().replace(/[\s_]/g, "");

                    if (normalizedDocExam !== normalizedTargetExam) {
                        return; // Discard cross-contaminated data
                    }

                    fetchedQuestions.push({
                        id: q.id,
                        exam: docExam || targetExam,
                        year: q.year || q.pyqYear || "2024",
                        shift: q.shift || "Shift 1",
                        subject: q.subject || subject,
                        question: q.questionEn || q.question || "",
                        options: q.options || [],
                        answer: typeof q.answer === "number" ? q.answer : 0
                    });
                });

                setQuestions(fetchedQuestions.slice(0, 20));
            } else {
                setQuestions([]);
            }

            setCurrent(0);
            setSelected({});
            setSubmitted(false);
            setTimeLeft(20 * 60);

        } catch (error) {
            console.error("FETCH ERROR FROM CLIENT:", error);
            setQuestions([]);
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

        return () => clearInterval(timer);
    }, [submitted]);

    const currentQuestion = useMemo(() => {
        return questions[current] || null;
    }, [questions, current]);

    const handleOption = (index: number) => {
        setSelected((prev) => ({
            ...prev,
            [current]: index,
        }));
    };

    const handleSubmit = () => {
        setSubmitted(true);
    };

    const handleRestart = () => {
        setSubmitted(false);
        setCurrent(0);
        setSelected({});
        setTimeLeft(20 * 60);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const score = useMemo(() => {
        let correct = 0;
        questions.forEach((q, i) => {
            if (selected[i] === q.answer) {
                correct++;
            }
        });
        return correct;
    }, [questions, selected]);

    const attempted = Object.keys(selected).length;
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const incorrect = Math.max(0, attempted - score);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-bold">Loading {targetExam} PYQs...</p>
                </div>
            </div>
        );
    }

    // STRICT EMPTY STATE HANDLER (EXAM SELECTOR REMOVED)
    if (!loading && questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
                <div className="max-w-3xl w-full bg-white rounded-[2rem] p-10 shadow-xl text-center">
                    {/* Only Subject Switcher Allowed */}
                    <div className="flex gap-3 justify-center overflow-x-auto pb-6 border-b">
                        {SUBJECTS.map((sub) => (
                            <button
                                key={sub}
                                onClick={() => setSubject(sub)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${subject === sub ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 mb-2 mt-6">
                        No Questions Available For: {targetExam}
                    </h2>
                    <p className="text-gray-500 mb-6 text-sm">
                        Database mein aapke selected exam **{targetExam}** ke {subject} subject ke pyq tests abhi uploaded nahi hain.
                    </p>
                    <button onClick={fetchQuestions} className="rounded-2xl bg-blue-600 text-white px-6 py-3 font-bold text-sm">
                        Reload View
                    </button>
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
                            <h1 className="text-3xl font-black text-blue-700">SoniLearn</h1>
                            <p className="text-sm text-gray-500 font-medium">Target Exam: <span className="font-bold text-gray-800">{targetExam}</span></p>
                        </div>
                        <div className="bg-red-50 px-5 py-3 rounded-2xl flex items-center gap-2">
                            <Clock3 className="w-5 h-5 text-red-600" />
                            <span className="font-black text-red-600 text-lg">{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                    {/* PROGRESS */}
                    <div className="mt-5">
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
                        </div>
                        <div className="flex justify-between mt-2 text-sm text-gray-500">
                            <span>Question {current + 1}/{questions.length}</span>
                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{subject}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SUBJECTS SWITCHER ONLY (EXAM SWITCHER BUTTONS REMOVED PERMANENTLY) */}
            <div className="max-w-4xl mx-auto px-4 mt-5">
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {SUBJECTS.map((sub) => (
                        <button
                            key={sub}
                            onClick={() => setSubject(sub)}
                            className={`px-5 py-3 rounded-2xl whitespace-nowrap font-bold transition ${subject === sub ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700"}`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </div>

            {/* QUESTION DISPLAY CONTAINER */}
            <div className="max-w-4xl mx-auto px-4 mt-5">
                <AnimatePresence mode="wait">
                    {currentQuestion && (
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-[2rem] p-6 shadow-xl border-t-8 border-blue-600"
                        >
                            <div className="flex items-center justify-between">
                                <div className="bg-amber-100 text-amber-900 border border-amber-300 text-xs md:text-sm px-4 py-2 rounded-xl font-black uppercase tracking-wider shadow-sm">
                                    Official {currentQuestion.exam} ({currentQuestion.year})
                                </div>
                                <button><Bookmark className="w-5 h-5 text-gray-400" /></button>
                            </div>
                            <h2 className="mt-6 text-2xl md:text-3xl leading-relaxed font-black text-gray-800">
                                {currentQuestion.question}
                            </h2>
                            <div className="mt-8 space-y-4">
                                {currentQuestion.options.map((option, i) => {
                                    const active = selected[current] === i;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleOption(i)}
                                            className={`w-full rounded-2xl border p-5 text-left transition-all ${active ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 hover:border-blue-300"}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${active ? "bg-white text-blue-700" : "bg-blue-50 text-blue-700"}`}>{String.fromCharCode(65 + i)}</div>
                                                <span className="text-lg font-semibold">{option}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ACTION FOOTER */}
            <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t p-4">
                <div className="max-w-4xl mx-auto flex gap-3">
                    <button
                        disabled={current === 0}
                        onClick={() => setCurrent((p) => p - 1)}
                        className="flex-1 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-5 h-5" /> Previous
                    </button>
                    {current === questions.length - 1 ? (
                        <button onClick={handleSubmit} className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black">Submit Test</button>
                    ) : (
                        <button onClick={() => setCurrent((p) => p + 1)} className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center gap-2">
                            Next <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}