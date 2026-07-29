// 🎯 TRIAL CHECK UTILITY
// Determines whether a user still has free-trial access or must upgrade.
// Trial length is 3 days from account creation (signup date).

const TRIAL_DAYS = 3;

interface TrialStatus {
  isPremium: boolean;
  isTrialActive: boolean;
  hasAccess: boolean;
  daysRemaining: number;
}

export function checkTrialStatus(userData: any): TrialStatus {
  const isPremium = userData?.isPremium === true;

  if (isPremium) {
    return {
      isPremium: true,
      isTrialActive: false,
      hasAccess: true,
      daysRemaining: 0,
    };
  }

  // Determine signup date — supports Firestore Timestamp, ISO string, or missing
  let signupDate: Date | null = null;

  const rawCreatedAt = userData?.createdAt;

  if (rawCreatedAt) {
    if (typeof rawCreatedAt?.toDate === "function") {
      // Firestore Timestamp object
      signupDate = rawCreatedAt.toDate();
    } else if (typeof rawCreatedAt === "string") {
      signupDate = new Date(rawCreatedAt);
    } else if (rawCreatedAt?.seconds) {
      // Firestore Timestamp-like plain object
      signupDate = new Date(rawCreatedAt.seconds * 1000);
    }
  }

  if (!signupDate || isNaN(signupDate.getTime())) {
    // Fallback — if we can't determine signup date, deny access safely
    return {
      isPremium: false,
      isTrialActive: false,
      hasAccess: false,
      daysRemaining: 0,
    };
  }

  const now = new Date();
  const msElapsed = now.getTime() - signupDate.getTime();
  const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);

  const daysRemaining = Math.max(0, Math.ceil(TRIAL_DAYS - daysElapsed));
  const isTrialActive = daysElapsed < TRIAL_DAYS;

  return {
    isPremium: false,
    isTrialActive,
    hasAccess: isTrialActive,
    daysRemaining,
  };
}