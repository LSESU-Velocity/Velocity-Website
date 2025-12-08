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
        sources: {
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
            { name: "CodeFast", usp: "Large library of templates", weakness: "Generic designs, hard to customize", x: 30, y: 60 },
            { name: "LaunchPad", usp: "One-click deployment", weakness: "Vendor lock-in, expensive scaling", x: 15, y: 75 },
            { name: "DevAssist", usp: "AI code completion", weakness: "Requires senior dev knowledge to debug", x: 40, y: 40 }
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
        ]
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
            sources: {
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
                { name: "FitBuddy", usp: "Focuses on finding personal trainers", weakness: "Expensive subscription, low student adoption", x: 75, y: 70 },
                { name: "GymMate", usp: "Tracks workout progress", weakness: "No social features, purely a logbook", x: 30, y: 25 },
                { name: "SpotMe", usp: "Large user base in US", weakness: "Very few users in London/UK", x: 60, y: 80 }
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
            ]
        };
    } else if (lowercaseIdea.includes("cat") || lowercaseIdea.includes("pet") || lowercaseIdea.includes("dog")) {
        data.name = "PetPals";
        data.tagline = "Connect with furry friends nearby.";
        data.market.aiInsight = "PetPals capitalizes on the post-pandemic pet boom (20% growth). It solves a critical trust issue in the pet-sitting market by leveraging local community verification.";
    } else if (lowercaseIdea.includes("study") || lowercaseIdea.includes("student") || lowercaseIdea.includes("university")) {
        data.name = "StudySphere";
        data.tagline = "Ace your exams together.";
        data.market.aiInsight = "StudySphere hits the sweet spot of post-COVID hybrid learning. Students are craving connection, and your peer-to-peer focus differentiates heavily from static content libraries like Chegg.";
    } else if (lowercaseIdea.includes("food") || lowercaseIdea.includes("restaurant") || lowercaseIdea.includes("cook")) {
        data.name = "Tastify";
        data.tagline = "Discover your next craving.";
        data.market.aiInsight = "Tastify disrupts the text-heavy food delivery model with a visual-first approach, aligning perfectly with Gen Z discovery habits.";
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
                    riskAnalysis: data.riskAnalysis,
                    searchVolume: data.searchVolume,
                    marketGap: data.marketGap
                },
                sources: data.sources,
                customerSegments: data.customerSegments,
                promptChain: data.promptChain
            });
        }, 1500); // Shorter delay for dev mode
    });
}
