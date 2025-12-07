import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

export function initFirebase(): Firestore {
    if (!getApps().length) {
        // Handle private key newlines - Vercel may store them in different formats
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!privateKey) {
            throw new Error('FIREBASE_PRIVATE_KEY is not set');
        }

        // Remove surrounding quotes if present (Vercel sometimes adds them)
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }

        // Replace literal \n with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');

        if (!process.env.FIREBASE_PROJECT_ID) {
            throw new Error('FIREBASE_PROJECT_ID is not set');
        }
        if (!process.env.FIREBASE_CLIENT_EMAIL) {
            throw new Error('FIREBASE_CLIENT_EMAIL is not set');
        }

        console.log('Initializing Firebase with project:', process.env.FIREBASE_PROJECT_ID);
        console.log('Service account:', process.env.FIREBASE_CLIENT_EMAIL);
        console.log('Private key starts with:', privateKey.substring(0, 30));

        app = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    }

    db = getFirestore();
    return db;
}

export { db };
