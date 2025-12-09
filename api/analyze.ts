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
// CHARACTER LIMITS are specified to ensure content fits widget layouts without truncation
const responseSchema = `{
  "name": "string - catchy startup name (max 25 chars)",
  "tagline": "string - short memorable tagline (max 60 chars)",
  "colors": ["primary hex", "secondary hex", "accent hex", "neutral hex"],
  "domain": ["domain1.com", "domain2.io", "domain3.app"],
  "stack": ["Tech1", "Tech2", "Tech3", "Tech4"],
  "interface": "string - brief description of main interface (max 80 chars)",
  "monetization": [
    {
      "model": "string - e.g. Freemium, Subscription (max 30 chars)",
      "pricing": "string - e.g. $29/mo, Free tier available (max 50 chars)",
      "strategies": ["Strategy - max 35 chars each", "Strategy2", "Strategy3"],
      "examples": "string - similar companies using this model (max 60 chars)"
    }
  ],
  "market": {
    "tam": { "value": "$XXB", "label": "Market description (max 40 chars)" },
    "sam": { "value": "$XXM", "label": "Serviceable market (max 40 chars)" },
    "som": { "value": "$XXK", "label": "Initial target segment (max 40 chars)" },
    "aiInsight": "string - 2-3 sentence market analysis (max 280 chars, complete sentences)"
  },
  "customerSegments": [
    {
      "segment": "Segment Name (max 35 chars)",
      "age": "Age range (max 10 chars, e.g. 25-45)",
      "income": "Income level (max 30 chars)",
      "interest": "Key interest/pain point (max 60 chars)"
    }
  ],
  "riskAnalysis": [
    {
      "risk": "Risk description (max 100 chars, complete sentence)",
      "mitigation": "How to mitigate (max 80 chars)",
      "productFeature": "Feature that addresses this (max 80 chars)"
    }
  ],
  "competitors": [
    {
      "name": "Competitor Name (max 25 chars)",
      "usp": "Their unique selling point (max 60 chars)",
      "weakness": "Their weakness you can exploit (max 100 chars, complete sentence)",
      "x": 0-100,
      "y": 0-100
    }
  ],
  "marketGap": {
    "xAxis": { "label": "Axis label (max 20 chars)", "low": "Low end (max 20 chars)", "high": "High end (max 20 chars)" },
    "yAxis": { "label": "Axis label (max 20 chars)", "low": "Low end (max 20 chars)", "high": "High end (max 20 chars)" },
    "yourPosition": { "x": 0-100, "y": 0-100 },
    "yourGap": "Description of your unique market position (max 120 chars, complete sentences)"
  },
  "searchVolume": [
    {
      "keyword": "Relevant search keyword (max 40 chars)",
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
      "title": "Step title (max 40 chars)",
      "prompt": "Full prompt that the user can plug in to an AI coding assistant to build the startup MVP (minimum viable product) (max 300 chars, actionable and complete)"
    }
  ],
  "distributionChannels": [
    {
      "name": "Channel name (max 40 chars)",
      "type": "Reddit/Discord/Forum/Social (max 15 chars)",
      "members": "Size indicator (max 20 chars, e.g. 750K+ members)"
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
    const keyData = keyDoc.data();

    // === RATE LIMITING: Configurable analyses per key per day ===
    const DAILY_LIMIT = keyData?.dailyLimit ?? 20; // Default to 20 if not set

    // Calculate start of today in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Count analyses made by this key today
    const rateLimitQuery = await db.collection('analyses')
      .where('keyId', '==', keyDoc.id)
      .where('createdAt', '>=', today)
      .count()
      .get();

    const todayCount = rateLimitQuery.data().count;
    const remaining = Math.max(0, DAILY_LIMIT - todayCount - 1); // -1 for the current request

    if (todayCount >= DAILY_LIMIT) {
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      return res.status(429).json({
        error: `Daily limit reached (${DAILY_LIMIT} analyses). Try again tomorrow.`,
        limit: DAILY_LIMIT,
        used: todayCount,
        remaining: 0,
        resetsAt: tomorrow.toISOString()
      });
    }
    // === END RATE LIMITING ===

    // Build the prompt for Gemini with Google Search grounding
    const prompt = `# ROLE
You are an elite startup analyst with deep expertise in market research, competitive intelligence, and venture strategy. Your analyses are data-driven, actionable, and used by founders to make investment-grade decisions.

# TASK
Analyze the following startup idea and generate a comprehensive market analysis report. Use Google Search to find REAL, CURRENT data—do not fabricate any market figures, competitor names, or community names.

## STARTUP IDEA
"${idea}"

# RESEARCH REQUIREMENTS (Use Google Search for Each)

## 1. MARKET SIZING (TAM/SAM/SOM)
- Search for recent industry reports (Statista, Grand View Research, IBISWorld, etc.)
- Use 2024-2025 data when available; clearly note the source year
- TAM = Total addressable market globally
- SAM = Segment the startup can realistically serve
- SOM = First-year achievable market share

## 2. COMPETITIVE LANDSCAPE
- Find 3-5 REAL companies operating in this exact space
- Search for their actual websites, funding amounts, and user counts when available
- Identify genuine weaknesses based on user reviews, Trustpilot, G2, or news articles

## 3. DISTRIBUTION CHANNELS
- Find REAL communities: specific subreddit names (r/example), Discord servers, Facebook groups, forums
- Search for communities where the target audience actively discusses related problems
- Include actual member/subscriber counts when available

## 4. SEARCH VOLUME TRENDS
- Use search data to identify trending keywords in this space
- Show realistic growth trajectories based on market trends

# SCORING CRITERIA

| Score | Criteria | Consider |
|-------|----------|----------|
| **Viability (0-100)** | Likelihood of success | Market fit, timing, competition intensity, unit economics |
| **Scalability (0-100)** | Growth potential | Tech scalability, operational complexity, market ceiling |
| **Complexity (0-100)** | Build difficulty | Higher = more complex; consider tech stack, integrations, regulatory requirements |

# PERCEPTUAL MAP POSITIONING
For the competitive positioning map (competitors + marketGap):
- X-axis: 0 (LOW) ← → 100 (HIGH) — the dimension you define (e.g., Price)
- Y-axis: 0 (LOW) ← → 100 (HIGH) — the dimension you define (e.g., Features)
- Position "yourPosition" to highlight a genuine market gap NOT occupied by existing competitors

# OUTPUT REQUIREMENTS

## Quantities
- 3 monetization strategies (with realistic pricing benchmarks from competitors)
- 3 customer segments (with specific demographics)
- 3 risks (with actionable mitigations)
- 3-5 real competitors (with accurate positioning coordinates)
- 3 search keywords (trending in this space)
- 3 prompt chain steps (actionable MVP-building prompts)
- 6 distribution channels (real communities with actual names)

## CHARACTER LIMITS — CRITICAL
Strictly respect ALL character limits in the schema. For each field:
- Write COMPLETE sentences that naturally fit the limit—never truncate mid-thought
- If space is tight, prioritize the single most impactful insight
- Example: "max 60 chars" means ≤60 characters total, including spaces

# RESPONSE FORMAT
Respond with ONLY valid JSON matching the schema below. No markdown code fences. No explanations before or after.
${responseSchema}`;

    // Use REST API with Google Search grounding enabled
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
