import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initFirebase } from '../lib/firebase';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// JSON Schema for the response - matches existing generateStartupData() structure
const responseSchema = `{
  "name": "string - catchy startup name",
  "tagline": "string - short memorable tagline",
  "colors": ["primary hex", "secondary hex", "accent hex", "neutral hex"],
  "domain": ["domain1.com", "domain2.io", "domain3.app"],
  "stack": ["Tech1", "Tech2", "Tech3", "Tech4"],
  "interface": "string - brief description of main interface",
  "monetization": [
    {
      "model": "string - e.g. Freemium, Subscription, Marketplace",
      "pricing": "string - e.g. $29/mo, Free tier available",
      "strategies": ["Strategy1", "Strategy2", "Strategy3"],
      "examples": "string - similar companies using this model"
    }
  ],
  "market": {
    "tam": { "value": "$XXB", "label": "Market description" },
    "sam": { "value": "$XXM", "label": "Serviceable market" },
    "som": { "value": "$XXK", "label": "Initial target segment" },
    "aiInsight": "string - 2-3 sentence market analysis"
  },
  "sources": {
    "market": [{ "name": "Source Name", "url": "https://..." }],
    "competitors": [{ "name": "Source Name", "url": "https://..." }]
  },
  "customerSegments": [
    {
      "segment": "Segment Name",
      "age": "Age range",
      "income": "Income level",
      "interest": "Key interest"
    }
  ],
  "riskAnalysis": [
    {
      "risk": "Risk description",
      "mitigation": "How to mitigate",
      "productFeature": "Feature that addresses this"
    }
  ],
  "competitors": [
    {
      "name": "Competitor Name",
      "usp": "Their unique selling point",
      "weakness": "Their weakness you can exploit",
      "x": 0-100,
      "y": 0-100
    }
  ],
  "marketGap": {
    "xAxis": { "label": "Axis label", "low": "Low end", "high": "High end" },
    "yAxis": { "label": "Axis label", "low": "Low end", "high": "High end" },
    "yourPosition": { "x": 0-100, "y": 0-100 },
    "yourGap": "Description of your unique position"
  },
  "searchVolume": [
    {
      "keyword": "Relevant keyword",
      "data": [
        { "name": "Y1", "users": 0 },
        { "name": "Y2", "users": 100 },
        { "name": "Y3", "users": 250 },
        { "name": "Y4", "users": 500 },
        { "name": "Y5", "users": 800 }
      ]
    }
  ],
  "promptChain": [
    {
      "step": 1,
      "title": "Step title",
      "prompt": "Full prompt for AI coding assistant"
    }
  ],
  "distributionChannels": [
    {
      "name": "Channel name",
      "type": "Reddit/Discord/Forum/Social",
      "members": "Size indicator"
    }
  ],
  "viability": 0-100,
  "scalability": 0-100,
  "complexity": 0-100
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { key, idea } = req.body;

    if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'Key is required' });
    }

    if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
        return res.status(400).json({ error: 'Idea description is required (min 3 characters)' });
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

        // Generate analysis using Gemini 2.5 Flash with grounding
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                maxOutputTokens: 8192,
            },
        });

        const prompt = `You are a startup analyst and market researcher. Analyze this startup idea and provide comprehensive data.

STARTUP IDEA: "${idea}"

IMPORTANT INSTRUCTIONS:
1. Use your knowledge to provide REAL, ACCURATE market data where possible
2. For TAM/SAM/SOM, use actual market research figures (cite real reports)
3. For competitors, include REAL companies that operate in this space
4. For distribution channels, include REAL communities (actual subreddits, Discord servers, forums)
5. Search volume data should represent realistic 5-year Google Trends growth patterns
6. Viability score (0-100): How likely is this to succeed? Consider market fit, timing, competition
7. Scalability score (0-100): How easily can this scale? Consider tech, ops, market size
8. Complexity score (0-100): How hard is this to build? Higher = more complex

For the perceptual map (competitors and marketGap):
- X-axis goes from LOW (left, value 0) to HIGH (right, value 100)
- Y-axis goes from LOW (bottom, value 0) to HIGH (top, value 100)
- Position competitors and "yourPosition" based on where they fall on these spectrums

Generate 3 monetization strategies, 3 customer segments, 3 risks, 3-5 competitors, 3 search keywords, 3 prompt chain steps, and 5 distribution channels.

Respond with ONLY valid JSON matching this exact schema (no markdown, no explanation):
${responseSchema}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Clean up the response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Parse the JSON
        let analysisData;
        try {
            analysisData = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', text);
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }

        // Save to Firestore
        const analysesRef = db.collection('analyses');
        const newAnalysis = {
            keyId: keyDoc.id,
            idea: idea.trim(),
            data: analysisData,
            createdAt: new Date(),
        };

        await analysesRef.add(newAnalysis);

        return res.status(200).json(analysisData);
    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({ error: 'Failed to generate analysis' });
    }
}
