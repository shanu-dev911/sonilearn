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
    const [isInstalled, setIsInstalled] = useState(true); // डिफ़ॉल्ट रूप से हिडन जब तक चेक न हो जाए
    const { user } = useFirebase();

    useEffect(() => {
        // 1. अगर पहले से इंस्टॉल है (Local Storage या Standalone Mode में), तो बैनर बिल्कुल न दिखाएं
        const previouslyInstalled = localStorage.getItem("sonilearn_app_installed") === "true";
        const isStandaloneMode =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;

        if (previouslyInstalled || isStandaloneMode) {
            setIsInstalled(true);
            return;
        }

        // अगर इंस्टॉल नहीं है तो बैनर दिखाएं
        setIsInstalled(false);

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        // 2. जैसे ही ऐप इंस्टॉल हो जाए, तुरंत गायब करें और Telegram पर डेटा भेजें
        const handleAppInstalled = async () => {
            setIsInstalled(true);
            localStorage.setItem("sonilearn_app_installed", "true");
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
                setIsInstalled(true);
                localStorage.setItem("sonilearn_app_installed", "true");
            }
            setDeferredPrompt(null);
        } else {
            alert("ऐप इंस्टॉल करने के लिए ऊपर 3 डॉट्स (⋮) पर क्लिक करके 'Install app' या 'Add to Home screen' चुनें।");
        }
    };

    // अगर इंस्टॉल हो चुका है, तो कुछ भी रेंडर न करें (पूरी तरह गायब)
    if (isInstalled) return null;

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