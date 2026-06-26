"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase-client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

// 🎯 EXAMS
const examsData = [
    // SSC
    "SSC CGL",
    "SSC CHSL",
    "SSC MTS",
    "SSC GD",
    "SSC CPO",
    "SSC Stenographer",
    "SSC JE",

    // RAILWAY
    "RRB NTPC",
    "RRB Group D",
    "RRB ALP",
    "RRB Technician",
    "RRB JE",
    "RRB SSE",
    "RRB Paramedical",
    "RRB Ministerial & Isolated",
    "RRB Apprentice",
];

export default function ProfilePage() {

    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);

    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);

    const [targetExam, setTargetExam] = useState("");

    // LOAD USER
    useEffect(() => {

        const unsubscribe = onAuthStateChanged(
            auth,
            async (currentUser) => {

                try {

                    if (currentUser) {

                        setUser(currentUser);

                        const userRef = doc(
                            db,
                            "users",
                            currentUser.uid
                        );

                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {

                            const data = userSnap.data();

                            setUserData(data);

                            setTargetExam(
                                data.targetExam || ""
                            );

                        }

                    } else {

                        router.push("/login");

                    }

                } catch (error) {

                    console.log("Profile Error:", error);

                } finally {

                    setLoading(false);

                }

            }
        );

        return () => unsubscribe();

    }, [router]);

    // UPDATE TARGET EXAM
    const handleUpdate = async () => {

        try {

            if (!user || !targetExam) return;

            await updateDoc(
                doc(db, "users", user.uid),
                {
                    examType: "Central",
                    state: "Central",
                    targetExam,
                }
            );

            setUserData({
                ...userData,
                targetExam,
            });

            setIsEditing(false);

        } catch (error) {

            console.log("Update Error:", error);

        }

    };

    // LOGOUT
    const handleLogout = async () => {

        try {

            await signOut(auth);

            router.push("/login");

        } catch (error) {

            console.log("Logout Error:", error);

        }

    };

    // LOADING
    if (loading) {

        return (
            <div className="min-h-screen flex items-center justify-center bg-white">

                <div className="text-center">

                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>

                    <p className="mt-4 text-blue-600 font-bold">
                        Loading Profile...
                    </p>

                </div>

            </div>
        );

    }

    return (
        <div className="min-h-screen bg-slate-50 pb-10">

            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 pt-8 pb-16 text-white">

                <button
                    onClick={() => router.push("/")}
                    className="mb-6 text-sm font-bold"
                >
                    ← Back
                </button>

                <div className="flex items-center gap-4">

                    <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center text-3xl">
                        👤
                    </div>

                    <div>

                        <h1 className="text-3xl font-black">
                            {userData?.name || "Student"}
                        </h1>

                        <p className="text-sm text-white/80 mt-1">
                            {user?.email}
                        </p>

                    </div>

                </div>

            </div>

            {/* CARD */}
            <div className="max-w-md mx-auto px-4 -mt-10">

                {/* TARGET EXAM */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border">

                    <div className="flex items-center justify-between mb-5">

                        <div>

                            <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
                                TARGET
                            </p>
                            <h2 className="text-2xl font-black text-gray-800 mt-1">
                                🎯 Target Exam
                            </h2>

                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-black"
                            >
                                Edit
                            </button>
                        )}

                    </div>

                    {!isEditing ? (

                        <div className="bg-slate-50 rounded-2xl p-5 border">

                            <p className="text-2xl font-black text-gray-800">
                                {userData?.targetExam || "Not Selected"}
                            </p>

                        </div>

                    ) : (

                        <div className="space-y-4">

                            <select
                                value={targetExam}
                                onChange={(e) =>
                                    setTargetExam(e.target.value)
                                }
                                className="w-full border rounded-2xl p-4 bg-white outline-none font-semibold"
                            >

                                <option value="">
                                    Select Target Exam
                                </option>

                                {examsData.map((exam) => (

                                    <option
                                        key={exam}
                                        value={exam}
                                    >
                                        {exam}
                                    </option>

                                ))}

                            </select>

                            <div className="flex gap-3">

                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 border rounded-2xl py-4 font-black text-gray-700"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleUpdate}
                                    disabled={!targetExam}
                                    className={`flex-1 rounded-2xl py-4 font-black text-white

                  ${targetExam
                                            ? "bg-green-600"
                                            : "bg-gray-300"
                                        }`}
                                >
                                    Save
                                </button>

                            </div>

                        </div>

                    )}

                </div>

                {/* ACCOUNT INFO */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border mt-5">

                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-4">
                        ACCOUNT
                    </p>

                    <div className="space-y-4">

                        <div>

                            <p className="text-sm text-gray-400 font-semibold">
                                Name
                            </p>

                            <h3 className="font-black text-gray-800 text-lg mt-1">
                                {userData?.name || "Student"}
                            </h3>

                        </div>

                        <div>

                            <p className="text-sm text-gray-400 font-semibold">
                                Email
                            </p>

                            <h3 className="font-black text-gray-800 text-lg mt-1 break-all">
                                {user?.email}
                            </h3>

                        </div>

                    </div>

                </div>

                {/* LOGOUT */}
                <button
                    onClick={handleLogout}
                    className="w-full mt-6 bg-red-500 hover:bg-red-600 transition text-white py-4 rounded-[2rem] font-black"
                >
                    Logout
                </button>

            </div>

        </div>
    );
}