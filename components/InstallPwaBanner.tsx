"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useFirebase } from "@/context/FirebaseContext";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPwaBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const { user } = useFirebase();

    useEffect(() => {
        // अगर ऐप पहले से इंस्टॉल्ड मोड में चल रहा है तो बैनर न दिखाएं
        if (
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true
        ) {
            return;
        }

        // यह इवेंट तभी आता है जब Chrome डायरेक्ट 1-क्लिक इंस्टॉल के लिए रेडी हो
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsVisible(true); // सिर्फ तभी बैनर दिखाएं जब 1-क्लिक इंस्टॉल काम करेगा
        };

        const handleAppInstalled = async () => {
            setIsVisible(false);
            setDeferredPrompt(null);

            try {
                const userData = {
                    name: user?.displayName || "Guest / Unauthenticated User",
                    email: user?.email || "No Email Provided",
                    phone: user?.phoneNumber || "No Phone Provided",
                    uid: user?.uid || "guest_user",
                };

                await fetch("/api/track-install", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(userData),
                });
            } catch (err) {
                console.error("Install tracking failed:", err);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, [user]);

    // 1-क्लिक डायरेक्ट इंस्टॉल लॉजिक
    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // सीधे Chrome का सिस्टम पॉपअप ट्रिगर होगा
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    if (!isVisible || !deferredPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-slate-900 border border-slate-700 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <Download className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold">Install SoniLearn App</h4>
                    <p className="text-xs text-slate-300">Fast access & daily practice</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleInstallClick}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition active:scale-95 shadow-md"
                >
                    Install
                </button>
                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 text-slate-400 hover:text-white"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}