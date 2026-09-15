"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    BookOpen,
    BarChart3,
    User,
    Smartphone,
} from "lucide-react";

const navItems = [
    {
        href: "/",
        icon: Home,
        label: "Home",
    },
    {
        href: "/tests",
        icon: BookOpen,
        label: "Tests",
    },
    {
        href: "#download",
        icon: Smartphone,
        label: "App",
        isAction: true,
    },
    {
        href: "/progress",
        icon: BarChart3,
        label: "Progress",
    },
    {
        href: "/profile",
        icon: User,
        label: "Profile",
    },
];

export default function BottomNav() {
    const pathname = usePathname();

    const handleAppDownload = (e: React.MouseEvent) => {
        e.preventDefault();
        if (typeof window !== "undefined") {
            // APK का सीधा लिंक या public/sonilearn.apk पाथ
            window.open("/sonilearn.apk", "_blank");
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
            <div className="h-16 flex items-center justify-around max-w-md mx-auto px-2">
                {navItems.map(({ href, icon: Icon, label, isAction }) => {
                    const active = pathname === href;

                    if (isAction) {
                        return (
                            <button
                                key={label}
                                onClick={handleAppDownload}
                                className="flex flex-col items-center justify-center text-xs font-bold text-blue-600 active:scale-95 transition-transform"
                            >
                                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
                                    <Icon size={19} className="animate-pulse" />
                                </div>
                                <span className="text-[10px] text-blue-700 font-extrabold mt-0.5">
                                    {label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center justify-center text-xs font-medium"
                        >
                            <Icon
                                size={22}
                                className={active ? "text-blue-600" : "text-gray-400"}
                            />
                            <span
                                className={`text-[11px] font-semibold mt-1 ${active ? "text-blue-600" : "text-gray-500"
                                    }`}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}