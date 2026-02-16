
import { doc, setDoc, Firestore } from 'firebase/firestore';

export interface UserExamProfile {
  userId: string;
  homeState: string;
  targetExamCategory: 'Central' | 'State';
  targetExamSubCategory: string;
  targetExam: string;
  goalTrackerText: string;
}

/**
 * Saves the user's exam profile to Firestore.
 * This is a blocking write operation, as the UI flow depends on its success.
 * @param firestore The Firestore instance.
 * @param profileData The user's exam profile data.
 */
export async function saveUserExamProfile(firestore: Firestore, profileData: UserExamProfile) {
  if (!profileData.userId) {
    throw new Error('User ID is required to save the exam profile.');
  }
  
  // The document ID is the same as the user's UID to enforce ownership in security rules.
  const profileRef = doc(firestore, 'users', profileData.userId, 'userExamProfile', profileData.userId);

  try {
    // Use await here because the next step (redirect) depends on this success.
    await setDoc(profileRef, profileData);
  } catch (error) {
    console.error("Firestore write error:", error);
    // Re-throw the original error to be caught by the calling UI function
    throw error;
  }
}
