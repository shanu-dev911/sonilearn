"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Flame, Trophy, Target, BookOpen, Crown, Rocket } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading SoniLearn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white pb-20 md:pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* LOGO & EXAM */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-700 tracking-tight leading-none">
                SONILEARN
              </h1>
              <p className="text-xs text-gray-500 font-semibold mt-1 tracking-wide uppercase">
                {targetExam}
              </p>
            </div>

            {/* RIGHT SECTION - PLAN & BUTTONS */}
            <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end flex-wrap">
              <div
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-black shadow-sm whitespace-nowrap ${isPremium
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                  }`}
              >
                {isPremium ? "PRO MEMBER" : "FREE PLAN"}
              </div>

              {!isPremium && (
                <button
                  onClick={() => router.push("/premium")}
                  aria-label="Upgrade to Premium"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-indigo-600 text-white text-xs sm:text-sm font-semibold hover:scale-105 transition-transform duration-200 active:scale-95 whitespace-nowrap"
                >
                  <Rocket size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Upgrade</span>
                  <span className="sm:hidden">Pro</span>
                </button>
              )}

              <button
                onClick={() => router.push("/profile")}
                className="w-9 sm:w-11 h-9 sm:h-11 bg-blue-100 hover:bg-blue-200 rounded-2xl flex items-center justify-center text-lg sm:text-xl transition-all duration-200 active:scale-95 flex-shrink-0"
              >
                👤
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full px-3 sm:px-4 md:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-10">
        {/* WELCOME BANNER */}
        <div className="mb-8 sm:mb-10 md:mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl md:rounded-[2rem] p-5 sm:p-6 md:p-8 lg:p-10 text-white shadow-2xl">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.6fr_0.9fr] items-center">
              {/* WELCOME TEXT */}
              <div>
                <p className="uppercase text-xs tracking-[0.3em] font-bold text-blue-100">
                  Welcome Back
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-2 sm:mt-3 leading-tight">
                  Hello, {userName} 👋
                </h2>
                <p className="text-blue-100 mt-3 sm:mt-4 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
                  Practice daily, improve weak areas and crack your dream exam 🚀
                </p>
              </div>

              {/* TARGET EXAM BOX */}
              <div className="bg-white/15 backdrop-blur-md rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-3 sm:py-4 w-full sm:w-auto sm:max-w-md sm:ml-auto">
                <p className="text-xs sm:text-sm text-blue-100 font-medium">Target Exam</p>
                <h3 className="text-xl sm:text-2xl font-black mt-1 sm:mt-2">
                  {targetExam}
                </h3>
              </div>
            </div>
          </div>
        </div>
        {/* FEATURES GRID - 1 COL MOBILE, 2 COL TABLET, 2 COL DESKTOP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-7 md:mb-8">
          {/* DAILY CHALLENGE CARD */}
          <button
            onClick={() => router.push("/daily")}
            className="group bg-gradient-to-br from-red-500 to-orange-500 text-white p-5 sm:p-6 md:p-7 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl min-h-[200px] sm:min-h-[220px] md:min-h-[240px] flex flex-col justify-between shadow-xl hover:scale-[1.02] transition-all duration-300 active:scale-95"
          >
            <Flame size={40} className="sm:w-12 sm:h-12 group-hover:scale-110 transition" />
            <div className="text-left">
              <h3 className="text-2xl sm:text-3xl font-black leading-tight">
                Daily Challenge
              </h3>
              <p className="text-white/90 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">
                Practice 20 fresh questions every day with leaderboard.
              </p>
            </div>
          </button>
          {/* WEAK PRACTICE CARD */}
          <button
            onClick={() => router.push("/weak")}
            className="group bg-white border border-gray-200 p-5 sm:p-6 md:p-7 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl min-h-[200px] sm:min-h-[220px] md:min-h-[240px] flex flex-col justify-between shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 active:scale-95"
          >
            <Target
              size={40}
              className="sm:w-12 sm:h-12 text-blue-600 group-hover:scale-110 transition"
            />
            <div className="text-left">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-800 leading-tight">
                Weak Practice
              </h3>
              <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">
                Improve weak subjects with smart practice sets.
              </p>
            </div>
          </button>

          {/* LEADERBOARD CARD */}
          <button
            onClick={() => router.push("/leaderboard")}
            className="group bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 sm:p-6 md:p-7 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl min-h-[200px] sm:min-h-[220px] md:min-h-[240px] flex flex-col justify-between shadow-xl hover:scale-[1.02] transition-all duration-300 active:scale-95"
          >
            <Trophy
              size={40}
              className="sm:w-12 sm:h-12 group-hover:scale-110 transition"
            />
            <div className="text-left">
              <h3 className="text-2xl sm:text-3xl font-black leading-tight">
                Leaderboard
              </h3>
              <p className="text-white/90 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">
                Compete with students across India and improve rank.
              </p>
            </div>
          </button>
          {/* PYQ CARD */}
          <button
            onClick={() => router.push("/pyq")}
            className="group bg-white border border-gray-200 p-5 sm:p-6 md:p-7 lg:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl min-h-[200px] sm:min-h-[220px] md:min-h-[240px] flex flex-col justify-between shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 active:scale-95"
          >
            <BookOpen
              size={40}
              className="sm:w-12 sm:h-12 text-emerald-600 group-hover:scale-110 transition"
            />
            <div className="text-left">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-800 leading-tight">
                Previous Year Questions
              </h3>
              <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">
                Solve real SSC & Railway exam PYQs subject-wise.
              </p>
            </div>
          </button>
        </div>

        {/* FAST TEST BUTTON - FULL WIDTH */}
        <button
          onClick={() => router.push("/fast-test")}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl sm:rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-7 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 shadow-2xl hover:scale-[1.01] transition-all duration-300 active:scale-95 mb-8 sm:mb-10"
        >
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            <div className="bg-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex-shrink-0">
              <Crown size={32} className="sm:w-9 sm:h-9" />
            </div>
            <div className="text-left">
              <p className="uppercase text-xs tracking-[0.3em] font-bold text-yellow-100">
                Quick Revision
              </p>
              <h3 className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2">
                ⚡ Fast Test
              </h3>
              <p className="text-white/90 mt-1 sm:mt-2 text-sm sm:text-base">
                5 minute rapid test for instant revision.
              </p>
            </div>
          </div>

          <div className="bg-white text-orange-600 px-5 sm:px-6 md:px-7 py-3 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-black text-sm sm:text-base whitespace-nowrap flex-shrink-0 shadow-lg">
            Start Now →
          </div>
        </button>

        {/* PRO TIP */}
        <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 text-center shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-black">
            Sonilearn Pro Tip
          </p>
          <p className="text-gray-600 italic text-base sm:text-lg leading-relaxed mt-3 sm:mt-4">
            "Consistency beats motivation. Practice every single day."
          </p>
        </div>
      </main>
    </div>
  );
} 