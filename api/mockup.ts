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
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { key, idea, startupName, appDescription } = req.body;

    if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'Key is required' });
    }

    if (!idea || typeof idea !== 'string') {
        return res.status(400).json({ error: 'Idea is required' });
    }

    try {
        const db = initFirebase();

        // Validate the key exists
        const keysRef = db.collection('keys');
        const keySnapshot = await keysRef.where('code', '==', key.trim()).get();

        if (keySnapshot.empty) {
            return res.status(401).json({ error: 'Invalid key' });
        }

        // Build the prompt for Gemini 2.5 Flash Image
        const prompt = `Generate a high-fidelity mobile app UI screen design for a startup app.

APP DETAILS:
- Name: "${startupName || 'Startup App'}"
- Concept: "${idea}"
- Main Interface: "${appDescription || 'A modern mobile app interface'}"

CRITICAL REQUIREMENTS (STRICT):
1. Generate **ONLY** the raw screen UI content.
2. **ABSOLUTELY NO** phone hardware, NO bezels, NO notch, NO device frame, NO rounded corners on the image itself.
3. The output must be a perfectly rectangular, flat image.
4. Aspect Ratio: **9:21** (matches modern tall smartphones).
5. Include a modern status bar at the top (time, battery, signal) integrated into the design.
6. Use a clean, modern, and premium design aesthetic.
7. Show the app in a "live" state with realistic content.

DO NOT INCLUDE:
- Any part of a phone body or case.
- Perspective tilts or 3D effects (must be flat 2D).
- Shadows around the device.
- Backgrounds behind the phone (the image should fill the entire canvas).

Style: Modern, minimal, professional iOS/Android app screen design. Dark or light theme based on what suits the concept best.`;

        // Use Gemini 2.5 Flash Image API
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
        }

        const geminiResponse = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseModalities: ['IMAGE'],
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error('Gemini Image API error:', errorData);
            return res.status(500).json({ error: 'Failed to generate mockup image' });
        }

        const geminiResult = await geminiResponse.json();

        // Extract the image from the response
        const candidate = geminiResult.candidates?.[0];
        if (!candidate) {
            return res.status(500).json({ error: 'No response from Gemini' });
        }

        // Find the image part in the response
        const imagePart = candidate.content?.parts?.find((part: any) => part.inlineData);

        if (!imagePart?.inlineData) {
            console.error('No image data in response:', JSON.stringify(geminiResult, null, 2));
            return res.status(500).json({ error: 'No image generated' });
        }

        const { data: imageData, mimeType } = imagePart.inlineData;

        return res.status(200).json({
            image: imageData,
            mimeType: mimeType || 'image/png'
        });
    } catch (error) {
        console.error('Mockup generation error:', error instanceof Error ? error.message : 'Unknown error');
        return res.status(500).json({ error: 'Failed to generate mockup' });
    }
}
