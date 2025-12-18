import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase locally to avoid import issues
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
    // Enable CORS with origin validation
    const allowedOrigins = [
        'https://lsesuvelocity.com',
        'https://www.lsesuvelocity.com',
        'https://velocity-website-five.vercel.app',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    ].filter(Boolean);

    if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
    }

    const origin = req.headers.origin || '';
    // Strict CORS: only allow explicitly listed origins
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const key = req.query.key as string;

    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }

    try {
        const db = initFirebase();

        // Validate the key exists
        const keysRef = db.collection('keys');
        const keySnapshot = await keysRef.where('code', '==', key.trim()).get();

        if (keySnapshot.empty) {
            return res.status(401).json({ error: 'Invalid key' });
        }

        const keyDoc = keySnapshot.docs[0];

        // Handle DELETE request
        if (req.method === 'DELETE') {
            const analysisId = req.query.id as string;

            if (!analysisId) {
                return res.status(400).json({ error: 'Analysis ID is required' });
            }

            // Verify the analysis belongs to this user
            const analysisRef = db.collection('analyses').doc(analysisId);
            const analysisDoc = await analysisRef.get();

            if (!analysisDoc.exists) {
                return res.status(404).json({ error: 'Analysis not found' });
            }

            if (analysisDoc.data()?.keyId !== keyDoc.id) {
                return res.status(403).json({ error: 'Unauthorized to delete this analysis' });
            }

            // Delete the analysis
            await analysisRef.delete();

            return res.status(200).json({ success: true });
        }

        // Handle GET request
        if (req.method === 'GET') {
            const analysesRef = db.collection('analyses');
            const analysesSnapshot = await analysesRef
                .where('keyId', '==', keyDoc.id)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();

            const analyses = analysesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
            }));

            return res.status(200).json(analyses);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Analyses API error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
