"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase-client"
import { collection, getDocs, query, orderBy, doc, setDoc, deleteDoc, limit } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

export default function CurrentAffairs() {
    const router = useRouter()

    const [viewMode, setViewMode] = useState<"select" | "read" | "quiz">("select")
    const [activeTab, setActiveTab] = useState("today")
    const [newsData, setNewsData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [downloadedIds, setDownloadedIds] = useState<string[]>([])

    // 🔥 NAYE QUIZ STATES (For Review & Score)
    const [quizQuestions, setQuizQuestions] = useState<any[]>([])
    const [userAnswers, setUserAnswers] = useState<number[]>([])
    const [currentQ, setCurrentQ] = useState(0)
    const [score, setScore] = useState(0)
    const [quizFinished, setQuizFinished] = useState(false)
    const [isReviewMode, setIsReviewMode] = useState(false) // Review mode toggle

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid)
                const downloadsRef = collection(db, "users", user.uid, "downloads")
                const snapshot = await getDocs(downloadsRef)
                setDownloadedIds(snapshot.docs.map(doc => doc.id))
            } else {
                setUserId(null)
            }
        })

        const fetchNewsFromDB = async () => {
            setLoading(true)
            try {
                // 10 news fetch hogi (Admin me ek baar dobara fetch kar lena)
                const q = query(collection(db, "current_affairs"), orderBy("createdAt", "desc"), limit(10));
                const querySnapshot = await getDocs(q);
                const fetchedNews: any[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedNews.push({ id: doc.id, ...doc.data() });
                });
                setNewsData(fetchedNews);
            } catch (error) {
                console.error("Error fetching news:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchNewsFromDB();
        return () => unsubscribe();
    }, [])

    const toggleDownload = async (newsId: string, newsItem: any) => {
        if (!userId) { alert("⚠️ Please login to download news!"); return; }
        const isDownloaded = downloadedIds.includes(newsId);
        const downloadRef = doc(db, "users", userId, "downloads", newsId);
        try {
            if (isDownloaded) {
                await deleteDoc(downloadRef);
                setDownloadedIds(prev => prev.filter(id => id !== newsId));
            } else {
                await setDoc(downloadRef, { ...newsItem, downloadedAt: new Date() });
                setDownloadedIds(prev => [...prev, newsId]);
            }
        } catch (error) { alert("❌ Error saving news."); }
    }

    const filteredNews = newsData.filter(news => activeTab === "week" ? true : (news.date === activeTab || !news.date))

    // 🧠 QUIZ START LOGIC (Questions pehle se generate karke fix kar lo)
    const startQuiz = () => {
        if (filteredNews.length === 0) return alert("Bhai abhi koi news nahi hai test ke liye!");

        const generatedQs = filteredNews.map(news => {
            const actualCategory = news.category || "National News";
            const allCategories = ["Sports", "Business & Economy", "Science & Technology", "International Affairs", "Politics", "Entertainment", "Defense", "National News"];
            const wrongCategories = allCategories.filter(c => c !== actualCategory).sort(() => 0.5 - Math.random()).slice(0, 3);

            const options = [
                { text: actualCategory, isCorrect: true },
                { text: wrongCategories[0], isCorrect: false },
                { text: wrongCategories[1], isCorrect: false },
                { text: wrongCategories[2], isCorrect: false }
            ].sort(() => Math.random() - 0.5);

            return { news, options };
        });

        setQuizQuestions(generatedQs);
        setUserAnswers(new Array(generatedQs.length).fill(null)); // Khali answers array
        setCurrentQ(0);
        setScore(0);
        setQuizFinished(false);
        setIsReviewMode(false);
        setViewMode("quiz");
    }

    // 🧠 ANSWER SUBMIT LOGIC
    const handleAnswerSubmit = (isCorrect: boolean, optionIndex: number) => {
        if (userAnswers[currentQ] !== null || isReviewMode) return; // Answer lock ho gaya

        // Save the user's answer
        const newAnswers = [...userAnswers];
        newAnswers[currentQ] = optionIndex;
        setUserAnswers(newAnswers);

        if (isCorrect) setScore(prev => prev + 1);

        // Agle sawal par automatically jana
        setTimeout(() => {
            if (currentQ < quizQuestions.length - 1) {
                setCurrentQ(prev => prev + 1);
            } else {
                setQuizFinished(true);
            }
        }, 1200);
    }

    // ==========================================
    // 🖥️ UI 1: SELECTION GATEWAY 
    // ==========================================
    if (viewMode === "select") {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans p-6 items-center justify-center">
                <button onClick={() => router.push("/")} className="absolute top-8 left-6 w-12 h-12 bg-white rounded-full shadow-sm text-gray-600 font-bold text-xl hover:bg-gray-100 flex items-center justify-center">←</button>
                <div className="text-center mb-10 mt-10">
                    <div className="text-6xl mb-4 animate-bounce">📰</div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Daily Current Affairs</h1>
                    <p className="text-gray-500 font-medium">What would you like to do today?</p>
                </div>
                <div className="w-full max-w-sm space-y-5">
                    <button onClick={() => setViewMode("read")} className="w-full bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:border-blue-400 active:scale-95 transition-all text-left flex items-center gap-5 group relative overflow-hidden">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl relative z-10">📖</div>
                        <div className="relative z-10">
                            <h2 className="font-black text-gray-900 text-xl">Read Articles</h2>
                            <p className="text-xs text-gray-500 mt-1 font-bold">Read today's top news</p>
                        </div>
                    </button>
                    <button onClick={startQuiz} className="w-full bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl active:scale-95 transition-all text-left flex items-center gap-5 group">
                        <div className="w-16 h-16 bg-white/10 text-orange-400 rounded-2xl flex items-center justify-center text-3xl">📝</div>
                        <div>
                            <h2 className="font-black text-white text-xl">Take Mock Test</h2>
                            <p className="text-xs text-gray-300 mt-1 font-bold">Test your memory ({filteredNews.length} Qs)</p>
                        </div>
                    </button>
                </div>
            </div>
        )
    }

    // ==========================================
    // 🖥️ UI 2: MOCK TEST & REVIEW MODE
    // ==========================================
    if (viewMode === "quiz" && quizQuestions.length > 0) {
        const currentData = quizQuestions[currentQ];
        const selectedOptIndex = userAnswers[currentQ];

        return (
            <div className="min-h-screen bg-gray-100 flex flex-col font-sans fixed inset-0 z-50">

                {/* Header */}
                <div className="bg-white px-4 py-4 shadow-sm flex justify-between items-center">
                    <button onClick={() => setViewMode("select")} className="text-gray-500 font-bold hover:text-red-500">✕ Exit</button>
                    <div className="font-black text-gray-800">
                        {isReviewMode ? "Review Mode" : `Q ${currentQ + 1} / ${quizQuestions.length}`}
                    </div>
                    {!isReviewMode && <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-lg text-sm">Score: {score}</div>}
                </div>

                <div className="flex-1 p-5 max-w-2xl mx-auto w-full flex flex-col justify-center overflow-y-auto">

                    {/* 🏆 RESULT SCREEN (Dikhayega Kitne Sahi, Kitne Galat) */}
                    {quizFinished && !isReviewMode ? (
                        <div className="bg-white p-8 rounded-[40px] shadow-xl text-center border border-gray-100 animate-in zoom-in">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-3xl font-black text-gray-900 mb-2">Test Finished!</h2>

                            <div className="flex justify-center gap-4 my-6">
                                <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex-1">
                                    <p className="text-green-600 font-black text-2xl">{score}</p>
                                    <p className="text-green-800 text-xs font-bold uppercase">Correct ✅</p>
                                </div>
                                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex-1">
                                    <p className="text-red-600 font-black text-2xl">{quizQuestions.length - score}</p>
                                    <p className="text-red-800 text-xs font-bold uppercase">Wrong ❌</p>
                                </div>
                            </div>

                            <div className="space-y-3 mt-4">
                                <button
                                    onClick={() => {
                                        setIsReviewMode(true);
                                        setCurrentQ(0);
                                    }}
                                    className="w-full bg-blue-100 text-blue-700 font-black py-4 rounded-2xl shadow-sm hover:bg-blue-200 transition-all"
                                >
                                    🔍 Review Answers
                                </button>
                                <button onClick={() => setViewMode("select")} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95">
                                    Back to Menu
                                </button>
                            </div>
                        </div>
                    ) : (

                        /* 📝 QUESTION SCREEN (Dono Quiz aur Review Mode ke liye) */
                        <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
                            {isReviewMode && <div className="bg-purple-100 text-purple-700 text-xs font-black px-3 py-1 rounded-md mb-4 inline-block">Question {currentQ + 1}</div>}
                            {!isReviewMode && <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase mb-4 inline-block">Reading Comprehension</span>}

                            <h2 className="text-lg font-bold text-gray-900 mb-2">नीचे दी गई आज की ताज़ा खबर पढ़ें:</h2>
                            <div className="bg-gray-50 p-4 rounded-xl border-l-4 border-blue-500 mb-5">
                                <p className="font-bold text-blue-900">"{currentData.news.title_hi}"</p>
                            </div>
                            <p className="font-bold text-gray-700 mb-4">प्रश्न: यह घटना मुख्य रूप से किस श्रेणी (Category) से संबंधित है?</p>

                            <div className="space-y-3">
                                {currentData.options.map((opt: any, idx: number) => {
                                    // 🔥 Logic for highlighting colors
                                    let btnClass = "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300";
                                    let icon = "";

                                    // Agar bache ne answer de diya hai YA review mode hai
                                    if (selectedOptIndex !== null || isReviewMode) {
                                        if (opt.isCorrect) {
                                            btnClass = "bg-green-50 border-2 border-green-500 text-green-700"; // Sahi jawab hamesha green
                                            icon = "✅";
                                        } else if (selectedOptIndex === idx) {
                                            btnClass = "bg-red-50 border-2 border-red-500 text-red-700"; // Jo galat chuna wo red
                                            icon = "❌";
                                        }
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswerSubmit(opt.isCorrect, idx)}
                                            disabled={selectedOptIndex !== null || isReviewMode}
                                            className={`w-full text-left p-4 rounded-xl font-bold transition-all flex justify-between items-center ${btnClass} ${selectedOptIndex === null && !isReviewMode ? 'active:scale-95' : ''}`}
                                        >
                                            <span>{String.fromCharCode(65 + idx)}. {opt.text}</span>
                                            {icon && <span>{icon}</span>}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* 🔥 REVIEW MODE NAVIGATION BUTTONS */}
                            {isReviewMode && (
                                <div className="mt-6 flex gap-3 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                                        disabled={currentQ === 0}
                                        className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl disabled:opacity-50"
                                    >
                                        ◀ Prev
                                    </button>
                                    {currentQ === quizQuestions.length - 1 ? (
                                        <button onClick={() => setViewMode("select")} className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl">
                                            Finish Review
                                        </button>
                                    ) : (
                                        <button onClick={() => setCurrentQ(prev => Math.min(quizQuestions.length - 1, prev + 1))} className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl">
                                            Next ▶
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ==========================================
    // 🖥️ UI 3: READ ARTICLES (Pehle jaisa)
    // ==========================================
    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24">
            <div className="bg-gradient-to-br from-blue-700 to-blue-500 px-6 pt-10 pb-16 rounded-b-[40px] shadow-lg relative">
                <div className="flex items-center gap-4 max-w-4xl mx-auto mb-2">
                    <button onClick={() => setViewMode("select")} className="text-white bg-white/20 hover:bg-white/30 p-2.5 rounded-xl active:scale-95 transition-all backdrop-blur-sm">←</button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Read Articles 📖</h1>
                        <p className="text-blue-100 text-sm font-medium mt-0.5">Stay updated with latest news</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-5 -mt-8">
                <div className="bg-white rounded-2xl shadow-md p-1.5 flex justify-between mb-6 border border-gray-100 relative z-10">
                    <button onClick={() => setActiveTab("today")} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "today" ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Today</button>
                    <button onClick={() => setActiveTab("yesterday")} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "yesterday" ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Yesterday</button>
                    <button onClick={() => setActiveTab("week")} className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "week" ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>This Week</button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10 font-bold text-gray-400 animate-pulse">Loading latest updates...</div>
                    ) : filteredNews.length > 0 ? (
                        filteredNews.map((news) => {
                            const isDownloaded = downloadedIds.includes(news.id);
                            return (
                                <div key={news.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 transition-all">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase border border-blue-100">{news.category || "NEWS"}</span>
                                        <span className="text-xs font-bold text-gray-400">⏱️ 2 min read</span>
                                    </div>
                                    <h2 className="font-black text-gray-900 text-[17px] mb-2">{news.title_en}</h2>
                                    <h2 className="font-bold text-blue-800 text-[16px] mb-3 pb-3 border-b border-gray-100">{news.title_hi}</h2>
                                    <p className="text-sm font-medium text-gray-500 line-clamp-2">{news.desc}</p>

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <a href={news.url} target="_blank" rel="noopener noreferrer" className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[13px] px-4 py-2 rounded-xl transition-colors">📖 Read Full Article</a>
                                        <button onClick={() => toggleDownload(news.id, news)} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isDownloaded ? "bg-green-100 text-green-600" : "bg-gray-50 text-gray-400"}`}>
                                            {isDownloaded ? "✅" : "📥"}
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-10 font-bold text-gray-500">📭 No news found</div>
                    )}
                </div>
            </div>
        </div>
    )
}
