# Velocity | LSE

<div align="center">
<img width="200" alt="Velocity Logo" src="public/Velocity-logo-black.png" />
</div>

**Velocity** is the LSESU society behind Launchpad and our builder programmes. **Launchpad** is the platform: an AI startup analysis workspace that turns a rough spark into a practical read on the market, customers, risks, and next steps.

## Launchpad

Launchpad takes a founder's early idea and runs it through a structured analysis workflow. It helps answer the questions student builders usually need before they spend weeks building: who the customer is, what problem is sharpest, where the opportunity sits, what could break, and what to build next.

### How it works

1. Describe your startup idea in plain English.
2. Connect an LLM API key when prompted.
3. Launchpad runs the idea through an orchestrated LangGraph workflow:
   - **Idea classification and intake normalization**
   - **Bull analyst**: identifies upside, market opportunity, and momentum
   - **Bear analyst**: stress-tests assumptions, surfaces risks and objections
   - **Synthesis**: merges perspectives into a unified opportunity assessment
   - **QA and repair**: schema-validation failures trigger one targeted regeneration pass with the errors fed back, then a final validation gate

### What you get

- **Analyst Council**: Bull and bear perspectives with key points and recommendations
- **Confidence Score**: Overall assessment with open risks and next moves
- **Market Sizing**: Directional TAM/SAM/SOM based on reachable communities
- **Competitor Map**: Visual perceptual map showing your gap
- **Customer Segments**: Target demographics with income levels and pain points
- **Monetization Strategy**: Revenue models with pricing suggestions
- **Distribution Channels**: Real communities where your users hang out
- **Prompt Chain**: Step-by-step prompts to build your MVP with AI coding assistants
- **Founder Assets** (optional): Waitlist landing page and pitch deck, generated on demand

### API key note

Launchpad is bring-your-own-key: paste a Google AI Studio (Gemini), OpenAI, or Anthropic API key in the browser and the provider is detected from the key prefix. Live web research (Google Search grounding) runs on Gemini keys only. Other providers run the analysis ungrounded. Velocity does not store the raw key server-side or sell API access. Keys are stored in browser `sessionStorage` by default, with an optional "remember on this device" setting. Provider terms, billing, data handling, and regional rules still apply.

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

4. Configure `.env.local`. See `.env.example` for available variables. Launchpad does not require a platform model API key; users supply their own Google AI Studio key in the browser.

5. Start the API server (needed for Launchpad analysis):
   ```bash
   npm run dev:api
   ```

6. In a separate terminal, start the frontend:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Development checks

```bash
npm run typecheck   # TypeScript, no emit
npm run lint        # ESLint (errors block CI; react-hooks compiler rules warn)
npm test            # Vitest unit suite (sanitizers, SSE parser, guards, crypto)
npm run build       # Production bundle
```

CI runs all four on every push and pull request (`.github/workflows/ci.yml`).

### Interest form browser checks

```bash
npx playwright install chromium firefox webkit
npm run test:browser
```

The browser suite builds the site and serves it with the production security
headers from `vercel.json`. It covers Chromium, Firefox, WebKit, and Android/iPhone
viewport emulation. Google Form responses are intercepted locally: these tests
never create real registrations. They cover blocked and slow embeds, manual retry,
offline recovery, iframe validation/submission, URL/history preservation, nested
event dialogs, keyboard focus, small screens, and the JavaScript-free fallback.
CI runs these checks too. On Windows with Edge installed, set
`PLAYWRIGHT_EDGE=1` to include the installed Edge browser.
To run the optional live, signed-out Google access checks, set
`INTEREST_FORM_LIVE=1` and run `npm run test:browser -- interest-form.live.spec.ts`.
These also block the response endpoint and submit no registrations.

The site cannot inspect a cross-origin Google Form to determine whether its
contents rendered successfully: even a blocked frame can emit `load`
([iframe event behavior](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#error_and_load_event_behavior)).
Recovery links therefore remain visible, including a same-tab option for browsers
that restrict new tabs. Timeouts and connection changes never reload answers;
retry is an explicit user action. If Google is unavailable altogether, the modal
also provides the society's contact address.

Before an event launch, check the live form in a signed-out/private browser and
on a physical iPhone/Android device. Confirm responder access is **Anyone with
the link**, responses are still accepted, and sign-in requirements are intentional
([Google responder settings](https://support.google.com/docs/answer/2839588)).
The app cannot override Google-side access or availability. Keep the fallback
link in `index.html` synchronized with `FLAGSHIP_INTEREST_FORM_URL` in
`lib/eventsCatalog.ts`; the browser suite checks that they match.

## Project Structure

```
├── api/                     # Vercel serverless API routes
│   ├── analyze.ts           # Main analysis endpoint (accepts user API key via header)
│   └── analyze-stream.ts    # SSE streaming endpoint with real-time progress
├── components/              # React components
│   ├── Launchpad.tsx        # Main Launchpad UI and input flow
│   ├── LaunchpadDashboard.tsx  # Results dashboard with council, market, and artifacts
│   ├── ApiKeyEntry.tsx      # Google AI Studio key entry modal
│   └── ...
├── lib/                     # Utility and pipeline modules
│   ├── api.ts               # Frontend API client with SSE support
│   ├── launchpad-lab/       # LangChain/LangGraph analysis pipeline modules
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

> Launchpad startup ideas are sent to Google Gemini for analysis using your own Google AI Studio API key. Analyses are stored in your browser only and are not persisted on our servers. Please avoid submitting sensitive personal information or confidential business data. Google processing is subject to Google's own terms and privacy policy.

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
