import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Rocket, CheckCircle2, Cpu, Target, BarChart3, Palette, ArrowRight, Loader2, Zap, TrendingUp, Globe, Sparkles } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Mock data generator
const generateStartupData = (idea: string) => {
  const lowercaseIdea = idea.toLowerCase();
  let data = {
    name: "VelocityApp",
    tagline: "Build faster.",
    colors: ["#FF1F1F", "#0A0A0A", "#FFFFFF", "#333333"],
    domain: "velocity.app",
    stack: ["Next.js", "Supabase", "OpenAI", "Vercel"],
    interface: "Dashboard with real-time analytics"
  };

  if (lowercaseIdea.includes("gym") || lowercaseIdea.includes("fitness") || lowercaseIdea.includes("workout")) {
    data = {
      name: "GymSync",
      tagline: "Find your perfect spotter.",
      colors: ["#FF1F1F", "#0A0A0A", "#FFFFFF", "#333333"],
      domain: "gymsync.app",
      stack: ["FlutterFlow", "Supabase", "OpenAI API", "Stripe"],
      interface: "Swipe-based matchmaking"
    };
  } else if (lowercaseIdea.includes("cat") || lowercaseIdea.includes("pet") || lowercaseIdea.includes("dog")) {
    data = {
      name: "PetPals",
      tagline: "Connect with furry friends nearby.",
      colors: ["#FF9F1C", "#0A0A0A", "#FFFFFF", "#2EC4B6"],
      domain: "petpals.io",
      stack: ["React Native", "Firebase", "Cloudinary", "Stripe"],
      interface: "Location-based feed"
    };
  } else if (lowercaseIdea.includes("study") || lowercaseIdea.includes("student") || lowercaseIdea.includes("university")) {
    data = {
      name: "StudySphere",
      tagline: "Ace your exams together.",
      colors: ["#4361EE", "#0A0A0A", "#FFFFFF", "#F72585"],
      domain: "studysphere.edu",
      stack: ["Next.js", "Prisma", "OpenAI", "Vercel"],
      interface: "Collaborative workspace"
    };
  } else if (lowercaseIdea.includes("food") || lowercaseIdea.includes("restaurant") || lowercaseIdea.includes("cook")) {
    data = {
      name: "Tastify",
      tagline: "Discover your next craving.",
      colors: ["#E63946", "#0A0A0A", "#FFFFFF", "#F4A261"],
      domain: "tastify.app",
      stack: ["React", "Node.js", "MongoDB", "Stripe"],
      interface: "Visual menu browser"
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
          marketSize: "2.4M",
          competitors: 3,
          riskiestAssumption: "Users will adopt within first week.",
          growthData: [
            { name: 'W1', users: 0 },
            { name: 'W2', users: 45 },
            { name: 'W3', users: 120 },
            { name: 'W4', users: 350 },
            { name: 'W5', users: 890 },
            { name: 'W6', users: 1400 },
          ]
        }
      });
    }, 2500);
  });
};

