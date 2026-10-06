"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Clock,
  FileText,
  Play,
  Sparkles,
  User,
} from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  description: string;
  exam: string;
  subject: string;
  faculty: string;
  duration: string;
  youtubeId: string;
  isLatest: boolean;
}

function extractYoutubeId(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const input = value.trim();
  if (/^[\w-]{11}$/.test(input)) return input;

  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!["youtube.com", "m.youtube.com", "youtube-nocookie.com", "youtu.be"].includes(hostname)) {
      return null;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const id =
      hostname === "youtu.be"
        ? pathParts[0]
        : url.searchParams.get("v") ||
          (["embed", "shorts", "live", "v"].includes(pathParts[0]) ? pathParts[1] : null);

    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedExam, setSelectedExam] = useState("ALL");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [openNotesId, setOpenNotesId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadVideos = async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const videosQuery = query(collection(db, "videos"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(videosQuery);
        const loadedVideos = snapshot.docs.flatMap((document) => {
          const data = document.data();
          const youtubeId = extractYoutubeId(
            data.youtubeId ?? data.youtubeUrl ?? data.videoUrl ?? data.url,
          );

          if (!youtubeId) return [];

          return [{
            id: document.id,
            title: asText(data.title, "Untitled class"),
            description: asText(data.notes ?? data.summary ?? data.description),
            exam: asText(data.exam, "Exam prep"),
            subject: asText(data.subject, "General"),
            faculty: asText(data.faculty, "SoniLearn Faculty"),
            duration: asText(data.duration, "Full lecture"),
            youtubeId,
            isLatest: data.isLatest === true,
          }];
        });

        if (isMounted) setVideos(loadedVideos);
      } catch (error) {
        console.error("Error loading public video lectures:", error);
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadVideos();
    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  const examOptions = ["ALL", ...Array.from(new Set(videos.map((video) => video.exam)))];
  const subjectOptions = ["ALL", ...Array.from(new Set(videos.map((video) => video.subject)))];
  const filteredVideos = videos.filter((video) => {
    const matchesExam = selectedExam === "ALL" || video.exam === selectedExam;
    const matchesSubject = selectedSubject === "ALL" || video.subject === selectedSubject;
    return matchesExam && matchesSubject;
  });
  const featuredVideo = videos.find((video) => video.isLatest) ?? videos[0];

  const playVideo = (videoId: string) => setPlayingVideoId(videoId);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              className="rounded-xl bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-base font-black leading-tight text-slate-900">
                Coaching Video Classes
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Concept &amp; Trick Lectures
              </p>
            </div>
          </div>
          <span className="hidden rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-blue-700 sm:inline-flex">
            Learn at your pace
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 pt-6">
        {featuredVideo && !loading && (
          <section className="relative overflow-hidden rounded-3xl border border-indigo-900/40 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-5 text-white shadow-xl sm:p-7">
            <div className="relative z-10 max-w-3xl">
              <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950">
                <Sparkles size={12} /> Featured class
              </span>
              <p className="mb-2 text-xs font-bold text-indigo-200">
                {featuredVideo.exam} <span className="px-1">•</span> {featuredVideo.subject}
              </p>
              <h2 className="text-xl font-black leading-snug sm:text-2xl">{featuredVideo.title}</h2>
              {featuredVideo.description && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-300">
                  {featuredVideo.description}
                </p>
              )}
              <button
                type="button"
                onClick={() => playVideo(featuredVideo.id)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg transition hover:bg-blue-500 active:scale-95"
              >
                <Play size={14} fill="currentColor" /> Watch class
              </button>
            </div>
            <div aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          </section>
        )}

        {!loading && videos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {examOptions.map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => {
                    setSelectedExam(exam);
                    setSelectedSubject("ALL");
                  }}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    selectedExam === exam
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {exam === "ALL" ? "All Exams" : exam}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {subjectOptions.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => setSelectedSubject(subject)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                    selectedSubject === subject
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {subject === "ALL" ? "All Subjects" : subject}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-xs font-bold text-slate-500">Loading video lectures...</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-10 text-center">
            <h3 className="text-sm font-black text-slate-800">Lectures couldn&apos;t be loaded</h3>
            <p className="mt-1 text-xs text-slate-500">Please check your connection and try again.</p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
            >
              Try again
            </button>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
            <h3 className="text-sm font-black text-slate-800">No lectures found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {videos.length
                ? "There are no lectures for these filters."
                : "New lectures will appear here as soon as they are published."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((video) => {
              const isPlaying = playingVideoId === video.id;
              const notesOpen = openNotesId === video.id;

              return (
                <article
                  key={video.id}
                  onClick={(event) => {
                    const target = event.target;
                    if (target instanceof Element && target.closest("button, iframe, a")) return;
                    playVideo(video.id);
                  }}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
                >
                  <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950">
                    {isPlaying ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full border-0"
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-label={`Play ${video.title}`}
                          onClick={() => playVideo(video.id)}
                          className="absolute inset-0 z-10 flex h-full w-full items-center justify-center"
                        >
                          <img
                            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 bg-slate-950/35 transition group-hover:bg-slate-950/20" />
                          <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-blue-600/90 text-white shadow-[0_0_30px_rgba(59,130,246,0.8)] transition group-hover:scale-110">
                            <Play size={22} fill="currentColor" className="ml-1" />
                          </span>
                        </button>
                        <span className="pointer-events-none absolute bottom-2 right-2 z-20 inline-flex items-center gap-1 rounded-md bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-white">
                          <Clock size={11} /> {video.duration}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => playVideo(video.id)}
                    className="mt-3 flex flex-1 flex-col text-left"
                  >
                    <span className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-blue-700">
                        {video.exam}
                      </span>
                      <span className="rounded-md bg-indigo-50 px-2 py-1 text-[9px] font-bold text-indigo-700">
                        {video.subject}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-sm font-black leading-snug text-slate-900">
                      {video.title}
                    </span>
                    <span className="mt-2 flex items-center gap-1.5 truncate text-[11px] font-semibold text-slate-500">
                      <User size={13} className="shrink-0" />
                      {video.faculty}
                    </span>
                  </button>

                  <div className="mt-3 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      aria-expanded={notesOpen}
                      onClick={() => setOpenNotesId(notesOpen ? null : video.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg py-1.5 text-left text-[11px] font-bold text-indigo-700 transition hover:text-indigo-900"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <FileText size={14} />
                        View Class Notes &amp; Summary
                      </span>
                      <ChevronDown
                        size={15}
                        className={`shrink-0 transition-transform ${notesOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {notesOpen && (
                      <div className="mt-1 rounded-xl bg-indigo-50/80 p-3 text-xs leading-relaxed text-slate-700">
                        {video.description ? (
                          <p className="whitespace-pre-wrap">{video.description}</p>
                        ) : (
                          <p className="text-slate-500">Notes haven&apos;t been added for this class yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
