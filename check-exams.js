const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkAllExams() {
  console.log("📊 Fetching all questions from database...\n");

  const snapshot = await db.collection("questions").get();

  const examCounts = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    const exam = data.exam || "UNKNOWN";
    examCounts[exam] = (examCounts[exam] || 0) + 1;
  });

  console.log("=================================");
  console.log("EXAM-WISE QUESTION COUNT");
  console.log("=================================\n");

  const sorted = Object.entries(examCounts).sort((a, b) => b[1] - a[1]);

  sorted.forEach(([exam, count]) => {
    console.log(`${exam.padEnd(30)} : ${count} questions`);
  });

  console.log(`\nTotal Questions: ${snapshot.size}`);
  console.log(`Total Exams Covered: ${sorted.length}`);

  const allTargetExams = [
    "SSC CGL", "SSC CHSL", "SSC MTS", "SSC GD", "SSC CPO", "SSC Stenographer", "SSC JE",
    "RRB NTPC", "RRB Group D", "RRB ALP", "RRB Technician", "RRB JE", "RRB SSE",
    "RRB Paramedical", "RRB Ministerial & Isolated", "RRB Apprentice"
  ];

  console.log("\n=================================");
  console.log("❌ MISSING EXAMS (0 Questions)");
  console.log("=================================\n");

  const missing = allTargetExams.filter(exam => {
    const underscored = exam.replace(/\s+/g, "_");
    return !examCounts[exam] && !examCounts[underscored];
  });

  if (missing.length === 0) {
    console.log("Koi exam missing nahi hai! 🎉");
  } else {
    missing.forEach(exam => console.log(`- ${exam}`));
  }

  process.exit(0);
}

checkAllExams().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});