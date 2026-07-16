import { initializeApp, getApps, getApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import {
    initializeFirestore,
    persistentLocalCache,
} from "firebase/firestore";

// FIREBASE CONFIG
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",

    authDomain:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",

    projectId:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",

    storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",

    messagingSenderId:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "demo-sender",

    appId:
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app",
};

// APP - Only initialize on client side
let app: any;
let auth: any;
let db: any;

if (typeof window !== 'undefined') {
    try {
        app =
            getApps().length > 0
                ? getApp()
                : initializeApp(firebaseConfig);

        auth = getAuth(app);

        db = initializeFirestore(app, {
            localCache: persistentLocalCache(),
        });
    } catch (error) {
        console.warn("Firebase initialization warning:", error);
    }
}

export { app, auth, db };