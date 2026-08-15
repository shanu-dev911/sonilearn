"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase-client";
import {
    collection,
    doc,
    getDocs,
    addDoc,
    query,
    where,
    limit,
    serverTimestamp,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
    Timer,
    CheckCircle2,
    XCircle,
    ArrowRight,
    ArrowLeft,
    RotateCcw,
    Home,
    Award,
    Newspaper,
    BookOpen,
} from "lucide-react";

type Question = {
    id: string;
    questionEn: string;
    questionHi: string;
    optionsEn: string[];
    optionsHi: string[];
    answer: string;
    explanationEn?: string;
    explanationHi?: string;
    subject?: string;
};

type Phase = "loading" | "subject-select" | "quiz" | "submitting" | "result";

const TOTAL_QUESTIONS = 25;
const TIMER_SECONDS = 20 * 60; // 20 minutes

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// 🎯 STRONG RUNTIME RESHUFFLE — same pattern used across the platform,
// guarantees option order is genuinely randomized every load.
function getSecureRandom(): number {
    if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
        const arr = new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        return arr[0] / (0xffffffff + 1);
    }
    return Math.random();
}

function fisherYatesShuffle(arr: number[]): number[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(getSecureRandom() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function shuffleOptions(optEn: string[], optHi: string[], correctIndex: number) {
    let indices = fisherYatesShuffle([0, 1, 2, 3]);
    indices = fisherYatesShuffle(indices);
    const newOptEn = indices.map((idx) => optEn[idx]);
    const newOptHi = indices.map((idx) => optHi[idx]);
    const newCorrectIndex = indices.indexOf(correctIndex);
    return { newOptEn, newOptHi, newCorrectText: newOptEn[newCorrectIndex] };
}

const EXAM_KEY = "CURRENT_AFFAIRS";

export default function CurrentAffairsTest() {
    const router = useRouter();
    const [user, authLoading] = useAuthState(auth);

    const [phase, setPhase] = useState<Phase>("loading");
    const [error, setError] = useState("");

    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [selectedSubject, setSelectedSubject] = useState("");

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
    const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
    const [score, setScore] = useState(0);

    // LOAD AVAILABLE MONTH/SUBJECT CATEGORIES
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setError("Please log in to access Current Affairs.");
            setPhase("result");
            return;
        }

        async function loadSubjects() {
            try {
                setError("");

                const snap = await getDocs(
                    query(collection(db, "questions"), where("exam", "==", EXAM_KEY), limit(500))
                );

                const subjectSet = new Set<string>();
                snap.forEach((d) => {
                    const data: any = d.data();
                    const subj = data.subject || data.topic;
                    if (subj) subjectSet.add(subj);
                });

                const subjectList = Array.from(subjectSet).sort().reverse(); // latest month first if named like "August 2026"

                if (subjectList.length === 0) {
                    setError("No Current Affairs questions available yet. Check back soon!");
                    setPhase("result");
                    return;
                }

                setAvailableSubjects(subjectList);
                setPhase("subject-select");
            } catch (err) {
                console.error(err);
                setError("Failed to load Current Affairs categories.");
                setPhase("result");
            }
        }

        loadSubjects();
    }, [user, authLoading]);

    // LOAD QUESTIONS FOR SELECTED CATEGORY (verified + reshuffled)
    const startQuizForSubject = async (subject: string) => {
        try {
            setSelectedSubject(subject);
            setPhase("loading");
            setError("");
            setQuestions([]);
            setSelectedAnswers({});
            setCurrentIndex(0);
            setTimeLeft(TIMER_SECONDS);
            setScore(0);

            const snap = await getDocs(
                query(
                    collection(db, "questions"),
                    where("exam", "==", EXAM_KEY),
                    where("subject", "==", subject),
                    limit(150)
                )
            );

            let arr: Question[] = [];

            snap.forEach((d) => {
                const data: any = d.data();
                const answerKey = (data.answer || "").toString().toUpperCase();

                const optionMap: Record<string, string> = {
                    A: data.optionA,
                    B: data.optionB,
                    C: data.optionC,
                    D: data.optionD,
                };
                const answerValue = optionMap[answerKey];

                const primaryText = data.questionEn || data.question || "";
                const allOptionsPresent = data.optionA && data.optionB && data.optionC && data.optionD;

                // VERIFICATION — skip invalid/incomplete questions entirely
                if (!primaryText || !allOptionsPresent || !answerValue) return;

                const rawOptEn = [data.optionA, data.optionB, data.optionC, data.optionD];
                const rawOptHi = [
                    data.optionAHi || data.optionA,
                    data.optionBHi || data.optionB,
                    data.optionCHi || data.optionC,
                    data.optionDHi || data.optionD,
                ];

                const correctIndex = ["A", "B", "C", "D"].indexOf(answerKey);
                const { newOptEn, newOptHi, newCorrectText } = shuffleOptions(rawOptEn, rawOptHi, correctIndex);

                arr.push({
                    id: d.id,
                    questionEn: primaryText,
                    questionHi: data.questionHi || "",
                    optionsEn: newOptEn,
                    optionsHi: newOptHi,
                    answer: newCorrectText,
                    explanationEn: data.explanationEn || "",
                    explanationHi: data.explanationHi || "",
                    subject: data.subject || subject,
                });
            });

            arr = arr.sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);

            if (arr.length === 0) {
                setError(`No verified questions found for ${subject}.`);
                setPhase("result");
                return;
            }

            setQuestions(arr);
            setPhase("quiz");
        } catch (err) {
            console.error(err);
            setError("Failed to load questions.");
            setPhase("result");
        }
    };

    // TIMER
    useEffect(() => {
        if (phase !== "quiz") return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitTest();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const handleOptionSelect = (option: string) => {
        if (selectedAnswers[currentIndex] !== undefined) return;
        setSelectedAnswers({ ...selectedAnswers, [currentIndex]: option });
    };

    const handleSubmitTest = async () => {
        setPhase("submitting");

        let finalScore = 0;
        questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.answer) finalScore += 1;
        });
        setScore(finalScore);

        const uid = user?.uid || "guest";

        try {
            await addDoc(collection(db, "exam_results"), {
                userId: uid,
                userName: user?.displayName || user?.email || "Student",
                score: finalScore,
                total: questions.length,
                examTrack: EXAM_KEY,
                subject: selectedSubject,
                mode: "current_affairs",
                createdAt: serverTimestamp(),
            });

            const wrongOnes = questions.filter((q, idx) => (selectedAnswers[idx] || "").trim() !== q.answer);

            for (const q of wrongOnes) {
                await addDoc(collection(db, "weak_questions"), {
                    userId: uid,
                    questionEn: q.questionEn,
                    questionHi: q.questionHi,
                    optionsEn: q.optionsEn,
                    optionsHi: q.optionsHi,
                    correctAnswer: q.answer,
                    topic: q.subject || selectedSubject,
                    timestamp: serverTimestamp(),
                });
            }
        } catch (err) {
            console.log("Submission error:", err);
        }

        setPhase("result");
    };

    const handleRetry = () => {
        setPhase("subject-select");
        setSelectedAnswers({});
        setCurrentIndex(0);
        setScore(0);
        setSelectedSubject("");
    };

    // ===================== UI =====================

    if (phase === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Loading Current Affairs...
                </p>
            </div>
        );
    }

    // SUBJECT / MONTH SELECTION SCREEN
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
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                                📰 Current Affairs
                            </span>
                            <h1 className="text-sm font-black tracking-tight text-slate-800 uppercase">
                                Stay Updated
                            </h1>
                        </div>
                    </div>
                </header>

                <div className="max-w-2xl mx-auto px-4 mt-8">
                    <h2 className="text-xl font-black text-slate-900 mb-1">Choose a Category</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        {TOTAL_QUESTIONS} verified questions, {TIMER_SECONDS / 60} minutes. Hindi & English both available.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableSubjects.map((subject) => (
                            <button
                                key={subject}
                                onClick={() => startQuizForSubject(subject)}
                                className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
                            >
                                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Newspaper size={18} />
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
                    Saving your results...
                </p>
            </div>
        );
    }

    if (phase === "result") {
        if (error) {
            return (
                <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-200">
                        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            ⚠️
                        </div>
                        <p className="text-rose-600 font-bold text-sm">{error}</p>
                        <button
                            onClick={() => router.push("/")}
                            className="mt-5 w-full bg-slate-900 text-white h-12 rounded-xl font-bold text-sm"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </main>
            );
        }

        const total = questions.length;
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-xl border border-slate-200">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Award size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Test Completed! 🎉</h1>
                    <p className="text-slate-500 text-sm mb-1">{selectedSubject}</p>
                    <p className="text-slate-400 text-xs mb-6">Here is your performance breakdown.</p>

                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-xs text-slate-400 font-bold uppercase block">Total Qs</span>
                            <span className="text-xl font-black text-slate-900">{total}</span>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                            <span className="text-xs text-emerald-600 font-bold uppercase block">Score</span>
                            <span className="text-xl font-black text-emerald-700">{score}</span>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <span className="text-xs text-blue-600 font-bold uppercase block">Accuracy</span>
                            <span className="text-xl font-black text-blue-700">{percentage}%</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push("/")}
                            className="flex-1 bg-slate-900 text-white h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition"
                        >
                            <Home size={16} /> Dashboard
                        </button>
                        <button
                            onClick={handleRetry}
                            className="flex-1 bg-blue-600 text-white h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 transition"
                        >
                            <RotateCcw size={16} /> Try Another
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // QUIZ SCREEN
    const currentQ = questions[currentIndex];
    const userSelectedOpt = selectedAnswers[currentIndex];
    const hasAnswered = userSelectedOpt !== undefined;

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-20 font-sans">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPhase("subject-select")}
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition flex-shrink-0"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">{selectedSubject}</h1>
                            <p className="text-xs text-slate-500 font-medium">Question {currentIndex + 1} of {questions.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-mono font-bold text-sm shadow-md">
                        <Timer size={16} className="text-amber-400 animate-pulse" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                </div>
                <div className="h-1 w-full bg-slate-100">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-8">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">

                    {/* BILINGUAL QUESTION */}
                    <div className="mb-6 space-y-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                            {currentIndex + 1}. {currentQ.questionEn}
                        </h2>
                        {currentQ.questionHi && (
                            <h2 className="text-base sm:text-lg font-semibold text-slate-600 leading-relaxed border-t border-dashed border-slate-100 pt-3 font-hindi">
                                {currentQ.questionHi}
                            </h2>
                        )}
                    </div>

                    {/* BILINGUAL OPTIONS */}
                    <div className="space-y-3 mb-8">
                        {currentQ.optionsEn.map((optEn, idx) => {
                            const optHi = currentQ.optionsHi?.[idx] || "";
                            const isCorrect = optEn === currentQ.answer;
                            const isSelected = userSelectedOpt === optEn;

                            let optionStyle = "border-slate-200 hover:border-blue-500 bg-white text-slate-700";

                            if (hasAnswered) {
                                if (isCorrect) {
                                    optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                                } else if (isSelected) {
                                    optionStyle = "border-rose-500 bg-rose-50 text-rose-900 font-bold";
                                } else {
                                    optionStyle = "border-slate-200 opacity-60 bg-slate-50";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    disabled={hasAnswered}
                                    onClick={() => handleOptionSelect(optEn)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 text-sm sm:text-base ${optionStyle}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <span className="block">{optEn}</span>
                                        {optHi && <span className="block text-xs sm:text-sm font-medium opacity-80 mt-0.5 font-hindi">{optHi}</span>}
                                    </div>
                                    {hasAnswered && isCorrect && <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />}
                                    {hasAnswered && isSelected && !isCorrect && <XCircle size={20} className="text-rose-600 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* EXPLANATION */}
                    {hasAnswered && (currentQ.explanationEn || currentQ.explanationHi) && (
                        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 mb-8 animate-in fade-in duration-300">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
                                <BookOpen size={12} /> Explanation
                            </h4>
                            {currentQ.explanationEn && <p className="text-slate-700 text-sm leading-relaxed mb-1.5">{currentQ.explanationEn}</p>}
                            {currentQ.explanationHi && <p className="text-slate-600 text-sm leading-relaxed font-hindi border-t border-blue-100 pt-1.5">{currentQ.explanationHi}</p>}
                        </div>
                    )}

                    {/* NAVIGATION */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm disabled:opacity-40 hover:bg-slate-50 transition"
                        >
                            Previous
                        </button>

                        {currentIndex < questions.length - 1 ? (
                            <button
                                onClick={() => setCurrentIndex((prev) => prev + 1)}
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition shadow-md"
                            >
                                Next <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitTest}
                                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-500 transition shadow-md"
                            >
                                Submit Test <CheckCircle2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}