"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase-client";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// ✅ ONLY SSC + RAILWAY EXAMS
const examsData: string[] = [
    "SSC CGL",
    "SSC CHSL",
    "SSC MTS",
    "SSC GD",
    "SSC CPO",
    "RRB NTPC",
    "RRB GROUP D",
    "RRB ALP",
    "RRB JE",
];

export default function CompleteProfile() {

    const router = useRouter();

    const [step, setStep] = useState(1);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    const [targetExam, setTargetExam] = useState("");

    const [loading, setLoading] = useState(false);

    // ✅ PHONE VALIDATION
    const handlePhoneChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {

        const value = e.target.value.replace(/\D/g, "");

        if (value.length <= 10) {
            setPhone(value);
        }

    };

    // ✅ SAVE PROFILE
    const handleFinish = async () => {

        if (!name || phone.length !== 10 || !targetExam) {
            alert("Please fill all details");
            return;
        }

        setLoading(true);

        try {

            const user = auth.currentUser;

            if (!user) {
                alert("User not found");
                return;
            }

            await updateDoc(
                doc(db, "users", user.uid),
                {
                    name: name.trim(),

                    phone: `+91${phone}`,

                    examType: "Central",

                    state: "Central",

                    targetExam,

                    profileCompleted: true,
                }
            );

            router.push("/");

        } catch (error) {

            console.log("Profile Error:", error);

            alert("Something went wrong");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">

            <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8">

                {/* LOGO */}
                <div className="text-center mb-8">

                    <h1 className="text-4xl font-black text-blue-700">
                        SONILEARN
                    </h1>

                    <p className="text-gray-400 mt-2 font-medium">
                        Complete your profile 🚀
                    </p>

                </div>

                {/* PROGRESS */}
                <div className="flex gap-3 mb-10">

                    <div
                        className={`h-2 flex-1 rounded-full transition-all duration-300

            ${step >= 1
                                ? "bg-blue-600"
                                : "bg-gray-200"
                            }`}
                    />

                    <div
                        className={`h-2 flex-1 rounded-full transition-all duration-300

            ${step >= 2
                                ? "bg-blue-600"
                                : "bg-gray-200"
                            }`}
                    />

                </div>

                {/* STEP 1 */}
                {step === 1 && (

                    <div>

                        <h2 className="text-3xl font-black text-gray-800 mb-2">
                            Basic Details
                        </h2>

                        <p className="text-gray-500 mb-8">
                            Enter your personal information
                        </p>

                        {/* NAME */}
                        <div className="mb-5">

                            <label className="text-sm font-bold text-gray-600 mb-2 block">
                                Full Name
                            </label>

                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
                            />

                        </div>

                        {/* PHONE */}
                        <div className="mb-8">

                            <label className="text-sm font-bold text-gray-600 mb-2 block">
                                Phone Number
                            </label>

                            <div className="flex items-center bg-slate-50 border border-gray-200 rounded-2xl px-5 py-4">

                                <span className="font-bold text-gray-700 mr-2">
                                    +91
                                </span>

                                <input
                                    type="tel"
                                    placeholder="9876543210"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    className="w-full bg-transparent outline-none"
                                />

                            </div>

                        </div>

                        {/* NEXT BUTTON */}
                        <button
                            disabled={!name || phone.length !== 10}
                            onClick={() => setStep(2)}
                            className={`w-full py-4 rounded-2xl font-black text-lg transition-all

              ${!name || phone.length !== 10
                                    ? "bg-gray-200 text-gray-400"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                        >

                            Next →

                        </button>

                    </div>

                )}

                {/* STEP 2 */}
                {step === 2 && (

                    <div>

                        <h2 className="text-3xl font-black text-gray-800 mb-2">
                            Select Target Exam
                        </h2>

                        <p className="text-gray-500 mb-8">
                            Choose your exam for personalized practice
                        </p>

                        {/* EXAMS */}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">

                            {examsData.map((exam) => (

                                <button
                                    key={exam}
                                    onClick={() => setTargetExam(exam)}
                                    className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all

                  ${targetExam === exam
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                                        }`}
                                >

                                    🎯 {exam}

                                </button>

                            ))}

                        </div>

                        {/* BUTTONS */}
                        <div className="flex gap-3 mt-8">

                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold"
                            >

                                Back

                            </button>

                            <button
                                disabled={!targetExam || loading}
                                onClick={handleFinish}
                                className={`flex-1 py-4 rounded-2xl font-black transition-all

                ${!targetExam || loading
                                        ? "bg-gray-200 text-gray-400"
                                        : "bg-green-600 text-white hover:bg-green-700"
                                    }`}
                            >

                                {loading
                                    ? "Please wait..."
                                    : "Start 🚀"}

                            </button>

                        </div>

                    </div>

                )}

            </div>

        </div>

    );

}