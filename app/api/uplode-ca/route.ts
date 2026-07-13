export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-client";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

export async function GET() {
    try {
        const today = "2026-04-12";

        // 🔥 check if already exists (duplicate skip)
        const q = query(
            collection(db, "current_affairs"),
            where("date", "==", today)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return NextResponse.json({
                message: "Already exists for today ✅",
            });
        }

        // 🔥 DATA (20 CA)
        const data = 
            [
                {
                    "title": "Bharatiya Nyaya Sanhita implemented",
                    "description": "India replaced IPC with new criminal laws.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India ranks in Global Hunger Index",
                    "description": "India's position highlighted in global hunger report.",
                    "date": "2026-04-12"
                },
                {
                    "title": "National Green Tribunal active role",
                    "description": "NGT strengthens environmental protection laws.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India’s literacy rate improves",
                    "description": "Education sector shows positive growth.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India becomes top remittance receiver",
                    "description": "Highest remittance inflow globally recorded.",
                    "date": "2026-04-12"
                },
                {
                    "title": "New labour codes implemented",
                    "description": "Government introduced reforms in labour laws.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India improves global competitiveness ranking",
                    "description": "India ranks higher in competitiveness index.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India’s population becomes highest",
                    "description": "India surpasses China in population.",
                    "date": "2026-04-12"
                },
                {
                    "title": "National Cyber Security Policy updated",
                    "description": "India strengthens cyber defence systems.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India wins Paralympics medals",
                    "description": "Athletes achieve success in Paralympics.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India launches Unified Logistics Interface Platform",
                    "description": "Digital platform improves logistics efficiency.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India improves ease of living index",
                    "description": "Quality of life improves across cities.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India’s banking sector strengthens",
                    "description": "NPAs reduced and profitability improved.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India launches PM Surya Ghar Yojana",
                    "description": "Solar rooftop scheme for households launched.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India improves gender equality index",
                    "description": "Women participation increases in workforce.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India hosts Global Millet Conference",
                    "description": "Millets promoted as superfood globally.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India’s steel production increases",
                    "description": "India becomes second largest steel producer.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India expands Jal Jeevan Mission",
                    "description": "Clean water supply reaches more households.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India improves air quality index",
                    "description": "Efforts made to reduce pollution levels.",
                    "date": "2026-04-12"
                },
                {
                    "title": "India strengthens digital economy",
                    "description": "Growth seen in fintech and digital platforms.",
                    "date": "2026-04-12"
                }
            ]
        // 🔥 SAVE TO FIREBASE
        for (const item of data) {
            await addDoc(collection(db, "current_affairs"), {
                ...item,
                date: today,
                createdAt: new Date(),
            });
        }

        return NextResponse.json({
            message: "Uploaded 20 Current Affairs ✅",
        });

    } catch (error: any) {
        return NextResponse.json({
            error: "Failed ❌",
            message: error.message,
        });
    }
}