// Widget with spotlight effect matching Features.tsx
const Widget = ({ title, icon: Icon, children, delay = 0 }: any) => {
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
      className="relative group bg-white/[0.02] border border-white/10 overflow-hidden h-full flex flex-col"
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

      <div className="relative z-10 p-6 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/5 border border-white/10 group-hover:border-velocity-red/50 group-hover:bg-velocity-red/10 transition-colors duration-300">
            <Icon className="w-4 h-4 text-gray-300 group-hover:text-velocity-red transition-colors duration-300" />
          </div>
          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">{title}</span>
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
    <section className="min-h-screen pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-velocity-red/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 border border-velocity-red/30 bg-velocity-red/10 mb-8"
          >
            <Sparkles className="w-3 h-3 text-velocity-red" />
            <span className="font-mono text-xs text-velocity-red uppercase tracking-widest">Velocity Launchpad</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans font-black text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-6"
          >
            <span className="text-white">FROM IDEA</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-velocity-red to-velocity-darkRed">TO LAUNCH</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-mono text-sm md:text-base text-gray-400 max-w-xl mb-12 leading-relaxed"
          >
            Describe your idea in one sentence. We'll generate your brand identity, 
            tech stack, and go-to-market strategy.
          </motion.p>

          {/* Input Section */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
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
              {/* Brand Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-12 border-t border-white/5 pt-12"
              >
                <div className="inline-flex items-center gap-2 text-velocity-red mb-4">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-mono text-xs uppercase tracking-widest">Analysis Complete</span>
                </div>
                <h2 className="font-sans font-bold text-4xl md:text-5xl tracking-tight text-white mb-2">{data.identity.name}</h2>
                <p className="font-mono text-gray-500 text-sm italic">{data.identity.tagline}</p>
              </motion.div>

              {/* Widgets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Brand Identity */}
                <Widget title="Brand Identity" icon={Palette} delay={0.1}>
                  <div className="space-y-6">
                    <div>
                      <p className="font-mono text-xs text-gray-500 mb-3 uppercase tracking-widest">Color Palette</p>
                      <div className="flex gap-3">
                        {data.identity.colors.map((color: string, i: number) => (
                          <motion.div 
                            key={i} 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                            className="w-10 h-10 border border-white/10" 
                            style={{ backgroundColor: color }} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <p className="font-mono text-xs text-gray-500 mb-2 uppercase tracking-widest">Domain</p>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-velocity-red" />
                        <span className="font-mono text-sm text-white">{data.identity.domain}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 bg-velocity-red/20 text-velocity-red border border-velocity-red/30">AVAILABLE</span>
                      </div>
                    </div>
                  </div>
                </Widget>

                {/* Tech Stack */}
                <Widget title="Tech Stack" icon={Cpu} delay={0.2}>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {data.blueprint.stack.map((tech: string, i: number) => (
                        <motion.span 
                          key={i} 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 font-mono text-xs text-gray-300 hover:border-velocity-red/30 transition-colors cursor-default"
                        >
                          {tech}
                        </motion.span>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-mono text-xs text-gray-500 mb-1 uppercase tracking-widest">Complexity</p>
                        <p className="font-sans font-bold text-white">{data.blueprint.complexity}</p>
                      </div>
                      <div>
                        <p className="font-mono text-xs text-gray-500 mb-1 uppercase tracking-widest">Build Time</p>
                        <p className="font-sans font-bold text-velocity-red">{data.blueprint.timeline}</p>
                      </div>
                    </div>
                  </div>
                </Widget>

                {/* Quick Stats */}
                <Widget title="Market Signals" icon={TrendingUp} delay={0.3}>
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-center">
                      <p className="font-sans font-bold text-2xl text-white">{data.validation.marketSize}</p>
                      <p className="font-mono text-xs text-gray-500 mt-1 uppercase tracking-widest">Target Users</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 flex flex-col justify-center">
                      <p className="font-sans font-bold text-2xl text-velocity-red">{data.validation.competitors}</p>
                      <p className="font-mono text-xs text-gray-500 mt-1 uppercase tracking-widest">Competitors</p>
                    </div>
                    <div className="col-span-2 bg-white/[0.02] border border-white/5 p-4">
                      <p className="font-mono text-xs text-gray-500 mb-2 uppercase tracking-widest">UI Pattern</p>
                      <p className="font-mono text-sm text-white">{data.visuals.appInterface}</p>
                    </div>
                  </div>
                </Widget>

                {/* Growth Chart */}
                <div className="md:col-span-2 min-h-[280px]">
                  <Widget title="Projected Growth" icon={BarChart3} delay={0.4}>
                    <div className="h-full w-full min-h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.validation.growthData}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF1F1F" stopOpacity={0.3}/>
                              <stop offset="100%" stopColor="#FF1F1F" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="name" 
                            stroke="#333" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false}
                            fontFamily="JetBrains Mono"
                          />
                          <YAxis 
                            stroke="#333" 
                            fontSize={11} 
                            tickLine={false} 
                            axisLine={false}
                            fontFamily="JetBrains Mono"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0A0A0A', 
                              borderColor: '#333', 
                              fontFamily: 'JetBrains Mono',
                              fontSize: '12px'
                            }}
                            itemStyle={{ color: '#FF1F1F' }}
                            labelStyle={{ color: '#999' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="users" 
                            stroke="#FF1F1F" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorUsers)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Widget>
                </div>

                {/* Launch Strategy */}
                <Widget title="Day 1 Playbook" icon={Zap} delay={0.5}>
                  <div className="space-y-3">
                    {data.strategy.map((step: string, i: number) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="flex items-start gap-3 group/item"
                      >
                        <div className="w-6 h-6 bg-velocity-red/10 border border-velocity-red/30 text-velocity-red flex items-center justify-center font-mono text-xs font-bold shrink-0 group-hover/item:bg-velocity-red/20 transition-colors">
                          {i + 1}
                        </div>
                        <p className="font-mono text-sm text-gray-400 group-hover/item:text-gray-300 transition-colors leading-relaxed">{step}</p>
                      </motion.div>
                    ))}
                  </div>
                </Widget>

              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-16 text-center border-t border-white/5 pt-12"
              >
                <p className="font-mono text-gray-500 text-sm mb-6">Ready to build this?</p>
                <a 
                  href="https://www.lsesu.com/communities/societies/group/Velocity/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 font-mono text-sm uppercase tracking-widest bg-velocity-red border-2 border-velocity-red text-white hover:bg-velocity-red/80 hover:shadow-[0_0_50px_rgba(255,31,31,0.4)] transition-all duration-300"
                >
                  Join Velocity <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
