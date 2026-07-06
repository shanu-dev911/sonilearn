"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    Home,
    BookOpen,
    BarChart3,
    User,
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

    return (
        <nav
            className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white border-t border-gray-200
      "
        >
            <div className="h-16 flex items-center justify-around">

                {navItems.map(
                    ({ href, icon: Icon, label }) => {

                        const active = pathname === href;

                        return (
                            <Link
                                key={href}
                                href={href}
                                className="
                  flex flex-col items-center justify-center
                  text-xs font-medium
                "
                            >
                                <Icon
                                    size={22}
                                    className={
                                        active
                                            ? "text-blue-600"
                                            : "text-gray-400"
                                    }
                                />

                                <span
                                    className={
                                        active
                                            ? "text-blue-600 mt-1"
                                            : "text-gray-500 mt-1"
                                    }
                                >
                                    {label}
                                </span>
                            </Link>
                        );
                    }
                )}

            </div>
        </nav>
    );
}