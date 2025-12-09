import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Rate limiting store (in-memory for serverless - resets on cold start)
// For production, consider using Redis or a database
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const LOGIN_RATE_LIMIT = 10; // Max attempts per window
const LOGIN_RATE_WINDOW = 60 * 1000; // 1 minute window

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

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (!record || now > record.resetTime) {
        loginAttempts.set(ip, { count: 1, resetTime: now + LOGIN_RATE_WINDOW });
        return { allowed: true, remaining: LOGIN_RATE_LIMIT - 1 };
    }

    if (record.count >= LOGIN_RATE_LIMIT) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: LOGIN_RATE_LIMIT - record.count };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS with origin validation
    const allowedOrigins = [
        'https://velocity-website.vercel.app',
        'https://velocity-website-git-main.vercel.app',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    ].filter(Boolean);

    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
    }

    const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
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

    // Rate limiting check
    const clientIP = getClientIP(req);
    const rateCheck = checkRateLimit(clientIP);

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

    try {
        const db = initFirebase();

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
    } catch (error: any) {
        console.error('Login error:', error.code || 'UNKNOWN');
        return res.status(500).json({
            valid: false,
            error: 'Server error'
        });
    }
}
