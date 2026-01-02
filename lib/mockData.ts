// Mock data generator for local development
// This allows testing the Launchpad without a running backend

import type { AnalysisData } from './api';

const MOCK_WAITLIST_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{NAME}} - Launching Soon</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            DEFAULT: '#FF1F1F',
                            dark: '#CC0000',
                        }
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-black text-white font-sans antialiased">
    <div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand/20 rounded-full blur-[128px] pointer-events-none"></div>
        <div class="relative z-10 max-w-md w-full text-center space-y-8">
            <div class="inline-flex items-center gap-2 mb-4">
                <div class="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <span class="font-bold text-xl tracking-tight">{{NAME}}</span>
            </div>
            <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                {{TAGLINE}} <br/>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand to-orange-500">Launch sooner.</span>
            </h1>
            <p class="text-gray-400 text-lg">
                The best way to validate your idea. Join the waitlist today.
            </p>
            <div class="grid gap-3 text-left">
                <div class="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div class="w-2 h-2 rounded-full bg-brand"></div>
                    <span class="text-sm font-medium">Early Access</span>
                </div>
                <div class="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div class="w-2 h-2 rounded-full bg-brand"></div>
                    <span class="text-sm font-medium">Exclusive Features</span>
                </div>
            </div>
            <form class="flex gap-2" onsubmit="event.preventDefault(); alert('Joined!');">
                <input type="email" placeholder="enter@email.com" class="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand transition-colors" required>
                <button type="submit" class="bg-brand hover:bg-brand-dark text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-[0_0_20px_rgba(255,31,31,0.3)]">
                    Join
                </button>
            </form>
            <p class="text-xs text-gray-600">Join 2,000+ founders waiting for access.</p>
        </div>
    </div>
</body>
</html>`;

const MOCK_PITCH_DECK_HTML = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{NAME}} Pitch Deck</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/theme/black.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root { --r-main-color: #fff; --r-heading-color: #fff; --r-background-color: #000; --r-link-color: #FF1F1F; --r-selection-color: #FF1F1F; }
        .reveal .controls { color: #FF1F1F; }
        .reveal .progress { color: #FF1F1F; }
        .accent { color: #FF1F1F; }
        .bg-gradient { background: linear-gradient(135deg, rgba(255,31,31,0.1) 0%, rgba(0,0,0,0) 100%); }
    </style>
</head>
<body>
<div class="reveal">
    <div class="slides">
        <section data-background-color="#000">
            <h2 class="r-fit-text font-bold">The Future of Tech</h2>
            <p class="fragment text-gray-400">Is here.</p>
        </section>
        <section class="bg-gradient">
            <h3 class="text-red-500 uppercase tracking-widest text-lg mb-4">The Problem</h3>
            <h2 class="font-bold mb-8">Inefficiency</h2>
            <div class="flex flex-col gap-6 text-2xl">
                <div class="fragment bg-white/10 p-6 rounded-lg border-l-4 border-red-500">
                    Traditional solutions are <span class="text-red-500 font-bold">too slow</span>.
                </div>
                <div class="fragment bg-white/10 p-6 rounded-lg border-l-4 border-red-500">
                    Costs are <span class="text-red-500 font-bold">too high</span>.
                </div>
            </div>
        </section>
        <section>
            <div class="flex items-center justify-center gap-4 mb-8">
                <div class="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h1 class="font-bold tracking-tighter m-0">{{NAME}}</h1>
            </div>
            <p class="text-2xl text-gray-300">The solution you've been <span class="text-white font-bold underline decoration-red-500">waiting for</span>.</p>
        </section>
        <section>
             <h3 class="text-gray-500 uppercase tracking-widest text-lg mb-8">The Market</h3>
             <div class="grid grid-cols-3 gap-4">
                 <div class="bg-white/5 p-8 rounded-lg">
                     <div class="text-sm text-gray-400 uppercase">TAM</div>
                     <div class="text-5xl font-bold text-white mb-2">$150B</div>
                 </div>
                 <div class="bg-white/10 p-8 rounded-lg scale-110 shadow-[0_0_30px_rgba(255,31,31,0.1)] border border-red-500/30">
                     <div class="text-sm text-gray-400 uppercase">SAM</div>
                     <div class="text-5xl font-bold text-red-500 mb-2">$12B</div>
                 </div>
                 <div class="bg-white/5 p-8 rounded-lg">
                     <div class="text-sm text-gray-400 uppercase">SOM</div>
                     <div class="text-5xl font-bold text-white mb-2">$500K</div>
                 </div>
             </div>
        </section>
        <section data-background-color="#FF1F1F">
            <h2 class="text-white font-bold mb-4">Invest Now</h2>
            <p class="text-white/80 text-xl">{{NAME}} - {{TAGLINE}}</p>
        </section>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.0.4/dist/reveal.js"></script>
<script>
    Reveal.initialize({ hash: true, controls: true, progress: true, center: true, transition: 'slide' });
</script>
</body>
</html>`;

