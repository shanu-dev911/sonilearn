// FILE PATH IN YOUR PROJECT: app/doubt-solver/page.jsx

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, ImagePlus, X, Loader2 } from "lucide-react";

export default function DoubtSolverPage() {
    const [question, setQuestion] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [messages, setMessages] = useState([]); // { role: "user" | "ai", text, image }
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const router = useRouter();

    function handleImageSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }

    function removeImage() {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]); // strip data: prefix
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!question.trim() && !imageFile) return;

        const userMsg = { role: "user", text: question, image: imagePreview };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            let imageBase64 = null;
            let mimeType = null;
            if (imageFile) {
                imageBase64 = await fileToBase64(imageFile);
                mimeType = imageFile.type;
            }

            const res = await fetch("/api/doubt-solver", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, imageBase64, mimeType }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages((prev) => [
                    ...prev,
                    { role: "ai", text: `❌ Error: ${data.error || "Kuch galat ho gaya"}` },
                ]);
            } else {
                setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: "ai", text: "❌ Network error. Dobara try karein." },
            ]);
        } finally {
            setLoading(false);
            setQuestion("");
            removeImage();
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans flex flex-col">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-blue-700 tracking-tight">Doubt Solver</h1>
                        <p className="text-[10px] text-slate-500 font-medium">AI se apna sawal poochein</p>
                    </div>
                </div>
            </header>

            {/* CHAT AREA */}
            <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col gap-4">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 text-sm mt-16">
                        👋 Apna Maths, Science, GK, Reasoning ya koi bhi doubt yahan type karein — ya sawal ki photo upload karein.
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${msg.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white border border-slate-200 text-slate-800 shadow-sm"
                                }`}
                        >
                            {msg.image && (
                                <img
                                    src={msg.image}
                                    alt="question"
                                    className="rounded-lg mb-2 max-h-48 object-contain"
                                />
                            )}
                            {msg.text}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2 text-slate-500 text-sm">
                            <Loader2 size={14} className="animate-spin" />
                            Soch raha hoon...
                        </div>
                    </div>
                )}
            </main>

            {/* INPUT BAR */}
            <form
                onSubmit={handleSubmit}
                className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3"
            >
                <div className="max-w-3xl mx-auto">
                    {imagePreview && (
                        <div className="relative inline-block mb-2">
                            <img src={imagePreview} alt="preview" className="h-16 rounded-lg border border-slate-200" />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            className="hidden"
                            id="doubt-image-input"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            <ImagePlus size={18} className="text-slate-600" />
                        </button>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Apna sawal type karein..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={loading || (!question.trim() && !imageFile)}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}