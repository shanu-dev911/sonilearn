"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { checkTrialStatus } from "@/lib/trial-check";
import InstallPwaBanner from "@/components/InstallPwaBanner";
import {
  Flame,
  Trophy,
  Target,
  Crown,
  Zap,
  ArrowRight,
  Sparkles,
  X,
  Newspaper,
  BookOpen,
  Swords,
  Gift,
  Copy,
  Check,
  BarChart3,
  ListChecks,
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userName, setUserName] = useState("Student");
  const [targetExam, setTargetExam] = useState("Not Set");
  const [isPremium, setIsPremium] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [uid, setUid] = useState<string>("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [copied, setCopied] = useState(false);

  // 🎯 PROGRESS STATS
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setUid(user.uid);
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            setUserName(data.name || user.displayName || "Student");
            setTargetExam(data.targetExam || "Not Set");
            setIsPremium(data.isPremium || false);
          } else {
            setUserName(user.displayName || "Student");
          }

          // 🎯 Load progress stats from this user's exam_results
          const resultsQuery = query(
            collection(db, "exam_results"),
            where("userId", "==", user.uid)
          );
          const resultsSnap = await getDocs(resultsQuery);

          let attempts = 0;
          let accuracySum = 0;
          let best = 0;

          resultsSnap.forEach((d) => {
            const r = d.data();
            const score = Number(r.score || 0);
            const total = Number(r.total || 0);
            if (total > 0) {
              attempts++;
              const pct = (score / total) * 100;
              accuracySum += pct;
              if (pct > best) best = pct;
            }
          });

          setTotalAttempts(attempts);
          setAvgAccuracy(attempts > 0 ? Math.round(accuracySum / attempts) : 0);
          setBestScore(Math.round(best));
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setShowWelcome(true);
      window.history.replaceState({}, "", "/");
      const timer = setTimeout(() => setShowWelcome(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const trialStatus = userData ? checkTrialStatus(userData) : null;

  const referralCode = uid ? "SONI-" + uid.slice(0, 6).toUpperCase() : "";
  const referralLink = referralCode ? `https://sonilearn.in/signup?ref=${referralCode}` : "";

  const handleCopyReferral = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleShareReferral = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SoniLearn — Free SSC/RRB Practice",
          text: "Join me on SoniLearn for free SSC & Railway exam practice! Use my link to get bonus trial days:",
          url: referralLink,
        });
      } catch (err) {
        // user cancelled share — no action needed
      }
    } else {
      handleCopyReferral();
    }
  };

  const practiceCards = [
    {
      key: "daily",
      label: "Daily Challenge",
      desc: "20 questions daily to boost your score",
      icon: Flame,
      bg: "bg-rose-50",
      text: "text-rose-500",
      path: "/daily",
      alwaysFree: true,
    },
    {
      key: "weak",
      label: "Weak Practice",
      desc: "Focus on your weak topics",
      icon: Target,
      bg: "bg-blue-50",
      text: "text-blue-500",
      path: "/weak",
    },
    {
      key: "pyq",
      label: "PYQ Practice",
      desc: "Practice previous year questions",
      icon: BookOpen,
      bg: "bg-violet-50",
      text: "text-violet-500",
      path: "/pyq",
    },
    {
      key: "current-affairs",
      label: "Current Affairs",
      desc: "Stay updated with daily current affairs",
      icon: Newspaper,
      bg: "bg-emerald-50",
      text: "text-emerald-500",
      path: "/current-affairs",
    },
    {
      key: "warrior",
      label: "Warrior Battleground",
      desc: "High-velocity Math/Reasoning practice",
      icon: Swords,
      bg: "bg-amber-50",
      text: "text-amber-500",
      path: "/fast-test",
    },
    {
      key: "leaderboard",
      label: "Leaderboard Matrix",
      desc: "Check your rank and improve",
      icon: Trophy,
      bg: "bg-indigo-50",
      text: "text-indigo-500",
      path: "/leaderboard",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">

      {/* 🎯 PREMIUM WELCOME CELEBRATION OVERLAY */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative">
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

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex-shrink-0">
                <Image src="/logo.svg" alt="SoniLearn" width={32} height={32} priority className="w-full h-full" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black text-blue-700 tracking-tight">
                  SONI<span className="text-cyan-500">learn</span>
                </span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wide">
                  Learn Smart. Practice More. Achieve Big.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isPremium && (
                <button
                  onClick={() => router.push("/premium")}
                  className="flex items-center gap-1.5 border border-amber-300 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-bold"
                >
                  <Crown size={13} /> Upgrade
                </button>
              )}
              {isPremium && (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold">
                  <Crown size={13} /> Premium
                </div>
              )}
              <button
                onClick={() => router.push("/profile")}
                className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200"
              >
                👤
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">

        {/* 🎯 TRIAL BANNERS */}
        {!isPremium && trialStatus && trialStatus.isTrialActive && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-blue-700 text-xs sm:text-sm font-bold">
              🎁 {trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? "s" : ""} left in your free trial
            </p>
            <button onClick={() => router.push("/premium")} className="text-blue-600 text-xs font-black underline flex-shrink-0">
              Upgrade Now
            </button>
          </div>
        )}
        {!isPremium && trialStatus && !trialStatus.isTrialActive && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-rose-700 text-xs sm:text-sm font-bold">⏰ Your free trial has ended</p>
            <button onClick={() => router.push("/premium")} className="bg-rose-600 text-white text-xs font-black px-3 py-1.5 rounded-lg flex-shrink-0">
              Upgrade — ₹49
            </button>
          </div>
        )}

        {/* HERO SECTION */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-100/60 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-slate-500 text-sm font-medium">Welcome back,</p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                {userName} 👋
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-[220px] sm:max-w-xs leading-relaxed">
                Let's continue your preparation today.
              </p>

              <div className="inline-flex items-center gap-1.5 bg-white/80 border border-blue-100 rounded-full px-3 py-1.5 mt-3">
                <Target size={12} className="text-blue-600" />
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">{targetExam}</span>
              </div>

              <button
                onClick={() => router.push("/daily")}
                className="mt-4 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all"
              >
                Continue Learning <ArrowRight size={15} />
              </button>
            </div>

            <div className="hidden sm:block w-36 md:w-44 flex-shrink-0 -mb-8">
              <Image
                src="/ram.png.jpeg"
                alt="Study Buddy"
                width={200}
                height={260}
                className="w-full h-auto object-contain drop-shadow-xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* PRACTICE SECTION */}
        <div>
          <h2 className="text-base font-black text-slate-900 mb-3">Practice Section</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {practiceCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.key}
                  onClick={() => router.push(card.path)}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 text-left shadow-sm hover:shadow-md hover:border-slate-300 transition-all relative"
                >
                  <div className={`w-10 h-10 ${card.bg} ${card.text} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={18} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{card.label}</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1 leading-snug line-clamp-2">
                    {card.desc}
                  </p>
                  <ArrowRight size={13} className={`absolute bottom-3 right-3 ${card.text}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* YOUR PROGRESS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-slate-900">Your Progress</h2>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 grid grid-cols-3 divide-x divide-slate-100">
            <div className="text-center px-2">
              <ListChecks size={18} className="text-blue-500 mx-auto mb-1.5" />
              <p className="text-lg sm:text-xl font-black text-slate-900">{totalAttempts}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Tests Attempted</p>
            </div>
            <div className="text-center px-2">
              <BarChart3 size={18} className="text-emerald-500 mx-auto mb-1.5" />
              <p className="text-lg sm:text-xl font-black text-slate-900">{avgAccuracy}%</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Avg Accuracy</p>
            </div>
            <div className="text-center px-2">
              <Sparkles size={18} className="text-amber-500 mx-auto mb-1.5" />
              <p className="text-lg sm:text-xl font-black text-slate-900">{bestScore}%</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Best Score</p>
            </div>
          </div>
        </div>

        {/* REFERRAL SECTION */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-emerald-800">Invite Friends & Earn Rewards</p>
              <p className="text-[11px] text-emerald-700/80 font-medium mt-0.5">
                Get +2 trial days per referral, and 1 month free after 4 signups!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCopyReferral}
              className="bg-white border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={handleShareReferral}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
            >
              Invite Now
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center max-w-xl mx-auto">
          <p className="text-slate-400 italic text-[11px] sm:text-xs font-medium">
            "Consistency beats motivation. Practice every single day."
          </p>
        </div>
      </main>

      <InstallPwaBanner />
    </div>
  );
}