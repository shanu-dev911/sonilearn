"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { checkTrialStatus } from "@/lib/trial-check";
import { Flame, Trophy, Target, Crown, Rocket, Zap, ArrowUpRight, ShieldCheck, Sparkles, X } from "lucide-react";

export default function Dashboard() {
  const [userName, setUserName] = useState("Student");
  const [targetExam, setTargetExam] = useState("Not Set");
  const [isPremium, setIsPremium] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchUserDocument = async (currentUser: any) => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const premiumValue = checkTrialStatus(data).isPremium;
        setUserData(data);
        setUserName(data.name || currentUser.displayName || "Student");
        setTargetExam(data.targetExam || "Not Set");
        setIsPremium(premiumValue);
      } else {
        setUserName(currentUser.displayName || "Student");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserDocument(user);
      } else {
        router.push("/login");
      }
      setLoadingUserData(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 🎯 Show welcome celebration if just came back from successful payment
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setShowWelcome(true);

      const refreshPremiumState = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await fetchUserDocument(currentUser);
        }
      };

      refreshPremiumState();
      // Clean the URL so refresh doesn't re-trigger it
      window.history.replaceState({}, "", "/");

      const timer = setTimeout(() => setShowWelcome(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const trialStatus = userData ? checkTrialStatus(userData) : null;

  if (loadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-24 font-sans selection:bg-blue-600 selection:text-white">

      {/* 🎯 PREMIUM WELCOME CELEBRATION OVERLAY */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
              <Crown size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome to Premium! 🎉</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Payment successful! You now have full access to every feature — Warrior Questions, unlimited Daily Challenge, Leaderboard, and more.
            </p>
            <button
              onClick={() => setShowWelcome(false)}
              className="w-full mt-6 bg-slate-900 text-white h-12 rounded-xl font-bold text-sm"
            >
              Let's Go 🚀
            </button>
          </div>
        </div>
      )}

      {/* FIXED RESPONSIVE NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* BRAND LOGO */}
            <div className="flex items-center gap-2 max-w-[45%] sm:max-w-none">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="SoniLearn Logo"
                  width={40}
                  height={40}
                  priority
                  className="w-full h-full"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-base sm:text-lg font-black text-blue-700 tracking-tight leading-none truncate">
                  SONI<span className="text-cyan-500">learn</span>
                </h1>
                <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold tracking-wider uppercase mt-0.5 truncate">
                  Your Daily Partner
                </p>
              </div>
            </div>

            {/* ACTION PIPELINE */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 🎯 DYNAMIC MEMBERSHIP BADGE — Premium gets a distinct golden style */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wider transition-all shadow-sm whitespace-nowrap ${
                  isPremium
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white border border-amber-300"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {isPremium ? <Crown size={10} className="sm:w-3 sm:h-3" /> : <Zap size={10} className="sm:w-3 sm:h-3" />}
                <span>{isPremium ? "Premium" : "Free Tier"}</span>
              </div>

              {!isPremium && (
                <button
                  onClick={() => router.push("/premium")}
                  className="relative group overflow-hidden flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900 text-white text-[10px] sm:text-xs font-semibold hover:bg-slate-800 transition-all duration-300 shadow-md active:scale-98 whitespace-nowrap"
                >
                  <Rocket size={11} className="text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform hidden sm:inline" />
                  <span>Upgrade</span>
                </button>
              )}

              <button
                onClick={() => router.push("/profile")}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-xl flex items-center justify-center text-xs sm:text-sm transition-all duration-200 active:scale-95 border border-slate-200/60 flex-shrink-0"
              >
                👤
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTAINER CONTROL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">

        {/* 🎯 TRIAL BANNER — only shown to non-premium users who still have trial days left */}
        {!isPremium && trialStatus && trialStatus.isTrialActive && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
            <p className="text-blue-700 text-xs sm:text-sm font-bold">
              🎁 {trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? "s" : ""} left in your free trial
            </p>
            <button
              onClick={() => router.push("/premium")}
              className="text-blue-600 text-xs font-black underline flex-shrink-0"
            >
              Upgrade Now
            </button>
          </div>
        )}

        {/* 🎯 TRIAL EXPIRED BANNER */}
        {!isPremium && trialStatus && !trialStatus.isTrialActive && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
            <p className="text-rose-700 text-xs sm:text-sm font-bold">
              ⏰ Your free trial has ended
            </p>
            <button
              onClick={() => router.push("/premium")}
              className="bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-lg flex-shrink-0"
            >
              Upgrade — ₹49
            </button>
          </div>
        )}

        {/* PREMIUM MINIMALIST BANNER */}
        <div className={`relative overflow-hidden bg-slate-900 text-white rounded-[1.5rem] sm:rounded-[1.75rem] p-5 sm:p-8 md:p-10 shadow-xl border mb-6 sm:mb-8 ${isPremium ? "border-amber-400/40" : "border-slate-800"
          }`}>
          <div className={`absolute inset-0 pointer-events-none ${isPremium
              ? "bg-gradient-to-tr from-amber-900/30 via-transparent to-amber-700/20"
              : "bg-gradient-to-tr from-blue-900/40 via-transparent to-indigo-900/30"
            }`} />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
            <div>
              <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-3 sm:mb-4 ${
                isPremium ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-blue-200"
              }`}>
                {isPremium && <Crown size={10} />}
                {isPremium ? "Premium Workspace" : "Workspace Active"}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Welcome , {userName}
              </h2>
              <p className="text-slate-400 mt-2 text-xs sm:text-sm md:text-base max-w-xl font-medium leading-relaxed">
                Your performance track is calibrated. Access your modules below to continue your dynamic assessment pipeline.
              </p>
            </div>
            <div className={`border backdrop-blur-md rounded-2xl p-4 min-w-[180px] sm:min-w-[200px] flex flex-col justify-center ${isPremium ? "bg-amber-400/10 border-amber-400/20" : "bg-white/5 border-white/10"
              }`}>
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold tracking-wider uppercase">Target Track</span>
              <span className="text-lg sm:text-xl font-black mt-0.5 text-white tracking-tight">{targetExam}</span>
            </div>
          </div>
        </div>

        {/* ENTERPRISE METRICS SECTION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "Daily Status", val: "Calibrated", desc: "System operational", color: "text-blue-600" },
            { label: "Core Focus", val: "All Active", desc: "4 tracks sync", color: "text-indigo-600" },
            { label: "Velocity", val: "Instant", desc: "Rapid access live", color: "text-amber-600" },
            { label: "Security", val: "Verified", desc: "Cloud locked", color: "text-emerald-600" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-sm">
              <p className="text-[9px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider truncate">{item.label}</p>
              <p className={`text-sm sm:text-lg font-black mt-0.5 sm:mt-1 ${item.color} truncate`}>{item.val}</p>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* COMPACT INTERACTIVE DASHBOARD CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-6">

          {/* DAILY CHALLENGE CARD */}
          <button
            onClick={() => router.push("/daily")}
            className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between min-h-[160px] sm:min-h-[220px] active:scale-[0.99] w-full"
          >
            <div className="flex items-center justify-between w-full mb-4 sm:mb-0">
              <div className="bg-red-50 text-red-600 p-2.5 sm:p-3 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                <Flame size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                <ArrowUpRight size={18} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Daily Challenge
              </h3>
              <p className="text-slate-500 text-[11px] sm:text-xs mt-1.5 sm:mt-2 font-medium leading-relaxed">
                Execute a fresh set of 20 calibrated items daily to measure national placement matrix.
              </p>
            </div>
          </button>

          {/* WEAK PRACTICE CARD */}
          <button
            onClick={() => router.push("/weak")}
            className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between min-h-[160px] sm:min-h-[220px] active:scale-[0.99] w-full"
          >
            <div className="flex items-center justify-between w-full mb-4 sm:mb-0">
              <div className="bg-blue-50 text-blue-600 p-2.5 sm:p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Target size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                <ArrowUpRight size={18} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Weak Practice
              </h3>
              <p className="text-slate-500 text-[11px] sm:text-xs mt-1.5 sm:mt-2 font-medium leading-relaxed">
                Isolate historical structural errors. Focus resources directly onto high-error components.
              </p>
            </div>
          </button>

          {/* LEADERBOARD CARD */}
          <button
            onClick={() => router.push("/leaderboard")}
            className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between min-h-[160px] sm:min-h-[220px] active:scale-[0.99] w-full"
          >
            <div className="flex items-center justify-between w-full mb-4 sm:mb-0">
              <div className="bg-indigo-50 text-indigo-600 p-2.5 sm:p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Trophy size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                <ArrowUpRight size={18} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Leaderboard Matrix
              </h3>
              <p className="text-slate-500 text-[11px] sm:text-xs mt-1.5 sm:mt-2 font-medium leading-relaxed">
                Review verified performance tracking data across peer student demographics nationwide.
              </p>
            </div>
          </button>
        </div>

        {/* HERO RAPID ASSESSMENT ENGINE */}
        <button
          onClick={() => router.push("/fast-test")}
          className="w-full bg-white hover:bg-slate-900/5 group border border-slate-200 hover:border-amber-500 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 active:scale-[0.995] mb-6 sm:mb-8 shadow-sm"
        >
          <div className="flex items-start sm:items-center gap-3.5 text-left w-full sm:w-auto">
            <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 flex-shrink-0">
              <Crown size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] tracking-wider font-black text-amber-700 uppercase">
                <Zap size={10} />Math/Reasoning
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate">
                🎯 Warrior Battle Questions
              </h3>
              <p className="text-slate-500 text-[11px] sm:text-xs font-medium leading-normal">
                Initiate a high-velocity -minute evaluation cycle for structural review.
              </p>
            </div>
          </div>
          <div className="bg-slate-950 text-white group-hover:bg-blue-600 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs shadow-md transition-all whitespace-nowrap align-self-stretch text-center sm:self-auto flex items-center justify-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
            Start <ArrowUpRight size={14} />
          </div>
        </button>

        {/* BUSINESS COMPLIANCE FOOTER */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center shadow-sm max-w-xl mx-auto">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            SoniLearn Core Architecture
          </p>
          <p className="text-slate-500 italic text-[11px] sm:text-xs font-medium mt-1.5">
            "Consistency beats motivation. Practice every single day."
          </p>
        </div>
      </main>
    </div>
  );
}