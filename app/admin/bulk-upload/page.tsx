"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { db } from "@/lib/firebase-client";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { UploadCloud, CheckCircle2, XCircle, Loader2, Eye, Pencil, FileText, Trash2 } from "lucide-react";

const EXAMS = ["SSC CGL", "SSC CHSL", "SSC MTS", "SSC GD", "SSC CPO", "SSC Stenographer", "SSC JE", "RRB NTPC", "RRB Group D", "RRB ALP", "RRB Technician", "RRB JE", "RRB Paramedical"];
const SUBJECTS = ["General Awareness", "General Intelligence & Reasoning", "General Science", "Mathematics", "English Comprehension"];
const SHIFTS = ["Shift 1", "Shift 2", "Shift 3"];
const YEARS = Array.from({ length: 16 }, (_, index) => 2026 - index);

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
  const [targetExam, setTargetExam] = useState(EXAMS[0]);
  const [examYear, setExamYear] = useState(2026);
  const [shift, setShift] = useState(SHIFTS[0]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [resolvedMetadata, setResolvedMetadata] = useState({
    examCategory: EXAMS[0],
    year: 2026,
    shift: SHIFTS[0],
    subject: SUBJECTS[0],
  });

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

  const handlePdfUpload = async (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }

    setError("");
    setDone(false);
    setParsingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("examCategory", targetExam);
      formData.append("year", String(examYear));
      formData.append("shift", shift);
      formData.append("subject", subject);

      const response = await fetch("/api/admin/parse-pdf", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "PDF parsing failed");
      if (!Array.isArray(result.questions) || result.questions.length === 0) {
        throw new Error("No complete questions were found. Please use a selectable-text PDF.");
      }
      const metadata = result.metadata || {
        examCategory: targetExam,
        year: examYear,
        shift,
        subject,
      };
      setResolvedMetadata(metadata);
      setParsedQuestions(result.questions.map((question: Record<string, any>) => ({
        ...question,
        examCategory: question.examCategory || metadata.examCategory,
        exam: question.exam || metadata.examCategory,
        year: question.year || metadata.year,
        shift: question.shift || metadata.shift,
        subject: question.subject || metadata.subject,
      })));
      setPreviewMode(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "PDF parsing failed.");
    } finally {
      setParsingPdf(false);
    }
  };

  // 🎯 EDIT ANSWER IN PREVIEW
  const handleAnswerChange = (index: number, newAnswer: string) => {
    const updated = [...parsedQuestions];
    updated[index] = { ...updated[index], answer: newAnswer, correctOption: newAnswer };
    setParsedQuestions(updated);
  };

  // 🎯 EDIT ANY TEXT FIELD IN PREVIEW (question/options)
  const handleFieldChange = (index: number, field: string, value: string) => {
    const updated = [...parsedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    if (field.startsWith("option") && updated[index].options) {
      updated[index].options = ["A", "B", "C", "D"].map((letter) => updated[index][`option${letter}`] || "");
    }
    setParsedQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    setParsedQuestions((questions) => questions.filter((_, questionIndex) => questionIndex !== index));
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
    const examName = resolvedMetadata.examCategory;
    const uploadYear = resolvedMetadata.year;
    const uploadShift = resolvedMetadata.shift;
    const uploadSubject = resolvedMetadata.subject;
    setCurrentExamName(examName);

    const subjectBatchCounts: Record<string, number> = {};
    const subjectsSeen = new Set<string>();
    try {
      const existingSnap = await getDocs(query(collection(db, "questions"), where("examCategory", "==", examName)));
      const existingQuestions = new Set(existingSnap.docs.map((item) => {
        const data = item.data() as Record<string, any>;
        return `${data.year || ""}|${data.shift || ""}|${data.subject || ""}|${data.questionText || data.questionEn || ""}`;
      }));
      let pendingWrites: Array<{ reference: ReturnType<typeof doc>; data: Record<string, any> }> = [];

      const commitPending = async () => {
        if (pendingWrites.length === 0) return;
        const batch = writeBatch(db);
        pendingWrites.forEach(({ reference, data }) => batch.set(reference, data));
        await batch.commit();
        pendingWrites = [];
      };

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i] || {};
        const questionText = String(q.questionText || q.questionEn || "").trim();
        const options = Array.isArray(q.options) && q.options.length === 4
          ? q.options.map((option: unknown) => String(option || "").trim())
          : [q.optionA, q.optionB, q.optionC, q.optionD].map((option) => String(option || "").trim());
        const correctOption = String(q.correctOption || q.answer || "").toUpperCase();
        const questionSubject = q.subject || uploadSubject;

        if (!questionText || options.some((option: string) => !option) || !["A", "B", "C", "D"].includes(correctOption)) {
          skipCount++;
          setProgress({ done: i + 1, total: questions.length });
          continue;
        }

        const questionYear = Number(q.year || uploadYear);
        const questionShift = q.shift || uploadShift;
        const duplicateKey = `${examName}|${questionYear}|${questionShift}|${questionSubject}|${questionText}`;
        if (existingQuestions.has(`${questionYear}|${questionShift}|${questionSubject}|${questionText}`)) {
          dupCount++;
          setProgress({ done: i + 1, total: questions.length });
          continue;
        }
        existingQuestions.add(`${questionYear}|${questionShift}|${questionSubject}|${questionText}`);
        subjectsSeen.add(questionSubject);

        const correctText = options["ABCD".indexOf(correctOption)];
        const legacyOptions = shuffleOptions(options);
        const legacyAnswer = "ABCD"[legacyOptions.indexOf(correctText)];
        const reference = doc(collection(db, "questions"));
        pendingWrites.push({
          reference,
          data: {
            examCategory: examName,
            exam: examName,
            year: questionYear,
            shift: questionShift,
            subject: questionSubject,
            questionText,
            questionEn: questionText,
            questionHi: q.questionHi || "",
            options,
            correctOption,
            explanation: q.explanation || q.explanationEn || "",
            explanationEn: q.explanationEn || q.explanation || "",
            explanationHi: q.explanationHi || "",
            optionA: legacyOptions[0],
            optionB: legacyOptions[1],
            optionC: legacyOptions[2],
            optionD: legacyOptions[3],
            answer: legacyAnswer,
            isPYQ: true,
            createdAt: Date.now(),
          },
        });
        uploadCount++;
        subjectBatchCounts[questionSubject] = (subjectBatchCounts[questionSubject] || 0) + 1;
        if (pendingWrites.length === 400) await commitPending();
        setProgress({ done: i + 1, total: questions.length });
      }
      await commitPending();
    } catch (e) {
      console.error("Batch upload error:", e);
      setError("Upload failed before all questions were saved. Please try again.");
    }

    setSkipped(skipCount);
    setDuplicates(dupCount);
    setSubjectUploadedThisBatch(subjectBatchCounts);

    try {
      const countQuery = query(collection(db, "questions"), where("examCategory", "==", examName));
      const countSnap = await getDocs(countQuery);
      const currentBucketCount = countSnap.docs.filter((item) => {
        const data = item.data() as Record<string, any>;
        return Number(data.year) === uploadYear && data.shift === uploadShift && data.subject === uploadSubject;
      }).length;
      setCurrentExamCount(currentBucketCount);
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
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs sm:grid-cols-4">
            <div><span className="block font-bold uppercase tracking-wide text-blue-500">Exam</span><span className="font-black text-slate-800">{resolvedMetadata.examCategory}</span></div>
            <div><span className="block font-bold uppercase tracking-wide text-blue-500">Year</span><span className="font-black text-slate-800">{resolvedMetadata.year}</span></div>
            <div><span className="block font-bold uppercase tracking-wide text-blue-500">Shift</span><span className="font-black text-slate-800">{resolvedMetadata.shift}</span></div>
            <div><span className="block font-bold uppercase tracking-wide text-blue-500">Subject</span><span className="font-black text-slate-800">{resolvedMetadata.subject}</span></div>
          </div>

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
                  value={q.questionText || q.questionEn || ""}
                  onChange={(e) => {
                    handleFieldChange(index, "questionText", e.target.value);
                    handleFieldChange(index, "questionEn", e.target.value);
                  }}
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
                    value={q.answer || ""}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="">Select answer</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(index)}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
                <textarea
                  value={q.explanation || q.explanationEn || ""}
                  onChange={(e) => {
                    handleFieldChange(index, "explanation", e.target.value);
                    handleFieldChange(index, "explanationEn", e.target.value);
                  }}
                  rows={2}
                  placeholder="English explanation"
                  className="mt-3 w-full resize-none rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 outline-none focus:border-blue-400"
                />
                <textarea
                  value={q.explanationHi || ""}
                  onChange={(e) => handleFieldChange(index, "explanationHi", e.target.value)}
                  rows={2}
                  placeholder="Hindi explanation"
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 outline-none focus:border-blue-400"
                />
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
        <p className="text-slate-500 text-sm mb-6">Select metadata, upload a PDF, review every extracted question, then save safely to Firestore.</p>

        <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          {[
            ["Target Exam", targetExam, setTargetExam, EXAMS],
            ["Exam Year", examYear, (value: string) => setExamYear(Number(value)), YEARS],
            ["Shift", shift, setShift, SHIFTS],
            ["Subject", subject, setSubject, SUBJECTS],
          ].map(([label, value, setter, options]) => (
            <label key={String(label)} className="text-xs font-black uppercase tracking-wide text-slate-500">
              {String(label)}
              <select
                value={String(value)}
                onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold normal-case tracking-normal text-slate-800 outline-none focus:border-blue-500"
              >
                {(options as (string | number)[]).map((option) => <option key={String(option)} value={String(option)}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>

        <label
          htmlFor="pdf-upload"
          className={`mb-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-6 py-8 text-center transition hover:border-blue-500 hover:bg-blue-50 ${parsingPdf ? "pointer-events-none opacity-60" : ""}`}
        >
          {parsingPdf ? <Loader2 size={28} className="animate-spin text-blue-600" /> : <FileText size={28} className="text-blue-600" />}
          <span className="mt-2 text-sm font-black text-slate-800">{parsingPdf ? "Parsing PDF..." : "Drop PDF here or choose a file"}</span>
          <span className="mt-1 text-xs text-slate-500">Question text, options, answers, and explanations will be previewed before saving.</span>
          <input id="pdf-upload" type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => handlePdfUpload(event.target.files?.[0])} disabled={parsingPdf || uploading} />
        </label>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
            <XCircle size={16} /> {error}
          </div>
        )}

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