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
    "tam": { "value": "$XXB", "label": "Total industry market (max 40 chars)" },
    "sam": { "value": "$XXM", "label": "Reachable with this product (max 40 chars)" },
    "som": { "value": "$XXK", "label": "Year 1 realistic target (max 40 chars)" },
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
  "marketReports": [
    {
      "title": "Report title - Publisher, Year (max 50 chars)",
      "publisher": "Publisher name (max 25 chars)",
      "keyStat": "Key stat: value | metric (max 40 chars)",
      "url": "URL to the actual report or source"
    }
  ],
  "competitors": [
    {
      "name": "Competitor Name (max 25 chars)",
      "usp": "Their unique selling point (max 60 chars)",
      "weakness": "Their weakness you can exploit (max 100 chars, complete sentence)",
      "x": "0-100 position on X-axis (based on xAxis definition below)",
      "y": "0-100 position on Y-axis (general-purpose tools like Canva=10-30, specialized tools=70-90)",
      "founded": "Founding year (max 10 chars, e.g. 2016)",
      "hq": "HQ location (max 15 chars, e.g. San Francisco)",
      "funding": "Funding raised (max 20 chars, e.g. $275M raised)",
      "employees": "Employee count (max 10 chars, e.g. 500+)",
      "website": "Company website domain (e.g. notion.so)"
    }
  ],
  "marketGap": {
    "xAxis": { "label": "Determinant attribute (max 20 chars)", "low": "Left end meaning (max 20 chars)", "high": "Right end meaning (max 20 chars)" },
    "yAxis": { "label": "Determinant attribute (max 20 chars)", "low": "Bottom=General Purpose/Simple (max 20 chars)", "high": "Top=Specialized/Complex (max 20 chars)" },
    "yourPosition": { "x": "0-100 (find a gap)", "y": "0-100 (find a gap)" },
    "yourGap": "Description of your unique market position (max 100 chars, complete sentences)"
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

// Resolve a single redirect URL to its final destination
async function resolveRedirectUrl(url: string): Promise<string> {
  try {
    // Only resolve vertexaisearch redirect URLs
    if (!url.includes('vertexaisearch.cloud.google.com/grounding-api-redirect')) {
      return url;
    }

    // Follow the redirect with a HEAD request to get the final URL
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });

    // The response.url will be the final URL after all redirects
    return response.url;
  } catch (error) {
    console.error('Failed to resolve redirect URL:', url, error);
    // Return original URL if resolution fails
    return url;
  }
}

// Resolve multiple redirect URLs in parallel with a timeout
async function resolveRedirectUrls(sources: { uri: string; title: string }[]): Promise<{ uri: string; title: string }[]> {
  const TIMEOUT_MS = 5000; // 5 second timeout for all URL resolutions

  const resolveWithTimeout = async (source: { uri: string; title: string }) => {
    try {
      const resolvedUri = await Promise.race([
        resolveRedirectUrl(source.uri),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
        )
      ]) as string;

      return { uri: resolvedUri, title: source.title };
    } catch {
      // Return original on timeout or error
      return source;
    }
  };

  // Resolve all URLs in parallel
  return Promise.all(sources.map(resolveWithTimeout));
}

