"use client";

import { Smartphone, Download } from "lucide-react";

interface DownloadAppButtonProps {
    apkUrl?: string; // आपकी APK फ़ाइल, Google Drive या Play Store का लिंक
    className?: string;
}

export default function DownloadAppButton({
    apkUrl = "/sonilearn.apk", // डिफ़ॉल्ट लिंक (public फ़ोल्डर में sonilearn.apk रख सकते हैं)
    className = "",
}: DownloadAppButtonProps) {
    const handleDownload = () => {
        if (typeof window !== "undefined") {
            window.open(apkUrl, "_blank");
        }
    };

    return (
        <button
            onClick={handleDownload}
            className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all ${className}`}
            title="Download Android App"
        >
            <Smartphone size={14} className="animate-bounce" />
            <span>Download App</span>
            <Download size={13} className="opacity-80" />
        </button>
    );
}