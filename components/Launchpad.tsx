import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, Variants } from 'framer-motion';
import { Rocket, CheckCircle2, Cpu, Target, BarChart3, Palette, ArrowRight, Loader2, Zap, TrendingUp, Globe, Smartphone, Coins, Copy, Terminal, AlertTriangle, ChevronLeft, ChevronRight, Users, MessageCircle, BookOpen, ExternalLink } from 'lucide-react';
// Animated text component matching Hero.tsx
const AnimatedText = ({
  text,
  className,
  delay = 0
}: {
  text: string,
  className?: string,
  delay?: number
}) => {
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: delay }
    })
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      }
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      }
    }
  };

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="visible"
      className={`flex flex-wrap justify-center gap-x-[0.25em] ${className}`}
    >
      {text.split(" ").map((word, index) => (
        <span key={index} className="whitespace-nowrap inline-block">
          {Array.from(word).map((letter, i) => (
            <motion.span variants={child} key={i} className="inline-block">
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  );
};

// Animated Dial/Gauge Component - Premium glassmorphism design
const AnimatedScoreBar = ({
  label,
  targetValue,
  delay = 0,
  visible = true,
  invertColor = false
}: {
  label: string;
  targetValue: number;
  delay?: number;
  visible?: boolean;
  invertColor?: boolean;
}) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (visible && !hasAnimated) {
      setHasAnimated(true);
      const startTime = Date.now();
      const duration = 1500;
      const delayMs = delay * 1000;

      const timeout = setTimeout(() => {
        const animate = () => {
          const elapsed = Date.now() - startTime - delayMs;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.round(eased * targetValue);

          setCurrentValue(value);

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      }, delayMs);

      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, targetValue, delay]);

  useEffect(() => {
    if (visible) {
      setHasAnimated(false);
      setCurrentValue(0);
    }
  }, [targetValue]);

  // Get solid color based on thresholds (unchanged)
  const getDialColor = (percentage: number) => {
    const effectivePercentage = invertColor ? 100 - percentage : percentage;

    // Thresholds: 0-33 (Red), 33-70 (Yellow), 70-90 (Green), 90+ (Dark Green)
    if (effectivePercentage < 33.33) {
      return '#ef4444'; // Red
    } else if (effectivePercentage < 70) {
      return '#eab308'; // Yellow
    } else if (effectivePercentage < 90) {
      return '#22c55e'; // Green
    } else {
      return '#15803d'; // Dark green
    }
  };

  const dialColor = getDialColor(currentValue);

  // Arc configuration
  const radius = 42;
  const strokeWidth = 6;
  const centerX = 50;
  const centerY = 50;

  // Calculate arc path (semicircle opening upward)
  const startAngle = -180;
  const endAngle = 0;
  const angleRange = endAngle - startAngle;
  const filledAngle = startAngle + (currentValue / 100) * angleRange;

  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAng: number, endAng: number) => {
    const start = polarToCartesian(cx, cy, r, startAng);
    const end = polarToCartesian(cx, cy, r, endAng);
    const largeArcFlag = Math.abs(endAng - startAng) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const backgroundArc = describeArc(centerX, centerY, radius, startAngle, endAngle);
  const filledArc = currentValue > 0 ? describeArc(centerX, centerY, radius, startAngle, filledAngle) : '';

  return (
    <div
      className="group/dial flex flex-col items-center justify-center w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glassmorphic container */}
      <div
        className="relative p-4 rounded-lg bg-white/[0.02] border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.04] hover:border-white/20"
        style={{
          boxShadow: isHovered ? `0 0 30px ${dialColor}15, inset 0 0 20px ${dialColor}05` : 'none',
        }}
      >
        {/* SVG Dial */}
        <div className="relative w-24 h-14 flex items-center justify-center">
          <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
            {/* Glow filter for filled arc */}
            <defs>
              <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Gradient for the arc */}
              <linearGradient id={`arcGradient-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={dialColor} stopOpacity="0.6" />
                <stop offset="100%" stopColor={dialColor} stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Background arc track */}
            <path
              d={backgroundArc}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Filled arc with glow */}
            {currentValue > 0 && (
              <path
                d={filledArc}
                fill="none"
                stroke={`url(#arcGradient-${label})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                filter={`url(#glow-${label})`}
                style={{
                  transition: 'stroke 0.3s ease-out'
                }}
              />
            )}

            {/* Start and end tick marks */}
            <circle cx={centerX - radius} cy={centerY} r="1.5" fill="rgba(255,255,255,0.2)" />
            <circle cx={centerX + radius} cy={centerY} r="1.5" fill="rgba(255,255,255,0.2)" />
          </svg>

          {/* Centered percentage display */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
            <span
              className="font-sans font-bold text-xl tracking-tight tabular-nums leading-none transition-all duration-300"
              style={{
                color: dialColor,
                textShadow: isHovered ? `0 0 15px ${dialColor}60` : 'none'
              }}
            >
              {currentValue}%
            </span>
          </div>
        </div>
      </div>

      {/* Label below the dial */}
      <span className="font-mono text-[9px] text-gray-500 uppercase tracking-[0.2em] mt-2 group-hover/dial:text-gray-300 transition-colors duration-300">
        {label}
      </span>
    </div>
  );
};

// Mock data generator
const generateStartupData = (idea: string) => {
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
      tam: { value: "15M", label: "UK Startup Founders" },
      sam: { value: "1.2M", label: "London Tech Workers" },
      som: { value: "~5,000", label: "LSE Students & Staff" },
      aiInsight: "VelocityApp targets a high-growth segment of UK founders (15M TAM) with a clear value prop: speed. While the market is competitive with players like LaunchPad, your 'beginner-friendly yet flexible' positioning addresses a key pain point. Financials look promising with a clear path to revenue via Freemium models, though CAC remains a risk to monitor."
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
    /**
     * PERCEPTUAL MAP DATA CONVENTION (for AI agents and future API integration):
     * 
     * ⚠️ CRITICAL: The perceptual map renders values in a LOW→HIGH direction:
     *   - X-axis: LEFT edge = xAxis.low, RIGHT edge = xAxis.high
     *   - Y-axis: BOTTOM edge = yAxis.low, TOP edge = yAxis.high
     * 
     * When defining axis values, think: "What is the LOW end of this spectrum?"
     * Put that in .low (rendered LEFT for X, BOTTOM for Y).
     * Put the HIGH end in .high (rendered RIGHT for X, TOP for Y).
     * 
     * EXAMPLES OF CORRECT LOW→HIGH ORDERING:
     *   ✓ Complexity:    low="Simple"     → high="Complex"    (simple is low complexity)
     *   ✓ Price:         low="Free"       → high="Premium"    (free is low price)
     *   ✓ Social:        low="Solo"       → high="Community"  (solo is low social)
     *   ✓ Reliability:   low="Casual"     → high="Scheduled"  (casual is low reliability)
     * 
     * COMMON MISTAKE TO AVOID:
     *   ✗ Do NOT think alphabetically or by "ease" - think by the SCALE being measured.
     *   ✗ If measuring "Ease of Use", the scale is still Simple(low)→Complex(high) because
     *     you're placing products on a complexity spectrum, not an "easiness" spectrum.
     * 
     * Competitor positions (x, y) are percentages: (0,0)=bottom-left, (100,100)=top-right.
     * A product at x=20 is 20% along the X-axis (closer to the LOW/left end).
     */
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
        tam: { value: "10M", label: "UK Gym Members" },
        sam: { value: "850K", label: "London Gym-Goers" },
        som: { value: "~5,000", label: "LSE Students & Staff" },
        aiInsight: "GymSync addresses the 'loneliness epidemic' in fitness by merging tracking with social connection. With 10M UK gym members, the TAM is substantial. The unique 'Tinder for Gym' interface differentiates it from purely utility-based competitors like GymMate. Monetization via subscriptions is viable, provided user retention is managed through community features."
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
    data = {
      name: "PetPals",
      tagline: "Connect with furry friends nearby.",
      colors: ["#FF9F1C", "#0A0A0A", "#FFFFFF", "#2EC4B6"],
      domain: ["petpals.io", "petpals-connect.app", "getpetpals.co.uk"],
      stack: ["React Native", "Firebase", "Cloudinary", "Stripe"],
      interface: "Location-based feed",
      monetization: [
        {
          model: "Marketplace",
          pricing: "5% Service Fee",
          strategies: ["Featured Listings", "Pet Service Booking", "Premium Profiles"],
          examples: "Airbnb, Uber, Etsy"
        },
        {
          model: "Subscription",
          pricing: "£9.99/mo for Owners",
          strategies: ["Insurance Integration", "Vet Chat Access", "Emergency Support"],
          examples: "BarkBox, Chewy Autoship"
        },
        {
          model: "Affiliate",
          pricing: "Product Recommendations",
          strategies: ["Pet Food Partnerships", "Toy Sales", "Grooming Discounts"],
          examples: "Wirecutter, Skyscanner"
        }
      ],
      market: {
        tam: { value: "2.4M", label: "UK Pet Owners" },
        sam: { value: "300K", label: "London Dog Owners" },
        som: { value: "~5,000", label: "LSE Students & Staff" },
        aiInsight: "PetPals capitalizes on the post-pandemic pet boom (20% growth). It solves a critical trust issue in the pet-sitting market by leveraging local community verification. While established players like Rover dominate the high-end, your focus on 'casual, community-led' care fills a massive gap for cost-conscious urban millennials."
      },
      sources: {
        market: [
          { name: "PFMA Pet Population Report", url: "https://pfma.org.uk" },
          { name: "Statista UK Pet Industry", url: "https://statista.com" }
        ],
        competitors: [
          { name: "Pet Industry Federation UK", url: "https://petfederation.co.uk" },
          { name: "App Store Pet App Reviews", url: "https://apps.apple.com" }
        ]
      },
      customerSegments: [
        { segment: "Pet Owners", age: "25-50", income: "Medium-High", interest: "Pet Care & Community" },
        { segment: "Remote Workers", age: "25-40", income: "Medium-High", interest: "Companionship" },
        { segment: "Elderly with Pets", age: "60+", income: "Fixed", interest: "Social Connection" }
      ],
      riskAnalysis: [
        {
          risk: "Chicken & Egg: App is empty, so no one joins.",
          mitigation: "Do things that don't scale. Manually seed 50 profiles.",
          productFeature: "Referral bonuses and fake-user-free verification."
        },
        {
          risk: "Trust & Safety incidents between pets/owners.",
          mitigation: "Mandatory verification and community guidelines.",
          productFeature: "Pet profile verification and sitter background checks."
        },
        {
          risk: "Platform leakage (users meet once and exchange numbers).",
          mitigation: "Offer value-added tools like scheduling and payment protection.",
          productFeature: "In-app payment escrow and scheduling calendar."
        }
      ],
      competitors: [
        { name: "Rover", usp: "Professional sitting services", weakness: "Paid services only, no casual playdates", x: 85, y: 80 },
        { name: "BorrowMyDoggy", usp: "Free community care", weakness: "Unreliable for scheduled needs", x: 20, y: 25 },
        { name: "LocalDog", usp: "Neighborhood focus", weakness: "Outdated app interface, buggy", x: 45, y: 40 }
      ],
      marketGap: {
        xAxis: { label: "Reliability", low: "Casual", high: "Scheduled" },
        yAxis: { label: "Price", low: "Free", high: "Expensive" },
        yourPosition: { x: 75, y: 25 },
        yourGap: "Reliable, scheduled care at student-friendly prices"
      },
      searchVolume: [
        {
          keyword: "Dog Walking App",
          data: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 50 },
            { name: 'W3', users: 140 },
            { name: 'W4', users: 400 },
            { name: 'W5', users: 950 },
            { name: 'W6', users: 1600 },
          ]
        },
        {
          keyword: "Pet Sitter London",
          data: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 25 },
            { name: 'W3', users: 80 },
            { name: 'W4', users: 200 },
            { name: 'W5', users: 500 },
            { name: 'W6', users: 1000 },
          ]
        },
        {
          keyword: "Puppy Playdates",
          data: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 60 },
            { name: 'W3', users: 180 },
            { name: 'W4', users: 450 },
            { name: 'W5', users: 1100 },
            { name: 'W6', users: 2200 },
          ]
        }
      ],
      promptChain: [
        {
          step: 1,
          title: "Build the Pet Feed",
          prompt: "Create a mobile app for pet owners to connect. Start with a location-based feed showing nearby pets with their photos, names, and a short bio. Add filters for pet type (dog, cat, etc.) and distance. Use warm orange and teal colors on a dark background."
        },
        {
          step: 2,
          title: "Add Pet Profiles & Booking",
          prompt: "Now add a pet profile page where owners can add multiple pets with photos, age, breed, and personality traits. Also add a booking system where users can request playdates or pet-sitting services with a calendar picker and messaging."
        },
        {
          step: 3,
          title: "Safety & Payments",
          prompt: "Finally, add owner verification badges, a review system for after playdates, and a simple payment flow for pet-sitting bookings. Include a map view to see nearby pets and add push notifications for new booking requests."
        }
      ],
      distributionChannels: [
        { name: "r/dogs", type: "Reddit", members: "2.5M+" },
        { name: "r/cats", type: "Reddit", members: "4M+" },
        { name: "PetForums.co.uk", type: "Forum", members: "Local" },
        { name: "Nextdoor", type: "App", members: "Neighbors" },
        { name: "Facebook Dog Groups", type: "Social", members: "Active" }
      ]
    };
  } else if (lowercaseIdea.includes("study") || lowercaseIdea.includes("student") || lowercaseIdea.includes("university")) {
    data = {
      name: "StudySphere",
      tagline: "Ace your exams together.",
      colors: ["#4361EE", "#0A0A0A", "#FFFFFF", "#F72585"],
      domain: ["studysphere.edu", "studysphere-app.com", "getstudysphere.io"],
      stack: ["Next.js", "Prisma", "OpenAI", "Vercel"],
      interface: "Collaborative workspace",
      monetization: [
        {
          model: "Freemium",
          pricing: "Free for Students",
          strategies: ["University Licensing", "Tutor Marketplace", "Study Material Sales"],
          examples: "Notion, Evernote, Quizlet"
        },
        {
          model: "Tutor Commission",
          pricing: "15% per Session",
          strategies: ["Video Chat Tools", "Scheduling API", "Payment Processing"],
          examples: "Preply, Cambly"
        },
        {
          model: "Content Sales",
          pricing: "$5 per Study Guide",
          strategies: ["User Generated Content", "Revenue Share", "Premium Notes"],
          examples: "Udemy, Gumroad"
        }
      ],
      market: {
        tam: { value: "2.8M", label: "UK University Students" },
        sam: { value: "400K", label: "London Students" },
        som: { value: "~12,000", label: "LSE Students" },
        aiInsight: "StudySphere hits the sweet spot of post-COVID hybrid learning. Students are craving connection, and your peer-to-peer focus differentiates heavily from static content libraries like Chegg. The 'Freemium' model aligns perfectly with student budgets. Success hinges on overcoming the 'empty platform' risk by seeding high-quality initial content."
      },
      sources: {
        market: [
          { name: "HESA Student Statistics 2024", url: "https://hesa.ac.uk" },
          { name: "Universities UK Data", url: "https://universitiesuk.ac.uk" }
        ],
        competitors: [
          { name: "EdTech Magazine Analysis", url: "https://edtechmagazine.com" },
          { name: "Student App Reviews", url: "https://trustpilot.com" }
        ]
      },
      customerSegments: [
        { segment: "Undergraduate Students", age: "18-22", income: "Low", interest: "Grades & Socializing" },
        { segment: "Postgrad Researchers", age: "23-30", income: "Low-Medium", interest: "Collaboration" },
        { segment: "Tutors/TAs", age: "20-30", income: "Variable", interest: "Teaching & Income" }
      ],
      riskAnalysis: [
        {
          risk: "Empty platform syndrome (no content).",
          mitigation: "Pay top students to upload notes for first 50 courses.",
          productFeature: "Bounty system for high-demand course notes."
        },
        {
          risk: "Copyright issues with university materials.",
          mitigation: "Implement strict content takedown policy and moderation.",
          productFeature: "Automated copyright detection and reporting tools."
        },
        {
          risk: "Seasonality (usage drops during holidays).",
          mitigation: "Introduce features for summer internships and career prep.",
          productFeature: "Career roadmap builder and internship matching."
        }
      ],
      competitors: [
        { name: "Chegg", usp: "Massive answer database", weakness: "Expensive monthly fee, academic integrity risks", x: 80, y: 85 },
        { name: "Quizlet", usp: "Great flashcards", weakness: "Limited collaboration features", x: 35, y: 30 },
        { name: "StuDocu", usp: "Note sharing", weakness: "Upload-gated content, inconsistent quality", x: 55, y: 50 }
      ],
      marketGap: {
        xAxis: { label: "Collaboration", low: "Solo Study", high: "Group Work" },
        yAxis: { label: "Price", low: "Free", high: "Paid" },
        yourPosition: { x: 80, y: 20 },
        yourGap: "Free peer collaboration, not paid answer lookup"
      },
      searchVolume: [
        {
          keyword: "Study Group App",
          data: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 55 },
            { name: 'W3', users: 150 },
            { name: 'W4', users: 420 },
            { name: 'W5', users: 980 },
            { name: 'W6', users: 1700 },
          ]
        },
        {
          keyword: "Exam Notes Sharing",
          data: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 35 },
            { name: 'W3', users: 100 },
            { name: 'W4', users: 300 },
            { name: 'W5', users: 750 },
            { name: 'W6', users: 1300 },
          ]
        },
        {
          keyword: "Student Tutor Finder",
          data: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 20 },
            { name: 'W3', users: 60 },
            { name: 'W4', users: 180 },
            { name: 'W5', users: 450 },
            { name: 'W6', users: 950 },
          ]
        }
      ],
      promptChain: [
        {
          step: 1,
          title: "Create the Study Hub",
          prompt: "Build me a web app for university students to study together. Start with a homepage showing study groups organized by course/subject, a search bar to find groups, and a simple signup with university email. Use a purple and pink color scheme on dark mode."
        },
        {
          step: 2,
          title: "Add Collaboration Tools",
          prompt: "Now add a study group page where members can share notes (upload PDFs or images), create flashcard decks together, and schedule study sessions with a shared calendar. Include a live chat for each group."
        },
        {
          step: 3,
          title: "Tutoring & Rewards",
          prompt: "Finally, add a tutor marketplace where students can offer tutoring for courses they've aced, a points system that rewards users for sharing quality notes, and a profile page showing someone's courses, groups, and reputation. Add email notifications for upcoming study sessions."
        }
      ],
      distributionChannels: [
        { name: "r/LSE", type: "Reddit", members: "Key Target" },
        { name: "The Student Room", type: "Forum", members: "Huge UK" },
        { name: "r/UniUK", type: "Reddit", members: "General" },
        { name: "Discord Study Servers", type: "Social", members: "Active" },
        { name: "Campus WhatsApp", type: "Chat", members: "Direct" }
      ]
    };
  } else if (lowercaseIdea.includes("food") || lowercaseIdea.includes("restaurant") || lowercaseIdea.includes("cook")) {
    data = {
      name: "Tastify",
      tagline: "Discover your next craving.",
      colors: ["#E63946", "#0A0A0A", "#FFFFFF", "#F4A261"],
      domain: ["tastify.app", "tastify-food.com", "gettastify.io"],
      stack: ["React", "Node.js", "MongoDB", "Stripe"],
      interface: "Visual menu browser",
      monetization: [
        {
          model: "Commission",
          pricing: "10% per Order",
          strategies: ["Sponsored Dishes", "Restaurant Analytics", "Delivery Integration"],
          examples: "Deliveroo, UberEats"
        },
        {
          model: "Subscription (SaaS)",
          pricing: "£49/mo for Restaurants",
          strategies: ["Menu Management", "CRM Features", "Website Builder"],
          examples: "Toast, Shopify"
        },
        {
          model: "Consumer Premium",
          pricing: "£7.99/mo for Foodies",
          strategies: ["Exclusive Reservations", "Secret Menu Access", "No Booking Fees"],
          examples: "Resy, Opentable"
        }
      ],
      market: {
        tam: { value: "45M", label: "UK Food Delivery Users" },
        sam: { value: "3.5M", label: "London Foodies" },
        som: { value: "~5,000", label: "LSE Students & Staff" },
        aiInsight: "Tastify disrupts the text-heavy food delivery model with a visual-first approach, aligning perfectly with Gen Z discovery habits. With 45M users in the TAM, the opportunity is massive. The main challenge is the logistics barrier, which your 'concierge MVP' strategy smartly mitigates. Visual discovery + seamless ordering is a defensible moat."
      },
      sources: {
        market: [
          { name: "Statista Food Delivery UK", url: "https://statista.com" },
          { name: "IGD UK Food & Grocery", url: "https://igd.com" }
        ],
        competitors: [
          { name: "UK Hospitality Report", url: "https://ukhospitality.org.uk" },
          { name: "Statista Food Delivery", url: "https://statista.com" }
        ]
      },
      customerSegments: [
        { segment: "Foodies / Bloggers", age: "20-35", income: "Medium", interest: "Trends & Aesthetics" },
        { segment: "Busy Professionals", age: "25-45", income: "High", interest: "Quality & Convenience" },
        { segment: "Diet-Specific Eaters", age: "Any", income: "Variable", interest: "Health & Restrictions" }
      ],
      riskAnalysis: [
        {
          risk: "Restaurants ignore unproven platform.",
          mitigation: "Concierge MVP: Upload menus manually and call in orders.",
          productFeature: "AI menu digitization from photos."
        },
        {
          risk: "Low margins with delivery logistics.",
          mitigation: "Start with pickup-only to avoid driver network costs.",
          productFeature: "QR code ordering for pickup optimization."
        },
        {
          risk: "Competition from giants (UberEats/Deliveroo).",
          mitigation: "Niche down to specific cuisines or dietary needs (e.g. Vegan).",
          productFeature: "Dietary filter presets (Vegan, GF, Keto)."
        }
      ],
      competitors: [
        { name: "Yelp", usp: "Huge review database", weakness: "Trust issues with fake reviews", x: 30, y: 65 },
        { name: "Instagram", usp: "Visual discovery", weakness: "Not built for menus or ordering", x: 85, y: 20 },
        { name: "UberEats", usp: "Delivery logistics", weakness: "High fees for restaurants and users", x: 70, y: 80 }
      ],
      marketGap: {
        xAxis: { label: "Visual Focus", low: "Text-Based", high: "Visual First" },
        yAxis: { label: "Ordering", low: "Discovery Only", high: "Full Delivery" },
        yourPosition: { x: 80, y: 55 },
        yourGap: "Visual-first discovery with seamless ordering"
      },
      searchVolume: [
        {
          keyword: "Visual Menu App",
          data: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 35 },
            { name: 'W3', users: 90 },
            { name: 'W4', users: 250 },
            { name: 'W5', users: 600 },
            { name: 'W6', users: 1200 },
          ]
        },
        {
          keyword: "Find Food by Picture",
          data: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 60 },
            { name: 'W3', users: 150 },
            { name: 'W4', users: 400 },
            { name: 'W5', users: 950 },
            { name: 'W6', users: 1800 },
          ]
        },
        {
          keyword: "Best Dishes Near Me",
          data: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 80 },
            { name: 'W3', users: 220 },
            { name: 'W4', users: 550 },
            { name: 'W5', users: 1300 },
            { name: 'W6', users: 2500 },
          ]
        }
      ],
      promptChain: [
        {
          step: 1,
          title: "Build the Food Discovery Feed",
          prompt: "Create a food discovery app with a beautiful visual feed showing dish photos from nearby restaurants. Each card shows the dish photo, name, price, and restaurant. Add filters for cuisine type and dietary needs (vegan, gluten-free). Use red and orange colors on a dark theme."
        },
        {
          step: 2,
          title: "Add Restaurant Pages & Ordering",
          prompt: "Now add a restaurant detail page with all their dishes as a visual grid, operating hours, location on a map, and reviews. Include an 'Add to Order' button on each dish and a cart system to build your order."
        },
        {
          step: 3,
          title: "Checkout & User Favorites",
          prompt: "Finally, add a checkout flow with pickup or delivery options, saved payment methods, and order tracking. Include a favorites list where users can save dishes they want to try, and a past orders section to quickly reorder. Add tasty food animations when placing an order!"
        }
      ],
      distributionChannels: [
        { name: "r/LondonFood", type: "Reddit", members: "Locals" },
        { name: "Instagram Foodies", type: "Social", members: "Visual" },
        { name: "TikTok Food Trends", type: "Social", members: "Viral" },
        { name: "r/FoodPorn", type: "Reddit", members: "Global" },
        { name: "TripAdvisor Forums", type: "Travel", members: "Tourists" }
      ]
    };
  }

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
          growthData: data.searchVolume[0].data,
          marketGap: data.marketGap
        },
        sources: data.sources,
        customerSegments: data.customerSegments,
        systemPrompt: `Act as a Senior React Native developer. Set up a project structure for '${data.name}' using Expo and Firebase. Include a 'MapScreen' component with integrated Google Maps API and user authentication via Firebase. Focus on clean, modular code.`,
        promptChain: data.promptChain
      });
    }, 2500);
  });
};

