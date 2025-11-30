import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, Variants } from 'framer-motion';
import { Rocket, CheckCircle2, Cpu, Target, BarChart3, Palette, ArrowRight, Loader2, Zap, TrendingUp, Globe, Smartphone, Coins, Copy, Terminal, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
        technicalRequirement: "Implement feature flags with LaunchDarkly or Flagsmith for tier-based access control."
      },
      {
        model: "Subscription",
        pricing: "$29/mo Starter",
        strategies: ["Recurring Revenue", "Annual Discounts", "Usage-based Tiers"],
        technicalRequirement: "Integrate Stripe Billing with webhooks for subscription lifecycle management."
      },
      {
        model: "One-time Purchase",
        pricing: "$199 Lifetime Deal",
        strategies: ["Quick Cash Injection", "No Recurring Costs", "Early Adopters"],
        technicalRequirement: "Set up Stripe Checkout with license key generation for lifetime access."
      }
    ],
    market: {
      tam: { value: "15M", label: "UK Startup Founders" },
      sam: { value: "1.2M", label: "London Tech Workers" },
      som: { value: "~5,000", label: "LSE Students & Staff" }
    },
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
      { name: "CodeFast", usp: "Large library of templates", weakness: "Generic designs, hard to customize", x: 70, y: 60 },
      { name: "LaunchPad", usp: "One-click deployment", weakness: "Vendor lock-in, expensive scaling", x: 85, y: 75 },
      { name: "DevAssist", usp: "AI code completion", weakness: "Requires senior dev knowledge to debug", x: 60, y: 40 }
    ],
    marketGap: {
      xAxis: { label: "Ease of Use", low: "Complex", high: "Simple" },
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
          technicalRequirement: "Integrate Stripe Billing with in-app purchase support for iOS/Android."
        },
        {
          model: "Ad-Supported",
          pricing: "Free with Ads",
          strategies: ["Supplement Ads", "Local Gym Promos", "Affiliate Links"],
          technicalRequirement: "Implement Google AdMob SDK with mediation for optimal ad fill rates."
        },
        {
          model: "Freemium",
          pricing: "Free Basic / £9.99 Pro",
          strategies: ["Pro Workout Plans", "Verified Badge", "Priority Matching"],
          technicalRequirement: "Build entitlement system with RevenueCat for cross-platform subscription sync."
        }
      ],
      market: {
        tam: { value: "10M", label: "UK Gym Members" },
        sam: { value: "850K", label: "London Gym-Goers" },
        som: { value: "~5,000", label: "LSE Students & Staff" }
      },
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
          technicalRequirement: "Implement Stripe Connect for split payments and platform fees."
        },
        {
          model: "Subscription",
          pricing: "£9.99/mo for Owners",
          strategies: ["Insurance Integration", "Vet Chat Access", "Emergency Support"],
          technicalRequirement: "Set up Stripe Billing with customer portal for self-service management."
        },
        {
          model: "Affiliate",
          pricing: "Product Recommendations",
          strategies: ["Pet Food Partnerships", "Toy Sales", "Grooming Discounts"],
          technicalRequirement: "Build affiliate link tracking with UTM parameters and conversion pixels."
        }
      ],
      market: {
        tam: { value: "2.4M", label: "UK Pet Owners" },
        sam: { value: "300K", label: "London Dog Owners" },
        som: { value: "~5,000", label: "LSE Students & Staff" }
      },
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
          technicalRequirement: "Implement .edu email verification with SSO integration for institutions."
        },
        {
          model: "Tutor Commission",
          pricing: "15% per Session",
          strategies: ["Video Chat Tools", "Scheduling API", "Payment Processing"],
          technicalRequirement: "Implement Stripe Connect for tutor payouts with automatic fee deduction."
        },
        {
          model: "Content Sales",
          pricing: "$5 per Study Guide",
          strategies: ["User Generated Content", "Revenue Share", "Premium Notes"],
          technicalRequirement: "Build digital delivery system with Stripe for instant content unlocking."
        }
      ],
      market: {
        tam: { value: "2.8M", label: "UK University Students" },
        sam: { value: "400K", label: "London Students" },
        som: { value: "~12,000", label: "LSE Students" }
      },
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
          technicalRequirement: "Implement Stripe Connect for restaurant payouts with platform commission."
        },
        {
          model: "Subscription (SaaS)",
          pricing: "£49/mo for Restaurants",
          strategies: ["Menu Management", "CRM Features", "Website Builder"],
          technicalRequirement: "Build multi-tenant architecture with Stripe Billing for B2B subscriptions."
        },
        {
          model: "Consumer Premium",
          pricing: "£7.99/mo for Foodies",
          strategies: ["Exclusive Reservations", "Secret Menu Access", "No Booking Fees"],
          technicalRequirement: "Integrate Stripe with in-app purchases for cross-platform premium access."
        }
      ],
      market: {
        tam: { value: "45M", label: "UK Food Delivery Users" },
        sam: { value: "3.5M", label: "London Foodies" },
        som: { value: "~5,000", label: "LSE Students & Staff" }
      },
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
        strategy: [
          "Launch on university subreddits",
          "Partner with LSE student orgs",
          "Flyer campaign on campus",
          "TikTok viral content strategy"
        ],
        validation: {
          tam: data.market.tam,
          sam: data.market.sam,
          som: data.market.som,
          competitors: 3,
          competitorList: data.competitors,
          riskAnalysis: data.riskAnalysis,
          searchVolume: data.searchVolume,
          growthData: data.searchVolume[0].data,
          marketGap: data.marketGap
        },
        systemPrompt: `Act as a Senior React Native developer. Set up a project structure for '${data.name}' using Expo and Firebase. Include a 'MapScreen' component with integrated Google Maps API and user authentication via Firebase. Focus on clean, modular code.`
      });
    }, 2500);
  });
};

