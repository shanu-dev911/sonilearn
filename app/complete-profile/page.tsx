"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase-client";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { FiGift, FiX } from "react-icons/fi";

const examsData: string[] = [
    "SSC CGL", "SSC CHSL", "SSC MTS", "SSC GD", "SSC CPO", "SSC Stenographer", "SSC JE",
    "RRB NTPC", "RRB Group D", "RRB ALP", "RRB Technician", "RRB JE", "RRB SSE",
    "RRB Paramedical", "RRB Ministerial & Isolated", "RRB Apprentice"
];

const MULTI_STAGE_EXAMS: Record<string, { label: string; options: { value: string; label: string }[] }> = {
    "SSC CGL": {
        label: "Which Tier are you preparing for?",
        options: [
            { value: "TIER_1", label: "Tier 1" },
            { value: "TIER_2", label: "Tier 2" },
        ],
    },
    "SSC CHSL": {
        label: "Which Tier are you preparing for?",
        options: [
            { value: "TIER_1", label: "Tier 1" },
            { value: "TIER_2", label: "Tier 2" },
        ],
    },
    "RRB NTPC": {
        label: "Which CBT stage are you preparing for?",
        options: [
            { value: "CBT_1", label: "CBT 1" },
            { value: "CBT_2", label: "CBT 2" },
        ],
    },
    "RRB ALP": {
        label: "Which CBT stage are you preparing for?",
        options: [
            { value: "CBT_1", label: "CBT 1" },
            { value: "CBT_2", label: "CBT 2" },
        ],
    },
    "RRB JE": {
        label: "Which CBT stage are you preparing for?",
        options: [
            { value: "CBT_1", label: "CBT 1" },
            { value: "CBT_2", label: "CBT 2" },
        ],
    },
};

