"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Flame, Trophy, Target, Crown, Rocket, Zap, ArrowUpRight, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  const [userName, setUserName] = useState("Student");
  const [targetExam, setTargetExam] = useState("SSC GD");
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setUserName(data.name?.split(" ")[0] || "Student");
            setTargetExam(data.targetExam || "SSC GD");
            setIsPremium(data.isPremium || false);
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        router.push("/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500 text-sm font-medium tracking-wide">Securing session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-24 font-sans selection:bg-blue-600 selection:text-white">
      {/* GLOBAL ENTERPRISE NAVBAR */}
      <header className="sticky top-0确定 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            {/* BRAND BRANDING */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white font-black w-9 h-9 rounded-xl flex items-center justify-center text-lg tracking-tighter shadow-md shadow-blue-600/20">
                S
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                  SoniLearn
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                    Portal: {targetExam}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION PIPELINE */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${isPremium
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
              >
                {isPremium ? <ShieldCheck size={12} /> : <Zap size={12} />}
                {isPremium ? "Enterprise Pro" : "Standard Tier"}
              </div>

              {!isPremium && (
                <button
                  onClick={() => router.push("/premium")}
                  className="relative group overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all duration-300 shadow-md active:scale-98"
                >
                  <Rocket size={13} className="text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Upgrade Workspace</span>
                </button>
              )}

              <button
                onClick={() => router.push("/profile")}
                className="w-9 h-9 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-xl flex items-center justify-center text-sm transition-all duration-200 active:scale-95 border border-slate-200/60"
              >
                👤
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTAINER CONTROL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* PREMIUM MINIMALIST BANNER */}
        <div className="relative overflow-hidden bg-slate-900 text-white rounded-[1.75rem] p-6 sm:p-8 md:p-10 shadow-xl border border-slate-800 mb-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-indigo-900/30 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-4">
                Workspace Active
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Welcome back, {userName}
              </h2>
              <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-xl font-medium">
                Your performance track is calibrated. Access your modules below to continue your dynamic assessment pipeline.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[200px] flex flex-col justify-center">
              <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Target Track</span>
              <span className="text-xl font-black mt-1 text-white tracking-tight">{targetExam}</span>
            </div>
          </div>
        </div>

        {/* ENTERPRISE METRICS SECTION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Daily Status", val: "Calibrated", desc: "System operational", color: "text-blue-600" },
            { label: "Core Subject Focus", val: "All Active", desc: "4 tracks sync", color: "text-indigo-600" },
            { label: "Revision Velocity", val: "Instant", desc: "Rapid access live", color: "text-amber-600" },
            { label: "Security Token", val: "Verified", desc: "Cloud backup locked", color: "text-emerald-600" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</p>
              <p className={`text-lg font-black mt-1 ${item.color}`}>{item.val}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* COMPACT INTERACTIVE DASHBOARD CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          {/* DAILY CHALLENGE CARD */}
          <button
            onClick={() => router.push("/daily")}
            className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between min-h-[220px] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="bg-red-50 text-red-600 p-3 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                <Flame size={24} />
              </div>
              <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Daily Challenge
              </h3>
              <p className="text-slate-500 text-xs mt-2 font-medium leading-relaxed">
                Execute a fresh set of 20 calibrated items daily to measure national placement matrix.
              </p>
            </div>
          </button>

          {/* WEAK PRACTICE CARD */}
          <button
            onClick={() => router.push("/weak")}
            className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between min-h-[220px] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Target size={24} />
              </div>
              <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Weak Practice
              </h3>
              <p className="text-slate-500 text-xs mt-2 font-medium leading-relaxed">
                Isolate historical structural errors. Focus resources directly onto high-error components.
              </p>
            </div>
          </button>

          {/* LEADERBOARD CARD */}
          <button
            onClick={() => router.push("/leaderboard")}
            className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between min-h-[220px] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Trophy size={24} />
              </div>
              <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Leaderboard Matrix
              </h3>
              <p className="text-slate-500 text-xs mt-2 font-medium leading-relaxed">
                Review verified performance tracking data across peer student demographics nationwide.
              </p>
            </div>
          </button>
        </div>

        {/* HERO RAPID ASSESSMENT ENGINE */}
        <button
          onClick={() => router.push("/fast-test")}
          className="w-full bg-white hover:bg-slate-900/5 group border border-slate-200 hover:border-amber-500 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 active:scale-[0.995] mb-8 shadow-sm"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="bg-amber-50 text-amber-600 p-3.5 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
              <Crown size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] tracking-wider font-black text-amber-700 uppercase">
                <Zap size={10} /> Rapid Revision Engine
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                ⚡ Launch Fast Test Engine
              </h3>
              <p className="text-slate-500 text-xs font-medium">
                Initiate a high-velocity 5-minute evaluation cycle for structural retention review.
              </p>
            </div>
          </div>
          <div className="bg-slate-950 text-white group-hover:bg-blue-600 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all whitespace-nowrap self-end md:self-auto flex items-center gap-1.5">
            Start <ArrowUpRight size={14} />
          </div>
        </button>

        {/* BUSINESS COMPLIANCE FOOTER / MOTIVATION */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center shadow-sm max-w-xl mx-auto">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            SoniLearn Core Architecture
          </p>
          <p className="text-slate-500 italic text-xs font-medium mt-1.5">
            "Consistency beats motivation. Practice every single day."
          </p>
        </div>
      </main>
    </div>
  );
}