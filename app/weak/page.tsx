export const dynamic = 'force-dynamic';

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase-client";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RotateCcw,
  Award,
  Zap
} from "lucide-react";

type Question = {
  id: string;
  questionEn: string;
  questionHi: string;
  optionsEn: string[]; // Strict English Options Array
  optionsHi: string[]; // Strict Hindi Options Array
  correctAnswer: string; // Database mapped answer key/text
  explanationEn?: string;
  explanationHi?: string;
  topic?: string;
};

type Status = "idle" | "correct" | "wrong";

export default function WeakPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(true);
  const [mastered, setMastered] = useState(0);

  // LOAD SYNCHRONIZED WEAK QUESTIONS FROM USER SESSION
  useEffect(() => {
    async function loadQuestions() {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          router.push("/login");
          return;
        }

        // Fast Test aur Daily Challenge ke saare galat questions yahan fetch honge
        const q = query(
          collection(db, "weak_questions"),
          where("userId", "==", user.uid)
        );

        const snap = await getDocs(q);
        let arr: Question[] = [];

        snap.forEach((d) => {
          const data = d.data();

          // Bilingual Text Elements Parsing
          const qEn = data.questionEn || data.question || "";
          const qHi = data.questionHi || data.questionHindi || "";

          // Bilingual Options Mapping (Fallback agar database mein nested na ho)
          const optsEn = data.optionsEn || data.options || [];
          const optsHi = data.optionsHi || data.optionsHindi || [];

          arr.push({
            id: d.id,
            questionEn: qEn,
            questionHi: qHi,
            optionsEn: optsEn,
            optionsHi: optsHi,
            correctAnswer: data.correctAnswer || data.answer || "",
            explanationEn: data.explanationEn || data.explanation || "",
            explanationHi: data.explanationHi || data.explanationHindi || "",
            topic: data.topic || "General Assessment",
          });
        });

        setQuestions(arr);
      } catch (error) {
        console.error("Telemetry pipeline error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [router]);

  const resetQuestion = () => {
    setSelected("");
    setStatus("idle");
  };

  const selectAnswer = (option: string) => {
    if (status === "correct") return;
    setSelected(option);

    if (option === questions[current].correctAnswer) {
      setStatus("correct");
    } else {
      setStatus("wrong");
    }
  };

  const handleMastered = async () => {
    try {
      const q = questions[current];
      await deleteDoc(doc(db, "weak_questions", q.id));

      const updated = questions.filter((_, index) => index !== current);
      setQuestions(updated);
      setMastered((prev) => prev + 1);
      resetQuestion();

      if (current >= updated.length) {
        setCurrent(Math.max(updated.length - 1, 0));
      }
    } catch (error) {
      console.error("Error committing node deployment:", error);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Parsing Deficiencies Index...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5 border border-emerald-100">🎉</div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">List Cleared!</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">
            Daily Challenge aur Fast Test ke saare kamzor sawaal aapne sahi solve karke master kar liye hain!
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-6 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Solved Today</span>
            <h2 className="text-3xl font-black text-emerald-600">{mastered}</h2>
          </div>
          <button onClick={() => router.push("/daily")} className="w-full mt-6 bg-slate-900 text-white h-12 rounded-xl font-bold text-xs uppercase tracking-wider">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 antialiased text-slate-900">

      {/* HEADER INTERFACE */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">SoniLearn Adaptive Engine</span>
            <h1 className="text-sm font-black tracking-tight text-slate-800 uppercase mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Weak Error Remediation
            </h1>
          </div>
          <div className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] font-black uppercase tracking-wider block text-rose-400">Total Errors</span>
            <span className="text-base font-black block tracking-tight mt-0.5">{questions.length} Questions</span>
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100"><div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-4">

        <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3 flex items-center justify-between shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item index: {current + 1} / {questions.length}</span>
          <span className="text-xs font-black text-emerald-600 flex items-center gap-1"><Award size={14} /> {mastered} Mastered</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <span className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide inline-flex items-center gap-1 mb-5"><Zap size={11} /> Topic: {q.topic}</span>

          {/* 🎯 BILINGUAL QUESTION ZONE */}
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-bold leading-relaxed text-slate-800 tracking-tight">{q.questionEn}</h2>
            {q.questionHi && <h2 className="text-lg font-semibold leading-relaxed text-slate-600 border-t border-dashed border-slate-100 pt-3 font-hindi">{q.questionHi}</h2>}
          </div>

          {/* 🎯 BILINGUAL OPTIONS INTEGRATION GRID */}
          <div className="space-y-3">
            {q.optionsEn.map((optionEn, index) => {
              const optionHi = q.optionsHi?.[index] || ""; // Parallel Hindi option node index check
              const isCorrect = optionEn === q.correctAnswer || optionHi === q.correctAnswer;
              const isSelected = selected === optionEn || selected === optionHi;

              return (
                <button
                  key={index}
                  onClick={() => selectAnswer(optionEn)}
                  disabled={status === "correct"}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 flex items-center justify-between group ${isCorrect && status !== "idle"
                      ? "border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-sm"
                      : isSelected && status === "wrong"
                        ? "border-rose-500 bg-rose-50/60 text-rose-900"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40 text-slate-800"
                    }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs transition-all flex-shrink-0 ${isCorrect && status !== "idle" ? "bg-emerald-600 text-white" : isSelected && status === "wrong" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500"
                      }`}>{String.fromCharCode(65 + index)}</div>

                    {/* Render standard English option + Hindi subtitle translation variant side by side inside option element */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold block text-slate-800">{optionEn}</span>
                      {optionHi && <span className="text-xs font-medium block text-slate-500 mt-0.5 font-hindi">{optionHi}</span>}
                    </div>
                  </div>

                  {isCorrect && status !== "idle" && <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0 ml-2"><CheckCircle2 size={11} /> Correct</span>}
                  {isSelected && status === "wrong" && <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0 ml-2"><XCircle size={11} /> Wrong</span>}
                </button>
              );
            })}
          </div>

          {/* 🎯 BILINGUAL EXPLANATION WINDOW */}
          {status !== "idle" && (
            <div className={`mt-6 rounded-2xl p-4 border text-xs leading-relaxed ${status === "correct" ? "bg-blue-50/60 border-blue-100 text-blue-900" : "bg-amber-50/60 border-amber-100 text-amber-900"}`}>
              <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[10px] text-slate-400 mb-2"><BookOpen size={12} /> Solution Explanation / व्याख्या</div>
              {q.explanationEn && <p className="font-bold text-slate-700 block mb-1.5">{q.explanationEn}</p>}
              {q.explanationHi && <p className="font-medium text-slate-600 block border-t border-slate-200/40 pt-1.5 font-hindi">{q.explanationHi}</p>}
            </div>
          )}

          {/* SYSTEM OPERATIONS TRIGGER */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            {status === "correct" ? (
              <button onClick={handleMastered} className="w-full bg-emerald-900 hover:bg-emerald-800 text-white h-12 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">✓ Mark as Mastered & Save</button>
            ) : status === "wrong" ? (
              <button onClick={resetQuestion} className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"><RotateCcw size={14} /> Try This Node Again</button>
            ) : (
              <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-wider py-2">Select the verified correct option mapping</div>
            )}
          </div>
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={prevQuestion} disabled={current === 0} className="h-11 rounded-xl bg-white border border-slate-200/80 text-slate-600 text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-40"><ChevronLeft size={14} /> Back</button>
          <button onClick={nextQuestion} disabled={current === questions.length - 1} className="h-11 rounded-xl bg-white border border-slate-200/80 text-slate-600 text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-40">Skip Node <ChevronRight size={14} /></button>
        </div>
      </main>
    </div>
  );
}