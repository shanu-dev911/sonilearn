export const dynamic = 'force-dynamic';

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock3, Flame, Trophy, CheckCircle2, XCircle, BookOpen, RotateCcw } from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";

// =========================
// TYPES
// =========================

type Question = {
  id: string;
  questionEn: string;
  questionHi: string;
  optionsEn: string[];
  optionsHi: string[];
  options: string[];
  answer: string;
  explanationEn?: string;
  explanationHi?: string;
  topic?: string;
  exam?: string;
};

const normalizeExamToDBFormat = (exam: string): string => {
  return exam
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
};

export default function FastTestPage() {
  const router = useRouter();
  const [user, authLoading, authError] = useAuthState(auth);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [targetExam, setTargetExam] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wrongQuestionTracker, setWrongQuestionTracker] = useState<Question[]>([]);

  // =========================
  // LOAD TARGET EXAM
  // =========================
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("Please log in to access the fast test.");
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setError("User profile not found. Please set up your profile.");
          setQuestions([]);
          setTargetExam(null);
          setLoading(false);
          return;
        }

        const userData = docSnap.data();
        const exam = userData?.targetExam?.trim();
        if (!exam) {
          setError("Target exam not set. Please update your profile with your target exam.");
          setQuestions([]);
          setTargetExam(null);
          setLoading(false);
          return;
        }

        setTargetExam(exam);
        setError("");
      },
      (error) => {
        setError("Unable to load your profile. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, authError]);

  // =========================
  // LOAD QUESTIONS
  // =========================
  useEffect(() => {
    if (!targetExam || authLoading || !user) return;

    const loadQuestionsFromFirebase = async () => {
      try {
        setLoading(true);
        setError("");
        setQuestions([]);
        setCurrentQuestion(0);
        setSelectedOption(null);
        setScore(0);
        setFinished(false);
        setWrongQuestionTracker([]);

        const questionsRef = collection(db, "questions");
        let loadedQuestions: Question[] = [];
        const normalizedExam = normalizeExamToDBFormat(targetExam);

        try {
          const q = query(questionsRef, where("exam", "==", normalizedExam), limit(25));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.size > 0) {
            querySnapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.questionEn && data.optionA && data.optionB && data.answer) {
                const correctAnswer = data[`option${data.answer}`] || "";
                const optionsEn = [data.optionA, data.optionB, data.optionC, data.optionD].filter(Boolean);
                const optionsHi = [
                  data.optionAHi || data.optionA,
                  data.optionBHi || data.optionB,
                  data.optionCHi || data.optionC,
                  data.optionDHi || data.optionD,
                ].filter(Boolean);

                loadedQuestions.push({
                  id: docSnap.id,
                  questionEn: data.questionEn,
                  questionHi: data.questionHi || "",
                  optionsEn,
                  optionsHi,
                  options: optionsEn,
                  answer: correctAnswer,
                  explanationEn: data.explanationEn || "",
                  explanationHi: data.explanationHi || "",
                  topic: data.subject || data.topic || "General Assessment",
                  exam: data.exam,
                });
              }
            });
          }
        } catch (queryError) {
          console.warn("Query failed, fallback execution sequence activated.");
        }

        // Fallback Filter Mechanism
        if (loadedQuestions.length === 0) {
          const allQuestionsSnapshot = await getDocs(query(questionsRef, limit(200)));
          allQuestionsSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const dbExamNormalized = normalizeExamToDBFormat(data.exam || "");

            if (dbExamNormalized === normalizedExam && data.questionEn && data.optionA && data.optionB && data.answer) {
              const correctAnswer = data[`option${data.answer}`] || "";
              const optionsEn = [data.optionA, data.optionB, data.optionC, data.optionD].filter(Boolean);
              const optionsHi = [
                data.optionAHi || data.optionA,
                data.optionBHi || data.optionB,
                data.optionCHi || data.optionC,
                data.optionDHi || data.optionD,
              ].filter(Boolean);

              loadedQuestions.push({
                id: docSnap.id,
                questionEn: data.questionEn,
                questionHi: data.questionHi || "",
                optionsEn,
                optionsHi,
                options: optionsEn,
                answer: correctAnswer,
                explanationEn: data.explanationEn || "",
                explanationHi: data.explanationHi || "",
                topic: data.subject || data.topic || "General Assessment",
                exam: data.exam,
              });
            }
          });
        }

        if (loadedQuestions.length === 0) {
          setError(`No questions currently available for ${targetExam}. Verify repository.`);
          setQuestions([]);
          return;
        }

        setQuestions(loadedQuestions.sort(() => Math.random() - 0.5).slice(0, 15));
      } catch (err) {
        setError("Failed to resolve technical cluster questions mapping.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestionsFromFirebase();
  }, [targetExam, user, authLoading]);

  // =========================
  // RECORD WRONG ENTRIES DIRECT TO WEAK HOOK
  // =========================
  const processFailureSyncTelemetry = async (failedNodes: Question[]) => {
    if (!user || failedNodes.length === 0) return;
    try {
      const weakRef = collection(db, "weak_questions");
      const submissionPromises = failedNodes.map((q) => {
        return addDoc(weakRef, {
          userId: user.uid,
          questionEn: q.questionEn,
          questionHi: q.questionHi,
          optionsEn: q.optionsEn,
          optionsHi: q.optionsHi,
          correctAnswer: q.answer,
          topic: q.topic,
          timestamp: new Date()
        });
      });
      await Promise.all(submissionPromises);
    } catch (e) {
      console.error("Telemetry failure transaction error:", e);
    }
  };

  const handleAnswer = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);

    const activeQ = questions[currentQuestion];
    if (option === activeQ.answer) {
      setScore((prev) => prev + 1);
    } else {
      setWrongQuestionTracker((prev) => [...prev, activeQ]);
    }
  };

  const handleNext = async () => {
    if (!selectedOption) return;

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsSubmitting(true);
      await processFailureSyncTelemetry(wrongQuestionTracker);
      setIsSubmitting(false);
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setFinished(false);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption(null);
    setWrongQuestionTracker([]);
  };

  if (loading || authLoading || isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            {isSubmitting ? "Syncing Weak Assessment Telemetry..." : "Assembling Fast Test Matrix..."}
          </p>
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
        <div className="w-full max-w-md bg-white border rounded-3xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4">⚠️</div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Initialization Blocked</h1>
          <p className="text-slate-400 text-xs mt-2 mb-6 font-medium leading-relaxed">{error}</p>
          <button onClick={() => router.back()} className="w-full bg-slate-900 text-white font-bold h-11 text-xs rounded-xl uppercase tracking-wider shadow-sm">Return Dashboard</button>
        </div>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-100">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl mx-auto mb-3 border border-blue-100 shadow-sm">🎉</div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Assessment Concluded</h1>
            <p className="text-slate-400 text-xs mt-0.5 font-bold uppercase tracking-wider">Fast Evaluation Profile Sync Complete</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 mb-6 text-center border border-slate-200/60">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Diagnostic Metrics</span>
            <div className="text-5xl font-black text-blue-600 tracking-tight mt-1">{score}/{questions.length}</div>
            <div className="text-base font-bold text-slate-600 mt-1">{percentage}% Performance Ratio</div>
          </div>

          {wrongQuestionTracker.length > 0 && (
            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 mb-6 text-center text-rose-800 text-[11px] font-semibold leading-relaxed">
              ⚠️ {wrongQuestionTracker.length} incorrect answers recorded. Syncing items directly to your <span className="font-bold underline">Weak Practice Node</span>.
            </div>
          )}

          <div className="space-y-2.5">
            <button onClick={handleRestart} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 text-xs rounded-xl uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5"><RotateCcw size={14} /> Re-Initialize Stream</button>
            <button onClick={() => router.push("/")} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold h-12 text-xs rounded-xl uppercase tracking-wider transition-all">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const answerDisabled = selectedOption !== null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 antialiased text-slate-900">

      {/* APP HEADER */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs font-bold uppercase tracking-wider"><ArrowLeft size={16} /> Quit</button>
          <div className="text-center">
            <span className="text-[9px] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-blue-600 font-black tracking-widest uppercase block w-max mx-auto">{targetExam}</span>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight mt-1">Item {currentQuestion + 1} / {questions.length}</h1>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Score</span>
            <span className="text-base font-black text-blue-600 tracking-tight block mt-0.5">{score}</span>
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} /></div>
      </header>

      {/* COMPONENT BODY */}
      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-4">

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center mb-5"><span className="bg-slate-50 border text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide">Category: {currentQ?.topic}</span></div>

          {/* QUESTION BOX */}
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-bold leading-relaxed text-slate-800 tracking-tight">{currentQ.questionEn}</h2>
            {currentQ.questionHi && <h2 className="text-lg font-semibold leading-relaxed text-slate-600 border-t border-dashed border-slate-100 pt-3 font-hindi">{currentQ.questionHi}</h2>}
          </div>

          {/* OPTIONS SELECTION GRID */}
          <div className="space-y-3">
            {currentQ.optionsEn.map((optionEn, index) => {
              const optionHi = currentQ.optionsHi?.[index] || "";
              const isCorrect = optionEn === currentQ.answer;
              const isSelected = selectedOption === optionEn;

              let btnStyle = "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40 text-slate-800";
              let badgeStyle = "bg-slate-100 text-slate-500";

              if (answerDisabled) {
                if (isCorrect) {
                  btnStyle = "border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-sm";
                  badgeStyle = "bg-emerald-600 text-white";
                } else if (isSelected) {
                  btnStyle = "border-rose-500 bg-rose-50/60 text-rose-900";
                  badgeStyle = "bg-rose-500 text-white";
                } else {
                  btnStyle = "border-slate-100 bg-slate-50/30 text-slate-400 opacity-60";
                  badgeStyle = "bg-slate-100 text-slate-400";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(optionEn)}
                  disabled={answerDisabled}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 flex items-center justify-between group ${btnStyle}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs transition-all flex-shrink-0 ${badgeStyle}`}>{String.fromCharCode(65 + index)}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold block">{optionEn}</span>
                      {optionHi && <span className="text-xs font-medium block text-slate-500 mt-0.5 font-hindi">{optionHi}</span>}
                    </div>
                  </div>

                  {answerDisabled && isCorrect && <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded flex items-center gap-1 ml-2"><CheckCircle2 size={11} /> Correct</span>}
                  {answerDisabled && isSelected && !isCorrect && <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded flex items-center gap-1 ml-2"><XCircle size={11} /> Inaccurate</span>}
                </button>
              );
            })}
          </div>

          {/* RATIO SOLUTION WINDOW */}
          {answerDisabled && (currentQ.explanationEn || currentQ.explanationHi) && (
            <div className={`mt-6 rounded-2xl p-4 border text-xs leading-relaxed ${selectedOption === currentQ.answer ? "bg-blue-50/60 border-blue-100 text-blue-900" : "bg-amber-50/60 border-amber-100 text-amber-900"}`}>
              <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[10px] text-slate-400 mb-2"><BookOpen size={12} /> Solution Explanation / व्याख्या</div>
              {currentQ.explanationEn && <p className="font-bold text-slate-700 block mb-1.5">{currentQ.explanationEn}</p>}
              {currentQ.explanationHi && <p className="font-medium text-slate-600 block border-t border-slate-200/40 pt-1.5 font-hindi">{currentQ.explanationHi}</p>}
            </div>
          )}

          {/* ACTIONS HUB ENTRY */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className={`w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${selectedOption ? "bg-slate-900 hover:bg-slate-800 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"}`}
            >
              {currentQuestion + 1 === questions.length ? "✓ Terminate & Submit" : "Advance Node →"}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}