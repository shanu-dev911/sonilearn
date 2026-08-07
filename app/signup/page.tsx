"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
} from "firebase/auth";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase-client";

import { FcGoogle } from "react-icons/fc";

import {
    FiMail,
    FiLock,
} from "react-icons/fi";

const googleProvider = new GoogleAuthProvider();

function isInAppBrowser(): boolean {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    return /Instagram|FBAN|FBAV|Line|Twitter|WhatsApp/i.test(ua);
}

export default function SignupPage() {

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingRedirect, setCheckingRedirect] = useState(true);

    const checkUserAndRedirect = async (user: any) => {
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                if (userData.profileCompleted) {
                    router.push("/");
                } else {
                    router.push("/complete-profile");
                }
            } else {
                await setDoc(userRef, {
                    uid: user.uid,
                    name: user.displayName || "Student",
                    email: user.email || "",
                    photoURL: user.photoURL || "",
                    targetExam: "",
                    isPremium: false,
                    isSubscribed: false,
                    subscriptionStatus: "inactive",
                    profileCompleted: false,
                    createdAt: serverTimestamp(),
                });

                router.push("/complete-profile");
            }
        } catch (error) {
            console.log("User Check Error:", error);
            alert("Something went wrong");
        }
    };

    useEffect(() => {
        getRedirectResult(auth)
            .then((result) => {
                if (result && result.user) {
                    checkUserAndRedirect(result.user);
                }
            })
            .catch((error) => {
                console.log("Redirect Result Error:", error);
            })
            .finally(() => {
                setCheckingRedirect(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSignup = async () => {
        if (!email || !password) {
            alert("Enter email & password");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await checkUserAndRedirect(result.user);
        } catch (error: any) {
            console.log(error);
            alert(error.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            setLoading(true);

            if (isInAppBrowser()) {
                await signInWithRedirect(auth, googleProvider);
                return;
            }

            const result = await signInWithPopup(auth, googleProvider);
            await checkUserAndRedirect(result.user);
        } catch (error: any) {
            console.log(error);

            if (
                error.code === "auth/cancelled-popup-request" ||
                error.code === "auth/popup-blocked" ||
                error.code === "auth/popup-closed-by-user"
            ) {
                try {
                    await signInWithRedirect(auth, googleProvider);
                    return;
                } catch (redirectError) {
                    console.log("Redirect Fallback Error:", redirectError);
                }
            }

            alert(error.message || "Google Signup Failed");
        } finally {
            setLoading(false);
        }
    };

    if (checkingRedirect) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (

        <div className="min-h-screen bg-white flex items-center justify-center px-5 py-10">

            <div className="w-full max-w-md">

                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black text-blue-700 tracking-tight">
                        SONILEARN
                    </h1>
                    <p className="text-gray-400 mt-2 font-semibold">
                        Start Your Success Journey 🚀
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-7 shadow-sm">

                    <h2 className="text-2xl font-black text-center text-gray-800 mb-7">
                        Create Account ✨
                    </h2>

                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm mb-4">
                        <FiMail className="text-blue-600 text-xl" />
                        <input
                            type="email"
                            placeholder="Enter Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full outline-none bg-transparent font-semibold text-gray-700 placeholder:text-gray-300"
                        />
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm mb-6">
                        <FiLock className="text-blue-600 text-xl" />
                        <input
                            type="password"
                            placeholder="Create Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full outline-none bg-transparent font-semibold text-gray-700 placeholder:text-gray-300"
                        />
                    </div>

                    <button
                        onClick={handleSignup}
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black text-white transition-all
            ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        {loading ? "Please wait..." : "Sign Up 🚀"}
                    </button>

                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-[1px] bg-gray-200"></div>
                        <span className="text-xs text-gray-400 font-black uppercase tracking-widest">
                            OR
                        </span>
                        <div className="flex-1 h-[1px] bg-gray-200"></div>
                    </div>

                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full bg-white border border-gray-200 rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-gray-700 hover:bg-gray-50 transition"
                    >
                        <FcGoogle size={24} />
                        Continue with Google
                    </button>

                </div>

                <p className="text-center text-gray-400 mt-8 font-semibold">
                    Already have an account?
                    <span
                        onClick={() => router.push("/login")}
                        className="text-blue-600 ml-2 font-black cursor-pointer"
                    >
                        Log In
                    </span>
                </p>

            </div>

        </div>

    );
}