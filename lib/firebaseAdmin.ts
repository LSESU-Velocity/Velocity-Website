/**
 * Single Firebase Admin initializer for every server-side module.
 *
 * The credential lives in FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL /
 * FIREBASE_PRIVATE_KEY. Vercel stores the private key with escaped newlines
 * and sometimes surrounding quotes, so both are normalized here, nowhere else.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function normalizePrivateKey(raw: string): string {
  let key = raw;
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
}

/**
 * Initialize (or reuse) the Firebase Admin app and return Firestore.
 * Throws with a precise message when a credential env var is missing.
 */
export function initFirebaseAdmin(): Firestore {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId) throw new Error('FIREBASE_PROJECT_ID is not set');
    if (!clientEmail) throw new Error('FIREBASE_CLIENT_EMAIL is not set');
    if (!privateKey) throw new Error('FIREBASE_PRIVATE_KEY is not set');

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: normalizePrivateKey(privateKey),
      }),
    });
  }

  return getFirestore();
}

/**
 * Non-throwing variant for callers that degrade gracefully (rate limiting,
 * email verification). Returns null when credentials are absent or invalid.
 */
export function tryInitFirebaseAdmin(): Firestore | null {
  try {
    return initFirebaseAdmin();
  } catch (error) {
    console.warn(
      'Firebase Admin unavailable:',
      error instanceof Error ? error.message : 'unknown',
    );
    return null;
  }
}
