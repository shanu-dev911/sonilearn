"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  signInWithEmailAndPassword,
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
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase-client";

import { FcGoogle } from "react-icons/fc";
import { FiMail, FiLock, FiPhone, FiKey } from "react-icons/fi";

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

export default function LoginPage() {
  const router = useRouter();

  // Tab State: "email" | "phone"
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("phone");

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone login state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);

  // Firestore User Check & Sync
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
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "Student",
          email: user.email || "",
          phone: user.phoneNumber || "",
          photoURL: user.photoURL || "",
          targetExam: "",
          isPremium: false,
          subscriptionTier: "FREE TIER",
          walletBalance: 0,
          referralCode: `SL${randomNum}`,
          profileCompleted: false,
          createdAt: serverTimestamp(),
        });

        router.push("/complete-profile");
      }
    } catch (error) {
      console.log("Redirect Error:", error);
      alert("Something went wrong during profile setup.");
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
  }, []);

  // 1. EMAIL LOGIN
  const handleEmailLogin = async () => {
    if (!email || !password) {
      alert("Kripya email aur password dono dalein.");
      return;
    }

    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await checkUserAndRedirect(result.user);
    } catch (error: any) {
      console.log(error);
      alert(error.message || "Email Login failed");
    } finally {
      setLoading(false);
    }
  };

  // 2. PHONE RECAPTCHA SETUP
  const getAppVerifier = () => {
    if (typeof window === "undefined") return null;

    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved
        },
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

  // 3. SEND OTP
  const handleSendOtp = async () => {
    const cleanNumber = phoneNumber.trim().replace(/\D/g, "");

    if (cleanNumber.length !== 10) {
      alert("Kripya sahi 10 digit ka mobile number dalein.");
      return;
    }

    try {
      setLoading(true);
      const appVerifier = getAppVerifier();
      if (!appVerifier) throw new Error("Verifier not ready");

      const formattedPhone = `+91${cleanNumber}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmationResult;

      setOtpSent(true);
      alert("OTP bhej diya gaya hai!");
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

  // 4. VERIFY OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length < 6) {
      alert("Kripya 6-digit ka OTP dalein.");
      return;
    }

    if (!window.confirmationResult) {
      alert("Session expire ho gaya hai, dobara OTP mangwayein.");
      setOtpSent(false);
      return;
    }

    try {
      setLoading(true);
      const result = await window.confirmationResult.confirm(otp.trim());
      await checkUserAndRedirect(result.user);
    } catch (error: any) {
      console.error("OTP Verify Error:", error);
      alert("Galat ya Expired OTP hai. Sahi OTP enter karein.");
    } finally {
      setLoading(false);
    }
  };

  // 5. GOOGLE LOGIN
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
    <div className="min-h-screen bg-white flex items-center justify-center px-5 py-10 font-sans">
      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-blue-700 tracking-tight">
            SONILEARN
          </h1>
          <p className="text-gray-400 mt-2 font-semibold">
            Crack SSC & Railway Exams 🚀
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-7 shadow-sm">
          <h2 className="text-2xl font-black text-center text-gray-800 mb-6">
            Welcome Back 👋
          </h2>

          {/* METHOD TOGGLE TABS */}
          <div className="bg-white/80 p-1.5 rounded-2xl flex gap-1 mb-6 border border-blue-100 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone");
                setOtpSent(false);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                authMethod === "phone"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <FiPhone size={15} /> Mobile OTP
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod("email")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                authMethod === "email"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <FiMail size={15} /> Email / Pass
            </button>
          </div>

          {/* PHONE / OTP FORM */}
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
                      className="w-full outline-none bg-transparent font-semibold text-gray-700 placeholder:text-gray-300 tracking-wider"
                    />
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={loading || phoneNumber.length < 10}
                    className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-sm ${
                      loading || phoneNumber.length < 10
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

                  <div className="flex justify-between items-center px-1 mb-4">
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
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length < 6}
                    className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-sm ${
                      loading || otp.length < 6
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading ? "Verifying..." : "Verify & Log In 🚀"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* EMAIL FORM */}
          {authMethod === "email" && (
            <div>
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
                onClick={handleEmailLogin}
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black text-white transition-all ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Please wait..." : "Log In 🚀"}
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

          {/* GOOGLE BUTTON */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            <FcGoogle size={24} />
            Continue with Google
          </button>
        </div>

        <p className="text-center text-gray-400 mt-8 font-semibold">
          Don&apos;t have an account?
          <span
            onClick={() => router.push("/signup")}
            className="text-blue-600 ml-2 font-black cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}