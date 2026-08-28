"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Check, RefreshCw, X } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase-client";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type BannerState = "idle" | "installing" | "installed" | "needs_reload";

export default function InstallPwaBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState<BannerState>("idle");
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
        return () => unsub();
    }, []);

    useEffect(() => {
        const previouslyInstalled = typeof window !== "undefined" && localStorage.getItem("sonilearn_app_installed") === "true";
        const dismissed = typeof window !== "undefined" && sessionStorage.getItem("sonilearn_install_dismissed") === "true";
        const isStandalone = typeof window !== "undefined" && (
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true
        );

        if (previouslyInstalled || isStandalone || dismissed) {
            return;
        }

        setIsVisible(true);

        // 🎯 If the global InstallPromptManager (in layout.tsx) already
        // captured the event before this component mounted, reuse it here.
        const existingPrompt = (window as any).deferredInstallPrompt;
        if (existingPrompt) {
            setDeferredPrompt(existingPrompt);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setStatus("idle");
        };

        const handleAppInstalled = async () => {
            setStatus("installed");
            if (typeof window !== "undefined") {
                localStorage.setItem("sonilearn_app_installed", "true");
            }
            setDeferredPrompt(null);
            setTimeout(() => setIsVisible(false), 1800);

            try {
                await fetch("/api/track-install", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: currentUser?.displayName || "Guest / Unauthenticated User",
                        email: currentUser?.email || "No Email Provided",
                        phone: currentUser?.phoneNumber || "No Phone Provided",
                        uid: currentUser?.uid || "guest_user",
                    }),
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const handleInstallClick = async () => {
        if (status === "installing") return;

        if (!deferredPrompt) {
            setStatus("needs_reload");
            return;
        }

        setStatus("installing");
        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome !== "accepted") {
                setStatus("idle");
                setDeferredPrompt(null);
            }
        } catch (err) {
            console.error("Install prompt failed:", err);
            setStatus("idle");
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        if (typeof window !== "undefined") {
            sessionStorage.setItem("sonilearn_install_dismissed", "true");
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-white border border-slate-200 text-slate-900 p-4 rounded-2xl shadow-2xl shadow-slate-900/10 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-xl text-white shrink-0 transition-colors ${status === "installed" ? "bg-emerald-500" : "bg-blue-600"
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
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                        {status === "installed"
                            ? "Installed! 🎉"
                            : status === "installing"
                                ? "Installing SoniLearn..."
                                : status === "needs_reload"
                                    ? "Reload to continue"
                                    : "Install SoniLearn App"}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                        {status === "installed"
                            ? "App is now on your home screen"
                            : status === "installing"
                                ? "Just a moment..."
                                : status === "needs_reload"
                                    ? "Tap reload to try installing again"
                                    : "Fast access, offline-friendly practice"}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {(status === "idle" || status === "needs_reload") && (
                    <button
                        onClick={status === "needs_reload" ? () => window.location.reload() : handleInstallClick}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-md"
                    >
                        {status === "needs_reload" ? "Reload" : "Install"}
                    </button>
                )}
                {status === "idle" && (
                    <button
                        onClick={handleDismiss}
                        className="text-slate-400 hover:text-slate-600 p-1"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}