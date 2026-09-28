"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import {
  ArrowLeft,
  Play,
  Sparkles,
  Clock,
  User,
  BookOpen,
  X,
  FileText,
  Lock,
  Crown
} from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  exam: string;
  subject: string;
  faculty: string;
  duration?: string;
  youtubeId: string;
  isLatest?: boolean;
}

export default function VideosPage() {
  const router = useRouter();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState("ALL");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  // Firestore se published videos load karna
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      }
    });

    const loadVideos = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as VideoItem[];
        setVideos(list);
      } catch (err) {
        console.error("Error loading videos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
    return () => unsub();
  }, [router]);

  // Filters
  const filteredVideos = videos.filter((v) => {
    const matchExam = selectedExam === "ALL" || v.exam === selectedExam;
    const matchSubject = selectedSubject === "ALL" || v.subject === selectedSubject;
    return matchExam && matchSubject;
  });

  // Top Hero Video (agar koi 'isLatest' marked ho ya first video)
  const heroVideo = videos.find((v) => v.isLatest) || videos[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">
              Coaching Video Classes 🎬
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Concept & Trick Lectures
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-xl">
          <Crown size={12} />
          <span>Pass Included</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5 space-y-6">

        {/* 1. HERO FEATURED CLASS BANNER */}
        {heroVideo && !loading && (
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-indigo-900/40">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Sparkles size={11} /> FEATURED CLASS
              </span>
              <span className="text-[11px] font-bold text-indigo-200 bg-white/10 px-2 py-0.5 rounded-lg">
                {heroVideo.exam} • {heroVideo.subject}
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white leading-snug mb-2">
              {heroVideo.title}
            </h2>

            {heroVideo.description && (
              <p className="text-xs text-slate-300 font-medium line-clamp-2 mb-5 max-w-2xl leading-relaxed">
                {heroVideo.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                <span>By {heroVideo.faculty}</span>
                <span>•</span>
                <span>{heroVideo.duration || "Class"}</span>
              </div>

              <button
                onClick={() => setActiveVideo(heroVideo)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg active:scale-95 transition"
              >
                <Play size={13} fill="white" /> Watch Class
              </button>
            </div>
          </div>
        )}

        {/* 2. FILTER TABS */}
        <div className="space-y-2">
          {/* Exam Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {["ALL", "SSC GD", "Railway (NTPC/Group D)"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedExam(tab);
                  setSelectedSubject("ALL");
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedExam === tab
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab === "ALL" ? "All Exams" : tab}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {["ALL", "Maths", "Reasoning", "GK & GS", "General Science"].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                  selectedSubject === sub
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {sub === "ALL" ? "All Subjects" : sub}
              </button>
            ))}
          </div>
        </div>

        {/* 3. VIDEOS LIST GRID */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400 font-bold">Loading video lectures...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
            <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-black text-slate-800">No Lectures Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Is filter ke liye abhi koi lecture upload nahi hua hai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => setActiveVideo(vid)}
                className="bg-white border border-slate-200 hover:border-blue-500 rounded-3xl p-4 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail / Placeholder */}
                  <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden mb-3 flex items-center justify-center">
                    <img
                      src={`https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/20 transition flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 text-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                        <Play size={18} fill="#2563eb" className="ml-0.5" />
                      </div>
                    </div>
                    {vid.duration && (
                      <span className="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {vid.duration}
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">
                      {vid.exam}
                    </span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {vid.subject}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug">
                    {vid.title}
                  </h3>

                  {vid.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {vid.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1 truncate">
                    <User size={12} /> {vid.faculty}
                  </span>
                  <span className="text-blue-600 font-bold group-hover:underline">
                    Watch →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* 4. VIDEO PLAYER + NOTES MODAL */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                  {activeVideo.exam} • {activeVideo.subject}
                </span>
                <h3 className="text-sm font-bold truncate mt-1 text-white">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* YouTube Embed Player */}
            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              ></iframe>
            </div>

            {/* Class Details & Notes */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-base font-black text-slate-900 leading-tight">
                  {activeVideo.title}
                </h4>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Faculty: <strong className="text-slate-800">{activeVideo.faculty}</strong> • Duration: {activeVideo.duration || "Full Lecture"}
                </p>
              </div>

              {/* Class Notes Section */}
              {activeVideo.description && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900 uppercase tracking-wider mb-2">
                    <FileText size={14} className="text-indigo-600" />
                    Teacher Notes & Summary
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                    {activeVideo.description}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveVideo(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Close Video
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}