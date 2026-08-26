"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export default function UpdatePwaBanner() {
    const [hasUpdate, setHasUpdate] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                setHasUpdate(true);
            });
        }
    }, []);

    const handleReload = () => {
        window.location.reload();
    };

    if (!hasUpdate) return null;

    return (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-amber-900 border border-amber-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600 rounded-lg text-white">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold">New Update Available</h4>
                    <p className="text-xs text-amber-200">Tap to refresh for latest features</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleReload}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition"
                >
                    Reload
                </button>
                <button
                    onClick={() => setHasUpdate(false)}
                    className="p-1 text-amber-300 hover:text-white"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}