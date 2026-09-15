"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    User,
    Mail,
    ShieldCheck,
    Target,
    LogOut,
    Check,
    Edit2,
    BookmarkCheck,
    MessageSquare,
    Send,
    Layers,
    Gift,
    Share2,
    Copy,
    MessageCircle,
    Smartphone,
    X,
    ChevronRight,
    Wallet,
    ArrowUpRight,
    Loader2
} from "lucide-react";

const examsData = [
    "SSC CGL", "SSC CHSL", "SSC MTS", "SSC GD", "SSC CPO", "SSC Stenographer", "SSC JE",
    "RRB NTPC", "RRB Group D", "RRB ALP", "RRB Technician", "RRB JE", "RRB SSE",
    "RRB Paramedical", "RRB Ministerial & Isolated", "RRB Apprentice"
];

interface StageOption {
    value: string;
    label: string;
}

interface StageConfigEntry {
    label: string;
    options: StageOption[];
}

const MULTI_STAGE_EXAMS: Record<string, StageConfigEntry> = {
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

const MIN_WITHDRAWAL_INR = 100;

function generateReferralCode(name: string): string {
    const cleanName = (name || "SL").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3) || "SL";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${randomNum}`;
}

export default function ProfilePage() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [targetExam, setTargetExam] = useState("");
    const [examStage, setExamStage] = useState("");

    // 🎁 Referral & Wallet States
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [copiedReferral, setCopiedReferral] = useState(false);
    const [upiInput, setUpiInput] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawMessage, setWithdrawMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const [feedbackText, setFeedbackText] = useState("");
    const [feedbackSending, setFeedbackSending] = useState(false);
    const [feedbackSent, setFeedbackSent] = useState(false);

    const stageConfig = MULTI_STAGE_EXAMS[targetExam];
    const needsStageSelection = Boolean(stageConfig);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    setUser(currentUser);
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const data = userSnap.data();

                        if (!data.referralCode) {
                            const newCode = generateReferralCode(data.name || currentUser.displayName || "SL");
                            await updateDoc(userRef, { referralCode: newCode });
                            data.referralCode = newCode;
                        }

                        setUserData(data);
                        setTargetExam(data.targetExam || "");
                        setExamStage(data.examStage || "");
                        if (data.upiId) {
                            setUpiInput(data.upiId);
                        }
                    }
                } else {
                    router.push("/login");
                }
            } catch (error) {
                console.log("Profile Sync Error:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSelectExam = (exam: string) => {
        setTargetExam(exam);
        setExamStage("");
    };

    const handleUpdate = async () => {
        try {
            if (!user || !targetExam) return;

            if (needsStageSelection && !examStage) {
                alert("Please select your exam stage (CBT/Tier)");
                return;
            }

            const stageToSave = needsStageSelection ? examStage : "";

            await updateDoc(doc(db, "users", user.uid), {
                examType: "Central",
                state: "Central",
                targetExam: targetExam,
                examStage: stageToSave,
            });

            setUserData({
                ...userData,
                targetExam: targetExam,
                examStage: stageToSave,
            });

            setIsEditing(false);
        } catch (error) {
            console.log("Firestore Commit Error:", error);
        }
    };

    // 💰 UPI WITHDRAWAL HANDLER
    const handleWithdraw = async () => {
        setWithdrawMessage(null);
        const cleanUpi = upiInput.trim();

        if (!cleanUpi || !cleanUpi.includes("@")) {
            setWithdrawMessage({ text: "कृपया मान्य UPI ID दर्ज करें (उदा. user@oksbi)।", type: "error" });
            return;
        }

        const balance = userData?.walletBalance || 0;
        if (balance < MIN_WITHDRAWAL_INR) {
            setWithdrawMessage({ text: `न्यूनतम निकासी सीमा ₹${MIN_WITHDRAWAL_INR} है।`, type: "error" });
            return;
        }

        setWithdrawing(true);
        try {
            const res = await fetch("/api/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    upiId: cleanUpi,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setWithdrawMessage({ text: data.message, type: "success" });
                setUserData({
                    ...userData,
                    walletBalance: 0,
                    upiId: cleanUpi,
                });
            } else {
                setWithdrawMessage({ text: data.error || "निकासी विफल रही।", type: "error" });
            }
        } catch (err) {
            console.error("Withdrawal network error:", err);
            setWithdrawMessage({ text: "नेटवर्क त्रुटि हुई। कृपया पुनः प्रयास करें।", type: "error" });
        } finally {
            setWithdrawing(false);
        }
    };

    const getFormalMessage = () => {
        const code = userData?.referralCode || "SONI100";
        return (
            `🎯 *SoniLearn - SSC & Railway Mock Tests*\n\n` +
            `SSC और Railway परीक्षाओं की तैयारी के लिए SoniLearn ऐप इस्तेमाल करें। यहाँ TCS पैटर्न के PYQ और रियल टाइम ऑल इंडिया टेस्ट उपलब्ध हैं।\n\n` +
                `🎁 मेरा कूपन कोड इस्तेमाल करके प्रीमियम पास पर तुरंत 10% की छूट पाएं!\n\n` +
                `👉 कूपन कोड: *${code}*\n` +
            `📲 वेबसाइट पर जाएं: https://sonilearn.in`
        );
    };

    const handleCopyReferral = () => {
        const code = userData?.referralCode || "SONI100";
        navigator.clipboard.writeText(code);
        setCopiedReferral(true);
        setTimeout(() => setCopiedReferral(false), 2500);
    };

    const handleNativeShare = async () => {
        const msg = getFormalMessage();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "SoniLearn Discount Code",
                    text: msg,
                    url: "https://sonilearn.in",
                });
            } catch (err) {
                console.log("Share cancelled or failed:", err);
            }
        } else {
            handleWhatsAppShare();
        }
    };

    const handleWhatsAppShare = () => {
        const text = encodeURIComponent(getFormalMessage());
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    };

    const handleTelegramShare = () => {
        const text = encodeURIComponent(getFormalMessage());
        window.open(`https://t.me/share/url?url=https://sonilearn.in&text=${text}`, "_blank");
    };

    const handleFacebookShare = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=https://sonilearn.in`, "_blank");
    };

    const handleSmsShare = () => {
        const text = encodeURIComponent(getFormalMessage());
        window.open(`sms:?body=${text}`, "_blank");
    };

    const handleFeedbackSubmit = async () => {
        if (!feedbackText.trim()) return;

        try {
            setFeedbackSending(true);

            const feedbackData = {
                userId: user?.uid || "guest",
                userName: userData?.name || user?.email || "Student",
                userEmail: user?.email || "",
                message: feedbackText.trim(),
            };

            await addDoc(collection(db, "feedback"), {
                ...feedbackData,
                createdAt: serverTimestamp(),
            });

            fetch("/api/send-feedback-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(feedbackData),
            }).catch((err) => console.log("Notification error:", err));

            setFeedbackText("");
            setFeedbackSent(true);

            setTimeout(() => setFeedbackSent(false), 4000);
        } catch (error) {
            console.log("Feedback Submit Error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setFeedbackSending(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.log("Logout Pipeline Error:", error);
        }
    };

    const getStageLabel = (exam: string, stageValue: string): string => {
        const config = MULTI_STAGE_EXAMS[exam];
        if (!config || !stageValue) return "";
        const found = config.options.find((o) => o.value === stageValue);
        return found ? found.label : "";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-500 text-sm font-medium">Synchronizing profile metadata...</p>
                </div>
            </div>
        );
    }

    const currentStageLabel = userData?.examStage
        ? getStageLabel(userData.targetExam, userData.examStage)
        : "";

    const commitDisabled = !targetExam || (needsStageSelection && !examStage);
    const walletBalance = userData?.walletBalance || 0;
    const progressPercent = Math.min(100, Math.round((walletBalance / MIN_WITHDRAWAL_INR) * 100));

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-24 font-sans antialiased">

            {/* 🎯 REFERRAL DETAIL MODAL */}
            {showReferralModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                                    <Gift size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                        Refer & Earn ₹10 Cash
                                    </h3>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Per successful pass purchase
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReferralModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Rules */}
                        <div className="space-y-3 my-5">
                            <div className="flex items-start gap-3 bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                    1
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">अपना कोड शेयर करें</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                        दोस्त को अपना कोड भेजें। वह ऐप पर 3 दिन का फ्री ट्रायल ले सकता है।
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                    2
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">दोस्त को 10% की छूट मिलेगी</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                        जब वह ₹49 का प्रीमियम पास खरीदेगा, तो आपका कोड लगाने पर उसे पास सिर्फ ₹44 में मिलेगा।
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl">
                                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                    3
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-emerald-950">आपको ₹10 का सीधा कैश!</h4>
                                    <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                                        पेमेंट सफल होते ही आपके वॉलेट में ₹10 जुड़ जाएँगे। ₹100 होते ही आप UPI से सीधे निकाल सकते हैं।
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Code Box */}
                        <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex items-center justify-between gap-3 mb-4">
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Your Referral Code
                                </span>
                                <span className="text-base font-black tracking-widest text-amber-400 font-mono">
                                    {userData?.referralCode || "SONI100"}
                                </span>
                            </div>
                            <button
                                onClick={handleCopyReferral}
                                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
                            >
                                {copiedReferral ? (
                                    <>
                                        <Check size={13} className="text-emerald-400" /> Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={13} /> Copy
                                    </>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={handleNativeShare}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black h-12 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-98"
                        >
                            <Share2 size={16} /> Share With Friends
                        </button>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.push("/")}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200/60 px-3 py-2 rounded-xl border border-slate-200/40"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Workspace Account</span>
                        <span className="text-xs text-slate-700 font-bold tracking-tight">{user?.email}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* PROFILE BANNER */}
                <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-transparent to-transparent pointer-events-none" />
                    <div className="relative flex items-center gap-4 sm:gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-2xl shadow-inner text-blue-400">
                            <User size={32} />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                                <ShieldCheck size={11} /> Verified Account
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                                {userData?.name || "Student"}
                            </h2>
                            <p className="text-slate-400 mt-1.5 text-xs sm:text-sm font-medium">
                                Active node linked via auth configuration server.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">

                    <div className="space-y-6">

                        {/* 💰 WALLET & WITHDRAW CARD */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black tracking-tight text-slate-900">
                                            Referral Wallet
                                        </h3>
                                        <p className="text-slate-400 text-xs font-medium">
                                            Earn ₹10 on every friend's pass purchase
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Balance</span>
                                    <span className="text-2xl font-black text-emerald-600">₹{walletBalance}</span>
                                </div>
                            </div>

                            {/* Progress bar towards ₹100 */}
                            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mb-5">
                                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                                    <span>Payout Goal (Min ₹{MIN_WITHDRAWAL_INR})</span>
                                    <span>{progressPercent}% Complete</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium mt-2">
                                    {walletBalance >= MIN_WITHDRAWAL_INR
                                        ? "🎉 बधाई! आपका बैलेंस ₹100 पार हो गया है। नीचे अपनी UPI ID डालकर तुरंत विथड्रॉ करें।"
                                        : `विथड्रॉ अनलॉक करने के लिए ₹${MIN_WITHDRAWAL_INR - walletBalance} और चाहिए (लगभग ${Math.ceil((MIN_WITHDRAWAL_INR - walletBalance) / 10)} सफल रेफरल)।`}
                                </p>
                            </div>

                            {/* UPI Withdrawal Section */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Enter UPI ID to Withdraw
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="username@oksbi या 9876543210@paytm"
                                        value={upiInput}
                                        onChange={(e) => setUpiInput(e.target.value)}
                                        disabled={walletBalance < MIN_WITHDRAWAL_INR || withdrawing}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 disabled:opacity-60"
                                    />
                                    <button
                                        onClick={handleWithdraw}
                                        disabled={walletBalance < MIN_WITHDRAWAL_INR || withdrawing || !upiInput.trim()}
                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
                                    >
                                        {withdrawing ? (
                                            <>
                                                <Loader2 size={13} className="animate-spin" /> Processing
                                            </>
                                        ) : (
                                            <>
                                                <ArrowUpRight size={14} /> Withdraw
                                            </>
                                        )}
                                    </button>
                                </div>

                                {withdrawMessage && (
                                    <p className={`text-xs font-bold mt-2 ${withdrawMessage.type === "success" ? "text-emerald-600" : "text-rose-500"}`}>
                                        {withdrawMessage.text}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* TARGET CALIBRATION */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                                        <Target className="text-blue-600" size={18} /> Target Calibration
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-0.5 font-medium">Select your targeted execution pipeline.</p>
                                </div>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200/60 hover:border-blue-200 transition-all"
                                    >
                                        <Edit2 size={12} /> Modify
                                    </button>
                                )}
                            </div>

                            {!isEditing ? (
                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Configuration Target</span>
                                        <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                                            {userData?.targetExam || "No active pipeline selected"}
                                        </p>
                                        {currentStageLabel && (
                                            <span className="inline-flex items-center gap-1 mt-2 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                                <Layers size={11} />
                                                <span>{currentStageLabel}</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-600/10">
                                        <BookmarkCheck size={20} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2.5 block">Select Exam Profile</span>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[260px] overflow-y-auto pr-2 border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                                            {examsData.map((exam) => {
                                                const isSelected = targetExam === exam;
                                                return (
                                                    <button
                                                        key={exam}
                                                        onClick={() => handleSelectExam(exam)}
                                                        className={
                                                            isSelected
                                                                ? "px-3 py-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10"
                                                                : "px-3 py-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                                                        }
                                                    >
                                                        <span className="truncate">{exam}</span>
                                                        {isSelected && <Check size={12} className="flex-shrink-0 ml-1" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {needsStageSelection && (
                                        <div>
                                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2.5 block">
                                                {stageConfig.label}
                                            </span>
                                            <div className="grid grid-cols-2 gap-2">
                                                {stageConfig.options.map((opt) => {
                                                    const isSelected = examStage === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => setExamStage(opt.value)}
                                                            className={
                                                                isSelected
                                                                    ? "px-4 py-3 rounded-xl text-center text-xs font-bold border transition-all flex items-center justify-center gap-1.5 bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/10"
                                                                    : "px-4 py-3 rounded-xl text-center text-xs font-bold border transition-all flex items-center justify-center gap-1.5 bg-white border-slate-200 text-slate-700 hover:border-amber-300"
                                                            }
                                                        >
                                                            <Layers size={12} />
                                                            <span>{opt.label}</span>
                                                            {isSelected && <Check size={12} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 border border-slate-200 hover:bg-slate-50 rounded-xl py-3 font-bold text-xs text-slate-700 transition-colors"
                                        >
                                            Discard Changes
                                        </button>
                                        <button
                                            onClick={handleUpdate}
                                            disabled={commitDisabled}
                                            className={
                                                commitDisabled
                                                    ? "flex-1 rounded-xl py-3 font-bold text-xs transition-all shadow-md bg-slate-200 cursor-not-allowed shadow-none text-slate-400"
                                                    : "flex-1 rounded-xl py-3 font-bold text-xs text-white transition-all shadow-md bg-slate-900 hover:bg-slate-800"
                                            }
                                        >
                                            Commit Configuration
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* REFERRAL STRIP */}
                            <div className="mt-8 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 flex-shrink-0">
                                        <Gift size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs sm:text-sm font-black text-slate-900">
                                                Share & Earn Cash
                                            </span>
                                            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                                ₹10 Payout
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                            दोस्त को 10% की छूट और आपको ₹10 का सीधा UPI कैश मिलेगा।
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowReferralModal(true)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 flex-shrink-0"
                                >
                                    <span>Details & Share</span>
                                    <ChevronRight size={14} />
                                </button>
                            </div>

                            {/* FEEDBACK SECTION */}
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <div className="mb-4">
                                    <h3 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                                        <MessageSquare className="text-blue-600" size={18} /> Send Feedback
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-0.5 font-medium">
                                        Kuch problem hai ya suggestion dena hai? Yahan likhein.
                                    </p>
                                </div>

                                {feedbackSent && (
                                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl p-3 mb-4 flex items-center gap-2">
                                        <Check size={14} /> Feedback bhej diya gaya! Dhanyawad.
                                    </div>
                                )}

                                <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Apna feedback, suggestion ya problem yahan likhein..."
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 transition resize-none"
                                />

                                <div className="flex items-center justify-between mt-3 gap-3">
                                    <a
                                        href="mailto:supportsonilearn@gmail.com"
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5"
                                    >
                                        <Mail size={13} /> Email us directly
                                    </a>

                                    <button
                                        onClick={handleFeedbackSubmit}
                                        disabled={feedbackSending || !feedbackText.trim()}
                                        className={
                                            feedbackSending || !feedbackText.trim()
                                                ? "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs transition-all bg-slate-200 cursor-not-allowed shadow-none text-slate-400"
                                                : "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white transition-all shadow-md bg-blue-600 hover:bg-blue-700"
                                        }
                                    >
                                        {feedbackSending ? "Sending..." : (
                                            <>
                                                <Send size={13} /> Submit
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR CREDENTIALS & LOGOUT */}
                    <div className="space-y-5">
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">Identity Credentials</span>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                    <div className="bg-slate-100 text-slate-500 p-2 rounded-xl"><User size={16} /></div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-semibold block">Full Identity</span>
                                        <span className="text-sm font-bold text-slate-800">{userData?.name || "Student"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <div className="bg-slate-100 text-slate-500 p-2 rounded-xl"><Mail size={16} /></div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] text-slate-400 font-semibold block">Secure Endpoint</span>
                                        <span className="text-sm font-bold text-slate-800 truncate block">{user?.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm">
                            <span className="text-[11px] text-blue-500 font-bold uppercase tracking-wider mb-3 block">Need Help?</span>
                            <p className="text-xs text-slate-600 font-medium mb-3">
                                Kisi bhi query ya payout issue ke liye humein email karein.
                            </p>

                            <a
                                href="mailto:supportsonilearn@gmail.com"
                                className="inline-flex items-center gap-2 bg-white border border-blue-200 text-blue-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-all"
                            >
                                <Mail size={14} /> supportsonilearn@gmail.com
                            </a>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-xs py-3.5 px-4 rounded-2xl border border-slate-200/80 hover:border-red-200 shadow-sm transition-all active:scale-98"
                        >
                            <LogOut size={14} /> LOGOUT
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}