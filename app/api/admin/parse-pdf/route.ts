import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const dynamic = "force-dynamic";

const SUPPORTED_EXAMS = [
  "SSC CGL", "SSC CHSL", "SSC MTS", "SSC GD", "SSC CPO", "SSC Stenographer", "SSC JE",
  "RRB NTPC", "RRB Group D", "RRB ALP", "RRB Technician", "RRB JE", "RRB Paramedical",
];

const SUPPORTED_SUBJECTS = [
  "General Awareness", "General Intelligence & Reasoning", "General Science", "Mathematics", "English Comprehension",
];

function cleanText(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/https?:\/\/\S+|www\.\S+/gi, "")
    .replace(/\b(?:www\.)?\S*(?:testbook|adda247|careerpower|byjus|oliveboard|gradeup)\S*\b/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findMetadata(text: string, fallback: { examCategory: string; year: number; shift: string; subject: string }) {
  const header = text.slice(0, Math.min(text.length, 12000));
  const examCategory = SUPPORTED_EXAMS.find((exam) =>
    new RegExp(`(?:exam(?:ination)?(?:\s+name)?\s*[:\-]?\s*)?${exam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(header)
  ) || fallback.examCategory;
  const yearMatch = header.match(/(?:exam\s*)?(?:year|paper\s*year)\s*[:\-]?\s*(20\d{2})/i) || header.match(/\b(20(?:1[1-9]|2[0-6]))\b/);
  const shiftMatch = header.match(/\b(Shift\s*[123])\b/i);
  const subject = SUPPORTED_SUBJECTS.find((candidate) =>
    new RegExp(`(?:subject|section)\s*[:\-]?\s*${candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(header)
  ) || fallback.subject;

  return {
    examCategory,
    year: yearMatch ? Number(yearMatch[1]) : fallback.year,
    shift: shiftMatch ? shiftMatch[1].replace(/\s+/g, " ") : fallback.shift,
    subject,
  };
}

function parseQuestions(text: string) {
  const cleaned = cleanText(text)
    .replace(/^\s*(?:answer key|answers|solutions?)\s*$/gim, "")
    .replace(/\f/g, "\n");
  const blocks = cleaned.split(/(?=^\s*(?:Q(?:uestion)?\s*)?\d+\s*[).:-])/gim);

  return blocks.map((block, index) => {
    const questionMatch = block.match(/^\s*(?:Q(?:uestion)?\s*)?\d+\s*[).:-]\s*([\s\S]*?)(?=\n\s*(?:A|1)[).:-]\s)/i);
    const optionMatches = [...block.matchAll(/^\s*([A-D])\s*[).:-]\s*(.+)$/gim)];
    const answerMatch = block.match(/(?:answer|correct\s*(?:answer|option)?|ans)\s*[:.)-]?\s*([A-D])/i);
    const options = ["A", "B", "C", "D"].map((letter) => optionMatches.find((match) => match[1].toUpperCase() === letter)?.[2]?.trim() || "");
    const questionText = cleanText(questionMatch?.[1] || block.replace(/^\s*\d+\s*[).:-]\s*/i, "").split(/\n\s*[A-D]\s*[).:-]/i)[0] || "");
    const explanationMatch = block.match(/(?:explanation|solution)\s*[:\-]?\s*([\s\S]*?)(?=\n\s*(?:Q(?:uestion)?\s*)?\d+\s*[).:-]|$)/i);
    const explanation = explanationMatch ? cleanText(explanationMatch[1]) : "";
    const correctOption = answerMatch?.[1]?.toUpperCase() || "";

    return {
      questionText,
      questionEn: questionText,
      questionHi: "",
      options,
      optionA: options[0],
      optionB: options[1],
      optionC: options[2],
      optionD: options[3],
      correctOption,
      answer: correctOption,
      explanation,
      explanationEn: explanation,
      explanationHi: "",
      sourceIndex: index + 1,
    };
  }).filter((question) => question.questionText && question.options.every(Boolean));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const examCategory = String(formData.get("examCategory") || "");
    const year = Number(formData.get("year"));
    const shift = String(formData.get("shift") || "");
    const subject = String(formData.get("subject") || "");

    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Please upload a PDF file." }, { status: 400 });
    }
    if (!SUPPORTED_EXAMS.includes(examCategory) || !SUPPORTED_SUBJECTS.includes(subject) || !["Shift 1", "Shift 2", "Shift 3"].includes(shift) || year < 2011 || year > 2026) {
      return NextResponse.json({ success: false, error: "Invalid exam metadata." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    const resolvedMetadata = findMetadata(parsed.text, { examCategory, year, shift, subject });
    const questions = parseQuestions(parsed.text).map((question) => ({
      ...question,
      ...resolvedMetadata,
      exam: resolvedMetadata.examCategory,
    }));

    return NextResponse.json({ success: true, metadata: resolvedMetadata, questions, total: questions.length });
  } catch (error) {
    console.error("PDF parse error:", error);
    return NextResponse.json({ success: false, error: "Unable to parse this PDF. Please check that it contains selectable text." }, { status: 500 });
  }
}
