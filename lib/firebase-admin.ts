// Lazily require and initialize firebase-admin to avoid Next.js bundling issues
export function getAdmin() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admin = require("firebase-admin");

    if (!admin.apps || !admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });
    }

    return admin;
}

export function getDb() {
    const admin = getAdmin();
    return admin.firestore();
}