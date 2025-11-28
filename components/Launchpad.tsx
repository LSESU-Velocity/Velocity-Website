import React, { useState, useEffect } from 'react';
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
    domain: "velocity.app",
    stack: ["Next.js", "Supabase", "OpenAI", "Vercel"],
    interface: "Dashboard with real-time analytics",
    monetization: {
      model: "Freemium Model",
      pricing: "Free tier available",
      strategies: ["Premium Analytics", "Team Seats", "Enterprise API"]
    },
    market: {
      tam: { value: "15M", label: "UK Startup Founders" },
      sam: { value: "1.2M", label: "London Tech Workers" },
      som: { value: "~5,000", label: "LSE Students & Staff" }
    }
  };

  if (lowercaseIdea.includes("gym") || lowercaseIdea.includes("fitness") || lowercaseIdea.includes("workout")) {
    data = {
      name: "GymSync",
      tagline: "Find your perfect spotter.",
      colors: ["#FF1F1F", "#0A0A0A", "#FFFFFF", "#333333"],
      domain: "gymsync.app",
      stack: ["FlutterFlow", "Supabase", "OpenAI API", "Stripe"],
      interface: "Swipe-based matchmaking",
      monetization: {
        model: "Subscription",
        pricing: "£4.99/mo Premium",
        strategies: ["Advanced Filters", "Unlimited Swipes", "Gym Partnerships"]
      },
      market: {
        tam: { value: "10M", label: "UK Gym Members" },
        sam: { value: "850K", label: "London Gym-Goers" },
        som: { value: "~5,000", label: "LSE Students & Staff" }
      }
    };
  } else if (lowercaseIdea.includes("cat") || lowercaseIdea.includes("pet") || lowercaseIdea.includes("dog")) {
    data = {
      name: "PetPals",
      tagline: "Connect with furry friends nearby.",
      colors: ["#FF9F1C", "#0A0A0A", "#FFFFFF", "#2EC4B6"],
      domain: "petpals.io",
      stack: ["React Native", "Firebase", "Cloudinary", "Stripe"],
      interface: "Location-based feed",
      monetization: {
        model: "Marketplace",
        pricing: "5% Service Fee",
        strategies: ["Featured Listings", "Pet Service Booking", "Premium Profiles"]
      },
      market: {
        tam: { value: "2.4M", label: "UK Pet Owners" },
        sam: { value: "300K", label: "London Dog Owners" },
        som: { value: "~5,000", label: "LSE Students & Staff" }
      }
    };
  } else if (lowercaseIdea.includes("study") || lowercaseIdea.includes("student") || lowercaseIdea.includes("university")) {
    data = {
      name: "StudySphere",
      tagline: "Ace your exams together.",
      colors: ["#4361EE", "#0A0A0A", "#FFFFFF", "#F72585"],
      domain: "studysphere.edu",
      stack: ["Next.js", "Prisma", "OpenAI", "Vercel"],
      interface: "Collaborative workspace",
      monetization: {
        model: "Freemium",
        pricing: "Free for Students",
        strategies: ["University Licensing", "Tutor Marketplace", "Study Material Sales"]
      },
      market: {
        tam: { value: "2.8M", label: "UK University Students" },
        sam: { value: "400K", label: "London Students" },
        som: { value: "~12,000", label: "LSE Students" }
      }
    };
  } else if (lowercaseIdea.includes("food") || lowercaseIdea.includes("restaurant") || lowercaseIdea.includes("cook")) {
    data = {
      name: "Tastify",
      tagline: "Discover your next craving.",
      colors: ["#E63946", "#0A0A0A", "#FFFFFF", "#F4A261"],
      domain: "tastify.app",
      stack: ["React", "Node.js", "MongoDB", "Stripe"],
      interface: "Visual menu browser",
      monetization: {
        model: "Commission",
        pricing: "10% per Order",
        strategies: ["Sponsored Dishes", "Restaurant Analytics", "Delivery Integration"]
      },
      market: {
        tam: { value: "45M", label: "UK Food Delivery Users" },
        sam: { value: "3.5M", label: "London Foodies" },
        som: { value: "~5,000", label: "LSE Students & Staff" }
      }
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
          appInterface: data.interface
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
          competitorList: [
            { name: "Incumbent", usp: "Established user base" },
            { name: "Startup A", usp: "Cheaper pricing" },
            { name: "Startup B", usp: "Better UI" }
          ],
          riskiestAssumption: "Users will adopt within first week.",
          growthData: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 45 },
            { name: 'W3', users: 120 },
            { name: 'W4', users: 350 },
            { name: 'W5', users: 890 },
            { name: 'W6', users: 1400 },
          ]
        },
        systemPrompt: `Act as a Senior React Native developer. Set up a project structure for '${data.name}' using Expo and Firebase. Include a 'MapScreen' component with integrated Google Maps API and user authentication via Firebase. Focus on clean, modular code.`
      });
    }, 2500);
  });
};

