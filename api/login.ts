import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Rate limiting constants
const LOGIN_RATE_LIMIT = 10; // Max attempts per window
const LOGIN_RATE_WINDOW_MS = 60 * 1000; // 1 minute window

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

function getClientIP(req: VercelRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || 'unknown';
}

async function checkRateLimitFirestore(db: FirebaseFirestore.Firestore, ip: string): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const rateLimitRef = db.collection('rateLimits').doc(ip.replace(/[\/\.]/g, '_')); // Sanitize IP for doc ID

    try {
        const doc = await rateLimitRef.get();

        if (!doc.exists || (doc.data()?.resetTime ?? 0) < now) {
            // New window or expired - reset counter
            await rateLimitRef.set({ count: 1, resetTime: now + LOGIN_RATE_WINDOW_MS });
            return { allowed: true, remaining: LOGIN_RATE_LIMIT - 1 };
        }

        const data = doc.data()!;
        if (data.count >= LOGIN_RATE_LIMIT) {
            return { allowed: false, remaining: 0 };
        }

        // Increment counter
        await rateLimitRef.update({ count: data.count + 1 });
        return { allowed: true, remaining: LOGIN_RATE_LIMIT - data.count - 1 };
    } catch (error) {
        // On Firestore error, allow request but log warning
        console.warn('Rate limit check failed, allowing request:', error instanceof Error ? error.message : 'Unknown error');
        return { allowed: true, remaining: LOGIN_RATE_LIMIT };
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS with origin validation
    const allowedOrigins = [
        'https://lsesuvelocity.com',
        'https://www.lsesuvelocity.com',
        'https://velocity-website-five.vercel.app',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    ].filter(Boolean);

    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
    }

    const origin = req.headers.origin || '';
    // Allow specific origins or project-specific Vercel preview URLs
    const isProjectPreview = /^https:\/\/velocity-website(-[a-z0-9]+)?(-[a-z0-9]+)?\.vercel\.app$/.test(origin);
    if (allowedOrigins.includes(origin) || isProjectPreview) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const db = initFirebase();

        // Rate limiting check (Firestore-based, persists across cold starts)
        const clientIP = getClientIP(req);
        const rateCheck = await checkRateLimitFirestore(db, clientIP);

        if (!rateCheck.allowed) {
            return res.status(429).json({
                valid: false,
                error: 'Too many login attempts. Please try again later.'
            });
        }

        const { key } = req.body;

        if (!key || typeof key !== 'string') {
            return res.status(400).json({ valid: false, error: 'Key is required' });
        }

        // Look up the key in the 'keys' collection
        const keysRef = db.collection('keys');
        const snapshot = await keysRef.where('code', '==', key.trim()).get();

        if (snapshot.empty) {
            return res.status(401).json({ valid: false, error: 'Invalid key' });
        }

        const keyDoc = snapshot.docs[0];

        return res.status(200).json({
            valid: true,
            keyId: keyDoc.id,
        });
    } catch (error: unknown) {
        console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
        return res.status(500).json({
            valid: false,
            error: 'Server error'
        });
    }
}