// Widget with spotlight effect matching Features.tsx
const Widget = ({ title, icon: Icon, children, delay = 0, className = "", action, visible = true }: any) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: visible ? delay : 0 }}
      onMouseMove={handleMouseMove}
      className={`relative group bg-white/[0.02] border border-white/10 overflow-hidden h-full flex flex-col ${className}`}
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 31, 31, 0.1),
              transparent 80%
            )
          `,
        }}
      />

      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.07]"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      <div className="relative z-10 p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/5 border border-white/10 group-hover:border-velocity-red/50 group-hover:bg-velocity-red/10 transition-colors duration-300">
              <Icon className="w-3.5 h-3.5 text-gray-300 group-hover:text-velocity-red transition-colors duration-300" />
            </div>
            <span className="font-mono text-[10px] text-gray-300 uppercase tracking-widest">{title}</span>
          </div>
          {action}
        </div>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

// Google Trends Widget Component using iframe embed
const GoogleTrends = ({ keyword }: { keyword: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const encodedKeyword = encodeURIComponent(keyword);

  // Google Trends embed URL for timeseries widget (5-year period for comprehensive trend data)
  const iframeSrc = `https://trends.google.com/trends/embed/explore/TIMESERIES?req=%7B%22comparisonItem%22%3A%5B%7B%22keyword%22%3A%22${encodedKeyword}%22%2C%22geo%22%3A%22GB%22%2C%22time%22%3A%22today%205-y%22%7D%5D%2C%22category%22%3A0%2C%22property%22%3A%22%22%7D&tz=-60&eq=q%3D${encodedKeyword}%26geo%3DGB%26date%3Dtoday%205-y`;

  return (
    <div className="w-full h-full overflow-hidden relative" style={{ minHeight: '280px' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-4 h-4 text-velocity-red animate-spin" />
            <span className="font-mono text-[9px] text-gray-400">Loading trends...</span>
          </div>
        </div>
      )}
      <iframe
        src={iframeSrc}
        className="border-0 absolute inset-0"
        style={{
          filter: 'invert(1) hue-rotate(180deg) contrast(0.9) brightness(1.1)',
          width: 'calc(100% + 40px)',
          height: 'calc(100% + 80px)',
          marginLeft: '-20px',
          marginTop: '-40px',
          transform: 'scale(0.95)',
          transformOrigin: 'center center'
        }}
        onLoad={() => setIsLoading(false)}
        title={`Google Trends for ${keyword}`}
      />
    </div>
  );
};

