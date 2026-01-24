import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuthKey, setCorsHeaders } from '../lib/serverAuth.js';

// Rate limiting constants - more lenient than login since these are authenticated requests
const HISTORY_RATE_LIMIT = 30; // Max requests per window
const HISTORY_RATE_WINDOW_MS = 60 * 1000; // 1 minute window

function getClientIP(req: VercelRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || 'unknown';
}

async function checkHistoryRateLimit(db: FirebaseFirestore.Firestore, ip: string): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    // Use a different collection/prefix to separate from login rate limits
    const rateLimitRef = db.collection('rateLimits').doc(`history_${ip.replace(/[\/\\.]/g, '_')}`);

    try {
        const doc = await rateLimitRef.get();

        if (!doc.exists || (doc.data()?.resetTime ?? 0) < now) {
            // New window or expired - reset counter
            await rateLimitRef.set({ count: 1, resetTime: now + HISTORY_RATE_WINDOW_MS });
            return { allowed: true, remaining: HISTORY_RATE_LIMIT - 1 };
        }

        const data = doc.data()!;
        if (data.count >= HISTORY_RATE_LIMIT) {
            return { allowed: false, remaining: 0 };
        }

        // Increment counter
        await rateLimitRef.update({ count: data.count + 1 });
        return { allowed: true, remaining: HISTORY_RATE_LIMIT - data.count - 1 };
    } catch (error) {
        // On Firestore error, allow request but log warning
        console.warn('History rate limit check failed, allowing request:', error instanceof Error ? error.message : 'Unknown error');
        return { allowed: true, remaining: HISTORY_RATE_LIMIT };
    }
}

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
    // Handle CORS with credentials support
    if (setCorsHeaders(req, res)) {
        return res.status(200).end();
    }

    // Get auth key from cookie
    const key = getAuthKey(req);

    if (!key) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const db = initFirebase();

        // Rate limiting check (Firestore-based, persists across cold starts)
        const clientIP = getClientIP(req);
        const rateCheck = await checkHistoryRateLimit(db, clientIP);

        if (!rateCheck.allowed) {
            return res.status(429).json({
                error: 'Too many requests. Please try again later.',
                remaining: 0
            });
        }

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
