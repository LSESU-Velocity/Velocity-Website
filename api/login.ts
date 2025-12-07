import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initFirebase() {
    if (getApps().length === 0) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (!privateKey) throw new Error('FIREBASE_PRIVATE_KEY is not set');

        // Handle potential formatting issues with the private key
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
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { key } = req.body;

    if (!key || typeof key !== 'string') {
        return res.status(400).json({ valid: false, error: 'Key is required' });
    }

    try {
        // Log env var presence (not values for security)
        console.log('Checking Firebase env vars...');
        console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING');
        console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING');
        console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? `SET (length: ${process.env.FIREBASE_PRIVATE_KEY.length})` : 'MISSING');

        const db = initFirebase();
        console.log('Firebase initialized successfully');

        // Look up the key in the 'keys' collection
        const keysRef = db.collection('keys');
        console.log('Querying keys collection for:', key.trim());
        const snapshot = await keysRef.where('code', '==', key.trim()).get();
        console.log('Query complete, found:', snapshot.size, 'documents');

        if (snapshot.empty) {
            return res.status(401).json({ valid: false, error: 'Invalid key' });
        }

        const keyDoc = snapshot.docs[0];

        return res.status(200).json({
            valid: true,
            keyId: keyDoc.id,
        });
    } catch (error: any) {
        console.error('Login error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack,
        });
        return res.status(500).json({
            valid: false,
            error: 'Server error',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
