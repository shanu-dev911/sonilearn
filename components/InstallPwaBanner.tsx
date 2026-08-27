"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Check, RefreshCw } from "lucide-react";
import { useFirebase } from "@/context/FirebaseContext";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type BannerState = "idle" | "installing" | "installed" | "needs_reload";

export default function InstallPwaBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState<BannerState>("idle");
    const { user } = useFirebase();

    useEffect(() => {
        const previouslyInstalled = typeof window !== "undefined" && localStorage.getItem("sonilearn_app_installed") === "true";
        const isStandalone = typeof window !== "undefined" && (
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true
        );

        if (previouslyInstalled || isStandalone) {
            return; // already installed — banner kabhi nahi dikhega
        }

        // 👇 Banner ab turant dikhega, beforeinstallprompt event ka wait nahi karega
        setIsVisible(true);

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setStatus("idle"); // naya prompt mil gaya, wapas normal "Install" button dikhao
        };

        const handleAppInstalled = async () => {
            setStatus("installed");
            if (typeof window !== "undefined") {
                localStorage.setItem("sonilearn_app_installed", "true");
            }
            setDeferredPrompt(null);
            setTimeout(() => setIsVisible(false), 1800); // sirf ab hide hoga — sirf installed hone par

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
        if (status === "installing") return;

        // Agar browser ka native prompt is waqt available nahi hai
        // (pehle use ho chuka hai is session mein), to seedha reload maango —
        // isse dobara beforeinstallprompt fire hota hai
        if (!deferredPrompt) {
            setStatus("needs_reload");
            return;
        }

        setStatus("installing");
        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome !== "accepted") {
                // Cancel dabaya — banner GAYAB NAHI hoga, bas wapas normal state
                setStatus("idle");
                setDeferredPrompt(null); // ye event ab consume ho chuka, dobara use nahi ho sakta
            }
            // agar accepted, status "installing" hi rahega jab tak asli 'appinstalled' event na aaye
        } catch (err) {
            console.error("Install prompt failed:", err);
            setStatus("idle");
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-slate-900 border border-slate-700 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg text-white shrink-0 transition-colors ${
                    status === "installed" ? "bg-emerald-600" : "bg-blue-600"
                }`}>
                    {status === "installed" ? (
                        <Check className="w-5 h-5" />
                    ) : status === "installing" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : status === "needs_reload" ? (
                        <RefreshCw className="w-5 h-5" />
                    ) : (
                        <Download className="w-5 h-5" />
                    )}
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm font-semibold truncate">
                        {status === "installed"
                            ? "Installed! 🎉"
                            : status === "installing"
                            ? "Installing SoniLearn..."
                            : status === "needs_reload"
                            ? "Page reload karo"
                            : "Install SoniLearn App"}
                    </h4>
                    <p className="text-xs text-slate-300 truncate">
                        {status === "installed"
                            ? "App aapke home screen par hai"
                            : status === "installing"
                            ? "Ek pal ruko, complete ho raha hai"
                            : status === "needs_reload"
                            ? "Fir se Install button milega"
                            : "Fast access & daily practice"}
                    </p>
                </div>
            </div>

            {(status === "idle" || status === "needs_reload") && (
                <button
                    onClick={status === "needs_reload" ? () => window.location.reload() : handleInstallClick}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition active:scale-95 shadow-md shrink-0"
                >
                    {status === "needs_reload" ? "Reload" : "Install"}
                </button>
            )}
        </div>
    );
}