'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader } from 'lucide-react';
import type { UserExamProfile } from '@/lib/user-exam-profile';

/**
 * The master page for the application. It acts as a router to direct users
 * to the correct page based on their authentication and onboarding status.
 * This is the primary entry point for all users.
 */
export default function RedirectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  // Memoize the document reference to prevent re-renders
  const userExamProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'userExamProfile', user.uid);
  }, [firestore, user?.uid]);
  
  const { data: userExamProfile, isLoading: profileLoading } = useDoc<UserExamProfile>(userExamProfileRef);
  
  useEffect(() => {
    // Wait until both auth and profile loading are complete
    if (authLoading || profileLoading) {
      return;
    }

    // 1. If no user is logged in, send them to the login page.
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // 2. If user is logged in but has not completed onboarding (no profile), send them to onboarding.
    if (user && !userExamProfile) {
      router.replace('/onboarding');
      return;
    }

    // 3. If user is logged in and has a profile, send them to the dashboard.
    if (user && userExamProfile) {
      router.replace('/dashboard');
    }

  }, [user, userExamProfile, authLoading, profileLoading, router]);

  // Display a full-screen loader while determining the user's destination.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground">Loading Your SoniLearn Experience...</p>
    </div>
  );
}
