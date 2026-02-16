
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from "firebase/storage";

// Holds the initialized Firebase services
export interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
}

// Singleton variable to hold the initialized services
let firebaseServices: FirebaseServices | null = null;

// This function initializes Firebase and returns the SDKs
export function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }
  
  const app = initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  
  // Set authentication persistence to local, ONLY in the browser
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence);
  }

  firebaseServices = { firebaseApp: app, auth, firestore, storage };

  return firebaseServices;
}


// Export hooks and providers
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