export const Launchpad: React.FC = () => {
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<any>(null);
  const [competitorIndex, setCompetitorIndex] = useState(0);
  const [monetizationIndex, setMonetizationIndex] = useState(0);
  const [riskIndex, setRiskIndex] = useState(0);
  const [searchVolumeIndex, setSearchVolumeIndex] = useState(0);
  const [domainIndex, setDomainIndex] = useState(0);
  const [appScreenIndex, setAppScreenIndex] = useState(0);
  const [promptChainIndex, setPromptChainIndex] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const inputFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (data && !isGenerating) {
      setShowResults(false); // Reset before scroll

      // Capture current scroll position immediately
      const initialScrollY = window.scrollY;

      // Freeze viewport to prevent any micro-scrolls during layout
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;

      // Wait for layout to fully settle
      setTimeout(() => {
        const element = inputFormRef.current;
        if (!element) {
          document.documentElement.style.overflow = '';
          document.documentElement.style.paddingRight = '';
          setShowResults(true);
          return;
        }

        // Calculate target while viewport is frozen - scroll to bottom edge of form
        // but account for navbar height so the heading below is visible
        const elementRect = element.getBoundingClientRect();
        const elementBottom = elementRect.bottom;
        const navbarHeight = 80; // Account for fixed navbar
        const target = initialScrollY + elementBottom - navbarHeight;
        const distance = target - initialScrollY;

        // Unfreeze viewport
        document.documentElement.style.overflow = '';
        document.documentElement.style.paddingRight = '';

        // Ensure we're at the starting position
        window.scrollTo({ top: initialScrollY, behavior: 'instant' as ScrollBehavior });

        const duration = 1400;
        let startTime: number | null = null;

        function animation(currentTime: number) {
          if (startTime === null) startTime = currentTime;
          const timeElapsed = currentTime - startTime;

          // Ease in-out cubic for smooth acceleration/deceleration
          const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          const progress = ease(Math.min(timeElapsed / duration, 1));
          window.scrollTo({ top: initialScrollY + (distance * progress), behavior: 'instant' as ScrollBehavior });

          if (timeElapsed < duration) {
            requestAnimationFrame(animation);
          } else {
            // Scroll complete - now show the widgets
            setShowResults(true);
          }
        }

        requestAnimationFrame(animation);
      }, 50);
    }
  }, [data, isGenerating]);

  const loadingSteps = [
    { text: "Scanning market landscape", icon: Globe },
    { text: "Analyzing competition", icon: Target },
    { text: "Generating brand identity", icon: Palette },
    { text: "Architecting tech stack", icon: Cpu },
    { text: "Crafting launch strategy", icon: Rocket }
  ];

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingSteps.length);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setIsGenerating(true);
    setData(null);
    setShowResults(false);
    setCompetitorIndex(0);
    setMonetizationIndex(0);
    setRiskIndex(0);
    setSearchVolumeIndex(0);
    setDomainIndex(0);
    setAppScreenIndex(0);
    setPromptChainIndex(0);
    setLoadingStep(0);

    const result = await generateStartupData(idea);

    setData(result);
    setIsGenerating(false);
  };

  return (
    <section className="min-h-screen pt-32 md:pt-48 pb-24 px-6 relative overflow-hidden">

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">

          <h1 className="flex flex-col items-center mb-8 leading-[0.85] select-none w-full">
            <AnimatedText
              text="FROM IDEA"
              className="font-sans font-black text-5xl md:text-7xl lg:text-8xl tracking-tighter text-white"
              delay={0.2}
            />
            <AnimatedText
              text="TO LAUNCH"
              className="font-sans font-black text-5xl md:text-7xl lg:text-8xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#F5E3A8] via-[#D4AF37] to-[#8A6E2F] pb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              delay={0.8}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="font-mono text-sm md:text-base text-gray-400 max-w-xl mb-12 leading-relaxed"
          >
            Describe your idea in one sentence. We'll generate your brand identity,
            tech stack, and go-to-market strategy.
          </motion.p>

          {/* Input Section */}
          <motion.form
            ref={inputFormRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            onSubmit={handleLaunch}
            className="w-full max-w-2xl"
          >
            <div className="relative group">
              <div className="flex flex-col sm:flex-row gap-4 bg-white/[0.02] border border-white/10 p-2 group-hover:border-white/20 transition-colors">
                <input
                  type="text"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="A Tinder-style app for finding gym partners..."
                  className="flex-1 bg-transparent text-white px-4 py-4 outline-none placeholder:text-gray-600 font-mono text-sm"
                  disabled={isGenerating}
                />
                <button
                  type="submit"
                  disabled={isGenerating || !idea}
                  className="relative px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all duration-300 border-2 bg-velocity-darkRed/20 border-velocity-red/50 text-white shadow-[0_0_20px_rgba(255,31,31,0.15)] hover:bg-velocity-red hover:border-velocity-red hover:shadow-[0_0_50px_rgba(255,31,31,0.6)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Launch <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.form>

          {/* Loading State */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8 flex flex-col items-center"
              >
                <div className="flex items-center gap-3 mb-4">
                  {React.createElement(loadingSteps[loadingStep].icon, {
                    className: "w-4 h-4 text-velocity-red"
                  })}
                  <span className="font-mono text-sm text-gray-400">
                    {loadingSteps[loadingStep].text}...
                  </span>
                </div>
                <div className="flex gap-2">
                  {loadingSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-[2px] transition-colors duration-300 ${i <= loadingStep ? 'bg-velocity-red' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Dashboard */}
        <AnimatePresence>
          {data && !isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showResults ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Widgets Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* Left Column: App Mockup & Monetization */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                  <Widget
                    title="App Mockup"
                    icon={Smartphone}
                    delay={0.1}
                    className="flex-1"
                    visible={showResults}
                    action={
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setAppScreenIndex((prev) => (prev - 1 + data.visuals.screens.length) % data.visuals.screens.length)}
                          className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-[9px] text-gray-400 tabular-nums px-1 select-none">
                          {appScreenIndex + 1}/{data.visuals.screens.length}
                        </span>
                        <button
                          onClick={() => setAppScreenIndex((prev) => (prev + 1) % data.visuals.screens.length)}
                          className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    }
                  >
                    <div className="flex flex-col h-full">
                      {/* Phone Mockup */}
                      <div className="flex-1 flex items-center justify-center py-2">
                        <div className="relative w-full max-w-[180px] aspect-[9/19] bg-black border-[6px] border-[#1f1f1f] rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                          {/* Dynamic Notch */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-5 bg-[#1f1f1f] rounded-b-xl z-20"></div>

                          {/* Screen Content */}
                          <div className="w-full h-full bg-[#0a0a0a] relative flex flex-col">
                            {/* Status Bar Mock */}
                            <div className="h-8 w-full flex items-center justify-between px-4 pt-1">
                              <div className="text-[8px] font-mono text-white">9:41</div>
                              <div className="flex gap-1">
                                <div className="w-3 h-2 bg-white/20 rounded-[1px]"></div>
                                <div className="w-3 h-2 bg-white/20 rounded-[1px]"></div>
                              </div>
                            </div>

                            {/* App Header */}
                            <div className="px-4 py-2 flex items-center justify-between">
                              <div className="w-6 h-6 rounded-full bg-white/10"></div>
                              <span className="font-sans font-bold text-white text-sm truncate max-w-[80px]">{data.visuals.screens[appScreenIndex].title}</span>
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${data.identity.name}`} alt="User" className="w-full h-full" />
                              </div>
                            </div>

                            {/* Search Bar (visible on all screens for consistency or conditionally) */}
                            <div className="px-4 mb-4">
                              <div className="w-full h-8 bg-white/5 rounded-full flex items-center px-3 border border-white/10">
                                <div className="w-3 h-3 rounded-full border border-white/30 mr-2"></div>
                                <div className="w-20 h-2 bg-white/10 rounded"></div>
                              </div>
                            </div>

                            {/* Dynamic Content Area */}
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={appScreenIndex}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1 relative overflow-hidden bg-white/5 mx-4 mb-4 rounded-2xl border border-white/5"
                              >
                                {data.visuals.screens[appScreenIndex].type === 'map' && (
                                  <>
                                    {/* Mock Markers */}
                                    <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-velocity-red/20 rounded-full flex items-center justify-center animate-pulse">
                                      <div className="w-3 h-3 bg-velocity-red rounded-full border border-black"></div>
                                    </div>
                                    <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-velocity-red/20 rounded-full flex items-center justify-center animate-pulse" style={{ animationDelay: '0.5s' }}>
                                      <div className="w-3 h-3 bg-velocity-red rounded-full border border-black"></div>
                                    </div>
                                    {/* Floating Action Button */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-velocity-red rounded-full shadow-lg shadow-red-900/20">
                                      <div className="w-16 h-2 bg-white rounded"></div>
                                    </div>
                                  </>
                                )}

                                {data.visuals.screens[appScreenIndex].type === 'feed' && (
                                  <div className="p-3 space-y-2 h-full overflow-hidden">
                                    {[1, 2, 3].map((i) => (
                                      <div key={i} className="w-full h-16 bg-white/5 rounded-lg border border-white/5 flex items-center p-2 gap-2">
                                        <div className="w-10 h-10 rounded-md bg-white/10"></div>
                                        <div className="flex-1 space-y-1">
                                          <div className="w-2/3 h-2 bg-white/20 rounded"></div>
                                          <div className="w-1/2 h-1.5 bg-white/10 rounded"></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {data.visuals.screens[appScreenIndex].type === 'profile' && (
                                  <div className="p-4 flex flex-col items-center h-full">
                                    <div className="w-16 h-16 rounded-full border-2 border-white/20 bg-white/5 mb-3">
                                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${data.identity.name}`} alt="User" className="w-full h-full rounded-full p-1" />
                                    </div>
                                    <div className="w-24 h-3 bg-white/20 rounded mb-1"></div>
                                    <div className="w-16 h-2 bg-white/10 rounded mb-6"></div>

                                    <div className="w-full grid grid-cols-3 gap-2 mb-4">
                                      {[1, 2, 3].map((i) => (
                                        <div key={i} className="aspect-square bg-white/5 rounded-lg border border-white/5"></div>
                                      ))}
                                    </div>

                                    <div className="w-full space-y-2 mt-auto">
                                      <div className="w-full h-8 bg-white/5 rounded border border-white/5"></div>
                                      <div className="w-full h-8 bg-white/5 rounded border border-white/5"></div>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            </AnimatePresence>

                            {/* Bottom Nav */}
                            <div className="h-12 border-t border-white/5 flex items-center justify-around px-2">
                              <div className={`w-6 h-6 rounded-full transition-colors ${appScreenIndex === 0 ? 'bg-white/10' : 'border border-white/20'}`}></div>
                              <div className={`w-6 h-6 rounded-full transition-colors ${appScreenIndex === 1 ? 'bg-white/10' : 'border border-white/20'}`}></div>
                              <div className={`w-6 h-6 rounded-full transition-colors ${appScreenIndex === 2 ? 'bg-white/10' : 'border border-white/20'}`}></div>
                            </div>

                            {/* Home Indicator */}
                            <div className="h-4 w-full flex justify-center items-start">
                              <div className="w-1/3 h-1 bg-white/20 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Widget>

                  <Widget
                    title="Monetization Strategy"
                    icon={Coins}
                    delay={0.15}
                    className="h-64"
                    visible={showResults}
                    action={
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setMonetizationIndex((prev) => (prev - 1 + data.monetization.length) % data.monetization.length)}
                          className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-[9px] text-gray-400 tabular-nums px-1 select-none">
                          {monetizationIndex + 1}/{data.monetization.length}
                        </span>
                        <button
                          onClick={() => setMonetizationIndex((prev) => (prev + 1) % data.monetization.length)}
                          className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    }
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={monetizationIndex}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        <div>
                          <p className="font-mono text-[10px] text-gray-300 mb-1 uppercase tracking-widest">Model</p>
                          <p className="font-sans font-bold text-white text-sm">{data.monetization[monetizationIndex].model}</p>
                          <p className="font-mono text-velocity-red text-xs mt-0.5">{data.monetization[monetizationIndex].pricing}</p>
                        </div>
                        <div className="space-y-1 mb-3">
                          {data.monetization[monetizationIndex].strategies.map((strat: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-velocity-red rounded-full"></div>
                              <span className="text-xs text-gray-200">{strat}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-white/5">
                          <p className="font-mono text-[9px] text-blue-400 uppercase tracking-widest mb-1">Who Does This Well</p>
                          <p className="font-mono text-[10px] text-gray-300 leading-relaxed flex items-center gap-1.5">
                            {data.monetization[monetizationIndex].examples}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </Widget>
                </div>

                {/* Center Column: Analysis */}
                <div className="lg:col-span-6 flex flex-col gap-4">
                  {/* Header moved here */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={showResults ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center pb-2"
                  >
                    <div className="inline-flex items-center gap-2 text-velocity-red mb-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="font-mono text-[9px] uppercase tracking-widest">Analysis Complete</span>
                    </div>
                    <h2 className="font-sans font-bold text-2xl md:text-3xl tracking-tight text-white mb-0.5">{data.identity.name}</h2>
                    <p className="font-mono text-gray-400 text-[10px] italic">{data.identity.tagline}</p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top Left: Market Funnel */}
                    <Widget title="Market Funnel" icon={TrendingUp} delay={0.2} className="h-full min-h-[380px]" visible={showResults}>
                      <div className="flex flex-col h-full justify-center gap-4 py-2">
                        {/* TAM - Wide Bar */}
                        <div className="w-full bg-[#1A1A1A] border border-white/5 p-3 rounded-sm hover:bg-[#222] transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[10px] text-gray-300 font-bold">TAM</span>
                                <span className="text-[9px] text-gray-400 uppercase tracking-wide">Total Market</span>
                              </div>
                              <p className="font-sans font-bold text-2xl text-white leading-none">{data.validation.tam.value}</p>
                            </div>
                            <p className="font-mono text-[9px] text-gray-400 text-right max-w-[50%] leading-tight">{data.validation.tam.label}</p>
                          </div>
                        </div>

                        {/* SAM - Medium Bar */}
                        <div className="w-[85%] mx-auto bg-[#2A2A2A] border border-white/10 p-3 rounded-sm hover:bg-[#333] transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[10px] text-gray-300 font-bold">SAM</span>
                                <span className="text-[9px] text-gray-400 uppercase tracking-wide">Serviceable</span>
                              </div>
                              <p className="font-sans font-bold text-2xl text-gray-100 leading-none">{data.validation.sam.value}</p>
                            </div>
                            <p className="font-mono text-[9px] text-gray-300 text-right max-w-[50%] leading-tight">{data.validation.sam.label}</p>
                          </div>
                        </div>

                        {/* SOM - Narrow Bar */}
                        <div className="w-[70%] mx-auto bg-velocity-red/30 shadow-[0_4px_20px_rgba(255,31,31,0.1)] border border-velocity-red/50 p-3 rounded-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[10px] text-velocity-red font-bold">SOM</span>
                                <span className="text-[9px] text-gray-300 uppercase tracking-wide">Target</span>
                              </div>
                              <p className="font-sans font-bold text-2xl text-gray-100 leading-none">{data.validation.som.value}</p>
                            </div>
                            <p className="font-mono text-[9px] text-gray-300 text-right max-w-[50%] leading-tight">{data.validation.som.label}</p>
                          </div>
                        </div>

                        {/* Source Reference Indicator */}
                        <div className="mt-auto flex items-center justify-end gap-1.5 group/srcref cursor-default">
                          <span className="font-mono text-[8px] text-gray-400 group-hover/srcref:text-blue-400 transition-colors">See sources</span>
                          <div className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover/srcref:bg-blue-500/20 group-hover/srcref:border-blue-500/50 transition-all">
                            <span className="font-mono text-[8px] text-blue-400 font-bold">1</span>
                          </div>
                        </div>
                      </div>
                    </Widget>

                    {/* Top Right: Search Volume */}
                    <Widget
                      title="Search Volume"
                      icon={BarChart3}
                      delay={0.2}
                      className="h-full min-h-[380px]"
                      visible={showResults}
                      action={
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSearchVolumeIndex((prev) => (prev - 1 + data.validation.searchVolume.length) % data.validation.searchVolume.length)}
                            className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-[9px] text-gray-400 tabular-nums px-1 select-none">
                            {searchVolumeIndex + 1}/{data.validation.searchVolume.length}
                          </span>
                          <button
                            onClick={() => setSearchVolumeIndex((prev) => (prev + 1) % data.validation.searchVolume.length)}
                            className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      }
                    >
                      <div className="h-full w-full flex flex-col">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={searchVolumeIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col h-full"
                          >
                            <div className="flex items-center justify-between mb-2 shrink-0">
                              <p className="font-mono text-[10px] text-white">
                                "{data.validation.searchVolume[searchVolumeIndex].keyword}"
                              </p>
                              <div className="group/info relative">
                                <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center cursor-help hover:border-velocity-red/50 transition-colors">
                                  <span className="text-[8px] text-gray-400 group-hover/info:text-velocity-red transition-colors">?</span>
                                </div>
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded text-[8px] font-mono text-gray-400 opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl leading-relaxed">
                                  <span className="text-white">100</span> = peak interest<br />
                                  <span className="text-white">50</span> = half as popular<br />
                                  <span className="text-white">0</span> = insufficient data
                                  <div className="absolute top-full right-3 -mt-px border-4 border-transparent border-t-gray-900/95" />
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 relative overflow-hidden rounded" style={{ minHeight: '280px' }}>
                              <GoogleTrends keyword={data.validation.searchVolume[searchVolumeIndex].keyword} />
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </Widget>

                    {/* Middle: AI Executive Summary */}
                    <div className="col-span-1 md:col-span-2">
                      <Widget
                        title="AI Executive Summary"
                        icon={Zap}
                        delay={0.25}
                        className="h-fit"
                        visible={showResults}
                      >
                        <div className="flex flex-col gap-3">
                          <p className="font-sans text-sm text-gray-200 leading-relaxed">
                            {data.validation.aiInsight}
                          </p>

                          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                            <AnimatedScoreBar label="Viability" targetValue={80} delay={0.3} visible={showResults} />
                            <AnimatedScoreBar label="Scalability" targetValue={60} delay={0.4} visible={showResults} />
                            <AnimatedScoreBar label="Complexity" targetValue={40} delay={0.5} visible={showResults} invertColor />
                          </div>
                        </div>
                      </Widget>
                    </div>

                    {/* Bottom Left: Competitors with Perceptual Map */}
                    <Widget
                      title="Market Position"
                      icon={Target}
                      delay={0.3}
                      className="min-h-[380px]"
                      visible={showResults}
                      action={
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCompetitorIndex((prev) => (prev - 1 + data.validation.competitorList.length) % data.validation.competitorList.length)}
                            className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-[9px] text-gray-400 tabular-nums px-1 select-none">
                            {competitorIndex + 1}/{data.validation.competitorList.length}
                          </span>
                          <button
                            onClick={() => setCompetitorIndex((prev) => (prev + 1) % data.validation.competitorList.length)}
                            className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      }
                    >
                      <div className="flex flex-col h-full py-1 gap-3">

                        {/* Perceptual Map */}
                        <div className="relative w-full h-44 bg-white/[0.02] border border-white/10 rounded-sm shrink-0 overflow-hidden group/map">

                          {/* Central Axis Lines */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          </div>
                          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none" />

                          {/* Minimal axis labels */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 font-mono text-[8px] text-gray-400 z-10">
                            {data.validation.marketGap?.yAxis.high}
                          </div>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[8px] text-gray-400 z-10">
                            {data.validation.marketGap?.yAxis.low}
                          </div>
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[8px] text-gray-400 z-10">
                            {data.validation.marketGap?.xAxis.low}
                          </div>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[8px] text-gray-400 z-10">
                            {data.validation.marketGap?.xAxis.high}
                          </div>

                          {/* Competitor dots */}
                          {data.validation.competitorList.map((comp: any, i: number) => (
                            <motion.div
                              key={comp.name}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                              className="absolute group/dot cursor-pointer"
                              style={{
                                left: `${comp.x}%`,
                                bottom: `${comp.y}%`,
                                transform: 'translate(-50%, 50%)'
                              }}
                              onClick={() => setCompetitorIndex(i)}
                            >
                              {competitorIndex === i ? (
                                <div className="w-4 h-4 rounded-full bg-velocity-red border-2 border-white shadow-[0_0_20px_rgba(255,31,31,0.8)] relative z-20 flex items-center justify-center">
                                  <div className="w-1 h-1 bg-white rounded-full" />
                                </div>
                              ) : (
                                <div className="w-3 h-3 rounded-full border-2 transition-all duration-300 shadow-lg bg-gray-900 border-gray-600 hover:bg-gray-800 hover:border-gray-400 z-10" />
                              )}

                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded text-[9px] font-mono text-white whitespace-nowrap opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
                                <div className="font-bold">{comp.name}</div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900/95" />
                              </div>
                            </motion.div>
                          ))}

                          {/* Your position - simplified */}
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8, type: "spring" }}
                            className="absolute z-20"
                            style={{
                              left: `${data.validation.marketGap?.yourPosition.x}%`,
                              bottom: `${data.validation.marketGap?.yourPosition.y}%`,
                              transform: 'translate(-50%, 50%)'
                            }}
                          >
                            <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                          </motion.div>
                        </div>

                        {/* Competitor Info - Streamlined */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={competitorIndex}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-velocity-red" />
                              <span className="font-sans font-bold text-white text-sm">{data.validation.competitorList[competitorIndex].name}</span>
                            </div>
                            <p className="font-mono text-[10px] text-gray-300 leading-relaxed pl-4">
                              <span className="text-gray-400">Weakness:</span> {data.validation.competitorList[competitorIndex].weakness}
                            </p>
                          </motion.div>
                        </AnimatePresence>

                        {/* Your Opportunity - Clean */}
                        <div className="mt-auto pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-mono text-[9px] text-emerald-400 uppercase tracking-widest">Your Gap</span>
                          </div>
                          <p className="font-sans text-xs text-white leading-relaxed pl-4">
                            {data.validation.marketGap?.yourGap}
                          </p>
                        </div>

                        {/* Source Reference Indicator */}
                        <div className="mt-3 flex items-center justify-end gap-1.5 group/srcref cursor-default">
                          <span className="font-mono text-[8px] text-gray-400 group-hover/srcref:text-blue-400 transition-colors">See sources</span>
                          <div className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover/srcref:bg-blue-500/20 group-hover/srcref:border-blue-500/50 transition-all">
                            <span className="font-mono text-[8px] text-blue-400 font-bold">2</span>
                          </div>
                        </div>
                      </div>
                    </Widget>

                    {/* Bottom Right: Biggest Risk */}
                    <Widget
                      title="THE BIGGEST RISK"
                      icon={AlertTriangle}
                      delay={0.4}
                      className="h-full min-h-[380px]"
                      visible={showResults}
                      action={
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setRiskIndex((prev) => (prev - 1 + data.validation.riskAnalysis.length) % data.validation.riskAnalysis.length)}
                            className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-[9px] text-gray-400 tabular-nums px-1 select-none">
                            {riskIndex + 1}/{data.validation.riskAnalysis.length}
                          </span>
                          <button
                            onClick={() => setRiskIndex((prev) => (prev + 1) % data.validation.riskAnalysis.length)}
                            className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      }
                    >
                      <div className="flex flex-col gap-2 h-full justify-center">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={riskIndex}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-2"
                          >
                            <div>
                              <p className="font-mono text-[9px] text-velocity-red mb-0.5 uppercase tracking-widest">The Risk:</p>
                              <p className="font-sans text-white text-xs leading-relaxed line-clamp-2">{data.validation.riskAnalysis[riskIndex].risk}</p>
                            </div>
                            <div>
                              <p className="font-mono text-[9px] text-blue-400 mb-0.5 uppercase tracking-widest">Product Feature:</p>
                              <p className="font-sans text-gray-300 text-xs leading-relaxed line-clamp-2">
                                {data.validation.riskAnalysis[riskIndex].productFeature || "Regenerate to see feature"}
                              </p>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </Widget>
                  </div>
                </div>

                {/* Right Column: Brand & Strategy */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                  <Widget title="Potential Customer Segments" icon={Users} delay={0.3} visible={showResults} className="h-fit">
                    <div className="space-y-4">
                      {data.customerSegments.map((segment: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="bg-white/5 border border-white/5 p-2 rounded-sm hover:border-velocity-red/30 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-sans font-bold text-white text-xs">{segment.segment}</span>
                            <span className="font-mono text-[9px] text-gray-300 border border-white/10 px-1 rounded bg-black/20">{segment.age}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[9px] text-gray-300 font-mono">
                              <span className="text-velocity-red">Target:</span> {segment.interest}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-gray-300 font-mono">
                              <span className="text-blue-400">Income:</span> {segment.income}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Widget>

                  <Widget title="Distribution Channels" icon={MessageCircle} delay={0.7} visible={showResults} className="h-fit min-h-[220px]">
                    <div className="flex flex-col gap-3 h-full">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[9px] text-gray-300 uppercase tracking-widest">
                          Where Your Users Hang Out
                        </p>
                        <div className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-gray-300">TOP 5</div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {data.distributionChannels.map((channel: any, i: number) => (
                          <motion.a
                            href={`https://google.com/search?q=${encodeURIComponent(channel.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + i * 0.1 }}
                            className="flex items-center justify-between p-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-velocity-red/30 transition-all group/channel rounded-sm cursor-pointer relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-velocity-red/5 translate-x-[-100%] group-hover/channel:translate-x-0 transition-transform duration-500 ease-out" />

                            <div className="flex items-center gap-2.5 relative z-10">
                              <div className="w-1.5 h-1.5 rounded-full bg-velocity-red group-hover/channel:scale-150 transition-transform duration-300" />
                              <span className="font-sans text-xs text-gray-200 font-medium group-hover/channel:text-white transition-colors">{channel.name}</span>
                            </div>

                            <div className="flex items-center gap-2 relative z-10">
                              <span className="font-mono text-[8px] text-gray-400 border border-white/5 px-1.5 py-0.5 rounded uppercase bg-black/20 group-hover/channel:border-white/10 transition-colors">{channel.type}</span>
                              <span className="font-mono text-[9px] text-velocity-red font-bold">{channel.members}</span>
                            </div>
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  </Widget>

                  <Widget
                    title="Prompt Chain"
                    icon={Terminal}
                    delay={0.8}
                    className="flex-1 min-h-[400px]"
                    visible={showResults}
                    action={
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPromptChainIndex((prev) => (prev - 1 + data.promptChain.length) % data.promptChain.length)}
                          className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-[9px] text-gray-400 tabular-nums px-1 select-none">
                          {promptChainIndex + 1}/{data.promptChain.length}
                        </span>
                        <button
                          onClick={() => setPromptChainIndex((prev) => (prev + 1) % data.promptChain.length)}
                          className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    }
                  >
                    <div className="flex flex-col h-full min-h-0">
                      <div className="flex-1 relative min-h-0">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={promptChainIndex}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex flex-col gap-3"
                          >
                            {/* Step Header */}
                            <div className="shrink-0">
                              <p className="font-mono text-[10px] text-gray-300 mb-1 uppercase tracking-widest">Step {data.promptChain[promptChainIndex].step}</p>
                              <p className="font-sans font-bold text-white text-sm">{data.promptChain[promptChainIndex].title}</p>
                            </div>

                            {/* Prompt content */}
                            <div className="relative group/prompt flex-1 min-h-0">
                              <div
                                className="p-3 bg-white/[0.02] border border-white/10 font-mono text-[10px] text-gray-300 h-full overflow-y-auto leading-relaxed cursor-pointer hover:border-velocity-red/30 hover:bg-white/[0.03] transition-all duration-300"
                                onClick={() => {
                                  navigator.clipboard.writeText(data.promptChain[promptChainIndex].prompt);
                                }}
                              >
                                {data.promptChain[promptChainIndex].prompt}
                              </div>
                              <div className="absolute top-2 right-2 opacity-0 group-hover/prompt:opacity-100 transition-opacity pointer-events-none">
                                <div className="flex items-center gap-1 bg-velocity-red px-2 py-1 text-[8px] font-mono text-white uppercase tracking-wider">
                                  <Copy className="w-2.5 h-2.5" /> Copy
                                </div>
                              </div>
                            </div>

                            {/* Progress Steps */}
                            <div className="shrink-0 flex items-center justify-between gap-1 pt-2 border-t border-white/5">
                              {data.promptChain.map((step: any, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => setPromptChainIndex(i)}
                                  className={`flex-1 h-1 transition-all duration-300 ${i === promptChainIndex
                                    ? 'bg-velocity-red'
                                    : i < promptChainIndex
                                      ? 'bg-velocity-red/40'
                                      : 'bg-white/10'
                                    }`}
                                />
                              ))}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* CTA */}
                      <div className="pt-3 shrink-0">
                        <a
                          href="https://www.lsesu.com/communities/societies/group/Velocity/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-velocity-red/20 border border-velocity-red/50 text-white font-mono text-[9px] uppercase tracking-widest hover:bg-velocity-red hover:border-velocity-red hover:shadow-[0_0_20px_rgba(255,31,31,0.3)] transition-all duration-300 text-center flex items-center justify-center gap-2"
                        >
                          Need help building? Join Velocity <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </Widget>
                </div>

                {/* Sources Widget - Bottom */}
                <div className="lg:col-span-12 mt-4">
                  <Widget
                    title="Data Sources"
                    icon={BookOpen}
                    delay={0.9}
                    className="h-fit"
                    visible={showResults}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Market Data Sources */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                            <span className="font-mono text-[8px] text-blue-400 font-bold">1</span>
                          </div>
                          <span className="font-mono text-[10px] text-white uppercase tracking-widest">Market Data</span>
                        </div>
                        <div className="pl-6 space-y-2">
                          {data.sources?.market?.map((source: { name: string; url: string }, i: number) => (
                            <motion.a
                              key={i}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1 + i * 0.1 }}
                              className="flex items-center gap-2 text-[10px] font-mono text-gray-400 hover:text-blue-400 transition-colors group/source"
                            >
                              <ExternalLink className="w-3 h-3 text-gray-500 group-hover/source:text-blue-400 transition-colors shrink-0" />
                              <span className="truncate">{source.name}</span>
                            </motion.a>
                          ))}
                        </div>
                      </div>

                      {/* Competitor Analysis Sources */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                            <span className="font-mono text-[8px] text-blue-400 font-bold">2</span>
                          </div>
                          <span className="font-mono text-[10px] text-white uppercase tracking-widest">Competitive Analysis</span>
                        </div>
                        <div className="pl-6 space-y-2">
                          {data.sources?.competitors?.map((source: { name: string; url: string }, i: number) => (
                            <motion.a
                              key={i}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.1 + i * 0.1 }}
                              className="flex items-center gap-2 text-[10px] font-mono text-gray-400 hover:text-blue-400 transition-colors group/source"
                            >
                              <ExternalLink className="w-3 h-3 text-gray-500 group-hover/source:text-blue-400 transition-colors shrink-0" />
                              <span className="truncate">{source.name}</span>
                            </motion.a>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI Disclaimer */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[7px] text-amber-400">!</span>
                      </div>
                      <p className="font-mono text-[9px] text-gray-400 leading-relaxed">
                        Data sourced from public databases and industry reports. In the future, sources will be dynamically fetched via Gemini AI for real-time accuracy.
                      </p>
                    </div>
                  </Widget>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
