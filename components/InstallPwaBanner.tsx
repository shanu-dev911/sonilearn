"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
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
        // चेक करें कि क्या ऐप पहले से इंस्टॉल है
        const previouslyInstalled = typeof window !== "undefined" && localStorage.getItem("sonilearn_app_installed") === "true";
        const isStandalone = typeof window !== "undefined" && (
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true
        );

        if (previouslyInstalled || isStandalone) {
            return;
        }

        // Chrome का 1-क्लिक प्रॉम्प्ट इवेंट लिसनर
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsVisible(true);
        };

        // इंस्टॉल कन्फ़र्म होने पर Telegram पर अलर्ट भेजना
        const handleAppInstalled = async () => {
            setIsVisible(false);
            if (typeof window !== "undefined") {
                localStorage.setItem("sonilearn_app_installed", "true");
            }
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

    // डायरेक्ट 1-क्लिक नेटिव इंस्टॉल ट्रिगर
    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setIsVisible(false);
            if (typeof window !== "undefined") {
                localStorage.setItem("sonilearn_app_installed", "true");
            }
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
            <div>
                <button
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition active:scale-95 shadow-md"
                >
                    Install
                </button>
            </div>
        </div>
    );
}