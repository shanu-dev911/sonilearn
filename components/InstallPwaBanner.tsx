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
    const [isStandalone, setIsStandalone] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const { user } = useFirebase();

    useEffect(() => {
        // चेक करें कि क्या ऐप पहले से इंस्टॉल्ड मोड में चल रहा है
        if (
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true
        ) {
            setIsStandalone(true);
            return;
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = async () => {
            setIsStandalone(true);
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

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setIsStandalone(true);
            }
            setDeferredPrompt(null);
        } else {
            // अगर ब्राउज़र ने ऑटो-प्रॉम्प्ट ब्लॉक किया है, तो यूजर को गाइड करें
            alert("ऐप इंस्टॉल करने के लिए ऊपर 3 डॉट्स (⋮) पर क्लिक करें और 'Install and create shortcut' / 'Add to Home screen' चुनें।");
        }
    };

    // अगर यूजर पहले से इंस्टॉल किए हुए ऐप में है या उसने क्रॉस दबा दिया है, तो न दिखाएं
    if (isStandalone || isDismissed) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-slate-900 border border-slate-700 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <Download className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold">Install SoniLearn App</h4>
                    <p className="text-xs text-slate-300">Fast access & offline practice</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleInstallClick}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
                >
                    Install
                </button>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="p-1 text-slate-400 hover:text-white"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}