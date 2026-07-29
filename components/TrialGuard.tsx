"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { checkTrialStatus } from "@/lib/trial-check";
import { Lock, Loader2, Zap } from "lucide-react";

interface TrialGuardProps {
  children: React.ReactNode;
}

export default function TrialGuard({ children }: TrialGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          router.push("/complete-profile");
          return;
        }

        const userData = userSnap.data();
        const status = checkTrialStatus(userData);

        setHasAccess(status.hasAccess);
        setDaysRemaining(status.daysRemaining);
      } catch (error) {
        console.error("Trial check error:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Your Free Trial Has Ended
          </h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Upgrade to Premium to continue accessing Daily Challenge, Warrior Questions, and all features.
          </p>
          <button
            onClick={() => router.push("/premium")}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md"
          >
            <Zap size={16} /> Upgrade to Premium — ₹49
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 h-11 rounded-xl font-bold text-xs"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}