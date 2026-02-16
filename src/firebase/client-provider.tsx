'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, type FirebaseServices } from '@/firebase/index';
import { Loader } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    // This is safe from SSR and the build process.
    if (typeof window !== 'undefined') {
      const firebaseServices = initializeFirebase();
      setServices(firebaseServices);
    }
  }, []); // Empty dependency array ensures this runs only once

  if (!services) {
    // While Firebase is initializing, show a global loader.
    // This prevents any child components from trying to use Firebase before it's ready.
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Connecting to services...</p>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
      storage={services.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
