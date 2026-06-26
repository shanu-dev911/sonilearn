"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db, auth } from "@/lib/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";

// =========================
// TYPES
// =========================

type Question = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  exam?: string;
};

// =========================
// NORMALIZE EXAM NAME TO DB FORMAT
// =========================
// Converts user format to database format
// SSC GD -> SSC_GD
// SSC CHSL -> SSC_CHSL
// RRB NTPC -> RRB_NTPC
// RRB Group D -> RRB_GROUP_D

const normalizeExamToDBFormat = (exam: string): string => {
  return exam
    .trim() // Remove leading/trailing spaces
    .toUpperCase() // Convert to uppercase
    .replace(/\s+/g, "_"); // Replace spaces with underscores
};

// =========================
// PAGE
// =========================

export default function FastTestPage() {
  const router = useRouter();
  const [user, authLoading, authError] = useAuthState(auth);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [targetExam, setTargetExam] = useState<string | null>(null);

  // =========================
  // LOAD TARGET EXAM
  // =========================

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError("Please log in to access the fast test.");
      setLoading(false);
      return;
    }

    if (authError) {
      console.error("❌ Auth Error:", authError);
      setError("Authentication failed. Please try again.");
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          console.error("❌ User profile not found for UID:", user.uid);
          setError("User profile not found. Please set up your profile.");
          setQuestions([]);
          setTargetExam(null);
          setLoading(false);
          return;
        }

        const userData = docSnap.data();
        const exam = userData?.targetExam?.trim();

        console.log("👤 User Data:", userData);
        console.log("🎯 Target Exam (Raw from user):", exam);
        console.log("🔄 Target Exam (Normalized for DB query):", normalizeExamToDBFormat(exam || ""));

        if (!exam) {
          console.error("❌ No targetExam found in user profile");
          setError(
            "Target exam not set. Please update your profile with your target exam."
          );
          setQuestions([]);
          setTargetExam(null);
          setLoading(false);
          return;
        }

        setTargetExam(exam);
        setError("");
      },
      (error) => {
        console.error("❌ Firestore Error:", error);
        setError("Unable to load your profile. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, authError]);

  // =========================
  // LOAD QUESTIONS
  // =========================

  useEffect(() => {
    if (!targetExam || authLoading || !user) return;

    const loadQuestionsFromFirebase = async () => {
      try {
        setLoading(true);
        setError("");
        setQuestions([]);
        setCurrentQuestion(0);
        setSelectedOption(null);
        setScore(0);
        setFinished(false);

        console.log("\n========== LOADING QUESTIONS ==========");
        console.log("🎯 Step 1: Target Exam from User Profile");
        console.log("   Raw:", targetExam);

        const normalizedExam = normalizeExamToDBFormat(targetExam);
        console.log("   Normalized for DB:", normalizedExam);

        // =========================
        // STEP 2: Try Firestore query with normalized exam
        // =========================

        console.log("\n🔍 Step 2: Querying Firestore for matching exams...");
        const questionsRef = collection(db, "questions");

        let loadedQuestions: Question[] = [];

        // Try exact match with normalized format
        console.log("   Attempting query: where('exam', '==', '" + normalizedExam + "')");

        try {
          const q = query(questionsRef, where("exam", "==", normalizedExam));
          const querySnapshot = await getDocs(q);

          console.log("   ✅ Query returned:", querySnapshot.size, "documents");

          if (querySnapshot.size > 0) {
            querySnapshot.forEach((docSnap) => {
              const data = docSnap.data();

              // Validate required fields
              if (
                data.questionEn &&
                data.optionA &&
                data.optionB &&
                data.optionC &&
                data.optionD &&
                data.answer
              ) {
                const correctAnswer = data[`option${data.answer}`] || "";

                loadedQuestions.push({
                  id: docSnap.id,
                  question: data.questionEn,
                  options: [data.optionA, data.optionB, data.optionC, data.optionD],
                  answer: correctAnswer,
                  exam: data.exam,
                });

                if (loadedQuestions.length <= 3) {
                  console.log(`   📖 Question ${loadedQuestions.length}: ${data.questionEn.substring(0, 50)}...`);
                }
              }
            });

            console.log("   ✅ Valid questions after validation:", loadedQuestions.length);
          }
        } catch (queryError) {
          console.warn("   ⚠️ Query failed, will try fallback:", queryError);
        }

        // =========================
        // STEP 3: Fallback - Load all and filter client-side
        // =========================

        if (loadedQuestions.length === 0) {
          console.log("\n⚠️ No questions found with exact match.");
          console.log("   Attempting fallback: Loading all documents and filtering...");

          const allQuestionsSnapshot = await getDocs(
            query(questionsRef, limit(1000))
          );

          console.log("   📊 Total documents in collection:", allQuestionsSnapshot.size);

          // Collect unique exams for debugging
          const uniqueExams = new Set<string>();
          const allDocuments: any[] = [];

          allQuestionsSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.exam) {
              uniqueExams.add(data.exam);
            }
            allDocuments.push({ id: docSnap.id, ...data });
          });

          console.log("   📋 Unique exam values in DB:", Array.from(uniqueExams).sort().join(", "));

          // Try case-insensitive matching
          const normalizedLower = normalizedExam.toLowerCase();

          console.log("\n   🔄 Filtering documents...");
          console.log("   Looking for exams matching:", normalizedLower);

          allDocuments.forEach((data) => {
            const dbExam = data.exam || "";
            const dbExamNormalized = normalizeExamToDBFormat(dbExam);

            // Exact match check
            if (dbExamNormalized === normalizedExam) {
              if (
                data.questionEn &&
                data.optionA &&
                data.optionB &&
                data.optionC &&
                data.optionD &&
                data.answer
              ) {
                const correctAnswer = data[`option${data.answer}`] || "";

                if (!loadedQuestions.some((q) => q.id === data.id)) {
                  loadedQuestions.push({
                    id: data.id,
                    question: data.questionEn,
                    options: [data.optionA, data.optionB, data.optionC, data.optionD],
                    answer: correctAnswer,
                    exam: data.exam,
                  });
                }
              }
            }
          });

          console.log("   ✅ Questions after filtering:", loadedQuestions.length);
        }

        // =========================
        // STEP 4: Final check and set state
        // =========================

        console.log("\n📊 FINAL RESULTS:");
        console.log("   Target Exam (Raw):", targetExam);
        console.log("   Target Exam (Normalized):", normalizedExam);
        console.log("   Total Questions Loaded:", loadedQuestions.length);

        if (loadedQuestions.length === 0) {
          console.error("❌ FAILED: No questions found for this exam!");
          console.log("\n💡 Troubleshooting:");
          console.log("   1. Check if exam name in user profile matches questions collection");
          console.log("   2. User has: '" + targetExam + "'");
          console.log("   3. Which normalizes to: '" + normalizedExam + "'");
          console.log("   4. Check Firestore 'questions' collection for matching 'exam' field");

          setError(
            `No questions available for ${targetExam}. Please verify:\n1. Your target exam is set correctly\n2. Questions exist in the database for this exam`
          );
          setQuestions([]);
          setLoading(false);
          return;
        }

        console.log("✅ SUCCESS: Questions loaded!");
        if (loadedQuestions[0]) {
          console.log("   First question exam field:", loadedQuestions[0].exam);
        }

        setQuestions(loadedQuestions);
        setError("");
      } catch (err) {
        console.error("❌ CRITICAL ERROR:", err);
        setError("Failed to load questions. Please try again or contact support.");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuestionsFromFirebase();
  }, [targetExam, user, authLoading]);

  // =========================
  // HANDLE ANSWER
  // =========================

  const handleAnswer = (option: string) => {
    if (selectedOption) return;

    setSelectedOption(option);

    if (option === questions[currentQuestion].answer) {
      setScore((prev) => prev + 1);
    }
  };

  // =========================
  // HANDLE NEXT
  // =========================

  const handleNext = () => {
    if (!selectedOption) return;

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setFinished(true);
    }
  };

  // =========================
  // HANDLE RESTART
  // =========================

  const handleRestart = () => {
    setFinished(false);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption(null);
  };

  // =========================
  // HANDLE BACK
  // =========================

  const handleBack = () => {
    router.back();
  };

  // =========================
  // LOADING STATE
  // =========================

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading Fast Test...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your questions</p>
        </div>
      </div>
    );
  }

  // =========================
  // ERROR STATE
  // =========================

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-red-200 p-6 sm:p-8 text-center shadow-lg">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Unable to Load Test
            </h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
              {error}
            </p>
            <button
              onClick={handleBack}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // NO QUESTIONS STATE
  // =========================

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-6 sm:p-8 text-center shadow-lg">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              No Questions Available
            </h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
              Questions for your exam are being prepared. Please try again later.
            </p>
            <button
              onClick={handleBack}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // RESULT SCREEN
  // =========================

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    const performanceMessage =
      percentage >= 80
        ? "Excellent performance! 🌟"
        : percentage >= 60
          ? "Good effort! 👍"
          : "Keep practicing! 💪";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Test Completed!
              </h1>
              <p className="text-gray-600">{performanceMessage}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 text-center border border-blue-100">
              <p className="text-sm font-semibold text-gray-600 mb-3">Your Score</p>
              <div className="text-5xl sm:text-6xl font-black text-blue-600 mb-2">
                {score}/{questions.length}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-700">
                {percentage}%
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRestart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 rounded-xl transition-colors duration-200"
              >
                Restart Test
              </button>
              <button
                onClick={handleBack}
                className="w-full bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold py-3 sm:py-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // QUESTION SCREEN
  // =========================

  const currentQ = questions[currentQuestion];
  const answerDisabled = selectedOption !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="text-center flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {targetExam}
                </p>
                <p className="text-sm sm:text-lg font-bold text-gray-900 mt-1">
                  Question {currentQuestion + 1}/{questions.length}
                </p>
              </div>
              <div className="w-10 sm:w-12 text-right">
                <p className="text-xs sm:text-sm font-semibold text-gray-600">Score</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600">{score}</p>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* QUESTION CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-lg mb-6">
          {/* QUESTION TEXT */}
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 leading-relaxed mb-8">
            {currentQ.question}
          </h2>

          {/* OPTIONS */}
          <div className="space-y-3 sm:space-y-4 mb-8">
            {currentQ.options.map((option, index) => {
              const isCorrect = option === currentQ.answer;
              const isSelected = selectedOption === option;

              let bgColor = "bg-white hover:bg-slate-50";
              let borderColor = "border-gray-200";
              let textColor = "text-gray-900";

              if (answerDisabled) {
                if (isCorrect) {
                  bgColor = "bg-green-50";
                  borderColor = "border-green-500";
                  textColor = "text-green-900";
                } else if (isSelected) {
                  bgColor = "bg-red-50";
                  borderColor = "border-red-500";
                  textColor = "text-red-900";
                } else {
                  bgColor = "bg-gray-50";
                  borderColor = "border-gray-200";
                  textColor = "text-gray-700";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={answerDisabled}
                  className={`w-full text-left p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 font-semibold min-h-[60px] sm:min-h-[72px] flex items-center cursor-pointer disabled:cursor-default ${bgColor} ${borderColor} ${textColor}`}
                >
                  <span className="flex items-center gap-3 w-full">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {answerDisabled && isCorrect && (
                      <span className="text-xl flex-shrink-0">✓</span>
                    )}
                    {answerDisabled && isSelected && !isCorrect && (
                      <span className="text-xl flex-shrink-0">✗</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* NEXT BUTTON */}
          <button
            onClick={handleNext}
            disabled={!selectedOption}
            className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-200 ${selectedOption
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            {currentQuestion + 1 === questions.length ? "Finish Test" : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
}