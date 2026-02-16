'use server';

import { initializeFirebase } from '@/firebase';
import { doc, getDoc, runTransaction, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { UsageLimitError } from './errors';

const PLAN_LIMITS = {
  free: {
    testsPerDay: 2, // e.g., 1 mock test + 1 PYQ test
    doubtsPerDay: 1,
  },
  pro: {
    testsPerDay: Infinity,
    doubtsPerDay: Infinity,
  },
};

type ActionType = 'test' | 'doubt';

async function getUserPlan(firestore: any, userId: string) {
  const subQuery = query(collection(firestore, 'users', userId, 'userSubscription'), where('status', '==', 'active'));
  const subSnap = await getDocs(subQuery);

  if (subSnap.empty) {
    return { plan: 'free', isActive: true };
  }

  // Find a subscription where the expiry date is in the future
  const activeSub = subSnap.docs
    .map(doc => doc.data())
    .find(sub => {
        if (!sub.expiryDate) return false;
        // expiryDate could be a Firebase Timestamp
        const expiry = (sub.expiryDate as Timestamp).toDate();
        return expiry > new Date();
    });
  
  if (activeSub && activeSub.plan === 'pro') {
    return { plan: 'pro', isActive: true };
  }
  
  return { plan: 'free', isActive: false };
}

export async function checkAndIncrementUsage(userId: string, action: ActionType) {
  // --- TESTING MODE ---
  // All subscription limits are temporarily disabled for testing and debugging.
  // The function returns immediately, bypassing all checks.
  return;

  // --- ORIGINAL LOGIC (Currently Unreachable) ---
  const { firestore } = initializeFirebase();
  const { plan } = await getUserPlan(firestore, userId);

  const limit = plan === 'pro' ? PLAN_LIMITS.pro : PLAN_LIMITS.free;
  const limitCount = action === 'test' ? limit.testsPerDay : limit.doubtsPerDay;

  if (limitCount === Infinity) {
    return; // Pro users have no limits
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const usageDocRef = doc(firestore, 'users', userId, 'dailyUsage', today);

  try {
    await runTransaction(firestore, async (transaction) => {
      const usageDoc = await transaction.get(usageDocRef);
      
      const currentUsage = {
        testsTaken: usageDoc.exists() ? usageDoc.data().testsTaken || 0 : 0,
        doubtsAsked: usageDoc.exists() ? usageDoc.data().doubtsAsked || 0 : 0,
      };

      const actionCount = action === 'test' ? currentUsage.testsTaken : currentUsage.doubtsAsked;

      if (actionCount >= limitCount) {
        throw new UsageLimitError(`Daily limit of ${limitCount} ${action}(s) reached for the free plan.`);
      }

      const dataToUpdate = action === 'test'
        ? { testsTaken: currentUsage.testsTaken + 1 }
        : { doubtsAsked: currentUsage.doubtsAsked + 1 };

      if (usageDoc.exists()) {
        transaction.update(usageDocRef, dataToUpdate);
      } else {
        const initialData = {
          testsTaken: action === 'test' ? 1 : 0,
          doubtsAsked: action === 'doubt' ? 1 : 0,
        };
        transaction.set(usageDocRef, initialData);
      }
    });
  } catch (error) {
    if (error instanceof UsageLimitError) {
      throw error; // Re-throw the specific error
    }
    console.error("Transaction failed: ", error);
    throw new Error("Failed to update usage stats. Please try again.");
  }
}
