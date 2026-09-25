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
    .replace(/\s{2,}/g, " ")
    .trim();
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

    return {
      questionText,
      questionEn: questionText,
      questionHi: "",
      options,
      optionA: options[0],
      optionB: options[1],
      optionC: options[2],
      optionD: options[3],
      correctOption: answerMatch?.[1]?.toUpperCase() || "A",
      answer: answerMatch?.[1]?.toUpperCase() || "A",
      explanation: "Explanation pending admin review.",
      explanationEn: "Explanation pending admin review.",
      explanationHi: "व्याख्या की समीक्षा आवश्यक है।",
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
    const questions = parseQuestions(parsed.text).map((question) => ({
      ...question,
      examCategory,
      exam: examCategory,
      year,
      shift,
      subject,
    }));

    return NextResponse.json({ success: true, questions, total: questions.length });
  } catch (error) {
    console.error("PDF parse error:", error);
    return NextResponse.json({ success: false, error: "Unable to parse this PDF. Please check that it contains selectable text." }, { status: 500 });
  }
}
