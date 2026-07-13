"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";

export default function SundayExamPage() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState("");
    const [answers, setAnswers] = useState<string[]>([]);
    const [timeLeft, setTimeLeft] = useState(5400);

    const [started, setStarted] = useState(false);
    const [agree, setAgree] = useState(false);
    const [finished, setFinished] = useState(false);

    const [finalScore, setFinalScore] = useState(0);
    const [rank, setRank] = useState<number | null>(null);
    const [cutoff, setCutoff] = useState<number | null>(null);

    // 🔥 LOAD QUESTIONS
    useEffect(() => {
        async function loadQuestions() {
            const snapshot = await getDocs(collection(db, "questions"));

            let all: any[] = [];

            snapshot.forEach((doc) => {
                const d = doc.data();

                all.push({
                    questionEn: d.questionEn || "",
                    questionHi: d.questionHi || "",
                    options: [d.optionA, d.optionB, d.optionC, d.optionD],
                    answer: d["option" + d.answer],
                    subject: d.subject || "General",
                });
            });

            const pick = (arr: any[], n: number) =>
                [...arr].sort(() => Math.random() - 0.5).slice(0, n);

            const finalQs = [
                ...pick(all.filter(q => q.subject === "Math"), 25),
                ...pick(all.filter(q => q.subject === "Reasoning"), 25),
                ...pick(all.filter(q => q.subject === "English"), 25),
                ...pick(all.filter(q => q.subject === "GK"), 25),
            ];

            setQuestions(finalQs);
            setAnswers(new Array(finalQs.length).fill(""));
        }

        loadQuestions();
    }, []);

    // ⏱️ TIMER (AUTO SUBMIT)
    useEffect(() => {
        if (!started) return;

        if (timeLeft <= 0) {
            handleFinish();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, started]);

    // 🎯 SELECT
    const handleSelect = (opt: string) => {
        const arr = [...answers];
        arr[current] = opt;
        setAnswers(arr);
        setSelected(opt);
    };

    // 🔥 FINISH + SAVE
    const handleFinish = async () => {
        let score = 0;

        answers.forEach((ans, i) => {
            if (ans === questions[i].answer) score += 1;
            else if (ans !== "") score -= 0.25;
        });

        const userId = localStorage.getItem("userId") || "guest_" + Date.now();

        try {
            await addDoc(collection(db, "exam_results"), {
                userId,
                name: "Shanu",
                score,
                subject: "All",
                time: new Date()
            });
        } catch (err) {
            console.error(err);
        }

        setFinalScore(score);
        setFinished(true);
    };

    const next = () => {
        if (current < questions.length - 1) {
            setCurrent(current + 1);
        } else {
            handleFinish();
        }
    };

    const prev = () => {
        if (current > 0) setCurrent(current - 1);
    };

    useEffect(() => {
        setSelected(answers[current] || "");
    }, [current]);

    // 🔥 RANK FIXED (NO DUPLICATE BUG)
    useEffect(() => {
        async function getRank() {
            const q = query(collection(db, "exam_results"), orderBy("score", "desc"));
            const snap = await getDocs(q);

            let all: any[] = [];
            snap.forEach(doc => all.push(doc.data()));

            const sorted = all.map(d => d.score);

            const betterScores = sorted.filter(s => s > finalScore).length;
            setRank(betterScores + 1);
            const cutoffIndex = Math.floor(sorted.length * 0.2);
            setCutoff(sorted[cutoffIndex] || 0);
        }

        if (finished) getRank();
    }, [finished]);

    // 🧾 RESULT
    if (finished) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: 20
            }}>
                <h2 style={{ color: "#16a34a" }}>✅ Exam Submitted</h2>

                <div style={{
                    marginTop: 20,
                    padding: 20,
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    textAlign: "center"
                }}>
                    <h3>📊 Result Summary</h3>

                    <p>🎯 Score: <b>{finalScore}</b></p>
                    <p>🏆 Rank: <b>{rank || "Calculating..."}</b></p>
                    <p>📉 Cutoff: <b>{cutoff || "Loading..."}</b></p>

                    <button
                        onClick={() => window.location.href = "/leaderboard"}
                        style={{
                            marginTop: 10,
                            padding: "10px 20px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8
                        }}
                    >
                        View Leaderboard
                    </button>
                </div>
            </div>
        );
    }

    // 📜 INSTRUCTIONS
    if (!started) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg,#1e3a8a,#2563eb)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <div style={{ background: "#fff", padding: 20, borderRadius: 10 }}>
                    <h2>📋 Live Exam</h2>

                    <label>
                        <input type="checkbox" checked={agree} onChange={() => setAgree(!agree)} />
                        I Agree
                    </label>

                    <button disabled={!agree} onClick={() => setStarted(true)}>
                        Start
                    </button>
                </div>
            </div>
        );
    }

    if (!questions.length) return <h2>Loading...</h2>;

    const q = questions[current];

    return (
        <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
            <div style={{
                background: "#0f172a",
                color: "#fff",
                padding: 12,
                display: "flex",
                justifyContent: "space-between"
            }}>
                <b>🔴 LIVE TEST</b>
                <span style={{ color: timeLeft < 300 ? "red" : "white" }}>
                    ⏱️ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </span>
            </div>

            <div style={{ padding: 20 }}>
                <h3>{q.questionEn}</h3>

                {q.options.map((opt: string, i: number) => (
                    <button
                        key={i}
                        onClick={() => handleSelect(opt)}
                        style={{
                            display: "block",
                            margin: "10px 0",
                            padding: 10,
                            width: "100%",
                            background: selected === opt ? "#dbeafe" : "#fff"
                        }}
                    >
                        {opt}
                    </button>
                ))}

                <div style={{ marginTop: 20 }}>
                    <button onClick={prev}>Back</button>
                    <button onClick={next}>
                        {current === questions.length - 1 ? "Submit" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
}