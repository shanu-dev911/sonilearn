'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

/**
 * A hook to protect routes and ensure only admin users can access them.
 * It checks for authentication and then verifies the admin role against Firestore.
 * It handles redirection and loading states automatically.
 * @returns An object containing the admin status (`isAdmin`) and loading state.
 */
export const useAdminAuth = () => {
    const { user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    
    const [isAdmin, setIsAdmin] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        // Don't do anything until Firebase Auth has resolved.
        if (authLoading) {
            return;
        }

        // If auth is resolved and there's no user, they are not an admin.
        if (!user) {
            toast.error("Access Denied. Please log in as an admin.");
            router.replace('/'); // Use replace to prevent going back to admin page
            setIsVerifying(false);
            return;
        }

        // If there is a user, check their admin status in Firestore.
        const checkAdminStatus = async () => {
            const adminRef = doc(firestore, 'roles_admin', user.uid);
            try {
                const adminDoc = await getDoc(adminRef);
                if (adminDoc.exists()) {
                    // User is an admin.
                    setIsAdmin(true);
                } else {
                    // User is logged in but not an admin.
                    toast.error("You do not have permission to access this page.");
                    router.replace('/dashboard'); // Redirect to their normal dashboard
                }
            } catch (error) {
                console.error("Error checking admin status:", error);
                toast.error("An error occurred while verifying your permissions.");
                router.replace('/dashboard');
            } finally {
                // Verification process is complete.
                setIsVerifying(false);
            }
        };

        checkAdminStatus();

    }, [user, authLoading, firestore, router]);

    // The overall loading state is true if auth is loading OR we are still verifying the role.
    return { isAdmin, loading: authLoading || isVerifying };
};