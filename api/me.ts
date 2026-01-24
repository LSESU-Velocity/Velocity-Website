import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuthKey, setCorsHeaders } from '../lib/serverAuth';

function initFirebase() {
    if (getApps().length === 0) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (!privateKey) throw new Error('FIREBASE_PRIVATE_KEY is not set');

        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');

        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    }
    return getFirestore();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    if (setCorsHeaders(req, res)) {
        return res.status(200).end();
    }

    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const key = getAuthKey(req);

        if (!key) {
            return res.status(401).json({ authenticated: false, error: 'Not authenticated' });
        }

        const db = initFirebase();

        // Validate the key still exists
        const keysRef = db.collection('keys');
        const snapshot = await keysRef.where('code', '==', key).get();

        if (snapshot.empty) {
            return res.status(401).json({ authenticated: false, error: 'Invalid session' });
        }

        return res.status(200).json({ authenticated: true });
    } catch (error: unknown) {
        console.error('Auth check error:', error instanceof Error ? error.message : 'Unknown error');
        return res.status(500).json({ authenticated: false, error: 'Server error' });
    }
}
