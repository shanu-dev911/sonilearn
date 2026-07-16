"use client";

import { createContext, useContext, type ReactNode } from "react";

type FirebaseContextType = {
  auth: any;
  db: any;
};

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  // Lazy load Firebase only on client side
  let auth = null;
  let db = null;

  if (typeof window !== 'undefined') {
    try {
      const firebase = require("@/lib/firebase-client");
      auth = firebase.auth;
      db = firebase.db;
    } catch (error) {
      console.warn("Firebase context initialization:", error);
    }
  }

  return (
    <FirebaseContext.Provider value={{ auth, db }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);

  if (!context) {
    // Server-side production build (prerendering) - safe check to bypass error during build time
    if (typeof window === 'undefined') {
      return { auth: null, db: null } as any;
    }
    throw new Error("useFirebase must be used within a FirebaseProvider.");
  }

  return context;
}