export function generateMockAnalysis(idea: string): Promise<AnalysisData> {
    const lowercaseIdea = idea.toLowerCase();

    let data = {
        name: "VelocityApp",
        tagline: "Build faster.",
        colors: ["#FF1F1F", "#0A0A0A", "#FFFFFF", "#333333"],
        domain: ["velocity.app", "velocity-tech.io", "getvelocity.com"],
        stack: ["Next.js", "Supabase", "OpenAI", "Vercel"],
        interface: "Dashboard with real-time analytics",
        monetization: [
            {
                model: "Freemium Model",
                pricing: "Free tier available",
                strategies: ["Premium Analytics", "Team Seats", "Enterprise API"],
                examples: "Slack, Dropbox, Zoom"
            },
            {
                model: "Subscription",
                pricing: "$29/mo Starter",
                strategies: ["Recurring Revenue", "Annual Discounts", "Usage-based Tiers"],
                examples: "Netflix, Adobe Creative Cloud"
            },
            {
                model: "One-time Purchase",
                pricing: "$199 Lifetime Deal",
                strategies: ["Quick Cash Injection", "No Recurring Costs", "Early Adopters"],
                examples: "Alfred, Things 3, Final Cut Pro"
            }
        ],
        market: {
            tam: { value: "$150B", label: "Global Developer Tools Market" },
            sam: { value: "$12B", label: "UK SaaS & Startup Tools" },
            som: { value: "$500K", label: "LSE Founders & Tech Students" },
            aiInsight: "VelocityApp targets a high-growth segment of UK founders ($150B TAM) with a clear value prop: speed. While the market is competitive with players like LaunchPad, your 'beginner-friendly yet flexible' positioning addresses a key pain point. Financials look promising with a clear path to revenue via Freemium models, though CAC remains a risk to monitor."
        },
        marketReports: [
            { title: "Developer Tools Market Report 2024", publisher: "Statista", keyStat: "Market size: $150B | CAGR: 12.1%", url: "https://statista.com/outlooks/developer-tools" },
            { title: "SaaS Industry Trends Report", publisher: "Grand View Research", keyStat: "Projected 2030: $317B", url: "https://grandviewresearch.com/saas" },
            { title: "UK Tech Startup Landscape", publisher: "Tech Nation", keyStat: "$14.4B invested in 2023", url: "https://technation.io/reports" }
        ],
        sources: {
            groundingChunks: [
                { uri: "https://statista.com/outlooks/developer-tools-market-2024", title: "Statista: Developer Tools Market Report 2024" },
                { uri: "https://gov.uk/business-statistics-uk-2024", title: "UK Business Statistics 2024" },
                { uri: "https://g2.com/categories/developer-tools", title: "G2: Best Developer Tools Software" },
                { uri: "https://capterra.com/development-software", title: "Capterra: Development Software Reviews" }
            ],
            searchQueries: ["UK developer tools market size 2024", "startup tools competitors 2024", "SaaS market UK"],
            market: [
                { name: "Statista UK Tech Report 2024", url: "https://statista.com" },
                { name: "Gov.uk Business Statistics", url: "https://gov.uk" }
            ],
            competitors: [
                { name: "G2 Crowd Reviews", url: "https://g2.com" },
                { name: "Capterra Comparisons", url: "https://capterra.com" }
            ]
        },
        customerSegments: [
            { segment: "Early-stage Founders", age: "20-35", income: "Variable", interest: "Tech & Innovation" },
            { segment: "Product Managers", age: "25-45", income: "High", interest: "Efficiency & Scaling" },
            { segment: "Hackathon Participants", age: "18-25", income: "Low", interest: "Speed & Prototyping" }
        ],

        competitors: [
            { name: "Vercel", usp: "One-click deployments", weakness: "Expensive at scale, vendor lock-in", x: 30, y: 60, founded: "2015", hq: "San Francisco", funding: "$313M raised", employees: "350+", website: "vercel.com" },
            { name: "Bubble", usp: "Visual no-code builder", weakness: "Limited customization, slow performance", x: 15, y: 75, founded: "2012", hq: "New York", funding: "$115M raised", employees: "200+", website: "bubble.io" },
            { name: "Replit", usp: "Browser-based IDE", weakness: "Not production-ready, limited enterprise features", x: 40, y: 40, founded: "2016", hq: "San Francisco", funding: "$222M raised", employees: "100+", website: "replit.com" }
        ],
        marketGap: {
            xAxis: { label: "Ease of Use", low: "Simple", high: "Complex" },
            yAxis: { label: "Customization", low: "Limited", high: "Flexible" },
            yourPosition: { x: 25, y: 85 },
            yourGap: "Beginner-friendly with full customization power"
        },
        searchVolume: [
            {
                keyword: "Startup Tools",
                data: [
                    { name: 'W1', users: 0 },
                    { name: 'W2', users: 45 },
                    { name: 'W3', users: 120 },
                    { name: 'W4', users: 350 },
                    { name: 'W5', users: 890 },
                    { name: 'W6', users: 1400 },
                ]
            },
            {
                keyword: "MVP Builder",
                data: [
                    { name: 'W1', users: 0 },
                    { name: 'W2', users: 20 },
                    { name: 'W3', users: 60 },
                    { name: 'W4', users: 150 },
                    { name: 'W5', users: 400 },
                    { name: 'W6', users: 900 },
                ]
            },
            {
                keyword: "No-code Platforms",
                data: [
                    { name: 'W1', users: 0 },
                    { name: 'W2', users: 80 },
                    { name: 'W3', users: 200 },
                    { name: 'W4', users: 500 },
                    { name: 'W5', users: 1200 },
                    { name: 'W6', users: 2000 },
                ]
            }
        ],
        promptChain: [
            {
                step: 1,
                title: "Set Up Your App Foundation",
                prompt: `Build me a modern web app called "${idea}" with a clean homepage, user signup/login, and a simple dashboard. Use a dark theme with red accents. Make it mobile-friendly.`
            },
            {
                step: 2,
                title: "Add Core Features",
                prompt: `Now add the main features: a real-time analytics view on the dashboard, the ability for users to create and manage projects, and a settings page where they can update their profile. Keep the same styling.`
            },
            {
                step: 3,
                title: "Polish & Launch Ready",
                prompt: `Finally, add a nice landing page that explains what the app does with a "Get Started" button, add some loading animations, and make sure the navigation flows smoothly between all pages. Add a footer with links.`
            }
        ],
        distributionChannels: [
            { name: "r/startups", type: "Reddit", members: "1.4M+" },
            { name: "Product Hunt", type: "Community", members: "Active" },
            { name: "Indie Hackers", type: "Forum", members: "Founders" },
            { name: "r/SaaS", type: "Reddit", members: "45k+" },
            { name: "Twitter/X Tech", type: "Social", members: "Viral" }
        ],

    };

    // Customize based on idea keywords
    if (lowercaseIdea.includes("gym") || lowercaseIdea.includes("fitness") || lowercaseIdea.includes("workout")) {
        data = {
            name: "GymSync",
            tagline: "Find your perfect spotter.",
            colors: ["#FF1F1F", "#0A0A0A", "#FFFFFF", "#333333"],
            domain: ["gymsync.app", "gymsync-connect.io", "getgymsync.com"],
            stack: ["FlutterFlow", "Supabase", "OpenAI API", "Stripe"],
            interface: "Swipe-based matchmaking",
            monetization: [
                {
                    model: "Subscription",
                    pricing: "£4.99/mo Premium",
                    strategies: ["Advanced Filters", "Unlimited Swipes", "Gym Partnerships"],
                    examples: "Strava, Peloton, Headspace"
                },
                {
                    model: "Ad-Supported",
                    pricing: "Free with Ads",
                    strategies: ["Supplement Ads", "Local Gym Promos", "Affiliate Links"],
                    examples: "MyFitnessPal (Free), YouTube"
                },
                {
                    model: "Freemium",
                    pricing: "Free Basic / £9.99 Pro",
                    strategies: ["Pro Workout Plans", "Verified Badge", "Priority Matching"],
                    examples: "Spotify, Duolingo"
                }
            ],
            market: {
                tam: { value: "$5.3B", label: "UK Fitness App Market" },
                sam: { value: "$420M", label: "London Fitness Tech" },
                som: { value: "$75K", label: "LSE Students & Staff" },
                aiInsight: "GymSync addresses the 'loneliness epidemic' in fitness by merging tracking with social connection. With $5.3B UK fitness app TAM, the opportunity is substantial. The unique 'Tinder for Gym' interface differentiates it from purely utility-based competitors like GymMate. Monetization via subscriptions is viable, provided user retention is managed through community features."
            },
            marketReports: [
                { title: "UK Fitness Market Report 2024", publisher: "UK Active", keyStat: "Market size: $5.3B | CAGR: 8.5%", url: "https://ukactive.com/reports" },
                { title: "Digital Fitness Market Outlook", publisher: "Mintel", keyStat: "App downloads: +45% YoY", url: "https://mintel.com/fitness" },
                { title: "Health & Fitness App Trends", publisher: "Statista", keyStat: "Global users: 1.1B", url: "https://statista.com/fitness-apps" }
            ],
            sources: {
                groundingChunks: [
                    { uri: "https://ukactive.com/reports/fitness-market-2024", title: "UK Active: Fitness Market Report 2024" },
                    { uri: "https://mintel.com/gym-health-clubs-uk", title: "Mintel: UK Gym & Health Clubs Analysis" },
                    { uri: "https://apps.apple.com/charts/fitness", title: "App Store: Top Fitness Apps" },
                    { uri: "https://trustpilot.com/categories/fitness-apps", title: "TrustPilot: Fitness App Reviews" }
                ],
                searchQueries: ["UK fitness app market size 2024", "gym partner app competitors", "fitness social apps UK"],
                market: [
                    { name: "UK Active Fitness Report 2024", url: "https://ukactive.com" },
                    { name: "Mintel Gym & Health Clubs", url: "https://mintel.com" }
                ],
                competitors: [
                    { name: "App Store Reviews", url: "https://apps.apple.com" },
                    { name: "TrustPilot Fitness Apps", url: "https://trustpilot.com" }
                ]
            },
            customerSegments: [
                { segment: "University Students", age: "18-24", income: "Low", interest: "Social Fitness" },
                { segment: "Young Professionals", age: "23-30", income: "Medium-High", interest: "Networking & Health" },
                { segment: "New Gym Goers", age: "Any", income: "Variable", interest: "Motivation & Support" }
            ],

            competitors: [
                { name: "FitBuddy", usp: "Focuses on finding personal trainers", weakness: "Expensive subscription, low student adoption", x: 75, y: 70, founded: "2018", hq: "London", funding: "$12M", employees: "50+", website: "fitbuddy.app" },
                { name: "GymMate", usp: "Tracks workout progress", weakness: "No social features, purely a logbook", x: 30, y: 25, founded: "2020", hq: "Berlin", funding: "$3M", employees: "25+", website: "gymmate.io" },
                { name: "SpotMe", usp: "Large user base in US", weakness: "Very few users in London/UK", x: 60, y: 80, founded: "2017", hq: "Los Angeles", funding: "$28M", employees: "100+", website: "spotme.fit" }
            ],
            marketGap: {
                xAxis: { label: "Social Features", low: "Solo", high: "Community" },
                yAxis: { label: "Price", low: "Free", high: "Premium" },
                yourPosition: { x: 85, y: 20 },
                yourGap: "Free social matching for students, not solo tracking"
            },
            searchVolume: [
                {
                    keyword: "Gym Partner App",
                    data: [
                        { name: 'W1', users: 0 },
                        { name: 'W2', users: 45 },
                        { name: 'W3', users: 120 },
                        { name: 'W4', users: 350 },
                        { name: 'W5', users: 890 },
                        { name: 'W6', users: 1400 },
                    ]
                },
                {
                    keyword: "Workout Buddy London",
                    data: [
                        { name: 'W1', users: 0 },
                        { name: 'W2', users: 15 },
                        { name: 'W3', users: 50 },
                        { name: 'W4', users: 120 },
                        { name: 'W5', users: 300 },
                        { name: 'W6', users: 650 },
                    ]
                },
                {
                    keyword: "Find Gym Spotter",
                    data: [
                        { name: 'W1', users: 0 },
                        { name: 'W2', users: 30 },
                        { name: 'W3', users: 90 },
                        { name: 'W4', users: 250 },
                        { name: 'W5', users: 600 },
                        { name: 'W6', users: 1100 },
                    ]
                }
            ],
            promptChain: [
                {
                    step: 1,
                    title: "Create the Matching Screen",
                    prompt: "Build me a mobile app for finding gym partners. Start with a swipe-based matching screen like Tinder where users can see other people's profiles (photo, name, gym they go to, workout style). Add swipe left to skip and swipe right to match. Use a dark theme with red highlights."
                },
                {
                    step: 2,
                    title: "Add Profiles & Chat",
                    prompt: "Now add a profile setup flow where users can add their photo, select their gym from a list, pick their workout times, and describe what they're looking for in a gym buddy. Also add a simple chat feature so matched users can message each other to plan workouts."
                },
                {
                    step: 3,
                    title: "Launch Features",
                    prompt: "Finally, add a matches list screen showing all your current gym buddies, push notifications when you get a new match, and a simple onboarding flow for new users that explains how the app works. Add a nice splash screen with the app logo."
                }
            ],
            distributionChannels: [
                { name: "r/Fitness", type: "Reddit", members: "11M+" },
                { name: "r/GymMotivation", type: "Reddit", members: "400k+" },
                { name: "Bodybuilding.com", type: "Forum", members: "OGs" },
                { name: "TikTok Fitness", type: "Social", members: "Viral" },
                { name: "r/LSE", type: "Local", members: "Students" }
            ],
        };
    }

    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                identity: {
                    name: data.name,
                    tagline: data.tagline,
                    colors: data.colors,
                    domain: data.domain,
                    available: true
                },
                monetization: data.monetization,
                visuals: {
                    logoStyle: "Minimalist",
                    appInterface: data.interface,
                    screens: [
                        { type: "map", title: "Home" },
                        { type: "feed", title: "Feed" },
                        { type: "profile", title: "Profile" }
                    ]
                },
                blueprint: {
                    stack: data.stack,
                    complexity: "Medium",
                    timeline: "2 Weekends"
                },
                distributionChannels: data.distributionChannels,
                validation: {
                    tam: data.market.tam,
                    sam: data.market.sam,
                    som: data.market.som,
                    aiInsight: data.market.aiInsight,
                    competitors: 3,
                    competitorList: data.competitors,
                    marketReports: data.marketReports,
                    marketGap: data.marketGap,
                    scores: {
                        viability: 75,
                        scalability: 65,
                        complexity: 45
                    }
                },
                sources: data.sources,
                customerSegments: data.customerSegments,
                promptChain: data.promptChain,
                artifacts: {
                    waitlistHtml: MOCK_WAITLIST_HTML.replace(/{{NAME}}/g, data.name).replace(/{{TAGLINE}}/g, data.tagline),
                    pitchDeckHtml: MOCK_PITCH_DECK_HTML.replace(/{{NAME}}/g, data.name).replace(/{{TAGLINE}}/g, data.tagline)
                }
            });
        }, 1500); // Shorter delay for dev mode
    });
}
