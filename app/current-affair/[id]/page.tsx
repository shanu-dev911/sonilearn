"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { dbClient } from "@/lib/firebase-client"
import { doc, getDoc } from "firebase/firestore"

export default function CurrentAffairDetail() {

    const { id } = useParams()
    const router = useRouter()

    const [data, setData] = useState<any>(null)
    const [selected, setSelected] = useState("")
    const [showAnswer, setShowAnswer] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            const ref = doc(dbClient, "current_affairs", id as string)
            const snap = await getDoc(ref)

            if (snap.exists()) {
                setData({ id: snap.id, ...snap.data() })
            }
        }

        fetchData()
    }, [id])

    if (!data) return <div className="p-10 text-center">Loading...</div>

    return (
        <div className="min-h-screen bg-gray-50 p-4">

            {/* BACK */}
            <button onClick={() => router.back()} className="mb-4 text-blue-600">
                ← Back
            </button>

            {/* CONTENT */}
            <div className="bg-white p-5 rounded-2xl shadow">

                <p className="text-xs text-gray-400">📅 {data.date}</p>

                <h1 className="text-xl font-bold mt-1">{data.title}</h1>

                <p className="mt-4 text-gray-700">
                    {data.fullContent || data.description}
                </p>

            </div>

            {/* 🔥 MCQ SECTION */}
            {data.mcq && (
                <div className="mt-6 bg-white p-5 rounded-2xl shadow">

                    <h2 className="font-bold mb-3">Practice Question</h2>

                    <p className="mb-3">{data.mcq.question}</p>

                    <div className="space-y-2">
                        {data.mcq.options.map((opt: string) => (
                            <button
                                key={opt}
                                onClick={() => {
                                    setSelected(opt)
                                    setShowAnswer(true)
                                }}
                                className={`w-full p-2 border rounded 
                  ${showAnswer
                                        ? opt === data.mcq.answer
                                            ? "bg-green-100"
                                            : opt === selected
                                                ? "bg-red-100"
                                                : ""
                                        : selected === opt
                                            ? "bg-blue-100"
                                            : ""
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    {showAnswer && (
                        <p className="mt-3 text-green-600">
                            Correct Answer: {data.mcq.answer}
                        </p>
                    )}

                </div>
            )}

        </div>
    )
}