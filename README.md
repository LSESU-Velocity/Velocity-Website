# Velocity | LSE

<div align="center">
<img width="200" alt="Velocity Logo" src="public/Velocity-logo-black.png" />
</div>

**Velocity** is a platform built by LSESU Velocity to help student founders validate and sharpen startup ideas. **Launchpad Lab** is its flagship tool — a BYOK (Bring Your Own Key) AI analysis lab powered by LangChain, LangGraph, and Google Gemini.

## Launchpad Lab

Launchpad Lab uses your own Google Gemini API key to run a multi-stage analysis pipeline on your startup idea. No platform API key is required — you bring your own.

### How it works

1. Enter your free Google AI Studio API key (get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)).
2. Describe your startup idea.
3. The analysis runs through an orchestrated LangGraph workflow:
   - **Idea classification and intake normalization**
   - **Bull analyst** — identifies upside, market opportunity, and momentum
   - **Bear analyst** — stress-tests assumptions, surfaces risks and objections
   - **Synthesis** — merges perspectives into a unified opportunity assessment
   - **QA and repair** — validates the report against the output schema

### What you get

- **Analyst Council** — Bull and bear perspectives with key points and recommendations
- **Confidence Score** — Overall assessment with open risks and next moves
- **Market Sizing** — Directional TAM/SAM/SOM based on reachable communities
- **Competitor Map** — Visual perceptual map showing your gap
- **Customer Segments** — Target demographics with income levels and pain points
- **Monetization Strategy** — Revenue models with pricing suggestions
- **Distribution Channels** — Real communities where your users hang out
- **Prompt Chain** — Step-by-step prompts to build your MVP with AI coding assistants
- **Founder Assets** (optional) — Waitlist landing page and pitch deck, generated on demand

### Key handling and privacy

- Your API key is stored in browser `sessionStorage` by default (cleared when the tab closes).
- Opt into "remember on this device" to persist in `localStorage`.
- Keys are sent to the Velocity backend only to authorize the Gemini request — they are never logged, persisted, or returned in responses.
- Your idea is sent to Google Gemini for analysis. Analyses are not stored on our servers — results live in your browser only.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Vercel Serverless Functions
- **AI**: LangChain + LangGraph with Google Gemini (`@langchain/google`)
- **Hosting**: Vercel
- **Optional**: Firebase Firestore (for non-Launchpad features)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/LSESU-Velocity/Velocity-Website.git
   cd Velocity-Website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure `.env.local` — see `.env.example` for available variables. Launchpad Lab does not require a platform `GEMINI_API_KEY`; users supply their own key in the browser.

5. Start the API server (needed for Launchpad Lab analysis):
   ```bash
   npm run dev:api
   ```

6. In a separate terminal, start the frontend:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
├── api/                     # Vercel serverless API routes
│   ├── analyze.ts           # Main analysis endpoint (accepts BYOK key via header)
│   └── analyze-stream.ts    # SSE streaming endpoint with real-time progress
├── components/              # React components
│   ├── Launchpad.tsx        # Main Launchpad Lab UI and input flow
│   ├── LaunchpadDashboard.tsx  # Results dashboard with council, market, and artifacts
│   ├── ApiKeyEntry.tsx      # BYOK API key entry modal
│   └── ...
├── lib/                     # Utility and pipeline modules
│   ├── api.ts               # Frontend API client with SSE support
│   ├── launchpad-lab/       # LangChain/LangGraph analysis pipeline
│   │   ├── graph.ts         # LangGraph state graph definition and nodes
│   │   ├── schemas.ts       # Zod schemas for analysis contract
│   │   ├── prompts.ts       # Prompt builders for each analysis stage
│   │   ├── analyze.ts       # Analysis runner and outcome types
│   │   └── index.ts         # Barrel exports
│   ├── launchpad-storage.ts # Client-side thread persistence (localStorage)
│   └── ...
├── public/                  # Static assets
└── index.html               # Main HTML entry point
```

## Privacy Note

> Your startup ideas are sent to the Google Gemini API for AI-powered analysis using your own API key. Analyses are stored in your browser only and are not persisted on our servers. Please avoid submitting sensitive personal information or confidential business data. Google's processing is subject to their [privacy policy](https://policies.google.com/privacy).

## Deployment

This project is configured for deployment on Vercel. Connect your GitHub repository to Vercel and configure environment variables in the Vercel dashboard.

## Contributing

This project is maintained by [LSESU Velocity](https://github.com/LSESU-Velocity).

## License

This project is open-source under the [MIT License](LICENSE).

---

<div align="center">

[![Instagram](https://img.shields.io/badge/Instagram-%23E4405F.svg?style=for-the-badge&logo=Instagram&logoColor=white)](https://www.instagram.com/lsesu.velocity)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/lsesu-velocity/)

</div>
