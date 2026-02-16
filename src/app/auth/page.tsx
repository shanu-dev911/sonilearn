'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader } from 'lucide-react';

/**
 * This page acts as a safeguard and redirect handler for the /auth route.
 * The primary login page is at /auth/login, but if any part of the app
 * incorrectly navigates to /auth, this page will catch the user and
 * route them to the appropriate location, preventing a 404 error.
 */
export default function AuthRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication state is resolved before redirecting.
    if (loading) {
      return;
    }
    // Always redirect to the master controller at the root.
    // It will decide the final destination (login, onboarding, or dashboard).
    router.replace('/');
    
  }, [user, loading, router]);

  // Display a loading indicator while the auth check and redirection are in progress.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground">Redirecting...</p>
    </div>
  );
}
