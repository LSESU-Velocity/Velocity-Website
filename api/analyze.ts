import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuthKey, setCorsHeaders } from '../lib/serverAuth.js';

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
// CHARACTER LIMITS are specified in descriptions to guide the model
const responseSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Catchy startup name (max 25 chars)" },
    tagline: { type: "string", description: "Short memorable tagline (max 60 chars)" },
    interface: { type: "string", description: "Brief description of main interface (max 80 chars)" },
    monetization: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        properties: {
          model: { type: "string", description: "e.g. Freemium, Subscription (max 30 chars)" },
          pricing: { type: "string", description: "e.g. $29/mo, Free tier available (max 50 chars)" },
          strategies: { type: "array", items: { type: "string" }, description: "Strategy items (max 35 chars each)" },
          examples: { type: "string", description: "Similar companies using this model (max 60 chars)" }
        },
        required: ["model", "pricing", "strategies", "examples"]
      }
    },
    market: {
      type: "object",
      properties: {
        aiInsight: { type: "string", description: "2-3 sentence market analysis (max 280 chars, complete sentences)" }
      },
      required: ["aiInsight"]
    },
    customerSegments: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        properties: {
          segment: { type: "string", description: "Segment Name (max 35 chars)" },
          age: { type: "string", description: "Age range (max 10 chars, e.g. 25-45)" },
          income: { type: "string", description: "Income level (max 30 chars)" },
          interest: { type: "string", description: "Key interest/pain point (max 60 chars)" }
        },
        required: ["segment", "age", "income", "interest"]
      }
    },

    competitors: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Competitor Name (max 25 chars)" },
          strength: { type: "string", description: "Their key strength/advantage (max 100 chars, complete sentence)" },
          weakness: { type: "string", description: "Their weakness you can exploit (max 100 chars, complete sentence)" },
          x: { type: "number", description: "0-100 position on X-axis (based on xAxis definition)" },
          y: { type: "number", description: "0-100 position on Y-axis (general-purpose tools=10-30, specialized=70-90)" },
          website: { type: "string", description: "Company website domain (e.g. notion.so)" }
        },
        required: ["name", "strength", "weakness", "x", "y", "website"]
      }
    },
    marketGap: {
      type: "object",
      properties: {
        xAxis: {
          type: "object",
          properties: {
            label: { type: "string", description: "Determinant attribute (max 20 chars)" },
            low: { type: "string", description: "Left end meaning (max 20 chars)" },
            high: { type: "string", description: "Right end meaning (max 20 chars)" }
          },
          required: ["label", "low", "high"]
        },
        yAxis: {
          type: "object",
          properties: {
            label: { type: "string", description: "Determinant attribute (max 20 chars)" },
            low: { type: "string", description: "Bottom=General Purpose/Simple (max 20 chars)" },
            high: { type: "string", description: "Top=Specialized/Complex (max 20 chars)" }
          },
          required: ["label", "low", "high"]
        },
        yourPosition: {
          type: "object",
          properties: {
            x: { type: "number", description: "0-100 (find a gap)" },
            y: { type: "number", description: "0-100 (find a gap)" }
          },
          required: ["x", "y"]
        },
        yourGap: { type: "string", description: "Description of your unique market position (max 100 chars, complete sentences)" }
      },
      required: ["xAxis", "yAxis", "yourPosition", "yourGap"]
    },
    promptChain: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        properties: {
          step: { type: "number", description: "Step number" },
          title: { type: "string", description: "Step title (max 40 chars)" },
          prompt: { type: "string", description: "Full prompt for AI coding assistant to build MVP (max 300 chars, actionable and complete)" }
        },
        required: ["step", "title", "prompt"]
      }
    },
    distributionChannels: {
      type: "array",
      minItems: 5,
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Channel name (max 40 chars)" },
          type: { type: "string", description: "Reddit/Discord/Forum/Social (max 15 chars)" },
          members: { type: "string", description: "Size indicator (max 20 chars, e.g. 750K+ members)" }
        },
        required: ["name", "type", "members"]
      }
    },

    waitlistHtml: { type: "string", description: "Complete landing page HTML with Tailwind CDN" },
    pitchDeckHtml: { type: "string", description: "Complete Reveal.js pitch deck HTML" }
  },
  required: [
    "name", "tagline", "interface", "monetization", "market", "customerSegments",
    "competitors", "marketGap",
    "promptChain", "distributionChannels",
    "waitlistHtml", "pitchDeckHtml"
  ]
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS with credentials support
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get auth key from cookie
  const key = getAuthKey(req);

  if (!key) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { idea } = req.body;

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

    // Pre-check rate limit (non-atomic, just to fail fast before expensive AI call)
    // The actual atomic check happens after AI processing in the transaction
    const preCheckQuery = await db.collection('analyses')
      .where('keyId', '==', keyDoc.id)
      .where('createdAt', '>=', today)
      .count()
      .get();

    const preCheckCount = preCheckQuery.data().count;

    if (preCheckCount >= DAILY_LIMIT) {
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      return res.status(429).json({
        error: `Daily limit reached (${DAILY_LIMIT} analyses). Try again tomorrow.`,
        limit: DAILY_LIMIT,
        used: preCheckCount,
        remaining: 0,
        resetsAt: tomorrow.toISOString()
      });
    }
    // === END PRE-CHECK (actual atomic check happens in transaction below) ===

    // Build the prompt for Gemini
    const prompt = `You are a startup analyst and market researcher. Analyze this startup idea and provide comprehensive data.

STARTUP IDEA: "${idea}"

CRITICAL INSTRUCTIONS:
1. For distribution channels, identify REAL communities (actual subreddits, Discord servers, forums) where target users gather
2. Identify 3-5 real competitors in the space
3. Include competitor website domains (e.g., notion.so, coda.io)

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

IMPORTANT - GENERATE TWO UNIQUE HTML ARTIFACTS (waitlistHtml and pitchDeckHtml):

CRITICAL - MAKE EACH DESIGN UNIQUE:
Before generating HTML, choose a UNIQUE visual identity for this specific startup based on its industry, target audience, and brand personality.

1. COLOR PALETTE (pick ONE that fits the startup's industry):
   - Tech/SaaS: Electric blue (#3B82F6) + cyan accents
   - Health/Fitness: Vibrant green (#10B981) + lime accents
   - Finance/Business: Deep purple (#8B5CF6) + gold accents
   - Food/Delivery: Warm orange (#F97316) + yellow accents
   - Social/Dating: Hot pink (#EC4899) + purple accents
   - Education: Teal (#14B8A6) + sky blue accents
   - Travel: Ocean blue (#0EA5E9) + sunset orange accents
   - AI/Automation: Neon green (#22C55E) + black
   - Gaming/Entertainment: Electric purple (#A855F7) + neon pink
   - Sustainability/Eco: Forest green (#16A34A) + earth tones
   - Default/Other: Choose a distinctive color that matches the startup's personality

2. LAYOUT STYLE (pick ONE, vary based on startup type):
   - Centered Hero: Large centered headline, stacked content
   - Split Layout: Image/graphic on one side, content on other
   - Card Grid: Features displayed in a grid of glassmorphism cards
   - Minimal Single Column: Clean, lots of whitespace, single flow
   - Bold Asymmetric: Off-center elements, creative positioning

3. TYPOGRAPHY VIBE (pick ONE that matches brand):
   - Bold/Impactful: Extra-large headlines, minimal body text
   - Elegant/Refined: Lighter weights, generous letter-spacing
   - Playful/Friendly: Rounded feels, varied sizes
   - Technical/Precise: Monospace accents, structured hierarchy

WAITLIST LANDING PAGE (waitlistHtml):
Generate a STUNNING, production-ready landing page with the UNIQUE visual identity chosen above.

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Startup Name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: { DEFAULT: '{CHOSEN_PRIMARY_COLOR}', dark: '{CHOSEN_DARK_COLOR}' }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .glass { backdrop-filter: blur(20px); background: rgba(255,255,255,0.03); }
    .glow { box-shadow: 0 0 60px {CHOSEN_PRIMARY_COLOR}26; }
    .gradient-text { background: linear-gradient(135deg, #fff 0%, {CHOSEN_PRIMARY_COLOR} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  </style>
</head>
<body class="bg-[#0a0a0a] text-white min-h-screen antialiased">
  <!-- Use CHOSEN layout style, brand colors, and specific content -->
</body>
</html>

PITCH DECK (pitchDeckHtml):
Generate a Reveal.js presentation. CRITICAL: Reveal.js only works when ALL content is inside <section> tags.

EXACT STRUCTURE - COPY THIS EXACTLY AND FILL IN CONTENT:
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Startup} Pitch Deck</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/black.css">
  <style>
    :root { --r-background-color: #0a0a0a; }
    /* Ensure full height for iframe usage */
    html, body, .reveal { height: 100%; min-height: 100vh; margin: 0; padding: 0; overflow: hidden; }
    .reveal { font-family: system-ui, sans-serif; }
    .reveal .controls, .reveal .progress { color: {CHOSEN_PRIMARY_COLOR}; }
    .accent { color: {CHOSEN_PRIMARY_COLOR}; }
  </style>
</head>
<body>
<div class="reveal">
  <div class="slides">
    <section>
      <h1 class="r-fit-text">[HOOK STATEMENT HERE]</h1>
    </section>
    <section>
      <h2>The Problem</h2>
      <p class="r-fit-text accent">[SHOCKING STATISTIC]</p>
      <p>[One line explanation]</p>
    </section>
    <section>
      <h1 class="accent">{Startup Name}</h1>
      <p>{Tagline}</p>
      <p class="fragment">[Brief description]</p>
    </section>
    <section>
      <h2>Who We Serve</h2>
      <div style="display:flex;gap:2rem;justify-content:center;">
        <div><h3>[Segment 1]</h3><p>[Pain point]</p></div>
        <div><h3>[Segment 2]</h3><p>[Pain point]</p></div>
      </div>
    </section>
    <section>
      <h2>Business Model</h2>
      <p class="r-fit-text accent">[Pricing]</p>
      <p>[Revenue strategy]</p>
    </section>
    <section data-background-color="{CHOSEN_PRIMARY_COLOR}">
      <h1 class="r-fit-text">Join the Waitlist</h1>
      <p>[Call to action]</p>
    </section>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
<script>
  // Standard initialization for full-frame iframe
  try {
    Reveal.initialize({
      hash: false,
      keyboardCondition: 'focused',
      controls: true,
      progress: true,
      center: true,
      transition: 'slide'
    }).then(() => {
      console.log('Reveal initialized successfully');
    }).catch(err => {
      console.error('Reveal initialization failed:', err);
    });
  } catch (e) {
    console.error('Reveal script error:', e);
  }
</script>
</body>
</html>

CRITICAL RULES:
- EVERY piece of content MUST be inside a <section> tag
- Each <section> = one slide
- Do NOT put any text, headings, or content between </section> and <section>
- Replace all [BRACKETED TEXT] with actual content
- Use the brand color from the chosen palette

Output ONLY valid HTML, no markdown code blocks.

Generate 3 monetization strategies, 3 customer segments, 3-5 competitors, 3 prompt chain steps, 5 distribution channels, waitlist HTML, and pitch deck HTML.`;

    // Use REST API to call Gemini
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
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema: responseSchema
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


    // Extract the response text
    const candidate = geminiResult.candidates?.[0];
    if (!candidate) {
      return res.status(500).json({ error: 'No response from Gemini' });
    }

    let text = candidate.content?.parts?.[0]?.text || '';

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

    // Reshape data to match Launchpad.tsx expectations
    const formattedData = {
      identity: {
        name: analysisData.name,
        tagline: analysisData.tagline,
      },
      monetization: analysisData.monetization,
      visuals: {
        logoStyle: "Minimalist",
        appInterface: analysisData.interface,
      },
      distributionChannels: analysisData.distributionChannels,
      validation: {
        aiInsight: analysisData.market.aiInsight,
        competitors: analysisData.competitors.length,
        competitorList: analysisData.competitors,
        marketGap: analysisData.marketGap,
      },
      customerSegments: analysisData.customerSegments,
      promptChain: analysisData.promptChain,
      artifacts: {
        waitlistHtml: analysisData.waitlistHtml,
        pitchDeckHtml: analysisData.pitchDeckHtml
      }
    };

    // Save to Firestore with ATOMIC rate limit check using a transaction
    // This prevents race conditions where parallel requests bypass the limit
    const analysesRef = db.collection('analyses');

    try {
      await db.runTransaction(async (transaction) => {
        // Re-check rate limit inside the transaction (atomic read)
        const rateLimitQuery = await db.collection('analyses')
          .where('keyId', '==', keyDoc.id)
          .where('createdAt', '>=', today)
          .count()
          .get();

        const currentCount = rateLimitQuery.data().count;

        if (currentCount >= DAILY_LIMIT) {
          // Throw to abort the transaction - this will be caught below
          throw new Error('RATE_LIMIT_EXCEEDED');
        }

        // Create the new analysis document atomically
        const newAnalysisRef = analysesRef.doc();
        transaction.set(newAnalysisRef, {
          keyId: keyDoc.id,
          idea: idea.trim(),
          data: formattedData,
          createdAt: new Date(),
        });
      });
    } catch (txError) {
      if (txError instanceof Error && txError.message === 'RATE_LIMIT_EXCEEDED') {
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        return res.status(429).json({
          error: `Daily limit reached (${DAILY_LIMIT} analyses). Try again tomorrow.`,
          limit: DAILY_LIMIT,
          used: DAILY_LIMIT,
          remaining: 0,
          resetsAt: tomorrow.toISOString()
        });
      }
      // Re-throw other transaction errors
      throw txError;
    }

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Analysis error:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: 'Failed to generate analysis' });
  }
}
