import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

// =========================
// FIREBASE CONFIG - SECURE ENVS
// =========================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// =========================
// VALIDATE ENV VARS SAFELY (ONLY ON CLIENT SIDE)
// =========================
if (typeof window !== "undefined") {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    const envVarNames = missingKeys
      .map((key) => `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`)
      .join(", ");

    console.warn(
      `[firebase-client] Warning: Missing Firebase config keys: ${envVarNames}. ` +
      `Ensure your .env.local file has these values.`
    );
  }
}

// =========================
// INITIALIZE APP SAFELY
// =========================
// Agar build time par apiKey nahi milti toh temporary dummy values pass karenge taaki initializeApp crash na ho
const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

const app = getApps().length > 0 
  ? getApp() 
  : initializeApp(isConfigValid ? firebaseConfig : { 
      apiKey: "dummy-key-for-build",
      authDomain: "dummy-auth.firebaseapp.com",
      projectId: "dummy-project-id",
      storageBucket: "dummy-storage.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:dummy"
    });

// =========================
// AUTH PRODUCTION EXPORT
// =========================
const auth = getAuth(app);

// =========================
// FIRESTORE OFFLINE CACHE EXPORT
// =========================
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export { app, auth, db };