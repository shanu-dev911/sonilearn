export const dynamic = 'force-dynamic';

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth, db} from "@/lib/firebase-client"
import { FiMail } from "react-icons/fi"

export default function ForgotPassword() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const handleResetPassword = async () => {
        if (!email) return alert("Please enter your registered email address.");

        setLoading(true)
        setMessage("")
        try {
            await sendPasswordResetEmail(auth, email)
            setMessage("Success! Password reset link has been sent to your email. Please check your inbox (and spam folder).")
        } catch (error: any) {
            alert("Error: " + error.message)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 font-sans">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    
                    <h1 className="text-4xl font-black text-blue-700 tracking-tight">SoniLearn</h1>
                    <p className="text-gray-400 font-medium">Reset your password 🔒</p>
                </div>

                <div className="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100 shadow-sm">
                    <h2 className="text-xl font-black text-gray-800 mb-2 text-center">Forgot Password?</h2>
                    <p className="text-sm text-gray-500 text-center mb-6">Enter your email and we'll send you a link to reset your password.</p>

                    {message && (
                        <div className="bg-green-100 text-green-700 p-4 rounded-2xl text-sm font-bold mb-6 text-center">
                            {message}
                        </div>
                    )}

                    <div className="flex items-center bg-white border border-gray-100 rounded-2xl px-4 py-4 mb-6 shadow-sm">
                        <FiMail className="text-blue-500 text-xl mr-3" />
                        <input
                            type="email"
                            placeholder="Enter your Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-transparent outline-none w-full font-bold text-gray-700"
                        />
                    </div>

                    <button
                        onClick={handleResetPassword}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all disabled:opacity-50 mb-4"
                    >
                        {loading ? "Sending Link..." : "Send Reset Link 📩"}
                    </button>

                    <button
                        onClick={() => router.push("/login")}
                        className="w-full bg-white text-gray-600 py-4 rounded-2xl font-bold border border-gray-200 active:scale-95 transition-all"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    )
}