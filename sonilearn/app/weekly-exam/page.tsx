"use client"

import { useState, useEffect } from "react"

export default function WeeklyExam() {

    const [allowed, setAllowed] = useState(false)
    const [message, setMessage] = useState("Checking exam time...")

    useEffect(() => {

        const now = new Date()

        const day = now.getDay() // Sunday = 0
        const hour = now.getHours()

        if (day === 0 && hour >= 10 && hour < 11) {

            setAllowed(true)

        } else {

            setMessage("Weekly Live Exam only available Sunday 10 AM")

        }

    }, [])

    if (!allowed) {

        return (

            <div className="min-h-screen flex items-center justify-center">

                <h1 className="text-xl font-semibold">

                    {message}

                </h1>

            </div>

        )

    }

    return (

        <div className="min-h-screen flex items-center justify-center">

            <div className="bg-white p-10 rounded-xl shadow text-center">

                <h1 className="text-2xl font-bold mb-4">

                    Weekly Live Exam

                </h1>

                <p className="mb-6">

                    All India Competition

                </p>

                <button
                    onClick={() => window.location.href = "/mock"}
                    className="bg-blue-600 text-white px-6 py-3 rounded"
                >

                    Start Exam

                </button>

            </div>

        </div>

    )

}