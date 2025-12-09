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

// Interface for grounding metadata from Google Search
interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundingSupport {
  segment?: {
    startIndex?: number;
    endIndex?: number;
    text?: string;
  };
  groundingChunkIndices?: number[];
}

interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
  searchEntryPoint?: {
    renderedContent?: string;
  };
}

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

    // Build the prompt for Gemini with Google Search grounding
    const prompt = `You are a startup analyst and market researcher. Analyze this startup idea and provide comprehensive data.

STARTUP IDEA: "${idea}"

CRITICAL INSTRUCTIONS - USE GOOGLE SEARCH FOR REAL DATA:
1. Search for REAL, CURRENT market size data (TAM/SAM/SOM) - use actual industry reports
2. Search for REAL competitors that operate in this space with their actual websites
3. Search for real market trends and growth data
4. For distribution channels, find REAL communities (actual subreddits, Discord servers, forums)
5. All market figures should come from verifiable sources you find via search

SCORING:
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

    // Use REST API with Google Search grounding enabled
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      return res.status(500).json({ error: 'Failed to call Gemini API' });
    }

    const geminiResult = await geminiResponse.json();

    // Extract the response text and grounding metadata
    const candidate = geminiResult.candidates?.[0];
    if (!candidate) {
      return res.status(500).json({ error: 'No response from Gemini' });
    }

    let text = candidate.content?.parts?.[0]?.text || '';
    const groundingMetadata: GroundingMetadata = candidate.groundingMetadata || {};

    // Log grounding info for debugging
    console.log('Grounding queries used:', groundingMetadata.webSearchQueries);
    console.log('Number of grounding chunks:', groundingMetadata.groundingChunks?.length || 0);

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

    // Extract sources from grounding metadata
    const groundingChunks = groundingMetadata.groundingChunks || [];
    const searchQueries = groundingMetadata.webSearchQueries || [];

    // Format grounding sources for the frontend
    const groundingSources = groundingChunks.map((chunk: GroundingChunk) => ({
      uri: chunk.web?.uri || '',
      title: chunk.web?.title || 'Source'
    })).filter((source: { uri: string; title: string }) => source.uri); // Filter out empty URIs

    // Create categorized sources from grounding data
    // First half for market data, second half for competitors (rough heuristic)
    const midpoint = Math.ceil(groundingSources.length / 2);
    const marketSources = groundingSources.slice(0, midpoint).map((s: { uri: string; title: string }) => ({
      name: s.title,
      url: s.uri
    }));
    const competitorSources = groundingSources.slice(midpoint).map((s: { uri: string; title: string }) => ({
      name: s.title,
      url: s.uri
    }));

    // Reshape data to match Launchpad.tsx expectations
    const formattedData = {
      identity: {
        name: analysisData.name,
        tagline: analysisData.tagline,
        colors: analysisData.colors || ["#000000", "#ffffff"],
        domain: analysisData.domain || [],
        available: true
      },
      monetization: analysisData.monetization,
      visuals: {
        logoStyle: "Minimalist",
        appInterface: analysisData.interface,
        screens: [
          { type: "map", title: "Home" },
          { type: "feed", title: "Feed" },
          { type: "profile", title: "Profile" }
        ]
      },
      blueprint: {
        stack: analysisData.stack || [],
        complexity: analysisData.complexity > 70 ? "High" : analysisData.complexity > 40 ? "Medium" : "Low",
        timeline: "2-4 Weeks"
      },
      distributionChannels: analysisData.distributionChannels,
      validation: {
        tam: analysisData.market.tam,
        sam: analysisData.market.sam,
        som: analysisData.market.som,
        aiInsight: analysisData.market.aiInsight,
        competitors: analysisData.competitors.length,
        competitorList: analysisData.competitors,
        riskAnalysis: analysisData.riskAnalysis,
        searchVolume: analysisData.searchVolume,
        marketGap: analysisData.marketGap,
        scores: {
          viability: analysisData.viability || 0,
          scalability: analysisData.scalability || 0,
          complexity: analysisData.complexity || 0
        }
      },
      // Enhanced sources with grounding metadata
      sources: {
        // All grounding sources with full metadata
        groundingChunks: groundingSources,
        // Search queries used by the model
        searchQueries: searchQueries,
        // Categorized sources for backward compatibility
        market: marketSources.length > 0 ? marketSources : (analysisData.sources?.market || []),
        competitors: competitorSources.length > 0 ? competitorSources : (analysisData.sources?.competitors || [])
      },
      customerSegments: analysisData.customerSegments,
      promptChain: analysisData.promptChain
    };

    // Save to Firestore
    const analysesRef = db.collection('analyses');
    const newAnalysis = {
      keyId: keyDoc.id,
      idea: idea.trim(),
      data: formattedData,
      createdAt: new Date(),
    };

    await analysesRef.add(newAnalysis);

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Failed to generate analysis' });
  }
}