// Widget with spotlight effect matching Features.tsx
const Widget = ({ title, icon: Icon, children, delay = 0, className = "", action }: any) => {
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
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
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
            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{title}</span>
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
  const [loadingStep, setLoadingStep] = useState(0);
  const inputFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
      if (data && !isGenerating) {
        setTimeout(() => {
          const element = inputFormRef.current;
          if (!element) return;

          const start = window.scrollY;
          const elementTop = element.getBoundingClientRect().top;
          const offset = 100; // Position the input form near the top with some padding
          const target = start + elementTop - offset;
          const distance = target - start;
          const duration = 1400; // Slower scroll (1.4s)
          let startTime: number | null = null;

          function animation(currentTime: number) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            
            // Ease in-out cubic for smooth acceleration/deceleration
            const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            
            const progress = ease(Math.min(timeElapsed / duration, 1));
            window.scrollTo(0, start + (distance * progress));

            if (timeElapsed < duration) {
              requestAnimationFrame(animation);
            }
          }

          requestAnimationFrame(animation);
        }, 100);
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
    setCompetitorIndex(0);
    setMonetizationIndex(0);
    setRiskIndex(0);
    setSearchVolumeIndex(0);
    setDomainIndex(0);
    setAppScreenIndex(0);
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
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
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
                    action={
                      <div className="flex items-center gap-1.5">
                         <button 
                           onClick={() => setAppScreenIndex((prev) => (prev - 1 + data.visuals.screens.length) % data.visuals.screens.length)}
                           className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                         >
                           <ChevronLeft className="w-3 h-3" />
                         </button>
                         <span className="font-mono text-[9px] text-gray-500 tabular-nums px-1 select-none">
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
                    action={
                      <div className="flex items-center gap-1.5">
                         <button 
                           onClick={() => setMonetizationIndex((prev) => (prev - 1 + data.monetization.length) % data.monetization.length)}
                           className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                         >
                           <ChevronLeft className="w-3 h-3" />
                         </button>
                         <span className="font-mono text-[9px] text-gray-500 tabular-nums px-1 select-none">
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
                          <p className="font-mono text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Model</p>
                          <p className="font-sans font-bold text-white text-sm">{data.monetization[monetizationIndex].model}</p>
                          <p className="font-mono text-velocity-red text-xs mt-0.5">{data.monetization[monetizationIndex].pricing}</p>
                        </div>
                        <div className="space-y-1 mb-3">
                          {data.monetization[monetizationIndex].strategies.map((strat: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-velocity-red rounded-full"></div>
                              <span className="text-xs text-gray-300">{strat}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-white/5">
                          <p className="font-mono text-[9px] text-blue-400 uppercase tracking-widest mb-1">Technical Requirement</p>
                          <p className="font-mono text-[10px] text-gray-500 leading-relaxed">{data.monetization[monetizationIndex].technicalRequirement}</p>
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
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-center pb-2"
                    >
                      <div className="inline-flex items-center gap-2 text-velocity-red mb-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="font-mono text-[9px] uppercase tracking-widest">Analysis Complete</span>
                      </div>
                      <h2 className="font-sans font-bold text-2xl md:text-3xl tracking-tight text-white mb-0.5">{data.identity.name}</h2>
                      <p className="font-mono text-gray-500 text-[10px] italic">{data.identity.tagline}</p>
                    </motion.div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full grid-rows-[1fr_auto]">
                      {/* Top Left: Market Funnel */}
                      <Widget title="Market Funnel" icon={TrendingUp} delay={0.2} className="h-full min-h-[280px]">
                        <div className="flex flex-col h-full justify-center gap-4 py-2">
                          {/* TAM - Wide Bar */}
                          <div className="w-full bg-[#1A1A1A] border border-white/5 p-3 rounded-sm hover:bg-[#222] transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-[10px] text-gray-500 font-bold">TAM</span>
                                  <span className="text-[9px] text-gray-600 uppercase tracking-wide">Total Market</span>
                                </div>
                                <p className="font-sans font-bold text-2xl text-white leading-none">{data.validation.tam.value}</p>
                              </div>
                              <p className="font-mono text-[9px] text-gray-500 text-right max-w-[50%] leading-tight">{data.validation.tam.label}</p>
                            </div>
                          </div>

                          {/* SAM - Medium Bar */}
                          <div className="w-[85%] mx-auto bg-[#2A2A2A] border border-white/10 p-3 rounded-sm hover:bg-[#333] transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-[10px] text-gray-400 font-bold">SAM</span>
                                  <span className="text-[9px] text-gray-500 uppercase tracking-wide">Serviceable</span>
                                </div>
                                <p className="font-sans font-bold text-2xl text-gray-100 leading-none">{data.validation.sam.value}</p>
                              </div>
                              <p className="font-mono text-[9px] text-gray-400 text-right max-w-[50%] leading-tight">{data.validation.sam.label}</p>
                            </div>
                          </div>

                          {/* SOM - Narrow Bar */}
                          <div className="w-[70%] mx-auto bg-velocity-red shadow-[0_4px_20px_rgba(255,31,31,0.2)] border border-red-500 p-3 rounded-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-[10px] text-white font-bold">SOM</span>
                                  <span className="text-[9px] text-white/70 uppercase tracking-wide">Target</span>
                                </div>
                                <p className="font-sans font-bold text-2xl text-white leading-none">{data.validation.som.value}</p>
                              </div>
                              <p className="font-mono text-[9px] text-white/90 text-right max-w-[50%] leading-tight">{data.validation.som.label}</p>
                            </div>
                          </div>
                        </div>
                      </Widget>

                      {/* Top Right: Search Volume */}
                      <Widget 
                        title="Search Volume" 
                        icon={BarChart3} 
                        delay={0.2} 
                        className="h-full min-h-[280px]"
                        action={
                          <div className="flex items-center gap-1.5">
                             <button 
                               onClick={() => setSearchVolumeIndex((prev) => (prev - 1 + data.validation.searchVolume.length) % data.validation.searchVolume.length)}
                               className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                             >
                               <ChevronLeft className="w-3 h-3" />
                             </button>
                             <span className="font-mono text-[9px] text-gray-500 tabular-nums px-1 select-none">
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
                         <div className="h-full w-full flex flex-col min-h-[140px]">
                           <AnimatePresence mode="wait">
                             <motion.div
                                key={searchVolumeIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col h-full"
                             >
                               <p className="font-mono text-[10px] text-gray-500 mb-2 leading-relaxed">
                                 for "{data.validation.searchVolume[searchVolumeIndex].keyword}":<br/>
                                 <span className="text-white">High trending</span>
                               </p>
                               <div className="flex-1">
                                  <ResponsiveContainer width="100%" height="100%">
                                     <AreaChart data={data.validation.searchVolume[searchVolumeIndex].data}>
                                        <defs>
                                           <linearGradient id={`colorUsers-${searchVolumeIndex}`} x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#FF1F1F" stopOpacity={0.3}/>
                                              <stop offset="100%" stopColor="#FF1F1F" stopOpacity={0}/>
                                           </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" hide />
                                        <YAxis hide />
                                        <Tooltip 
                                           contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#333', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                                           itemStyle={{ color: '#FF1F1F' }}
                                           cursor={{ stroke: '#333', strokeWidth: 1 }}
                                        />
                                        <Area 
                                          type="monotone" 
                                          dataKey="users" 
                                          stroke="#FF1F1F" 
                                          strokeWidth={2} 
                                          fillOpacity={1} 
                                          fill={`url(#colorUsers-${searchVolumeIndex})`} 
                                        />
                                     </AreaChart>
                                  </ResponsiveContainer>
                               </div>
                             </motion.div>
                           </AnimatePresence>
                         </div>
                      </Widget>
                        
                      {/* Bottom Left: Competitors with Perceptual Map */}
                      <Widget 
                        title="Market Gap & Opportunities" 
                        icon={Target} 
                        delay={0.3}
                        className="h-[540px]"
                      >
                        <div className="flex flex-col h-full py-1 gap-2">
                          
                          {/* Perceptual Map Section */}
                          <div className="relative w-full h-48 bg-black/20 border border-white/10 rounded-sm mb-1 shrink-0">
                              
                              {/* Quadrant Backgrounds */}
                              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                                <div className="bg-white/[0.01] border-r border-b border-white/5" />
                                <div className="border-b border-white/5" />
                                <div className="border-r border-white/5" />
                                <div className="bg-white/[0.01]" />
                              </div>

                              {/* Central Axis Lines */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-full h-px bg-white/20 relative">
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 border-t border-r border-white/20 rotate-45 transform origin-center" />
                                </div>
                                <div className="h-full w-px bg-white/20 absolute left-1/2 top-0 -translate-x-1/2">
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 border-t border-l border-white/20 rotate-45 transform origin-center" />
                                </div>
                              </div>
                              
                              {/* Axis Labels */}
                              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded">
                                  {data.validation.marketGap?.xAxis.label}
                                </span>
                              </div>
                              
                              <div className="absolute bottom-1 left-2 font-mono text-[8px] text-gray-600 flex items-center gap-1">
                                <ChevronLeft className="w-2 h-2" /> {data.validation.marketGap?.xAxis.low}
                              </div>
                              <div className="absolute bottom-1 right-2 font-mono text-[8px] text-gray-600 flex items-center gap-1">
                                {data.validation.marketGap?.xAxis.high} <ChevronRight className="w-2 h-2" />
                              </div>

                              <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 flex items-center justify-center">
                                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded whitespace-nowrap">
                                  {data.validation.marketGap?.yAxis.label}
                                </span>
                              </div>

                              <div className="absolute top-1 left-1/2 ml-2 font-mono text-[8px] text-gray-600">
                                High
                              </div>
                              <div className="absolute bottom-1 left-1/2 ml-2 font-mono text-[8px] text-gray-600">
                                Low
                              </div>
                              
                              {/* Competitor dots */}
                              {data.validation.competitorList.map((comp: any, i: number) => (
                                <motion.div
                                  key={comp.name}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                                  className="absolute group/dot cursor-help"
                                  style={{
                                    left: `${comp.x}%`,
                                    bottom: `${comp.y}%`,
                                    transform: 'translate(-50%, 50%)'
                                  }}
                                  onMouseEnter={() => setCompetitorIndex(i)}
                                >
                                  <div className={`w-3 h-3 rounded-full border-2 transition-all duration-200 shadow-lg ${competitorIndex === i ? 'bg-white border-white scale-125 z-20 shadow-white/30' : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500 z-10'}`} />
                                  
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900/95 border border-white/10 rounded text-[9px] font-mono text-white whitespace-nowrap opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
                                    <div className="font-bold mb-0.5">{comp.name}</div>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900/95" />
                                  </div>
                                </motion.div>
                              ))}
                              
                              {/* Your opportunity position */}
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.8, type: "spring" }}
                                className="absolute group/gap cursor-help z-20"
                                style={{
                                  left: `${data.validation.marketGap?.yourPosition.x}%`,
                                  bottom: `${data.validation.marketGap?.yourPosition.y}%`,
                                  transform: 'translate(-50%, 50%)'
                                }}
                              >
                                <div className="absolute inset-0 w-full h-full rounded-full bg-emerald-500/30 animate-ping" />
                                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_15px_rgba(16,185,129,0.6)] relative z-10" />
                                
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-emerald-500 border border-white/20 rounded text-[9px] font-mono text-white whitespace-nowrap opacity-0 group-hover/gap:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
                                  <div className="font-bold">YOUR GAP</div>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-emerald-500" />
                                </div>
                              </motion.div>
                          </div>

                          {/* Competitor List */}
                          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
                             {data.validation.competitorList.map((comp: any, i: number) => (
                               <div 
                                  key={i}
                                  className={`p-2.5 rounded-sm border transition-all duration-200 cursor-pointer ${competitorIndex === i ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'}`}
                                  onClick={() => setCompetitorIndex(i)}
                                  onMouseEnter={() => setCompetitorIndex(i)}
                               >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`font-sans text-sm ${competitorIndex === i ? 'font-bold text-white' : 'font-medium text-gray-400'}`}>{comp.name}</span>
                                    <div className={`w-3 h-3 rounded-full border ${competitorIndex === i ? 'bg-white border-white' : 'bg-gray-800 border-gray-600'}`} />
                                  </div>
                                  <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10px]">
                                     <span className="text-gray-500 font-mono uppercase">USP</span>
                                     <span className="text-gray-300 leading-tight">{comp.usp}</span>
                                     <span className="text-gray-500 font-mono uppercase">Weakness</span>
                                     <span className="text-gray-400 leading-tight">{comp.weakness}</span>
                                  </div>
                               </div>
                             ))}
                          </div>

                          {/* Identified Opportunity - Green Theme */}
                          <div className="mt-auto p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-sm relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 animate-pulse" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="font-mono text-[9px] text-emerald-500 uppercase tracking-widest">Identified Opportunity</p>
                              <p className="font-sans text-xs text-emerald-100/90 leading-relaxed">
                                "{data.validation.marketGap?.yourGap}"
                              </p>
                            </div>
                          </div>
                        </div>
                      </Widget>

                      {/* Bottom Right: Biggest Risk */}
                      <Widget 
                        title="THE BIGGEST RISK" 
                        icon={AlertTriangle} 
                        delay={0.4}
                        className="h-64"
                        action={
                          <div className="flex items-center gap-1.5">
                             <button 
                               onClick={() => setRiskIndex((prev) => (prev - 1 + data.validation.riskAnalysis.length) % data.validation.riskAnalysis.length)}
                               className="w-5 h-5 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                             >
                               <ChevronLeft className="w-3 h-3" />
                             </button>
                             <span className="font-mono text-[9px] text-gray-500 tabular-nums px-1 select-none">
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
                                    <p className="font-sans text-gray-400 text-xs leading-relaxed line-clamp-2">
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
                  <Widget title="Brand Identity" icon={Palette} delay={0.3}>
                    <div className="space-y-3">
                      <div>
                        <p className="font-mono text-[10px] text-gray-500 mb-2 uppercase tracking-widest">Color Palette</p>
                        <div className="flex gap-2">
                          {data.identity.colors.map((color: string, i: number) => (
                            <motion.div 
                              key={i} 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                              className="w-8 h-8 border border-white/10" 
                              style={{ backgroundColor: color }} 
                            />
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Domain</p>
                          <div className="flex items-center gap-1">
                             <button 
                               onClick={() => setDomainIndex((prev) => (prev - 1 + data.identity.domain.length) % data.identity.domain.length)}
                               className="w-4 h-4 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                             >
                               <ChevronLeft className="w-2.5 h-2.5" />
                             </button>
                             <button 
                               onClick={() => setDomainIndex((prev) => (prev + 1) % data.identity.domain.length)}
                               className="w-4 h-4 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 hover:bg-velocity-red hover:border-velocity-red text-gray-500 hover:text-white transition-all duration-300 group/btn"
                             >
                               <ChevronRight className="w-2.5 h-2.5" />
                             </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={domainIndex}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                 <Globe className="w-3.5 h-3.5 text-velocity-red" />
                                 <span className="font-mono text-xs text-white">{data.identity.domain[domainIndex]}</span>
                              </div>
                              <span className="font-mono text-[9px] w-fit px-1.5 py-0.5 bg-[#2EC4B6]/10 text-[#2EC4B6] border border-[#2EC4B6]/30 uppercase">AVAILABLE [API CHECKED]</span>
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </Widget>

                  <Widget title="Day 1 Playbook" icon={Zap} delay={0.7}>
                    <div className="space-y-2">
                      {data.strategy.map((step: string, i: number) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + i * 0.1 }}
                          className="flex items-start gap-2 group/item"
                        >
                          <div className="w-4 h-4 bg-velocity-red/10 border border-velocity-red/30 text-velocity-red flex items-center justify-center font-mono text-[9px] font-bold shrink-0 group-hover/item:bg-velocity-red/20 transition-colors">
                            {i + 1}
                          </div>
                          <p className="font-mono text-[10px] text-gray-400 group-hover/item:text-gray-300 transition-colors leading-relaxed">{step}</p>
                        </motion.div>
                      ))}
                    </div>
                  </Widget>

                  <div className="mt-auto">
                    <div className="border border-white/10 bg-white/[0.02] p-3 flex flex-col gap-3 h-64">
                        <div className="flex items-center justify-between shrink-0">
                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Copy className="w-3 h-3" /> Copy Prompt
                            </span>
                        </div>
                        <div className="relative group/prompt flex-1 min-h-0">
                            <div className="p-2 bg-black/40 border border-white/10 font-mono text-[9px] text-gray-400 h-full overflow-y-auto leading-relaxed custom-scrollbar">
                                <span className="text-velocity-red">&gt; SYSTEM PROMPT:</span><br/>
                                {data.systemPrompt}
                            </div>
                            <div className="absolute top-1 right-1 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
                                <Copy className="w-3 h-3 text-white cursor-pointer" />
                            </div>
                        </div>
                        <a 
                           href="https://www.lsesu.com/communities/societies/group/Velocity/"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="w-full py-2 bg-velocity-red text-white font-mono text-[10px] uppercase tracking-widest hover:bg-velocity-red/80 transition-colors text-center shrink-0"
                        >
                           DON'T KNOW HOW TO USE THIS? JOIN VELOCITY NOW.
                        </a>
                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