export default function CompleteProfile() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [referralCode, setReferralCode] = useState("");

    const [targetExam, setTargetExam] = useState("");
    const [examStage, setExamStage] = useState("");
    const [loading, setLoading] = useState(false);

    const stageConfig = MULTI_STAGE_EXAMS[targetExam];
    const needsStageSelection = !!stageConfig;

    // Load auto-filled referral from URL or sessionStorage (if came via Google login)
    useEffect(() => {
        const urlRef = searchParams.get("ref");
        const sessionRef = typeof window !== "undefined" ? sessionStorage.getItem("pending_referral_code") : null;
        const codeToSet = (urlRef || sessionRef || "").trim().toUpperCase();
        if (codeToSet) {
            setReferralCode(codeToSet);
        }
    }, [searchParams]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 10) {
            setPhone(value);
        }
    };

    const handleSelectExam = (exam: string) => {
        setTargetExam(exam);
        setExamStage("");
    };

    // Verify if referrer code exists in database
    const verifyReferralCode = async (code: string): Promise<string | null> => {
        if (!code.trim()) return null;
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("referralCode", "==", code.trim().toUpperCase()));
            const snap = await getDocs(q);
            if (!snap.empty) {
                return code.trim().toUpperCase();
            }
            return null;
        } catch (err) {
            console.error("Error checking referral code:", err);
            return null;
        }
    };

    const handleFinish = async () => {
        if (!name.trim() || phone.length !== 10 || !targetExam) {
            alert("Please fill all details correctly");
            return;
        }

        if (needsStageSelection && !examStage) {
            alert("Please select your exam stage");
            return;
        }

        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                alert("User session not found. Please log in again.");
                return;
            }

            let validReferrer: string | null = null;
            if (referralCode.trim()) {
                validReferrer = await verifyReferralCode(referralCode);
                if (!validReferrer) {
                    alert("Invalid Referral Code! Please check the code or clear it using the (X) button.");
                    setLoading(false);
                    return;
                }
            }

            const updatePayload: Record<string, any> = {
                name: name.trim(),
                phone: `+91${phone}`,
                examType: "Central",
                state: "Central",
                targetExam,
                examStage: needsStageSelection ? examStage : "",
                profileCompleted: true,
            };

            // If user applied a referral code here
            if (validReferrer) {
                updatePayload.referredBy = validReferrer;
                updatePayload.referralRewarded = false;
            }

            await updateDoc(doc(db, "users", user.uid), updatePayload);

            if (typeof window !== "undefined") {
                sessionStorage.removeItem("pending_referral_code");
            }

            router.push("/");
        } catch (error) {
            console.error("Profile Commit Error:", error);
            alert("Something went wrong saving your profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Continue = () => {
        if (needsStageSelection) {
            setStep(3);
        } else {
            handleFinish();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5 font-sans">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8">

                {/* LOGO */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-blue-700 tracking-tight">
                        SONILEARN
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium text-sm">
                        Complete your profile 🚀
                    </p>
                </div>

                {/* PROGRESS BAR */}
                <div className="flex gap-3 mb-8">
                    <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? "bg-blue-600" : "bg-gray-200"}`} />
                    <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
                    <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`} />
                </div>

                {/* STEP 1: Basic Details + Optional Referral */}
                {step === 1 && (
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 mb-1">
                            Basic Details
                        </h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            Enter your personal information
                        </p>

                        {/* NAME */}
                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                                Full Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:border-blue-500 text-sm font-semibold"
                            />
                        </div>

                        {/* PHONE */}
                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                                Phone Number
                            </label>
                            <div className="flex items-center bg-slate-50 border border-gray-200 rounded-2xl px-4 py-3.5">
                                <span className="font-bold text-gray-700 mr-2 text-sm">
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    placeholder="9876543210"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    className="w-full bg-transparent outline-none text-sm font-semibold"
                                />
                            </div>
                        </div>

                        {/* 🎁 REFERRAL CODE INPUT (OPTIONAL WITH [X] REMOVE BUTTON) */}
                        <div className="mb-7">
                            <label className="text-xs font-bold text-gray-600 mb-1.5 block">
                                Referral Code <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="flex items-center bg-indigo-50/50 border border-dashed border-indigo-200 rounded-2xl px-4 py-3">
                                <FiGift className="text-indigo-600 text-lg mr-2.5 flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Enter friend's code"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                    className="w-full bg-transparent outline-none text-sm font-black text-indigo-700 uppercase tracking-wider placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400"
                                />
                                {referralCode && (
                                    <button
                                        type="button"
                                        onClick={() => setReferralCode("")}
                                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-xs ml-1 flex-shrink-0"
                                        title="Clear code"
                                    >
                                        <FiX size={13} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* NEXT BUTTON */}
                        <button
                            disabled={!name.trim() || phone.length !== 10}
                            onClick={() => setStep(2)}
                            className={`w-full py-4 rounded-2xl font-black text-base transition-all ${!name.trim() || phone.length !== 10
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-98"
                                }`}
                        >
                            Next →
                        </button>
                    </div>
                )}

                {/* STEP 2: Choose Exam */}
                {step === 2 && (
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 mb-1">
                            Select Target Exam
                        </h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            Choose your exam for personalized practice
                        </p>

                        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                            {examsData.map((exam) => (
                                <button
                                    key={exam}
                                    onClick={() => handleSelectExam(exam)}
                                    className={`w-full p-3.5 rounded-2xl border-2 text-left font-bold transition-all text-sm ${targetExam === exam
                                            ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20"
                                            : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                                        }`}
                                >
                                    🎯 {exam}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-7">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3.5 rounded-2xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                disabled={!targetExam || loading}
                                onClick={handleStep2Continue}
                                className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all ${!targetExam || loading
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-600/20 active:scale-98"
                                    }`}
                            >
                                {loading ? "Please wait..." : needsStageSelection ? "Next" : "Start 🚀"}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Multi-stage selection */}
                {step === 3 && stageConfig && (
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 mb-1">
                            Select Your Stage
                        </h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            {stageConfig.label}
                        </p>

                        <div className="space-y-3">
                            {stageConfig.options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setExamStage(opt.value)}
                                    className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all text-sm ${examStage === opt.value
                                            ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20"
                                            : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                                        }`}
                                >
                                    📘 {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 mt-7">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-3.5 rounded-2xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                disabled={!examStage || loading}
                                onClick={handleFinish}
                                className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all ${!examStage || loading
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-600/20 active:scale-98"
                                    }`}
                            >
                                {loading ? "Please wait..." : "Start 🚀"}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}