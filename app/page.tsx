"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { checkTrialStatus } from "@/lib/trial-check";
import {
  Flame,
  Trophy,
  Target,
  Crown,
  Rocket,
  Zap,
  ArrowUpRight,
  ScrollText,
  Newspaper,
  X,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Heart,
  History,
  CheckCircle2,
  XCircle,
  Star,
  Award,
  Users,
  BookCheck,
  ShieldCheck
} from "lucide-react";
import InstallPwaBanner from "@/components/InstallPwaBanner";
import UpdatePwaBanner from "@/components/UpdatePwaBanner";

interface TestAttempt {
  id: string;
  examTrack?: string;
  subject?: string;
  score: number;
  total: number;
  createdAt?: any;
  mode?: string;
}

export default function Dashboard() {
  const [userName, setUserName] = useState("Student");
  const [targetExam, setTargetExam] = useState("Not Set");
  const [isPremium, setIsPremium] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);

  // 🎯 Test History & Metrics States
  const [totalTests, setTotalTests] = useState(0);
  const [totalQuestionsAttempted, setTotalQuestionsAttempted] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [recentAttempts, setRecentAttempts] = useState<TestAttempt[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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

      await fetchUserTestHistory(currentUser.uid);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchUserTestHistory = async (uid: string) => {
    try {
      const resultsRef = collection(db, "exam_results");
      const q = query(
        resultsRef,
        where("userId", "==", uid),
        limit(50)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        let totalScoreSum = 0;
        let totalQuestionsSum = 0;
        const attemptsList: TestAttempt[] = [];

        snap.docs.forEach((d) => {
          const item = d.data();
          const score = Number(item.score || 0);
          const total = Number(item.total || 0);
          totalScoreSum += score;
          totalQuestionsSum += total;

          attemptsList.push({
            id: d.id,
            examTrack: item.examTrack || item.subject || "Practice Set",
            subject: item.subject || "Mixed",
            score: score,
            total: total > 0 ? total : 30,
            createdAt: item.createdAt,
            mode: item.mode || "Test",
          });
        });

        attemptsList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });

        setTotalTests(snap.size);
        setTotalQuestionsAttempted(totalQuestionsSum);
        setRecentAttempts(attemptsList);

        if (totalQuestionsSum > 0) {
          const acc = Math.round((totalScoreSum / totalQuestionsSum) * 100);
          setAvgAccuracy(acc);
        } else {
          setAvgAccuracy(0);
        }
      } else {
        setTotalTests(0);
        setTotalQuestionsAttempted(0);
        setAvgAccuracy(0);
        setRecentAttempts([]);
      }
    } catch (err) {
      console.error("Error reading exam_results history:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserDocument(user);
        setLoadingUserData(false);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

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

      {/* 🎯 PREMIUM WELCOME OVERLAY */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
              <Crown size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome to Premium! 🎉</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Payment successful! You now have full access to every feature.
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

      {/* 🎯 TESTBOOK STYLE TEST HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    My Test History & Attempts
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Verified records of all attempted tests
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Stats inside modal */}
            <div className="grid grid-cols-3 gap-2 py-4 border-b border-slate-100">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Sets</span>
                <span className="text-lg font-black text-slate-900">{totalTests}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Questions</span>
                <span className="text-lg font-black text-indigo-600">{totalQuestionsAttempted}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Accuracy</span>
                <span className="text-lg font-black text-emerald-600">{avgAccuracy}%</span>
              </div>
            </div>

            {/* Attempts Scroll List with Wrong Answer Calculation */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              {recentAttempts.length === 0 ? (
                <div className="text-center py-10">
                  <ScrollText size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">No test attempts yet!</p>
                  <p className="text-xs text-slate-400 mt-1">Start practicing to track your attempts.</p>
                </div>
              ) : (
                recentAttempts.map((att, idx) => {
                  const dateStr = att.createdAt?.toDate
                    ? att.createdAt.toDate().toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "Recent Test";

                  const correctAnswers = att.score;
                  const wrongAnswers = Math.max(0, att.total - att.score);

                  return (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-indigo-600">
                            {att.mode || "Test"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{dateStr}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-1 truncate">
                          {att.examTrack}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Subject: {att.subject}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-sm sm:text-base font-black text-slate-800">
                          {att.score} <span className="text-slate-400 text-xs font-bold">/ {att.total}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <CheckCircle2 size={10} /> {correctAnswers}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            <XCircle size={10} /> {wrongAnswers}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl text-xs uppercase tracking-wider transition"
            >
              Close History
            </button>
          </div>
        </div>
      )}

      {/* FIXED RESPONSIVE NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-2">
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

            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wider transition-all shadow-sm whitespace-nowrap ${isPremium
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
                  className="relative group overflow-hidden flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900 text-white text-[10px] sm:text-xs font-semibold hover:bg-slate-800 transition-all duration-300 shadow-md active:scale-95 whitespace-nowrap"
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

        {/* TRIAL BANNERS */}
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

        {/* HERO BANNER */}
        <div className="relative overflow-hidden bg-slate-900 text-white rounded-[1.5rem] sm:rounded-[1.75rem] p-5 sm:p-8 md:p-10 shadow-xl border border-slate-800 mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-indigo-900/30 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
            <div>
              <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-3 sm:mb-4 ${isPremium ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-blue-200"
                }`}>
                {isPremium && <Crown size={10} />}
                {isPremium ? "Premium Workspace" : "Workspace Active"}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Warrior {userName}
              </h2>
              <p className="text-slate-400 mt-2 text-xs sm:text-sm md:text-base max-w-xl font-medium leading-relaxed">
                Jo apne kadmon ki kaabiliyat par vishwas rakhte hain wahi aksar manzil tak pahunchte hain aaj ka ek-ek ghanta tumhari taakat banega🔥
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 min-w-[180px] sm:min-w-[200px] flex flex-col justify-center">
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold tracking-wider uppercase">Target Track</span>
              <span className="text-lg sm:text-xl font-black mt-0.5 sm:text-white tracking-tight">{targetExam}</span>
            </div>
          </div>
        </div>

        {/* SOCIAL PROOF & TRUST HIGHLIGHTS */}
        <section className="mb-6 sm:mb-8" aria-label="SoniLearn trust highlights">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              {
                value: "100,000+",
                label: "TCS Pattern Real PYQs",
                detail: "2016-2026",
                icon: BookCheck,
                color: "text-blue-600",
                background: "bg-blue-50",
              },
              {
                value: "All India",
                label: "Live Mock Ranking",
                detail: "& Percentile",
                icon: Users,
                color: "text-indigo-600",
                background: "bg-indigo-50",
              },
              {
                value: "3 Days",
                label: "Instant Free Trial Pass",
                detail: "Zero Card Required",
                icon: ShieldCheck,
                color: "text-emerald-600",
                background: "bg-emerald-50",
              },
              {
                value: "4.8 / 5",
                label: "Rated by Aspirants",
                detail: "SSC & Railway",
                icon: Star,
                color: "text-amber-600",
                background: "bg-amber-50",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.value} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${stat.background} ${stat.color}`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-bold leading-snug text-slate-600 sm:text-xs">{stat.label}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{stat.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200/80 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, text: "Full Bilingual", detail: "Hindi & English" },
              { icon: Award, text: "Real TCS Exam Interface", detail: "Timer & sectional cutoffs" },
              { icon: BookCheck, text: "Instant Detailed Solutions", detail: "Identify weak areas faster" },
              { icon: ShieldCheck, text: "Study Anywhere", detail: "Mobile, tablet & desktop" },
            ].map((highlight) => {
              const Icon = highlight.icon;
              return (
                <div key={highlight.text} className="flex items-center gap-3 bg-white px-4 py-3.5 sm:px-5">
                  <Icon size={18} className="shrink-0 text-blue-600" />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black text-slate-800">{highlight.text}</p>
                    <p className="truncate text-[10px] font-medium text-slate-500">{highlight.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* METRICS SECTION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            {
              label: "Sets Attempted",
              val: `${totalTests} Tests`,
              desc: "Total completed sets",
              color: "text-blue-600"
            },
            {
              label: "Questions Solved",
              val: `${totalQuestionsAttempted} Qs`,
              desc: "Attempted questions",
              color: "text-indigo-600"
            },
            {
              label: "Avg Accuracy",
              val: `${avgAccuracy}%`,
              desc: "Success conversion",
              color: "text-emerald-600"
            },
            {
              label: "Target Exam",
              val: targetExam !== "Not Set" ? targetExam : "Active",
              desc: "Current focal track",
              color: "text-amber-600"
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-sm">
              <p className="text-[9px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider truncate">{item.label}</p>
              <p className={`text-sm sm:text-lg font-black mt-0.5 sm:mt-1 ${item.color} truncate`}>{item.val}</p>
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* COMPACT INTERACTIVE DASHBOARD CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6">

          {/* 1. DAILY CHALLENGE CARD */}
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
                Execute a fresh set of 30 calibrated items daily to measure national placement matrix.
              </p>
            </div>
          </button>

          {/* 2. WEAK PRACTICE CARD */}
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
                Pehle ki gayi galtiyon ko sudharo aur kamzor topics par focus karke score badhao.
              </p>
            </div>
          </button>

          {/* 3. PYQ PRACTICE CARD */}
          <button
            onClick={() => router.push("/pyq")}
            className="group relative bg-white border border-indigo-200 hover:border-indigo-500 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between min-h-[160px] sm:min-h-[220px] active:scale-[0.99] w-full"
          >
            <div className="flex items-center justify-between w-full mb-4 sm:mb-0">
              <div className="bg-indigo-50 text-indigo-600 p-2.5 sm:p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <ScrollText size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                <ArrowUpRight size={18} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                PYQ Practice
              </h3>
              <p className="text-slate-500 text-[11px] sm:text-xs mt-1.5 sm:mt-2 font-medium leading-relaxed">
                Har attempt mein naye PYQs — real exam pattern par daily practice
              </p>
            </div>
          </button>

          {/* 4. CURRENT AFFAIRS CARD */}
          <button
            onClick={() => router.push("/current-affairs")}
            className="group relative bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between min-h-[160px] sm:min-h-[220px] active:scale-[0.99] w-full"
          >
            <div className="flex items-center justify-between w-full mb-4 sm:mb-0">
              <div className="bg-emerald-50 text-emerald-600 p-2.5 sm:p-3 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Newspaper size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="text-slate-300 group-hover:text-emerald-600 transition-colors">
                <ArrowUpRight size={18} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Current Affairs
              </h3>
              <p className="text-slate-500 text-[11px] sm:text-xs mt-1.5 sm:mt-2 font-medium leading-relaxed">
                Exam ke liye sabse zaroori 30 current affairs sawal — roz naya update
              </p>
            </div>
          </button>

          {/* 5. 🎯 MY TEST HISTORY CARD (LEADERBOARD KE THEEK PEHLE) */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="group relative bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col justify-between min-h-[160px] sm:min-h-[220px] active:scale-[0.99] w-full"
          >
            <div className="flex items-center justify-between w-full mb-4 sm:mb-0">
              <div className="bg-indigo-50 text-indigo-600 p-2.5 sm:p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <History size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                <span>{totalTests} Tests Done</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                My Test History
              </h3>
              <p className="text-slate-500 text-[11px] sm:text-xs mt-1.5 sm:mt-2 font-medium leading-relaxed">
                Kitne set maare hain, kitna score aaya aur test analysis yahan dekho.
              </p>
            </div>
          </button>

          {/* 6. LEADERBOARD CARD */}
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
                Live Leaderboard par apni rank aur overall performance check karo
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
                High-level Maths aur Reasoning questions — topper level practice.
              </p>
            </div>
          </div>
          <div className="bg-slate-950 text-white group-hover:bg-blue-600 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs shadow-md transition-all whitespace-nowrap self-stretch text-center sm:self-auto flex items-center justify-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
            Start <ArrowUpRight size={14} />
          </div>
        </button>

        {/* FOOTER */}
        <footer className="mt-8 mb-6 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase tracking-wider mb-2.5">
                <Heart size={11} className="text-red-500 fill-red-500" /> Made for Aspirants
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                SoniLearn Educational Platform
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
                Helping students across India with daily practice questions, fast revision, and live results.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-600 font-semibold">
                Designed & Developed by{" "}
                <span className="font-black text-slate-900">Shanu Sharma</span>
                <span className="text-slate-400 block sm:inline sm:ml-1 text-[11px]">
                  (Founder & Lead Architect)
                </span>
              </p>
            </div>

            <div className="pt-1">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-3">
                Connect With Us
              </span>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <a
                  href="https://www.instagram.com/sonilearn.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-pink-600 flex items-center justify-center hover:bg-pink-50 hover:border-pink-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Instagram size={18} />
                </a>

                <a
                  href="https://www.facebook.com/sonilearn.official"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-blue-600 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Facebook size={18} />
                </a>

                <a
                  href="https://www.youtube.com/@sonilearnin"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-red-600 flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Youtube size={18} />
                </a>

                <a
                  href="https://www.linkedin.com/in/shanu-sharma-9a4950432/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-blue-700 flex items-center justify-center hover:bg-sky-50 hover:border-sky-200 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Linkedin size={18} />
                </a>
              </div>
            </div>

            <nav className="pt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-2" aria-label="Legal and support">
              <a href="/terms" className="text-xs font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-blue-600 hover:decoration-blue-300">
                Terms &amp; Conditions
              </a>
              <a href="/privacy" className="text-xs font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-blue-600 hover:decoration-blue-300">
                Privacy Policy
              </a>
              <a href="/refund" className="text-xs font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-blue-600 hover:decoration-blue-300">
                Refund Policy
              </a>
              <a href="/contact" className="text-xs font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-blue-600 hover:decoration-blue-300">
                Contact Us
              </a>
            </nav>

            <div className="pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              © {new Date().getFullYear()} SoniLearn. All rights reserved.
            </div>
          </div>
        </footer>
      </main>

      <InstallPwaBanner />
      <UpdatePwaBanner />
    </div>
  );
}