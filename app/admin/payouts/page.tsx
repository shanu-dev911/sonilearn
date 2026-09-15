"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc
} from "firebase/firestore";
import {
    CheckCircle2,
    Clock,
    ArrowUpRight,
    Copy,
    Check,
    ShieldAlert,
    Loader2,
    RefreshCw
} from "lucide-react";

interface PayoutRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    upiId: string;
    amount: number;
    status: "PENDING" | "COMPLETED";
    createdAt: string;
    completedAt?: string;
}

// 🎯 अधिकृत एडमिन ईमेल लिस्ट (ज़रूरत अनुसार अपनी दूसरी ईमेल भी जोड़ सकते हैं)
const ADMIN_EMAILS = [
    "supportsonilearn@gmail.com",
];

export default function AdminPayoutsPage() {
    const router = useRouter();

    const [authLoading, setAuthLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // 1. ADMIN AUTHENTICATION GUARD
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                alert("कृपया पहले एडमिन खाते से लॉग इन करें।");
                router.push("/login");
                return;
            }

            const currentEmail = (currentUser.email || "").toLowerCase().trim();
            const allowed = ADMIN_EMAILS.map((e) => e.toLowerCase().trim());

            if (!allowed.includes(currentEmail)) {
                alert("अनधिकृत पहुँच! केवल एडमिन ही यह पृष्ठ देख सकते हैं।");
                router.push("/");
                return;
            }

            setIsAuthorized(true);
            setAuthLoading(false);
        });

        return () => unsubscribeAuth();
    }, [router]);

    // 2. REALTIME FIRESTORE LISTENER FOR PAYOUTS
    useEffect(() => {
        if (!isAuthorized) return;

        const q = query(collection(db, "payout_requests"), orderBy("createdAt", "desc"));
        const unsubscribeSnapshot = onSnapshot(
            q,
            (snapshot) => {
                const docs = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                })) as PayoutRequest[];

                setRequests(docs);
                setLoading(false);
            },
            (error) => {
                console.error("Payout requests listener error:", error);
                setLoading(false);
            }
        );

        return () => unsubscribeSnapshot();
    }, [isAuthorized]);

    // 3. MARK STATUS AS COMPLETED
    const markCompleted = async (id: string, name: string, amount: number, upi: string) => {
        const confirmMsg = `क्या आपने ${name} को UPI (${upi}) पर ₹${amount} भेज दिए हैं?`;
        if (!window.confirm(confirmMsg)) return;

        setActionLoading(id);
        try {
            await updateDoc(doc(db, "payout_requests", id), {
                status: "COMPLETED",
                completedAt: new Date().toISOString(),
            });
        } catch (err: any) {
            console.error("Status update failed:", err);
            alert("स्टेटस अपडेट करने में समस्या हुई। कृपया पुनः प्रयास करें।");
        } finally {
            setActionLoading(null);
        }
    };

    // 4. COPY UPI ID TO CLIPBOARD
    const handleCopyUpi = (upiId: string, reqId: string) => {
        navigator.clipboard.writeText(upiId);
        setCopiedId(reqId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    एडमिन क्रेडेंशियल्स की पुष्टि हो रही है...
                </p>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    const pendingCount = requests.filter((r) => r.status === "PENDING").length;
    const completedCount = requests.filter((r) => r.status === "COMPLETED").length;
    const totalPendingAmount = requests
        .filter((r) => r.status === "PENDING")
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-900">
            <div className="max-w-4xl mx-auto">

                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider mb-1.5 border border-rose-200/60">
                            <ShieldAlert size={12} /> Admin Restricted Zone
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                            Payout Management
                        </h1>
                        <p className="text-slate-500 text-xs mt-0.5 font-medium">
                            छात्रों के ₹80 विथड्रॉवल रिक्वेस्ट्स का निपटान यहाँ से करें।
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition self-start sm:self-auto shadow-sm"
                    >
                        <RefreshCw size={13} /> रिफ्रेश
                    </button>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Pending Requests
                        </span>
                        <span className="text-2xl font-black text-amber-600 mt-1 block">
                            {pendingCount}
                        </span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            To Disburse
                        </span>
                        <span className="text-2xl font-black text-rose-600 mt-1 block">
                            ₹{totalPendingAmount}
                        </span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Completed
                        </span>
                        <span className="text-2xl font-black text-emerald-600 mt-1 block">
                            {completedCount}
                        </span>
                    </div>
                </div>

                {/* Requests List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 text-xs font-bold bg-white rounded-3xl border border-slate-200">
                            डेटा लोड हो रहा है...
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-200 text-sm">
                            फिलहाल कोई निकासी (Withdrawal) अनुरोध नहीं है।
                        </div>
                    ) : (
                        requests.map((req) => {
                            const isPending = req.status === "PENDING";
                            const formattedDate = req.createdAt
                                ? new Date(req.createdAt).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })
                                : "N/A";

                            return (
                                <div
                                    key={req.id}
                                    className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white ${isPending
                                            ? "border-amber-300 shadow-sm bg-amber-50/10 ring-1 ring-amber-100"
                                            : "border-slate-200 opacity-80"
                                        }`}
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <span className="font-black text-slate-900 text-sm">
                                                {req.userName || "Student"}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                ({req.userEmail || "No Email"})
                                            </span>
                                            {isPending ? (
                                                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                                                    <Clock size={11} /> PENDING
                                                </span>
                                            ) : (
                                                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                                    <CheckCircle2 size={11} /> COMPLETED
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                            {/* UPI Display with Click to Copy */}
                                            <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                                                <span className="text-xs font-mono font-black text-slate-800 tracking-wide select-all">
                                                    {req.upiId}
                                                </span>
                                                <button
                                                    onClick={() => handleCopyUpi(req.upiId, req.id)}
                                                    className="text-slate-400 hover:text-slate-700 transition"
                                                    title="Copy UPI"
                                                >
                                                    {copiedId === req.id ? (
                                                        <Check size={13} className="text-emerald-600" />
                                                    ) : (
                                                        <Copy size={13} />
                                                    )}
                                                </button>
                                            </div>

                                            <span className="text-lg font-black text-emerald-600 tracking-tight">
                                                ₹{req.amount}
                                            </span>

                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {formattedDate}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {isPending && (
                                        <button
                                            onClick={() =>
                                                markCompleted(
                                                    req.id,
                                                    req.userName,
                                                    req.amount,
                                                    req.upiId
                                                )
                                            }
                                            disabled={actionLoading === req.id}
                                            className="bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black px-5 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 self-start sm:self-auto shadow-md shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                                        >
                                            {actionLoading === req.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <ArrowUpRight size={15} /> Mark Completed
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
}