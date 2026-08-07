// 🎯 TRIAL AND PREMIUM CHECK UTILITY
// Determines whether a user still has free-trial access, active premium access, or must upgrade.

const TRIAL_DAYS = 3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface TrialStatus {
  isPremium: boolean;
  isPremiumExpired: boolean;
  isTrialActive: boolean;
  hasAccess: boolean;
  daysRemaining: number;
}

function parseDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === "function") {
    return value.toDate();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000);
  }
  return null;
}

export function checkTrialStatus(userData: any): TrialStatus {
  const now = new Date();
  const premiumExpiresAt = parseDate(userData?.premiumExpiresAt);

  const hasValidPremiumExpiry = premiumExpiresAt && premiumExpiresAt.getTime() > now.getTime();

  // ✅ Premium if either the isPremium flag is set, OR expiry date is still valid
  if (userData?.isPremium === true || hasValidPremiumExpiry) {
    if (hasValidPremiumExpiry) {
      const msRemaining = premiumExpiresAt!.getTime() - now.getTime();
      return {
        isPremium: true,
        isPremiumExpired: false,
        isTrialActive: false,
        hasAccess: true,
        daysRemaining: Math.max(0, Math.ceil(msRemaining / MS_PER_DAY)),
      };
    }

    return {
      isPremium: true,
      isPremiumExpired: false,
      isTrialActive: false,
      hasAccess: true,
      daysRemaining: 0,
    };
  }

  // ⏰ Premium had an expiry date and it has passed
  if (premiumExpiresAt && premiumExpiresAt.getTime() <= now.getTime()) {
    return {
      isPremium: false,
      isPremiumExpired: true,
      isTrialActive: false,
      hasAccess: false,
      daysRemaining: 0,
    };
  }

  // 🎁 No premium — check free trial based on signup date
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
      isPremiumExpired: false,
      isTrialActive: false,
      hasAccess: false,
      daysRemaining: 0,
    };
  }

  const msElapsed = now.getTime() - signupDate.getTime();
  const daysElapsed = msElapsed / MS_PER_DAY;

  const daysRemaining = Math.max(0, Math.ceil(TRIAL_DAYS - daysElapsed));
  const isTrialActive = daysElapsed < TRIAL_DAYS;

  return {
    isPremium: false,
    isPremiumExpired: false,
    isTrialActive,
    hasAccess: isTrialActive,
    daysRemaining,
  };
}