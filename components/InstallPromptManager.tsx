"use client";

import { useEffect } from "react";

// 🎯 GLOBAL SUPPRESSOR — runs on every page via layout.tsx.
// Prevents the browser's own native "Add to Home Screen" popup from
// appearing automatically on ANY page (including login/signup).
// The captured event is stored globally so InstallPwaBanner (shown
// only on the Dashboard) can still use it when the user taps Install.
export default function InstallPromptManager() {
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            (window as any).deferredInstallPrompt = e;
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    return null;
}