"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, ShieldCheck, Target, LogOut, Check, Edit2, BookmarkCheck } from "lucide-react";

// 🎯 EXAMS CONFIGURATION PIPELINE
const examsData = [
    "SSC CGL", "SSC CHSL", "SSC MTS", "SSC GD", "SSC CPO", "SSC Stenographer", "SSC JE",
    "RRB NTPC", "RRB Group D", "RRB ALP", "RRB Technician", "RRB JE", "RRB SSE",
    "RRB Paramedical", "RRB Ministerial & Isolated", "RRB Apprentice"
];

export default function ProfilePage() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [targetExam, setTargetExam] = useState("");

    // LOAD USER PROFILE DATA
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    setUser(currentUser);
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        setUserData(data);
                        setTargetExam(data.targetExam || "");
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

    // UPDATE TARGET DATA ASSIGNMENT
    const handleUpdate = async () => {
        try {
            if (!user || !targetExam) return;

            await updateDoc(doc(db, "users", user.uid), {
                examType: "Central",
                state: "Central",
                targetExam,
            });

            setUserData({
                ...userData,
                targetExam,
            });

            setIsEditing(false);
        } catch (error) {
            console.log("Firestore Commit Error:", error);
        }
    };

    // LOGOUT ACTION
    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.log("Logout Pipeline Error:", error);
        }
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

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-24 font-sans antialiased">

            {/* STICKY CONTROL NAV */}
            <div className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.push("/")}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200/60 px-3 py-2 rounded-xl border border-slate-200/40"
                    >
                        <ArrowLeft size={14} /> Back to Space
                    </button>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Workspace Account</span>
                        <span className="text-xs text-slate-700 font-bold tracking-tight">{user?.email}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* HERO USER PROFILE GRID */}
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

                {/* ENTERPRISE INTERACTIVE PROFILE TILES */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">

                    {/* LEFT WORKSPACE CARD: TARGET EXAM ENGINE */}
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
                                </div>
                                <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-600/10">
                                    <BookmarkCheck size={20} />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* GRID FORMATTED INTERACTIVE MODULE BUTTONS */}
                                <div>
                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2.5 block">Select Exam Profile</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[260px] overflow-y-auto pr-2 border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                                        {examsData.map((exam) => {
                                            const isSelected = targetExam === exam;
                                            return (
                                                <button
                                                    key={exam}
                                                    onClick={() => setTargetExam(exam)}
                                                    className={`px-3 py-2.5 rounded-xl text-left text-xs font-bold border transition-all flex items-center justify-between ${isSelected
                                                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10"
                                                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                                                        }`}
                                                >
                                                    <span className="truncate">{exam}</span>
                                                    {isSelected && <Check size={12} className="flex-shrink-0 ml-1" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 border border-slate-200 hover:bg-slate-50 rounded-xl py-3 font-bold text-xs text-slate-700 transition-colors"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={!targetExam}
                                        className={`flex-1 rounded-xl py-3 font-bold text-xs text-white transition-all shadow-md ${targetExam
                                                ? "bg-slate-900 hover:bg-slate-800"
                                                : "bg-slate-200 cursor-not-allowed shadow-none text-slate-400"
                                            }`}
                                    >
                                        Commit Configuration
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT WORKSPACE CARD: SECURE ACCOUNT SCHEMATICS */}
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

                        {/* ENTERPRISE TERMINATE SESSION OPERATION */}
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