// Widget with spotlight effect matching Features.tsx
const Widget = ({ title, icon: Icon, children, delay = 0, className = "" }: any) => {
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
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white/5 border border-white/10 group-hover:border-velocity-red/50 group-hover:bg-velocity-red/10 transition-colors duration-300">
            <Icon className="w-3.5 h-3.5 text-gray-300 group-hover:text-velocity-red transition-colors duration-300" />
          </div>
          <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{title}</span>
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
  const [loadingStep, setLoadingStep] = useState(0);

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
                <div className="lg:col-span-3 flex flex-col h-full">
                  <Widget title="App Mockup" icon={Smartphone} delay={0.1} className="h-full">
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
                                 <span className="font-sans font-bold text-white text-sm">{data.identity.name}</span>
                                 <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${data.identity.name}`} alt="User" className="w-full h-full" />
                                 </div>
                              </div>

                              {/* Search Bar */}
                              <div className="px-4 mb-4">
                                 <div className="w-full h-8 bg-white/5 rounded-full flex items-center px-3 border border-white/10">
                                    <div className="w-3 h-3 rounded-full border border-white/30 mr-2"></div>
                                    <div className="w-20 h-2 bg-white/10 rounded"></div>
                                 </div>
                              </div>

                              {/* Map/Content Mock */}
                              <div className="flex-1 relative overflow-hidden bg-white/5 mx-4 mb-4 rounded-2xl border border-white/5">
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
                              </div>

                              {/* Bottom Nav */}
                              <div className="h-12 border-t border-white/5 flex items-center justify-around px-2">
                                 <div className="w-6 h-6 bg-white/10 rounded-full"></div>
                                 <div className="w-6 h-6 rounded-full border border-white/20"></div>
                                 <div className="w-6 h-6 rounded-full border border-white/20"></div>
                              </div>
                              
                              {/* Home Indicator */}
                              <div className="h-4 w-full flex justify-center items-start">
                                 <div className="w-1/3 h-1 bg-white/20 rounded-full"></div>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Monetization Section */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                         <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-white/5 border border-white/10">
                               <Coins className="w-3.5 h-3.5 text-gray-300" />
                            </div>
                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Monetization Strategy</span>
                         </div>
                         
                         <div className="space-y-3">
                            <div>
                               <p className="font-mono text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Model</p>
                               <p className="font-sans font-bold text-white text-sm">{data.monetization.model}</p>
                               <p className="font-mono text-velocity-red text-xs mt-0.5">{data.monetization.pricing}</p>
                            </div>
                            <div className="space-y-1">
                               {data.monetization.strategies.map((strat: string, i: number) => (
                                  <div key={i} className="flex items-center gap-2">
                                     <div className="w-1 h-1 bg-velocity-red rounded-full"></div>
                                     <span className="text-xs text-gray-300">{strat}</span>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                    </div>
                  </Widget>
                </div>

                {/* Center Column: Analysis */}
                <div className="lg:col-span-6 flex flex-col gap-4">
                   {/* Header moved here */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-center py-2"
                    >
                      <div className="inline-flex items-center gap-2 text-velocity-red mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-mono text-[10px] uppercase tracking-widest">Analysis Complete</span>
                      </div>
                      <h2 className="font-sans font-bold text-3xl md:text-4xl tracking-tight text-white mb-1">{data.identity.name}</h2>
                      <p className="font-mono text-gray-500 text-xs italic">{data.identity.tagline}</p>
                    </motion.div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                      <div className="flex flex-col gap-4">
                        <Widget title="Market Signals" icon={TrendingUp} delay={0.2}>
                          <div className="flex flex-col h-full justify-between py-1 space-y-2">
                            <div className="flex items-baseline justify-between">
                              <div>
                                <p className="font-mono text-[9px] text-gray-500 uppercase tracking-wider">TAM <span className="normal-case text-gray-600">(Total Market)</span></p>
                                <p className="font-sans font-bold text-lg text-white leading-tight">{data.validation.tam.value}</p>
                              </div>
                              <p className="font-mono text-[8px] text-gray-400 text-right max-w-[55%]">{data.validation.tam.label}</p>
                            </div>
                            <div className="flex items-baseline justify-between">
                              <div>
                                <p className="font-mono text-[9px] text-gray-500 uppercase tracking-wider">SAM <span className="normal-case text-gray-600">(Serviceable)</span></p>
                                <p className="font-sans font-bold text-lg text-white leading-tight">{data.validation.sam.value}</p>
                              </div>
                              <p className="font-mono text-[8px] text-gray-400 text-right max-w-[55%]">{data.validation.sam.label}</p>
                            </div>
                            <div className="flex items-baseline justify-between">
                              <div>
                                <p className="font-mono text-[9px] text-velocity-red uppercase tracking-wider">SOM <span className="normal-case text-velocity-red/70">(Your Target)</span></p>
                                <p className="font-sans font-bold text-lg text-velocity-red leading-tight">{data.validation.som.value}</p>
                              </div>
                              <p className="font-mono text-[8px] text-gray-400 text-right max-w-[55%]">{data.validation.som.label}</p>
                            </div>
                          </div>
                        </Widget>
                        
                        <Widget title="Real Competitors" icon={Target} delay={0.3}>
                          <div className="flex flex-col h-full justify-between py-1">
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-[10px] text-gray-500 cursor-pointer hover:text-white transition-colors flex items-center gap-1">
                                  <ChevronLeft className="w-3 h-3" /> (1/3) <ChevronRight className="w-3 h-3" />
                               </span>
                            </div>
                            <div>
                               <p className="font-sans font-bold text-white text-sm mb-1">Competitor 1: USP</p>
                               <p className="font-mono text-[10px] text-gray-400 leading-relaxed">Details...</p>
                            </div>
                          </div>
                        </Widget>
                      </div>

                      <Widget title="Search Volume" icon={BarChart3} delay={0.2} className="h-full">
                         <div className="h-full w-full flex flex-col min-h-[140px]">
                           <p className="font-mono text-[10px] text-gray-500 mb-2 leading-relaxed">
                             for "{data.identity.name === 'PetPals' ? 'Pet Clinics' : data.identity.name}":<br/>
                             <span className="text-white">High trending</span>
                           </p>
                           <div className="flex-1">
                              <ResponsiveContainer width="100%" height="100%">
                                 <AreaChart data={data.validation.growthData}>
                                    <defs>
                                       <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
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
                                    <Area type="monotone" dataKey="users" stroke="#FF1F1F" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                                 </AreaChart>
                              </ResponsiveContainer>
                           </div>
                         </div>
                      </Widget>

                      <div className="md:col-span-2">
                         <Widget title="The Kill Switch (Risk)" icon={AlertTriangle} delay={0.4}>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                   <p className="font-mono text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Riskiest Assumption:</p>
                                   <p className="font-sans text-white text-xs leading-relaxed">{data.validation.riskiestAssumption}</p>
                                </div>
                                <div>
                                    <p className="font-mono text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Mitigation:</p>
                                    <p className="font-sans text-gray-400 text-xs leading-relaxed">Offer insurance valid only for on-platform bookings.</p>
                                </div>
                             </div>
                         </Widget>
                      </div>
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
                        <p className="font-mono text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Domain</p>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <Globe className="w-3.5 h-3.5 text-velocity-red" />
                             <span className="font-mono text-xs text-white">{data.identity.domain}</span>
                          </div>
                          <span className="font-mono text-[9px] w-fit px-1.5 py-0.5 bg-[#2EC4B6]/10 text-[#2EC4B6] border border-[#2EC4B6]/30 uppercase">AVAILABLE [API CHECKED]</span>
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
                    <div className="border border-white/10 bg-white/[0.02] p-3 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Copy className="w-3 h-3" /> Copy Prompt
                            </span>
                        </div>
                        <div className="relative group/prompt">
                            <div className="p-2 bg-black/40 border border-white/10 font-mono text-[9px] text-gray-400 h-[80px] overflow-y-auto leading-relaxed custom-scrollbar">
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
                           className="w-full py-2 bg-velocity-red text-white font-mono text-[10px] uppercase tracking-widest hover:bg-velocity-red/80 transition-colors text-center"
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
