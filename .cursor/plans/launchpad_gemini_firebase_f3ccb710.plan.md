---
name: Launchpad Gemini Firebase
overview: Make the Launchpad.tsx functional by integrating Gemini 2.5 Flash with Google Search grounding for real-time market data, and Firebase for invite-code authentication and result storage.
todos:
  - id: firebase-setup
    content: Create Firebase project, enable Auth + Firestore, set up security rules
    status: in_progress
  - id: cloud-functions
    content: "Create Cloud Functions: validateInviteCode, generateAnalysis, getAnalyses"
    status: pending
  - id: gemini-integration
    content: Implement Gemini 2.5 Flash with grounding in Cloud Function, define JSON schema
    status: pending
  - id: frontend-auth
    content: Create InviteCodeLogin component and useAuth hook
    status: pending
  - id: launchpad-integration
    content: Modify Launchpad.tsx to use real API instead of mock data
    status: pending
  - id: history-feature
    content: Add analysis history UI to view/load saved analyses
    status: pending
---

# Make Launchpad Functional with Gemini + Firebase

## Architecture Overview

```
[React Frontend] --> [Firebase Cloud Functions] --> [Gemini 2.5 Flash + Grounding]
       |                      |
       |                      v
       +-------------> [Firestore]
                - invite_codes
                - users
                - analyses
```

## 1. Firebase Project Setup

### Firestore Collections

- `keys`: `{ code: string, createdAt: timestamp, label?: string }`
- `analyses`: `{ keyId: string, idea: string, data: object, createdAt: timestamp }`

### How Keys Work

```
User Flow:
1. Admin gives user a key: "VEL-A3X9-K2M1"
2. User enters key on Launchpad to "login"
3. Key is stored in localStorage for persistence
4. Same key used forever to access their analyses
5. No email, no password - just the key
```

## 2. Cloud Function Endpoints

### `POST /login`

- Input: `{ key: string }`
- Validates key exists in Firestore `keys` collection
- Returns `{ valid: true, keyId: string }` or error
- Frontend stores key in localStorage

### `POST /generateAnalysis`

- Input: `{ key: string, idea: string }`
- Validates key exists
- Calls Gemini 2.5 Flash with grounding
- Saves result to Firestore under that key
- Returns generated analysis data

### `GET /analyses?key=XXX`

- Validates key
- Returns all analyses for that key from Firestore

## 3. Admin Panel (`/admin`)

Simple protected page for you to:

- Generate new keys (random or custom)
- View all existing keys with labels (e.g., "John's key")
- See usage stats per key
- Delete/revoke keys

Protected by a separate admin password (env variable)

## 3. Gemini 2.5 Flash Integration

### Grounding Configuration

Use `googleSearchRetrieval` tool for real-time data on:

- **Market Funnel**: TAM/SAM/SOM with actual market sizes and sources
- **Market Position**: Real competitors, their USPs, weaknesses, market positioning
- **Distribution Channels**: Active communities on Reddit, Discord, forums
- **Customer Segments**: Demographic data from industry reports

### Prompt Structure (Single Call)

```javascript
const prompt = `Analyze this startup idea: "${idea}"

Use Google Search to find REAL, CURRENT data for:
1. Market size (TAM/SAM/SOM) with actual figures and sources
2. Top 3-5 competitors with their positioning, strengths, weaknesses
3. Target customer segments with demographics
4. Active online communities where users gather
5. Current search trends for related keywords

Generate:
- Brand identity (name, tagline)
- Risk analysis with mitigations
- Monetization strategies
- AI coding prompts to build MVP
- Viability/Scalability/Complexity scores (0-100)

Return as JSON matching this schema: {...}`;
```

### Response Schema

Define strict JSON schema matching current `generateStartupData()` output structure to ensure compatibility with existing widget components.

## 4. Frontend Changes to `Launchpad.tsx`

### New Components/Files

- `components/InviteCodeLogin.tsx` - Login modal with invite code input
- `lib/firebase.ts` - Firebase config and initialization
- `lib/api.ts` - Cloud Function API calls
- `hooks/useAuth.ts` - Authentication state management

### Modify `handleLaunch()`

```typescript
const handleLaunch = async (e: React.FormEvent) => {
  // Check authentication
  if (!user) {
    setShowLoginModal(true);
    return;
  }
  
  setIsGenerating(true);
  
  // Call Cloud Function instead of mock data
  const result = await generateAnalysis(idea);
  
  setData(result);
  setIsGenerating(false);
};
```

### Add History Feature

- "My Analyses" sidebar or dropdown
- Load previous analyses from Firestore

## 5. API Recommendations

| Widget | Data Source | Notes |

|--------|-------------|-------|

| Market Funnel | Gemini + Grounding | Real TAM/SAM/SOM from reports |

| Market Position | Gemini + Grounding | Real competitors via search |

| Search Volume | Google Trends iframe (keep) | Free, works well |

| AI Summary | Gemini (no grounding) | Analysis only |

| Risk Analysis | Gemini (no grounding) | Generated risks |

| Customer Segments | Gemini + Grounding | Demographics from research |

| Distribution | Gemini + Grounding | Reddit/Discord communities |

| Prompt Chain | Gemini (no grounding) | Generated prompts |

**Why keep Google Trends iframe**: The official Trends API is deprecated. Alternatives like SerpAPI cost ~$50/mo. The iframe is free and provides accurate data.

## 6. Cost Estimate (Gemini 2.5 Flash)

- Input: ~2,000 tokens per request (prompt + idea)
- Output: ~3,000 tokens per response (full analysis JSON)
- Grounding: ~5 search queries per request
- **Cost per analysis**: ~$0.002 (input) + $0.006 (output) + grounding = ~$0.01-0.02
- **$300 credits**: ~15,000-30,000 analyses

## 7. File Structure

```
├── functions/
│   ├── src/
│   │   ├── index.ts          # Cloud Function endpoints
│   │   ├── gemini.ts         # Gemini API wrapper
│   │   └── schema.ts         # Response JSON schema
│   └── package.json
├── src/
│   ├── lib/
│   │   ├── firebase.ts       # Firebase init
│   │   └── api.ts            # API calls
│   ├── hooks/
│   │   └── useAuth.ts
│   └── components/
│       ├── Launchpad.tsx     # Modified
│       └── InviteCodeLogin.tsx # New
```