import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if config keys are actually present
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.projectId !== "dummy-project-id";

const dummyConfig = {
  apiKey: "dummy-key-for-build",
  authDomain: "dummy-auth.firebaseapp.com",
  projectId: "dummy-project-id",
  storageBucket: "dummy-storage.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:dummy"
};

// 1. Initialize App Safely
const app = getApps().length > 0
  ? getApp()
  : initializeApp(isConfigValid ? firebaseConfig : dummyConfig);

// 2. Initialize Auth & DB conditionally to prevent stale instances
let auth: Auth;
let db: Firestore;

if (isConfigValid) {
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
  });
} else {
  // Fallback for build time only to prevent compilation export errors
  auth = getAuth(app);
  db = initializeFirestore(app, {});
}

export { app, auth, db };