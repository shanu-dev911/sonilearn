"use client"

import { useState } from "react"

export default function AIPage() {

    const [question, setQuestion] = useState("")
    const [answer, setAnswer] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const askAI = async () => {

        if (!question.trim()) {
            setError("Please enter a question")
            return
        }

        setError("")
        setLoading(true)
        setAnswer("")

        try {

            const res = await fetch("/api/questions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ question })
            })

            const data = await res.json()

            if (data.success) {
                setAnswer(data.answer)
            } else {
                setError("AI could not generate answer")
            }

        } catch (err) {
            console.log(err)
            setError("Server error. Try again.")
        }

        setLoading(false)

    }

    return (

        <div className="min-h-screen bg-gray-100 p-6">

            <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow">

                <h1 className="text-2xl font-semibold mb-6 text-center">
                    24/7 Doubt Support
                
                </h1>


                <textarea
                    className="w-full border p-3 rounded mb-4"
                    rows={5}
                    placeholder="Paste your question here..."
                    value={question}
                    onChange={(e) => {
                        setQuestion(e.target.value)
                        setAnswer("")
                    }}
                />


                {error && (
                    <p className="text-red-500 mb-3 text-sm">
                        {error}
                    </p>
                )}


                <button
                    onClick={askAI}
                    className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
                >

                    {loading ? "Thinking..." : "Get Explanation"}

                </button>


                {answer && (

                    <div className="mt-6 p-4 bg-gray-100 rounded">

                        <h3 className="font-semibold mb-2">
                            Explanation
                        </h3>

                        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                            {answer}
                        </p>

                    </div>

                )}

            </div>

        </div>

    )

}