// Generate mockup image using Gemini 2.5 Flash Image
async function generateMockupImage(
  apiKey: string,
  idea: string,
  startupName: string,
  appDescription: string
): Promise<{ image: string; mimeType: string } | null> {
  try {
    const prompt = `Generate a professional mobile app UI mockup for a startup app.

APP DETAILS:
- Name: "${startupName || 'Startup App'}"
- Concept: "${idea}"
- Main Interface: "${appDescription || 'A modern mobile app interface'}"

REQUIREMENTS:
1. Create a single iPhone/smartphone mockup screenshot showing the main app screen
2. Use a clean, modern UI design with professional aesthetics
3. Include realistic UI elements: navigation bar, content area, buttons, icons
4. Use a cohesive color scheme that feels premium and tech-forward
5. Show the app in use with sample content relevant to the startup concept
6. The design should look like a real production app, not a wireframe
7. Include proper spacing, typography hierarchy, and visual balance
8. Make it look like a polished screenshot from the App Store

Style: Modern, minimal, professional iOS/Android app design. Dark or light theme based on what suits the concept best.`;

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
      console.error('Mockup generation failed:', await geminiResponse.text());
      return null;
    }

    const geminiResult = await geminiResponse.json();
    const candidate = geminiResult.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: { inlineData?: { data: string; mimeType: string } }) => part.inlineData);

    if (!imagePart?.inlineData) {
      console.error('No image data in mockup response');
      return null;
    }

    return {
      image: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/png'
    };
  } catch (error) {
    console.error('Error generating mockup:', error);
    return null;
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

  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
  }

  const origin = req.headers.origin || '';
  // Strict CORS: only allow explicitly listed origins
  if (allowedOrigins.includes(origin)) {
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
    const prompt = `You are a startup analyst and market researcher. Analyze this startup idea and provide comprehensive data.

STARTUP IDEA: "${idea}"

CRITICAL INSTRUCTIONS - USE GOOGLE SEARCH FOR REAL DATA:
1. Search for REAL, CURRENT market size data - use actual industry reports

TAM/SAM/SOM CALCULATION - BE REALISTIC AND SPECIFIC:
- TAM (Total Addressable Market): The ENTIRE global/regional market for this problem. Use industry reports.
- SAM (Serviceable Addressable Market): The portion of TAM reachable with THIS specific product/business model, limited by geography (focus on UK/Europe initially), language, pricing tier, and distribution capabilities.
- SOM (Serviceable Obtainable Market): The REALISTIC revenue a bootstrapped startup can capture in Year 1-2. This should be VERY conservative:
  * Calculate as 1-3% of SAM maximum for a new entrant
  * Consider: no brand recognition, limited marketing budget, small team
  * Base on acquiring a specific, achievable number of customers (e.g., "2,000 users × £10/mo = £240K")
  * SOM should feel achievable, not aspirational - this is the STARTING POINT
  * If SAM is £500M, SOM should NOT exceed £5-15M for Year 1
2. Search for REAL competitors that operate in this space with their actual websites
3. Search for real market trends and growth data
4. For distribution channels, find REAL communities (actual subreddits, Discord servers, forums)
5. All market figures should come from verifiable sources you find via search

MARKET REPORTS - FIND AUTHORITATIVE SOURCES:
6. Search for 3-4 real market research reports from sources like Statista, Grand View Research, IBISWorld, McKinsey, etc.
7. Include report title, publisher, and a key statistic (e.g., "Market size: $404B | CAGR: 13.4%")
8. Provide direct URLs to the actual reports

COMPETITOR PROFILES - VERIFIED DATA:
9. For each competitor, search for their founding year, HQ location, funding raised, and employee count
10. Include their actual website domain (e.g., notion.so, coda.io)
11. Use Crunchbase, LinkedIn, or company websites as sources

SCORING:
12. Viability score (0-100): How likely is this to succeed? Consider market fit, timing, competition
13. Scalability score (0-100): How easily can this scale? Consider tech, ops, market size
14. Complexity score (0-100): How hard is this to build? Higher = more complex

CHARACTER LIMITS - ABSOLUTELY CRITICAL (MUST FOLLOW):
15. STRICTLY respect all character limits specified in the schema (e.g., "max 60 chars")
16. Write COMPLETE, COHERENT sentences that naturally fit within limits - never truncate mid-sentence
17. Be concise but informative - prioritize key insights over verbose explanations
18. If a limit feels tight, focus on the most impactful information

ENFORCED LIMITS - COUNT CHARACTERS CAREFULLY:
19. "yourGap" field: MAXIMUM 100 characters - describe the unique market position concisely
20. "aiInsight" field (market analysis): MAXIMUM 280 characters - 2-3 short, complete sentences
21. These two fields commonly exceed limits - double-check their length before responding

PERCEPTUAL MAP - CRITICAL POSITIONING INSTRUCTIONS:
The perceptual map visually shows where competitors sit in the market. This MUST be accurate.

DO NOT (Common Mistakes to Avoid):
- Position ALL competitors above Y=50 or all below - ensure distribution across quadrants
- Use generic "Low/High" as axis labels - be SPECIFIC (e.g., "Consumer-Focused" not "Low Focus")
- Choose correlated axes (Price vs Quality, Simple vs Low-Cost correlate - avoid these)
- Place the user's position at exactly (50,50) - find an ACTUAL gap in the market
- Cluster all competitors in one quadrant - spread them to reveal market dynamics

STEP 1 - Choose TWO DETERMINANT ATTRIBUTES for the axes:
- These are attributes customers ACTUALLY use to decide between competitors
- Axes must be UNCORRELATED (avoid price vs quality - they correlate; use quality vs complexity instead)
- Good axis pairs by industry:
  * SaaS/Software: "Ease of Use vs Feature Depth", "Consumer vs Enterprise Focus", "Specialized vs General Purpose"
  * Physical Products: "Mass Market vs Premium", "Local vs Global Reach", "Standardized vs Custom"
  * Services: "Self-Service vs High-Touch", "Standardized vs Bespoke", "Budget vs Premium"
  * Marketplaces: "Niche vs Broad Inventory", "Local vs Global Coverage", "Curated vs Open"
- Pick axes that reveal a meaningful GAP where the user's product can differentiate

STEP 2 - Define axis meanings clearly:
- X-axis: LOW (left, value 0) to HIGH (right, value 100)
- Y-axis: LOW (bottom, value 0) to HIGH (top, value 100)
- Example: If Y-axis is "Specialized vs General Purpose", then:
  * Y=90-100: Highly specialized tools (e.g., academic citation managers)
  * Y=40-60: Mid-range tools
  * Y=0-20: General purpose tools (e.g., Canva, Google Docs)

STEP 3 - Position competitors using CATEGORICAL THINKING:
Before assigning X/Y values, categorize each competitor:
- LOW (0-25): Entry-level, budget, consumer, general-purpose
- MID-LOW (25-45): Prosumer, growing, accessible
- MID-HIGH (55-75): Professional, established, feature-rich
- HIGH (75-100): Enterprise, premium, highly specialized
Then convert to specific numbers within each range.

Examples:
- If X-axis is "Affordable vs Premium": Ryanair=15, Southwest=30, Delta=65, Emirates=90
- If X-axis is "Consumer vs Enterprise": Discord=20, Slack=45, Microsoft Teams=70, Salesforce=95
- If Y-axis is "General Purpose vs Specialized": Canva=15, Notion=30, Figma=65, Ahrefs=85

STEP 4 - Position "yourPosition" STRATEGICALLY:
- MUST be in a quadrant with FEW or NO existing competitors
- Distance from nearest competitor should be at least 15-20 units on one axis
- Justify WHY this gap represents a real market opportunity in "yourGap"
- If no clear gap exists, the market may be saturated - reflect this honestly

STEP 5 - VALIDATION before responding:
- Verify at least ONE competitor is below Y=40 AND at least ONE is above Y=60
- Verify at least ONE competitor is below X=40 AND at least ONE is above X=60
- If all competitors cluster in one quadrant, RECONSIDER your axis choices
- The map should tell a story about market segmentation

Generate 3 monetization strategies, 3 customer segments, 3 risks, 3-5 competitors, 3-4 market reports, 3 search keywords, 3 prompt chain steps, and 5 distribution channels.

Respond with ONLY valid JSON matching this exact schema (no markdown, no explanation):
${responseSchema}`;

    // Use REST API with Google Search grounding enabled
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
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

    // Format grounding sources for the frontend (initial extraction)
    const rawGroundingSources = groundingChunks.map((chunk: GroundingChunk) => ({
      uri: chunk.web?.uri || '',
      title: chunk.web?.title || 'Source'
    })).filter((source: { uri: string; title: string }) => source.uri); // Filter out empty URIs

    // Resolve redirect URLs to actual source URLs
    // This converts vertexaisearch.cloud.google.com/grounding-api-redirect/... to actual source URLs
    const groundingSources = await resolveRedirectUrls(rawGroundingSources);

    console.log('Resolved grounding sources:', groundingSources.map(s => s.uri));

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
        marketReports: analysisData.marketReports || [],
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

    // Generate mockup image in parallel with saving (optional - don't block on failure)
    let mockupResult: { image: string; mimeType: string } | null = null;
    try {
      mockupResult = await generateMockupImage(
        apiKey,
        idea,
        analysisData.name,
        analysisData.interface
      );
    } catch (err) {
      console.error('Mockup generation failed (non-blocking):', err);
    }

    // Save to Firestore with mockup data
    const analysesRef = db.collection('analyses');
    const newAnalysis: Record<string, unknown> = {
      keyId: keyDoc.id,
      idea: idea.trim(),
      data: formattedData,
      createdAt: new Date(),
    };

    // Add mockup fields if successfully generated
    if (mockupResult) {
      newAnalysis.mockupImage = mockupResult.image;
      newAnalysis.mockupMimeType = mockupResult.mimeType;
    }

    await analysesRef.add(newAnalysis);

    // Return formatted data with mockup if available
    const responseData = mockupResult
      ? { ...formattedData, mockupImage: mockupResult.image, mockupMimeType: mockupResult.mimeType }
      : formattedData;

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Analysis error:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: 'Failed to generate analysis' });
  }
}
