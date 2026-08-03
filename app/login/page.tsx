"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
    signInWithEmailAndPassword,
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

// 🎯 Detects if the user is inside an in-app browser (Instagram, Facebook, etc.)
// where signInWithPopup does not work reliably.
function isInAppBrowser(): boolean {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    return /Instagram|FBAN|FBAV|Line|Twitter|WhatsApp/i.test(ua);
}

export default function LoginPage() {

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
                    profileCompleted: false,
                    createdAt: serverTimestamp(),
                });

                router.push("/complete-profile");
            }
        } catch (error) {
            console.log("Redirect Error:", error);
            alert("Something went wrong.");
        }
    };

    // 🎯 On page load, check if we just came back from a Google redirect login
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

    const handleLogin = async () => {
        if (!email || !password) {
            alert("Enter email & password");
            return;
        }

        try {
            setLoading(true);
            const result = await signInWithEmailAndPassword(auth, email, password);
            await checkUserAndRedirect(result.user);
        } catch (error: any) {
            console.log(error);
            alert(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    // 🎯 GOOGLE LOGIN — uses redirect for in-app browsers, popup otherwise
    const handleGoogle = async () => {
        try {
            setLoading(true);

            if (isInAppBrowser()) {
                // Redirect-based flow works reliably inside Instagram/FB browsers
                await signInWithRedirect(auth, googleProvider);
                return; // Page will reload after redirect; handled by useEffect above
            }

            const result = await signInWithPopup(auth, googleProvider);
            await checkUserAndRedirect(result.user);
        } catch (error: any) {
            console.log(error);

            // Fallback: if popup fails for any reason, try redirect instead
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

            alert(error.message || "Google Login Failed");
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
                        Crack SSC & Railway Exams 🚀
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-7 shadow-sm">

                    <h2 className="text-2xl font-black text-center text-gray-800 mb-7">
                        Welcome Back 👋
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

                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm mb-2">
                        <FiLock className="text-blue-600 text-xl" />
                        <input
                            type="password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full outline-none bg-transparent font-semibold text-gray-700 placeholder:text-gray-300"
                        />
                    </div>

                    <div className="flex justify-end mb-6">
                        <button
                            onClick={() => router.push("/forgot-password")}
                            className="text-sm text-blue-600 font-bold"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl font-black text-white transition-all
            ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        {loading ? "Please wait..." : "Log In 🚀"}
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
                    Don&apos;t have an account?
                    <span
                        onClick={() => router.push("/signup")}
                        className="text-blue-600 ml-2 font-black cursor-pointer"
                    >
                        Sign Up
                    </span>
                </p>

            </div>

        </div>

    );
}