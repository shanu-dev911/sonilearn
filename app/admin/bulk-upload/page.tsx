"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { db } from "@/lib/firebase-client";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { UploadCloud, CheckCircle2, XCircle, Loader2, Eye, Pencil } from "lucide-react";

function shuffleOptions(array: string[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function BulkUploadPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [skipped, setSkipped] = useState(0);
  const [duplicates, setDuplicates] = useState(0);
  const [currentExamCount, setCurrentExamCount] = useState<number | null>(null);
  const [currentExamName, setCurrentExamName] = useState("");

  const [subjectUploadedThisBatch, setSubjectUploadedThisBatch] = useState<Record<string, number>>({});
  const [subjectTotalInDb, setSubjectTotalInDb] = useState<Record<string, number>>({});

  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // 🎯 STEP 1 — PARSE & PREVIEW
  const handlePreview = () => {
    setError("");
    setDone(false);

    let questions: any[] = [];
    try {
      questions = JSON.parse(jsonInput);
    } catch (e) {
      setError("❌ Invalid JSON — check formatting, commas, brackets.");
      return;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      setError("❌ Array khali hai ya format galat hai.");
      return;
    }

    setParsedQuestions(questions);
    setPreviewMode(true);
  };

  // 🎯 EDIT ANSWER IN PREVIEW
  const handleAnswerChange = (index: number, newAnswer: string) => {
    const updated = [...parsedQuestions];
    updated[index] = { ...updated[index], answer: newAnswer };
    setParsedQuestions(updated);
  };

  // 🎯 EDIT ANY TEXT FIELD IN PREVIEW (question/options)
  const handleFieldChange = (index: number, field: string, value: string) => {
    const updated = [...parsedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setParsedQuestions(updated);
  };

  // 🎯 STEP 2 — CONFIRM & UPLOAD (after verification)
  const handleConfirmUpload = async () => {
    const questions = parsedQuestions;

    setUploading(true);
    setPreviewMode(false);
    setProgress({ done: 0, total: questions.length });

    let uploadCount = 0;
    let skipCount = 0;
    let dupCount = 0;
    let examName = questions[0]?.exam || "";
    setCurrentExamName(examName);

    const subjectBatchCounts: Record<string, number> = {};
    const subjectsSeen = new Set<string>();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.questionEn || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.answer) {
        skipCount++;
        setProgress({ done: i + 1, total: questions.length });
        continue;
      }

      const subjectKey = q.subject || "Unknown";
      subjectsSeen.add(subjectKey);

      try {
        const dupQuery = query(
          collection(db, "questions"),
          where("exam", "==", q.exam),
          where("questionEn", "==", q.questionEn)
        );
        const dupSnap = await getDocs(dupQuery);

        if (!dupSnap.empty) {
          dupCount++;
          setProgress({ done: i + 1, total: questions.length });
          continue;
        }
      } catch (e) {
        console.log("Duplicate check error:", e);
      }

      let realCorrectAnswerText = "";
      if (q.answer === "A") realCorrectAnswerText = q.optionA;
      else if (q.answer === "B") realCorrectAnswerText = q.optionB;
      else if (q.answer === "C") realCorrectAnswerText = q.optionC;
      else if (q.answer === "D") realCorrectAnswerText = q.optionD;
      if (!realCorrectAnswerText) realCorrectAnswerText = q.optionA;

      const optionsPool = [q.optionA, q.optionB, q.optionC, q.optionD];
      const randomizedOptions = shuffleOptions(optionsPool);

      const sanitized = {
        ...q,
        optionA: randomizedOptions[0],
        optionB: randomizedOptions[1],
        optionC: randomizedOptions[2],
        optionD: randomizedOptions[3],
        answer: "A",
      };

      if (sanitized.optionA === realCorrectAnswerText) sanitized.answer = "A";
      else if (sanitized.optionB === realCorrectAnswerText) sanitized.answer = "B";
      else if (sanitized.optionC === realCorrectAnswerText) sanitized.answer = "C";
      else if (sanitized.optionD === realCorrectAnswerText) sanitized.answer = "D";

      const uniqueDocId = `q_bulk_${Date.now()}_idx_${i}_${Math.random().toString(36).substr(2, 5)}`;
      const docRef = doc(db, "questions", uniqueDocId);

      try {
        await setDoc(docRef, {
          ...sanitized,
          createdAt: new Date().toISOString(),
        });
        uploadCount++;
        subjectBatchCounts[subjectKey] = (subjectBatchCounts[subjectKey] || 0) + 1;
      } catch (e) {
        console.log("Upload error for question", i, e);
        skipCount++;
      }

      setProgress({ done: i + 1, total: questions.length });
    }

    setSkipped(skipCount);
    setDuplicates(dupCount);
    setSubjectUploadedThisBatch(subjectBatchCounts);

    try {
      const countQuery = query(collection(db, "questions"), where("exam", "==", examName));
      const countSnap = await getDocs(countQuery);
      setCurrentExamCount(countSnap.size);
    } catch (e) {
      console.log("Count fetch error:", e);
    }

    try {
      const subjectTotals: Record<string, number> = {};
      for (const subj of Array.from(subjectsSeen)) {
        const subjQuery = query(
          collection(db, "questions"),
          where("exam", "==", examName),
          where("subject", "==", subj)
        );
        const subjSnap = await getDocs(subjQuery);
        subjectTotals[subj] = subjSnap.size;
      }
      setSubjectTotalInDb(subjectTotals);
    } catch (e) {
      console.log("Subject count fetch error:", e);
    }

    setUploading(false);
    setDone(true);
    setJsonInput("");
    setParsedQuestions([]);
  };

  const handleBackToEdit = () => {
    setPreviewMode(false);
  };

  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  // ==========================================
  // 🎯 PREVIEW MODE UI
  // ==========================================
  if (previewMode) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Eye size={22} className="text-blue-600" /> Preview & Verify
            </h1>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            {parsedQuestions.length} questions mile. Answer galat lage to niche se badal do, phir Confirm & Upload dabao.
          </p>

          <div className="space-y-4 mb-6">
            {parsedQuestions.map((q, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Q{index + 1} • {q.subject || "No Subject"}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                    {q.exam}
                  </span>
                </div>

                <textarea
                  value={q.questionEn || ""}
                  onChange={(e) => handleFieldChange(index, "questionEn", e.target.value)}
                  rows={2}
                  className="w-full text-sm font-semibold text-slate-800 border border-slate-200 rounded-xl p-2.5 mb-3 outline-none focus:border-blue-400 resize-none"
                />

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {["A", "B", "C", "D"].map((opt) => {
                    const fieldName = `option${opt}`;
                    const isCorrect = q.answer === opt;
                    return (
                      <div
                        key={opt}
                        className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${
                          isCorrect ? "border-emerald-400 bg-emerald-50" : "border-slate-200"
                        }`}
                      >
                        <span className={`text-xs font-black ${isCorrect ? "text-emerald-600" : "text-slate-400"}`}>
                          {opt}
                        </span>
                        <input
                          value={q[fieldName] || ""}
                          onChange={(e) => handleFieldChange(index, fieldName, e.target.value)}
                          className="flex-1 text-xs font-medium bg-transparent outline-none text-slate-700"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Pencil size={12} /> Correct Answer:
                  </label>
                  <select
                    value={q.answer || "A"}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 sticky bottom-4">
            <button
              onClick={handleBackToEdit}
              className="flex-1 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm shadow-sm"
            >
              ← Back to Edit JSON
            </button>
            <button
              onClick={handleConfirmUpload}
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Confirm & Upload ({parsedQuestions.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🎯 DEFAULT MODE UI (Paste JSON + Upload progress)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-slate-900 mb-1">📤 Bulk Question Upload</h1>
        <p className="text-slate-500 text-sm mb-6">JSON array paste karo neeche, aur Preview dabao verify karne ke liye.</p>

        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='[ { "exam": "RRB_Paramedical", "subject": "General Knowledge", ... } ]'
          rows={12}
          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-700 outline-none focus:border-blue-400 transition resize-none shadow-sm"
          disabled={uploading}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl p-3 mt-3 flex items-center gap-2">
            <XCircle size={16} /> {error}
          </div>
        )}

        {!uploading && (
          <button
            onClick={handlePreview}
            disabled={!jsonInput.trim()}
            className={`w-full mt-4 flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm text-white transition-all ${
              !jsonInput.trim()
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Eye size={16} /> Preview & Verify Questions
          </button>
        )}

        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-sm mb-2">
              <Loader2 size={16} className="animate-spin" /> Uploading {progress.done}/{progress.total}...
            </div>
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-200"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1 text-center">{percent}%</p>
          </div>
        )}

        {done && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 font-black mb-3">
              <CheckCircle2 size={18} /> Upload Complete!
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="bg-emerald-50 rounded-xl p-3">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Uploaded</span>
                <span className="text-xl font-black text-emerald-700">{progress.total - skipped - duplicates}</span>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <span className="text-[10px] text-amber-600 font-bold uppercase block">Duplicates Skipped</span>
                <span className="text-xl font-black text-amber-700">{duplicates}</span>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <span className="text-[10px] text-red-600 font-bold uppercase block">Invalid Skipped</span>
                <span className="text-xl font-black text-red-700">{skipped}</span>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <span className="text-[10px] text-blue-600 font-bold uppercase block">Total in "{currentExamName}"</span>
                <span className="text-xl font-black text-blue-700">
                  {currentExamCount !== null ? currentExamCount : "..."}
                </span>
              </div>
            </div>

            {Object.keys(subjectUploadedThisBatch).length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                  📚 Subject-wise Breakdown
                </h3>
                <div className="space-y-2">
                  {Object.entries(subjectUploadedThisBatch).map(([subject, count]) => (
                    <div
                      key={subject}
                      className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5"
                    >
                      <span className="text-sm font-bold text-slate-700">{subject}</span>
                      <div className="text-right">
                        <span className="text-xs text-emerald-600 font-black">+{count} uploaded</span>
                        <span className="text-xs text-slate-400 mx-1.5">|</span>
                        <span className="text-xs text-blue-600 font-black">
                          {subjectTotalInDb[subject] ?? "..."} total
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}