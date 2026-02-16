'use client';

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { useFirebase } from '@/firebase';


export const useAuth = () => {
  const { auth, user, isUserLoading, userError } = useFirebase();

  const signUp = (email: string, pass: string) => {
    if (!auth) return Promise.reject(new Error("Firebase Auth not initialized."));
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const login = (email: string, pass: string) => {
    if (!auth) return Promise.reject(new Error("Firebase Auth not initialized."));
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const googleSignIn = () => {
    if (!auth) return Promise.reject(new Error("Firebase Auth not initialized."));
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    if (!auth) return Promise.reject(new Error("Firebase Auth not initialized."));
    return signOut(auth);
  };

  return {
    user,
    loading: isUserLoading,
    error: userError,
    auth, // expose auth instance for direct use if needed
    signUp,
    login,
    googleSignIn,
    logout,
  };
};
