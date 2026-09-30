export type TestCategory =
  | "current-affairs"
  | "daily-challenge"
  | "battleground"
  | "pyq"
  | "default";

export interface DurationConfig {
  seconds: number;
  minutes: number;
  label: string;
  badge: string;
}

export function getExamTestConfig(
  category: TestCategory,
  examName?: string,
  questionCount?: number
): DurationConfig {
  switch (category) {
    case "current-affairs":
      return { seconds: 300, minutes: 5, label: "5 Minutes", badge: "⚡ Super Fast (30s/Q)" };
    case "daily-challenge":
      return { seconds: 600, minutes: 10, label: "10 Minutes", badge: "🔥 Daily Habit (40s/Q)" };
    case "battleground":
      return { seconds: 300, minutes: 5, label: "5 Minutes", badge: "⚔️ Speed Battle" };
    case "pyq": {
      const normalizedExam = examName?.toLowerCase() || "";
      const isRailway =
        normalizedExam.includes("railway") ||
        normalizedExam.includes("ntpc") ||
        normalizedExam.includes("group d");

      return isRailway
        ? { seconds: 1500, minutes: 25, label: "25 Minutes", badge: "🚆 Railway Pattern (50s/Q)" }
        : { seconds: 1200, minutes: 20, label: "20 Minutes", badge: "🎯 TCS Speed Mode (40s/Q)" };
    }
    default:
      return { seconds: 1200, minutes: 20, label: "20 Minutes", badge: "Standard Exam Mode" };
  }
}

export function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}
