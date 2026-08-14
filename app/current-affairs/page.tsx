"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Timer, CheckCircle2, XCircle, ArrowRight, RotateCcw, Home, Award } from "lucide-react";

// 🎯 Bilingual Mock Questions Data (Hindi & English)
const CURRENT_AFFAIRS_QUESTIONS = [
    {
        id: 1,
        question: "Which country recently launched the world's first commercial wooden satellite?\nकिस देश ने हाल ही में दुनिया का पहला व्यावसायिक लकड़ी का उपग्रह लॉन्च किया है?",
        options: [
            "Japan / जापान",
            "United States / संयुक्त राज्य अमेरिका",
            "India / भारत",
            "Germany / जर्मनी"
        ],
        correctAnswer: 0,
        explanation: "English: Japan launched LignoSat, the world's first wooden satellite.\nHindi: जापान ने दुनिया का पहला लकड़ी का उपग्रह 'लिग्नोसैट' लॉन्च किया है।"
    },
    {
        id: 2,
        question: "What is the primary objective of India's Gaganyaan mission?\nभारत के गगनयान मिशन का मुख्य उद्देश्य क्या है?",
        options: [
            "Mars Orbiter Landing / मंगल ग्रह पर लैंडिंग",
            "Human Spaceflight to Low Earth Orbit / कम पृथ्वी की कक्षा में मानव अंतरिक्ष उड़ान",
            "Lunar South Pole Exploration / चंद्रमा के दक्षिणी ध्रुव की खोज",
            "Solar Corona Study / सौर कोरोना अध्ययन"
        ],
        correctAnswer: 1,
        explanation: "English: Gaganyaan is India's first human spaceflight mission to low Earth orbit.\nHindi: गगनयान भारत का पहला मानव अंतरिक्ष उड़ान मिशन है जो अंतरिक्ष यात्रियों को पृथ्वी की निचली कक्षा में भेजेगा।"
    },
    {
        id: 3,
        question: "Which city hosted the Summer Olympic Games?\nग्रीष्मकालीन ओलंपिक खेलों की मेजबानी किस शहर ने की थी?",
        options: [
            "Tokyo / टोक्यो",
            "Paris / पेरिस",
            "Los Angeles / लॉस एंजिल्स",
            "Brisbane / ब्रिस्बेन"
        ],
        correctAnswer: 1,
        explanation: "English: Paris, France hosted the Summer Olympic Games.\nHindi: पेरिस, फ्रांस ने ग्रीष्मकालीन ओलंपिक खेलों की मेजबानी की थी।"
    }
];

export default function CurrentAffairsTest() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
    const [showResults, setShowResults] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 Minutes
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (showResults || isSubmitted) return;

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
    }, [showResults, isSubmitted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (optionIndex: number) => {
        if (selectedAnswers[currentIndex] !== undefined) return;
        setSelectedAnswers({
            ...selectedAnswers,
            [currentIndex]: optionIndex
        });
    };

    const handleSubmitTest = () => {
        setIsSubmitted(true);
        setShowResults(true);
    };

    const currentQ = CURRENT_AFFAIRS_QUESTIONS[currentIndex];
    const userSelectedOpt = selectedAnswers[currentIndex];
    const hasAnswered = userSelectedOpt !== undefined;

    const calculateScore = () => {
        let score = 0;
        CURRENT_AFFAIRS_QUESTIONS.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.correctAnswer) {
                score += 1;
            }
        });
        return score;
    };

    if (showResults) {
        const score = calculateScore();
        const total = CURRENT_AFFAIRS_QUESTIONS.length;
        const percentage = Math.round((score / total) * 100);

        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-xl border border-slate-200">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Award size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Test Completed! / परीक्षा समाप्त! 🎉</h1>
                    <p className="text-slate-500 text-sm mb-6">Here is your performance breakdown.</p>

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
                            onClick={() => {
                                setSelectedAnswers({});
                                setShowResults(false);
                                setIsSubmitted(false);
                                setTimeLeft(30 * 60);
                                setCurrentIndex(0);
                            }}
                            className="flex-1 bg-blue-600 text-white h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 transition"
                        >
                            <RotateCcw size={16} /> Retry Test
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-20 font-sans">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Current Affairs (ससामयिक)</h1>
                        <p className="text-xs text-slate-500 font-medium">Question {currentIndex + 1} of {CURRENT_AFFAIRS_QUESTIONS.length}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-mono font-bold text-sm shadow-md">
                        <Timer size={16} className="text-amber-400 animate-pulse" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-8">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-6 leading-relaxed whitespace-pre-line">
                        {currentIndex + 1}. {currentQ.question}
                    </h2>

                    <div className="space-y-3 mb-8">
                        {currentQ.options.map((option, idx) => {
                            let optionStyle = "border-slate-200 hover:border-blue-500 bg-white text-slate-700";

                            if (hasAnswered) {
                                if (idx === currentQ.correctAnswer) {
                                    optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                                } else if (idx === userSelectedOpt) {
                                    optionStyle = "border-rose-500 bg-rose-50 text-rose-900 font-bold";
                                } else {
                                    optionStyle = "border-slate-200 opacity-60 bg-slate-50";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    disabled={hasAnswered}
                                    onClick={() => handleOptionSelect(idx)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-sm sm:text-base ${optionStyle}`}
                                >
                                    <span>{option}</span>
                                    {hasAnswered && idx === currentQ.correctAnswer && <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />}
                                    {hasAnswered && idx === userSelectedOpt && idx !== currentQ.correctAnswer && <XCircle size={20} className="text-rose-600 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>

                    {hasAnswered && (
                        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 mb-8 animate-in fade-in duration-300">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">Explanation / स्पष्टीकरण</h4>
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{currentQ.explanation}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm disabled:opacity-40 hover:bg-slate-50 transition"
                        >
                            Previous
                        </button>

                        {currentIndex < CURRENT_AFFAIRS_QUESTIONS.length - 1 ? (
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