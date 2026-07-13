export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

export async function GET() {
    const data = [
        {
            question: "भारत का सबसे बड़ा राज्य क्षेत्रफल के अनुसार कौन सा है?",
            options: ["उत्तर प्रदेश", "मध्य प्रदेश", "राजस्थान", "बिहार"],
            answer: "राजस्थान",
            subject: "General Knowledge",
            exam: "SSC"
        },
        {
            question: "संविधान सभा के अध्यक्ष कौन थे?",
            options: ["डॉ. राजेंद्र प्रसाद", "नेहरू", "गांधी", "पटेल"],
            answer: "डॉ. राजेंद्र प्रसाद",
            subject: "General Knowledge",
            exam: "SSC"
        }
    ];

    await fetch("http://localhost:3000/api/upload-questions", {
        method: "POST",
        body: JSON.stringify(data),
    });

    return NextResponse.json({ success: true });
}