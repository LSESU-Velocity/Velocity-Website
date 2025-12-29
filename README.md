# Velocity Launchpad | LSE

<div align="center">
<img width="200" alt="Velocity Logo" src="public/Velocity-logo-black.png" />
</div>

**Velocity Launchpad** is an AI-powered startup idea validation tool built for LSE students. Enter your business idea and get instant analysis including market positioning, competitor research, monetization strategies, and actionable next steps.

## Features

- 🚀 **AI-Powered Analysis** - Powered by Google Gemini for intelligent startup validation
- 📊 **Market Funnel Analysis** - TAM, SAM, SOM breakdown for your target market
- 🎯 **Competitor Research** - Identify competitors and your unique market position
- 💰 **Monetization Strategy** - AI-generated revenue models and pricing suggestions
- 📱 **App Mockup Generation** - Visual concept of your product
- ✅ **Day 1 Tasks** - Actionable first steps to get started

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Vercel Serverless Functions
- **AI**: Google Gemini API
- **Database**: Firebase Firestore
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
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `FIREBASE_PROJECT_ID` - Your Firebase project ID
   - `FIREBASE_CLIENT_EMAIL` - Firebase service account email
   - `FIREBASE_PRIVATE_KEY` - Firebase private key

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
├── components/          # React components
├── lib/                 # Utility functions and types
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
