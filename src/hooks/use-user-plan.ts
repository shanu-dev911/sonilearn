'use client';

/**
 * A hook to determine the user's subscription plan.
 * 
 * --- TESTING MODE ---
 * This hook is currently in TESTING MODE.
 * It bypasses all Firestore checks and treats every user as a 'pro' user.
 * This provides full, unrestricted access to all features for debugging purposes.
 * To restore normal functionality, replace this with the original subscription checking logic.
 */
export const useUserPlan = () => {
  return { 
    plan: 'pro', 
    hasProAccess: true, 
    loading: false 
  };
};
