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
        const prompt = `Generate a mobile app UI screen design for a startup app.

APP DETAILS:
- Name: "${startupName || 'Startup App'}"
- Concept: "${idea}"
- Main Interface: "${appDescription || 'A modern mobile app interface'}"

CRITICAL REQUIREMENTS:
1. Generate ONLY the app screen content - NO phone frame, NO device bezel, NO notch
2. The output should be a flat rectangular UI design at 9:19 aspect ratio (phone screen proportions)
3. Use a clean, modern UI design with professional aesthetics
4. Include realistic UI elements: status bar (time, signal, battery), navigation bar, content area, buttons, icons
5. Use a cohesive color scheme that feels premium and tech-forward
6. Show the app in use with sample content relevant to the startup concept
7. The design should look like a real production app screen, not a wireframe
8. Include proper spacing, typography hierarchy, and visual balance

DO NOT include:
- Phone device frames or bezels
- Device notches or camera cutouts in the frame
- Drop shadows or 3D perspective effects
- Any elements outside the screen content area

Style: Modern, minimal, professional iOS/Android app screen design. Dark or light theme based on what suits the concept best. The image should be a flat, straight-on view of just the screen content.`;

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
