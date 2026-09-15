"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { CheckCircle2, Clock, Smartphone, User, ArrowUpRight } from "lucide-react";

interface PayoutRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  upiId: string;
  amount: number;
  status: "PENDING" | "COMPLETED";
  createdAt: string;
}

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "payout_requests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PayoutRequest[];
      setRequests(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markCompleted = async (id: string) => {
    if (!confirm("Kya aapne is student ko payment send kar diya hai?")) return;
    try {
      await updateDoc(doc(db, "payout_requests", id), {
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      alert("Status update failed");
    }
  };

  if (loading) return <div className="p-8 text-center text-sm font-bold">Loading payouts...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-black mb-1">Payout Requests (₹80 Withdrawals)</h1>
      <p className="text-slate-500 text-xs mb-6">Student UPI par transfer karne ke baad 'Mark Completed' karein.</p>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold bg-white rounded-2xl border">
            Koi pending withdrawal request nahi hai.
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white ${
                req.status === "PENDING" ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-slate-900 text-sm">{req.userName}</span>
                  <span className="text-[10px] text-slate-400">({req.userEmail})</span>
                  {req.status === "PENDING" ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={10} /> PENDING
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={10} /> COMPLETED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-700 font-mono font-bold mt-2">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-200">
                    UPI: {req.upiId}
                  </span>
                  <span className="text-emerald-700 font-black text-sm">₹{req.amount}</span>
                </div>
              </div>

              {req.status === "PENDING" && (
                <button
                  onClick={() => markCompleted(req.id)}
                  className="bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <ArrowUpRight size={14} /> Mark Completed
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}