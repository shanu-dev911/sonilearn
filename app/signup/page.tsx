"use client";

export const dynamic = "force-dynamic";

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
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase-client";
import { FcGoogle } from "react-icons/fc";
import { FiMail, FiLock, FiGift } from "react-icons/fi";
import { Eye, EyeOff } from "lucide-react";

const googleProvider = new GoogleAuthProvider();

function isInAppBrowser(): boolean {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    return /Instagram|FBAN|FBAV|Line|Twitter|WhatsApp/i.test(ua);
}

function checkIsPwaInstalled(): boolean {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
    );
}

function generateReferralCode(name: string): string {
    const cleanName = (name || "SL").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3) || "SL";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${randomNum}`;
}

export default function SignupPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [referralInput, setReferralInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingRedirect, setCheckingRedirect] = useState(true);

    const verifyReferralCode = async (code: string): Promise<string | null> => {
        if (!code.trim()) return null;
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("referralCode", "==", code.trim().toUpperCase()));
            const snap = await getDocs(q);
            if (!snap.empty) {
                return code.trim().toUpperCase();
            }
            return null;
        } catch (err) {
            console.error("Error validating referral code:", err);
            return null;
        }
    };

    const registerUserAndRedirect = async (user: any, appliedReferralCode: string | null) => {
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const isInstalled = checkIsPwaInstalled();

            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.profileCompleted) {
                    router.push("/");
                } else {
                    router.push("/complete-profile");
                }
            } else {
                const studentName = user.displayName || "Student";
                const myReferralCode = generateReferralCode(studentName);

                await setDoc(userRef, {
                    uid: user.uid,
                    name: studentName,
                    email: user.email || "",
                    photoURL: user.photoURL || "",
                    targetExam: "",
                    isPremium: false,
                    subscriptionTier: "FREE TIER",
                    walletBalance: 0,
                    profileCompleted: false,
                    referralCode: myReferralCode,
                    referredBy: appliedReferralCode || null,
                    referralRewarded: false,
                    totalReferrals: 0,
                    bonusDaysEarned: 0,
                    isPwaInstalled: isInstalled,
                    createdAt: serverTimestamp(),
                });

                router.push("/complete-profile");
            }
        } catch (error) {
            console.error("Signup Redirect Error:", error);
            alert("Something went wrong creating your account.");
        }
    };

    useEffect(() => {
        getRedirectResult(auth)
            .then(async (result) => {
                if (result && result.user) {
                    const savedRef = sessionStorage.getItem("pending_referral_code");
                    await registerUserAndRedirect(result.user, savedRef || null);
                    sessionStorage.removeItem("pending_referral_code");
                }
            })
            .catch((error) => {
                console.error("Redirect Result Error:", error);
            })
            .finally(() => {
                setCheckingRedirect(false);
            });
    }, []);

    const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!email || !password) {
            alert("Please enter email & password");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters long");
            return;
        }

        try {
            setLoading(true);

            let validReferrer: string | null = null;
            if (referralInput.trim()) {
                validReferrer = await verifyReferralCode(referralInput);
                if (!validReferrer) {
                    alert("Invalid Referral Code! Please check or leave it empty.");
                    setLoading(false);
                    return;
                }
            }

            const result = await createUserWithEmailAndPassword(auth, email, password);
            await registerUserAndRedirect(result.user, validReferrer);
        } catch (error: any) {
            console.error(error);
            if (error.code === "auth/email-already-in-use") {
                alert("Account already exists with this email! Please log in instead.");
                router.push("/login");
            } else {
                alert(error.message || "Signup failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            setLoading(true);

            if (referralInput.trim()) {
                const validReferrer = await verifyReferralCode(referralInput);
                if (validReferrer) {
                    sessionStorage.setItem("pending_referral_code", validReferrer);
                } else {
                    alert("Invalid Referral Code! Please verify or leave it empty.");
                    setLoading(false);
                    return;
                }
            }

            if (isInAppBrowser()) {
                await signInWithRedirect(auth, googleProvider);
                return;
            }

            const result = await signInWithPopup(auth, googleProvider);
            const savedRef = sessionStorage.getItem("pending_referral_code");
            await registerUserAndRedirect(result.user, savedRef || null);
            sessionStorage.removeItem("pending_referral_code");
        } catch (error: any) {
            console.error(error);

            if (
                error.code === "auth/cancelled-popup-request" ||
                error.code === "auth/popup-blocked" ||
                error.code === "auth/popup-closed-by-user"
            ) {
                try {
                    await signInWithRedirect(auth, googleProvider);
                    return;
                } catch (redirectError) {
                    console.error("Redirect Fallback Error:", redirectError);
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
        <div className="min-h-screen bg-white flex items-center justify-center px-5 py-10 font-sans">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-blue-700 tracking-tight">
                        SONILEARN
                    </h1>
                    <p className="text-gray-400 mt-2 font-semibold text-sm">
                        Create Account & Start Free Practice 🚀
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-7 shadow-sm">
                    <h2 className="text-2xl font-black text-center text-gray-800 mb-6">
                        New Registration ✍️
                    </h2>

                    <form onSubmit={handleSignup}>
                        <div className="bg-white border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm mb-4 transition-colors">
                            <FiGift className="text-indigo-600 text-xl flex-shrink-0" aria-hidden="true" />
                            <input
                                type="text"
                                aria-label="Referral code (optional)"
                                placeholder="Referral Code (Optional)"
                                value={referralInput}
                                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                                autoCapitalize="characters"
                                className="w-full outline-none bg-transparent font-black tracking-wider text-slate-800 placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 uppercase text-sm"
                            />
                        </div>

                        <div className="bg-white border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm mb-4 transition-colors">
                            <FiMail className="text-blue-600 text-xl flex-shrink-0" aria-hidden="true" />
                            <input
                                type="email"
                                autoComplete="email"
                                aria-label="Email address"
                                placeholder="Enter Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full outline-none bg-transparent font-semibold text-slate-800 placeholder:text-slate-400 text-sm"
                            />
                        </div>

                        <div className="bg-white border border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm mb-6 transition-colors">
                            <FiLock className="text-blue-600 text-xl flex-shrink-0" aria-hidden="true" />
                            <input
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                aria-label="Create password"
                                placeholder="Create Password (min 6 chars)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full outline-none bg-transparent font-semibold text-slate-800 placeholder:text-slate-400 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((visible) => !visible)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                                className="text-slate-500 hover:text-slate-800 p-1 rounded-lg"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-md shadow-blue-500/20 active:scale-98 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                        >
                            {loading ? "Creating Account..." : "Create Account 🚀"}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-6" aria-label="Or sign up with Google">
                        <div className="flex-1 h-px bg-slate-300"></div>
                        <span className="text-xs text-slate-500 font-black uppercase tracking-widest">OR</span>
                        <div className="flex-1 h-px bg-slate-300"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-slate-700 hover:bg-slate-50 transition shadow-sm active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <FcGoogle size={24} />
                        Sign Up with Google
                    </button>
                </div>

                <p className="text-center text-gray-400 mt-8 font-semibold text-sm">
                    Already have an account?
                    <span
                        onClick={() => router.push("/login")}
                        className="text-blue-600 ml-2 font-black cursor-pointer hover:underline"
                    >
                        Log In
                    </span>
                </p>
            </div>
        </div>
    );
}