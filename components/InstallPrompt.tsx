"use client";

import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { auth } from "@/lib/firebase-client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_FLAG = "isAppInstalled";
const LEGACY_INSTALL_FLAG = "sonilearn_app_installed";
const REAPPEAR_DELAY = 60000;
const FALLBACK_DELAY = 5000;

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isInstalled() {
  return localStorage.getItem(INSTALL_FLAG) === "true" ||
    localStorage.getItem(LEGACY_INSTALL_FLAG) === "true" ||
    isStandaloneMode();
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const reappearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isInstalled()) return;

    const existingPrompt = (window as Window & { deferredInstallPrompt?: BeforeInstallPromptEvent }).deferredInstallPrompt;
    if (existingPrompt) {
      setDeferredPrompt(existingPrompt);
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      (window as Window & { deferredInstallPrompt?: BeforeInstallPromptEvent }).deferredInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setIsVisible(true);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };

    const handleAppInstalled = async () => {
      localStorage.setItem(INSTALL_FLAG, "true");
      localStorage.setItem(LEGACY_INSTALL_FLAG, "true");
      setDeferredPrompt(null);
      setIsVisible(false);
      setShowInstructions(false);
      if (reappearTimerRef.current) clearTimeout(reappearTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

      try {
        const currentUser = auth.currentUser;
        const response = await fetch("/api/track-install", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: currentUser?.displayName || "Guest / Unauthenticated User",
            email: currentUser?.email || "No Email Provided",
            phone: currentUser?.phoneNumber || "No Phone Provided",
            uid: currentUser?.uid || "guest_user",
          }),
        });

        if (!response.ok) {
          console.error("Install notification request failed:", response.status);
        }
      } catch (error) {
        console.error("Install notification failed:", error);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    fallbackTimerRef.current = setTimeout(() => {
      if (!isInstalled()) setIsVisible(true);
      fallbackTimerRef.current = null;
    }, FALLBACK_DELAY);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (reappearTimerRef.current) clearTimeout(reappearTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome !== "accepted") setDeferredPrompt(null);
      return;
    }

    setShowInstructions(true);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (reappearTimerRef.current) clearTimeout(reappearTimerRef.current);
    reappearTimerRef.current = setTimeout(() => {
      if (!isInstalled()) setIsVisible(true);
      reappearTimerRef.current = null;
    }, REAPPEAR_DELAY);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl shadow-slate-900/10 md:left-auto md:right-4 md:w-96">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-xl bg-blue-600 p-2.5 text-white">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold">Install SoniLearn App</h4>
            <p className="truncate text-xs text-slate-500">Fast access, offline-friendly practice</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={handleInstall} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-95">
            Install App
          </button>
          <button onClick={handleDismiss} aria-label="Dismiss install banner" className="p-1 text-slate-400 transition hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="install-instructions-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id="install-instructions-title" className="text-lg font-black text-slate-900">Install SoniLearn</h2>
              <button onClick={() => setShowInstructions(false)} aria-label="Close installation instructions" className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Click the browser menu (⋮ or Share) and tap &apos;Add to Home screen&apos;.</p>
            <button onClick={() => setShowInstructions(false)} className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white">Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
