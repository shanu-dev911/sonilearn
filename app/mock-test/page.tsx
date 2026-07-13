export const dynamic = 'force-dynamic';

"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function MockTest() {
    const router = useRouter();
    const [show, setShow] = useState(true); // 🔥 direct open

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">

            {/* POPUP DIRECT */}
            {show && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

                    <div className="bg-white p-6 rounded-2xl w-full max-w-md">

                        <h2 className="text-xl font-bold text-center mb-2">
                            Select Test
                        </h2>

                        <p className="text-gray-500 text-center mb-5 text-sm">
                            Choose your mock test
                        </p>

                        {/* ALL */}
                        <button
                            onClick={() => router.push("/mock-test/live?subject=All")}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold mb-4"
                        >
                            All (50 Qs / 60 min)
                        </button>

                        <div className="text-center text-gray-400 text-sm mb-3">
                            — Subject Wise —
                        </div>

                        {/* SUBJECT GRID */}
                        <div className="grid grid-cols-2 gap-3">

                            {[
                                { name: "Math", label: "Math" },
                                { name: "Reasoning", label: "Reasoning" },
                                { name: "English", label: "English " },
                                { name: "GK", label: "GK " },
                            ].map((sub) => (
                                <button
                                    key={sub.name}
                                    onClick={() =>
                                        router.push(`/mock-test/live?subject=${sub.name}`)
                                    }
                                    className="py-4 bg-slate-100 hover:bg-slate-200 rounded-2xl font-medium text-gray-700 transition text-sm"
                                >
                                    {sub.label}
                                </button>
                            ))}

                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}