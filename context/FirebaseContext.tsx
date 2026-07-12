"use client";

import { createContext, useContext, type ReactNode } from "react";
import { auth, db } from "@/lib/firebase-client";

type FirebaseContextType = {
  auth: typeof auth;
  db: typeof db;
};

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseContext.Provider value={{ auth, db }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);

  if (!context) {
    // Server-side production build (prerendering) ke waqt error bypass karne ke liye safe check
    if (typeof window === 'undefined') {
      return { auth: null, db: null } as any;
    }
    throw new Error("useFirebase must be used within a FirebaseProvider.");
  }

  return context;
}