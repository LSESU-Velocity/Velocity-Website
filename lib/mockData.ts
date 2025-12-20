// Mock data generator for local development
// This allows testing the Launchpad without a running backend

import type { AnalysisData } from './api';

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
        riskAnalysis: [
            {
                risk: "Building features users don't need.",
                mitigation: "Presell 10 licenses before coding.",
                productFeature: "Waitlist landing page with feature voting."
            },
            {
                risk: "High customer acquisition cost (CAC).",
                mitigation: "Focus on organic content marketing and SEO.",
                productFeature: "Built-in SEO optimization tools and blog generator."
            },
            {
                risk: "Technical debt accumulating early.",
                mitigation: "Enforce strict code reviews and modular architecture.",
                productFeature: "Automated linting and CI/CD pipeline integration."
            }
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
        lseData: {
            day1Tasks: [
                { task: "Post in r/startups", description: "Share your idea and ask for feedback on validation strategies", category: "outreach" as const },
                { task: "Interview 5 potential users", description: "Ask what tools they currently use and their biggest frustrations", category: "research" as const },
                { task: "Create a landing page", description: "Build a simple page to collect email signups and gauge interest", category: "build" as const },
                { task: "Analyze 3 competitor products", description: "Sign up for free trials and document their pricing, features, and gaps", category: "research" as const },
                { task: "DM 10 indie hackers", description: "Ask how they validated their ideas before building", category: "outreach" as const }
            ]
        }
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
            riskAnalysis: [
                {
                    risk: "Users match but don't meet offline.",
                    mitigation: "Host weekly group workouts to bridge online-to-offline gap.",
                    productFeature: "Auto group-matching and in-app event scheduling."
                },
                {
                    risk: "User safety concerns meeting strangers.",
                    mitigation: "Implement ID verification and public meeting spot suggestions.",
                    productFeature: "Identity verification badge and SOS alert system."
                },
                {
                    risk: "High churn rate after finding a partner.",
                    mitigation: "Add social feed features to keep users engaged post-match.",
                    productFeature: "Community feed and workout streak gamification."
                }
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
            lseData: {
                day1Tasks: [
                    { task: "Talk to 5 gym-goers at LSE", description: "Ask about their biggest frustration finding workout partners", category: "research" as const },
                    { task: "Post in r/Fitness", description: "Ask the community how they currently find gym buddies", category: "outreach" as const },
                    { task: "Survey LSE sports clubs", description: "Email club presidents asking about member social needs", category: "research" as const },
                    { task: "Create a quick prototype", description: "Build a simple matching form to test the core concept", category: "build" as const },
                    { task: "DM 10 fitness influencers", description: "Ask what their followers struggle with socially in gyms", category: "outreach" as const }
                ]
            }
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
                    riskAnalysis: data.riskAnalysis,
                    marketGap: data.marketGap,
                    scores: {
                        viability: 75,
                        scalability: 65,
                        complexity: 45
                    }
                },
                lseData: data.lseData,
                sources: data.sources,
                customerSegments: data.customerSegments,
                promptChain: data.promptChain
            });
        }, 1500); // Shorter delay for dev mode
    });
}
