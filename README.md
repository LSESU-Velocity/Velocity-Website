# Velocity Launchpad | LSE

<div align="center">
<img width="200" alt="Velocity Logo" src="public/Velocity-logo-black.png" />
</div>

**Velocity Launchpad** is an AI-powered startup idea validation tool built for LSE students. Enter your business idea and get instant analysis including market positioning, competitor research, monetisation strategies, and actionable next steps — all powered by Google Gemini.

## Features

### Phase 1: Validation
- **Industry Insights** — Instant market analysis of your startup idea
- **Waitlist Landing Page** — Download a production-ready HTML landing page to gauge interest
- **Pitch Deck Generator** — Interactive Reveal.js presentation with problem, solution, and business model slides
- **Market Position Map** — Visual perceptual map showing competitors and your unique gap

### Phase 2: Strategy
- **Customer Segments** — Identify 3+ target demographics with income levels and pain points
- **Monetisation Strategy** — Multiple revenue models (Freemium, Subscription, etc.) with pricing suggestions
- **Distribution Channels** — Top 5 real communities (Reddit, Discord, forums) where your users hang out

### Phase 3: Execution
- **Prompt Chain** — Step-by-step prompts to build your MVP with AI coding assistants

## Privacy Note

> ⚠️ **Data Processing Disclosure**: This tool sends your startup ideas and descriptions to the Google Gemini API for AI-powered analysis. Please avoid submitting sensitive personal information, confidential business data, or proprietary ideas during testing or use. All submitted content is processed by Google's servers according to their [privacy policy](https://policies.google.com/privacy).

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Vercel Serverless Functions
- **AI**: Google Gemini API (gemini-3-flash-preview)
- **Database**: Firebase Firestore (access key management & rate limiting)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key
- Firebase project (for access key management)

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

4. Configure your `.env.local` with:
   - `GEMINI_API_KEY` — Your Google Gemini API key
   - `FIREBASE_PROJECT_ID` — Your Firebase project ID
   - `FIREBASE_CLIENT_EMAIL` — Firebase service account email
   - `FIREBASE_PRIVATE_KEY` — Firebase private key

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Deployment

This project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and configure the environment variables in the Vercel dashboard.

## Project Structure

```
├── api/                 # Vercel serverless API routes
│   ├── analyze.ts       # Main AI analysis endpoint
│   ├── login.ts         # Access key authentication
│   └── me.ts            # Session validation
├── components/          # React components
│   ├── Launchpad.tsx    # Main launchpad UI
│   ├── LaunchpadDashboard.tsx  # Results dashboard
│   └── ...
├── lib/                 # Utility functions
│   ├── api.ts           # Frontend API client
│   ├── firebase.ts      # Firebase configuration
│   └── serverAuth.ts    # Server-side authentication
├── hooks/               # Custom React hooks
├── public/              # Static assets
└── index.html           # Main HTML entry point
```

## Contributing

This project is maintained by [LSESU Velocity](https://github.com/LSESU-Velocity).

## License

This project is open-source under the [MIT License](LICENSE). We believe in open knowledge and sharing resources to help student entrepreneurs everywhere.

---

<div align="center">


[![Instagram](https://img.shields.io/badge/Instagram-%23E4405F.svg?style=for-the-badge&logo=Instagram&logoColor=white)](https://www.instagram.com/lsesu.velocity)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/lsesu-velocity/)

</div>
