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
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
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
import { FiMail, FiLock, FiGift, FiPhone, FiKey } from "react-icons/fi";

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}

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

    // Tab State: "phone" | "email"
    const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");

    // Email form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Phone form state
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    // Common referral state
    const [referralInput, setReferralInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingRedirect, setCheckingRedirect] = useState(true);

    // 🎯 Verify Referral Code in Firestore
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

    // 🎯 Firestore User Sync & Creation
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
                const studentName = user.displayName || (user.phoneNumber ? `Student ${user.phoneNumber.slice(-4)}` : "Student");
                const myReferralCode = generateReferralCode(studentName);

                await setDoc(userRef, {
                    uid: user.uid,
                    name: studentName,
                    email: user.email || "",
                    phone: user.phoneNumber || "",
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

    // Catch Google Redirect
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

    // 1. RECAPTCHA SETUP FOR PHONE
    const getAppVerifier = () => {
        if (typeof window === "undefined") return null;

        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
                callback: () => { },
                "expired-callback": () => {
                    if (window.recaptchaVerifier) {
                        window.recaptchaVerifier.clear();
                        delete window.recaptchaVerifier;
                    }
                },
            });
        }

        return window.recaptchaVerifier;
    };

    // 2. PHONE: SEND OTP
    const handlePhoneSendOtp = async () => {
        const cleanNumber = phoneNumber.trim().replace(/\D/g, "");

        if (cleanNumber.length !== 10) {
            alert("Kripya sahi 10-digit mobile number enter karein.");
            return;
        }

        try {
            setLoading(true);

            // Agar user ne referral code dala hai toh verify karein
            if (referralInput.trim()) {
                const validReferrer = await verifyReferralCode(referralInput);
                if (!validReferrer) {
                    alert("Invalid Referral Code! Please verify or leave it empty.");
                    setLoading(false);
                    return;
                }
            }

            const appVerifier = getAppVerifier();
            if (!appVerifier) throw new Error("Verifier not ready");

            const formattedPhone = `+91${cleanNumber}`;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            window.confirmationResult = confirmationResult;

            setOtpSent(true);
            alert("OTP phone par bhej diya gaya hai!");
        } catch (error: any) {
            console.error("SMS Error:", error);
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                delete window.recaptchaVerifier;
            }
            alert(error.message || "OTP bhejne me problem aayi. Kripya check karein.");
        } finally {
            setLoading(false);
        }
    };

    // 3. PHONE: VERIFY OTP & SIGNUP
    const handlePhoneVerifyOtp = async () => {
        if (!otp || otp.trim().length < 6) {
            alert("Kripya 6-digit ka OTP dalein.");
            return;
        }

        if (!window.confirmationResult) {
            alert("Session expire ho gaya hai, kripya dobara OTP mangwayein.");
            setOtpSent(false);
            return;
        }

        try {
            setLoading(true);
            const result = await window.confirmationResult.confirm(otp.trim());

            let validReferrer: string | null = null;
            if (referralInput.trim()) {
                validReferrer = await verifyReferralCode(referralInput);
            }

            await registerUserAndRedirect(result.user, validReferrer);
        } catch (error: any) {
            console.error("OTP Verify Error:", error);
            alert("Galat ya expired OTP hai. Sahi OTP dalein.");
        } finally {
            setLoading(false);
        }
    };

    // 4. EMAIL SIGNUP
    const handleEmailSignup = async () => {
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

    // 5. GOOGLE SIGNUP
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
            {/* Invisible container for Firebase reCAPTCHA */}
            <div id="recaptcha-container"></div>

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

                    {/* METHOD TOGGLE TABS */}
                    <div className="bg-white/80 p-1.5 rounded-2xl flex gap-1 mb-6 border border-blue-100 shadow-xs">
                        <button
                            type="button"
                            onClick={() => {
                                setAuthMethod("phone");
                                setOtpSent(false);
                            }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${authMethod === "phone"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                        >
                            <FiPhone size={15} /> Mobile OTP
                        </button>

                        <button
                            type="button"
                            onClick={() => setAuthMethod("email")}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${authMethod === "email"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                        >
                            <FiMail size={15} /> Email / Pass
                        </button>
                    </div>

                    {/* 📱 PHONE SIGNUP FORM */}
                    {authMethod === "phone" && (
                        <div>
                            {!otpSent ? (
                                <>
                                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm mb-4">
                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            maxLength={10}
                                            placeholder="10-digit Mobile Number"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full outline-none bg-transparent font-semibold text-gray-700 placeholder:text-gray-300 text-sm tracking-wider"
                                        />
                                    </div>

                                    {/* Referral Code (Optional) */}
                                    <div className="bg-white border border-dashed border-indigo-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm mb-6">
                                        <FiGift className="text-indigo-600 text-xl flex-shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Referral Code (Optional)"
                                            value={referralInput}
                                            onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                                            className="w-full outline-none bg-transparent font-black tracking-wider text-indigo-700 placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-300 uppercase text-sm"
                                        />
                                    </div>

                                    <button
                                        onClick={handlePhoneSendOtp}
                                        disabled={loading || phoneNumber.length < 10}
                                        className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-md shadow-blue-500/20 ${loading || phoneNumber.length < 10
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700"
                                            }`}
                                    >
                                        {loading ? "Sending OTP..." : "Get OTP on Phone 🚀"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm mb-2">
                                        <FiKey className="text-blue-600 text-xl" />
                                        <input
                                            type="number"
                                            maxLength={6}
                                            placeholder="Enter 6-digit OTP"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="w-full outline-none bg-transparent font-semibold text-gray-700 placeholder:text-gray-300 tracking-widest text-center text-lg"
                                        />
                                    </div>

                                    <div className="flex justify-between items-center px-1 mb-5">
                                        <span className="text-xs text-gray-500 font-medium">
                                            Sent to +91 {phoneNumber}
                                        </span>
                                        <button
                                            onClick={() => setOtpSent(false)}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            Change Number
                                        </button>
                                    </div>

                                    <button
                                        onClick={handlePhoneVerifyOtp}
                                        disabled={loading || otp.length < 6}
                                        className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-md shadow-blue-500/20 ${loading || otp.length < 6
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700"
                                            }`}
                                    >
                                        {loading ? "Verifying..." : "Verify & Create Account 🚀"}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* ✉️ EMAIL SIGNUP FORM */}
                    {authMethod === "email" && (
                        <div>
                            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm mb-4">
                                <FiMail className="text-blue-600 text-xl flex-shrink-0" />
                                <input
                                    type="email"
                                    placeholder="Enter Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full outline-none bg-transparent font-semibold text-gray-700 placeholder:text-gray-300 text-sm"
                                />
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm mb-4">
                                <FiLock className="text-blue-600 text-xl flex-shrink-0" />
                                <input
                                    type="password"
                                    placeholder="Create Password (min 6 chars)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full outline-none bg-transparent font-semibold text-gray-700 placeholder:text-gray-300 text-sm"
                                />
                            </div>

                            {/* Referral Code (Optional) */}
                            <div className="bg-white border border-dashed border-indigo-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm mb-6">
                                <FiGift className="text-indigo-600 text-xl flex-shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Referral Code (Optional)"
                                    value={referralInput}
                                    onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                                    className="w-full outline-none bg-transparent font-black tracking-wider text-indigo-700 placeholder:font-medium placeholder:tracking-normal placeholder:text-gray-300 uppercase text-sm"
                                />
                            </div>

                            <button
                                onClick={handleEmailSignup}
                                disabled={loading}
                                className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-md shadow-blue-500/20 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {loading ? "Creating Account..." : "Create Account 🚀"}
                            </button>
                        </div>
                    )}

                    {/* OR DIVIDER */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-[1px] bg-gray-200"></div>
                        <span className="text-xs text-gray-400 font-black uppercase tracking-widest">
                            OR
                        </span>
                        <div className="flex-1 h-[1px] bg-gray-200"></div>
                    </div>

                    {/* GOOGLE SIGNUP */}
                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full bg-white border border-gray-200 rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-gray-700 hover:bg-gray-50 transition shadow-xs"
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