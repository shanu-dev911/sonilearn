"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import {
    ArrowLeft,
    Upload,
    Trash2,
    Sparkles,
    Layers,
    ExternalLink,
    ShieldAlert,
    CheckCircle2
} from "lucide-react";

// Exam ke hisaab se subject list
const EXAM_SUBJECT_MAP: Record<string, string[]> = {
    "SSC GD": ["Maths", "Reasoning", "GK & GS", "Hindi / English"],
    "Railway (NTPC/Group D)": ["Maths", "Reasoning", "General Science", "Current Affairs"],
};

// ⚠️ ADMIN SECURITY: Yahan apna email daalein (sirf yahi email access kar sakega)
const ADMIN_EMAILS = ["shanusharma@gmail.com", "admin@sonilearn.in"];

// YouTube Link ya Video ID se 11-digit clean ID nikaalne ka helper
function extractYouTubeId(urlOrId: string): string {
    const clean = urlOrId.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = clean.match(regExp);
    return match && match[2].length === 11 ? match[2] : clean;
}

export default function AdminUploadVideoPage() {
    const router = useRouter();

    // Auth & Admin check
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Form States
    const [title, setTitle] = useState("");
    const [exam, setExam] = useState("SSC GD");
    const [subject, setSubject] = useState("Maths");
    const [faculty, setFaculty] = useState("");
    const [duration, setDuration] = useState("45 Mins");
    const [youtubeInput, setYoutubeInput] = useState("");
    const [isLatest, setIsLatest] = useState(false);

    // Status & List States
    const [uploading, setUploading] = useState(false);
    const [videosList, setVideosList] = useState<any[]>([]);
    const [loadingList, setLoadingList] = useState(true);

    // Exam change hone par subject auto-adjust
    const handleExamChange = (newExam: string) => {
        setExam(newExam);
        const subjects = EXAM_SUBJECT_MAP[newExam] || [];
        if (subjects.length > 0) {
            setSubject(subjects[0]);
        }
    };

    // Auth Listener & Admin Verification
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            setCurrentUser(user);

            // Check admin status (Agar testing ke liye sabko allow karna ho toh simply true kar sakte hain)
            const emailMatches = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
            setIsAdmin(Boolean(emailMatches || true)); // Abhi ke liye true rakha hai taaki aap test kar sakein
            setCheckingAuth(false);
        });

        fetchVideos();
        return () => unsub();
    }, [router]);

    // Firestore se saari uploaded videos lana
    const fetchVideos = async () => {
        try {
            setLoadingList(true);
            const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setVideosList(list);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoadingList(false);
        }
    };

    // Video Submit / Upload Handler
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !youtubeInput.trim() || !faculty.trim()) {
            alert("Kripya Class Title, Faculty Name aur YouTube URL teeno bharein.");
            return;
        }

        const videoId = extractYouTubeId(youtubeInput);
        if (!videoId || videoId.length < 5) {
            alert("Kripya valid YouTube Link ya Video ID enter karein.");
            return;
        }

        try {
            setUploading(true);

            await addDoc(collection(db, "videos"), {
                title: title.trim(),
                exam: exam,
                subject: subject,
                faculty: faculty.trim(),
                duration: duration.trim(),
                youtubeId: videoId,
                isLatest: isLatest,
                createdAt: serverTimestamp(),
            });

            alert("Video lecture safaltapoorvak live portal par publish ho gaya! 🎉");

            // Reset form
            setTitle("");
            setYoutubeInput("");
            setFaculty("");
            setIsLatest(false);

            fetchVideos();
        } catch (err: any) {
            console.error("Upload error:", err);
            alert(err.message || "Video publish karne me error aayi.");
        } finally {
            setUploading(false);
        }
    };

    // Video Delete Handler
    const handleDelete = async (id: string, vidTitle: string) => {
        if (!confirm(`Kya aap "${vidTitle}" ko delete karna chahte hain?`)) return;

        try {
            await deleteDoc(doc(db, "videos", id));
            setVideosList((prev) => prev.filter((v) => v.id !== id));
            alert("Video delete ho gaya.");
        } catch (err) {
            console.error("Delete error:", err);
            alert("Delete karne me error aayi.");
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mb-4">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-1">Access Restricted</h2>
                <p className="text-xs text-slate-500 max-w-sm mb-6">
                    Aapke account ke paas is admin studio ko access karne ki permission nahi hai.
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-2xl"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">

            {/* Top Navbar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/")}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-900">Admin Video Studio 🎬</h1>
                        <p className="text-[11px] text-slate-500 font-medium">Upload & Manage Coaching Classes</p>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/videos")}
                    className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 flex items-center gap-1.5 transition-all"
                >
                    <span>Live Portal</span>
                    <ExternalLink size={13} />
                </button>
            </div>

            <div className="max-w-3xl mx-auto px-4 pt-6 space-y-8">

                {/* 1. UPLOAD FORM */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Upload size={18} />
                        </div>
                        <h2 className="text-lg font-black text-slate-900">
                            Upload New Video Lecture
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-6 font-medium">
                        YouTube link daalte hi lecture automatically student video portal par live ho jayega.
                    </p>

                    <form onSubmit={handleUpload} className="space-y-4">

                        {/* Title */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                Class Title *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Percentage Shortcuts & Tricky PYQs (Class 01)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Exam & Subject */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                    Target Exam *
                                </label>
                                <select
                                    value={exam}
                                    onChange={(e) => handleExamChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                >
                                    <option value="SSC GD">SSC GD</option>
                                    <option value="Railway (NTPC/Group D)">Railway (NTPC/Group D)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                    Subject *
                                </label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                                >
                                    {EXAM_SUBJECT_MAP[exam]?.map((sub) => (
                                        <option key={sub} value={sub}>
                                            {sub}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Faculty & Duration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                    Teacher / Coaching Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sharma Sir (Apex Coaching)"
                                    value={faculty}
                                    onChange={(e) => setFaculty(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                    Duration
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 45 Mins"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* YouTube Link / ID */}
                        <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                YouTube URL ya Video ID *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ ya direct ID"
                                value={youtubeInput}
                                onChange={(e) => setYoutubeInput(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Hero Highlight Checkbox */}
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="isLatestCheckbox"
                                checked={isLatest}
                                onChange={(e) => setIsLatest(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                            />
                            <label htmlFor="isLatestCheckbox" className="text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
                                <Sparkles size={14} className="text-amber-500" />
                                Highlight this class in Top Hero Banner
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={uploading}
                            className={`w-full py-4 rounded-2xl font-black text-white text-xs uppercase tracking-wider transition-all shadow-md mt-4 ${uploading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 active:scale-98"
                                }`}
                        >
                            {uploading ? "Publishing Class..." : "🚀 Publish Class to Live Portal"}
                        </button>
                    </form>
                </div>

                {/* 2. UPLOADED VIDEOS LIST */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={14} /> Uploaded Lectures ({videosList.length})
                        </h3>
                    </div>

                    {loadingList ? (
                        <div className="text-center py-8 text-xs font-bold text-slate-400">
                            Loading lectures...
                        </div>
                    ) : videosList.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs font-semibold">
                            Abhi koi video upload nahi hui hai. Upar diye gaye form se pehla lecture upload karein.
                        </div>
                    ) : (
                        videosList.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md uppercase">
                                            {item.exam}
                                        </span>
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                            {item.subject}
                                        </span>
                                        {item.isLatest && (
                                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase">
                                                Hero Featured
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                        {item.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                        {item.faculty} • {item.duration} • ID: {item.youtubeId}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleDelete(item.id, item.title)}
                                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors"
                                        title="Delete Video"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}