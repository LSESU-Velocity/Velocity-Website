import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, Variants } from 'framer-motion';
import { Rocket, CheckCircle2, Cpu, Target, BarChart3, Palette, ArrowRight, Loader2, Zap, TrendingUp, Globe, Smartphone, Coins, Copy, Terminal, AlertTriangle, ChevronLeft, ChevronRight, Users, MessageCircle, BookOpen, ExternalLink, LogOut, History, Trash2, Download, Presentation, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { InviteCodeLogin } from './InviteCodeLogin';
import { generateAnalysis, getAnalyses, AnalysisRecord, deleteAnalysis } from '../lib/api';
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

// Animated Dial/Gauge Component - Clean minimal design matching site aesthetic
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

  // Arc configuration - smaller size
  const radius = 36;
  const strokeWidth = 4;
  const centerX = 50;
  const centerY = 45;

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
    <div className="flex flex-col items-center justify-center w-full">
      {/* Minimal container */}
      <div className="relative p-2">
        {/* SVG Dial */}
        <div className="relative w-20 h-12 flex items-center justify-center">
          <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
            {/* Background arc track */}
            <path
              d={backgroundArc}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Filled arc - no glow filter */}
            {currentValue > 0 && (
              <path
                d={filledArc}
                fill="none"
                stroke={dialColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{
                  transition: 'stroke 0.3s ease-out'
                }}
              />
            )}

            {/* Minimal tick marks */}
            <circle cx={centerX - radius} cy={centerY} r="1" fill="rgba(255,255,255,0.15)" />
            <circle cx={centerX + radius} cy={centerY} r="1" fill="rgba(255,255,255,0.15)" />
          </svg>

          {/* Centered percentage display */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
            <span
              className="font-mono font-medium text-sm tracking-tight tabular-nums leading-none"
              style={{ color: dialColor }}
            >
              {currentValue}%
            </span>
          </div>
        </div>
      </div>

      {/* Label below the dial */}
      <span className="font-mono text-[9px] text-gray-300 uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );
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
      className={`relative group bg-white/[0.03] border border-white/10 overflow-hidden h-full flex flex-col backdrop-blur-md shadow-2xl ${className}`}
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
              <Icon className="w-3.5 h-3.5 text-gray-200 group-hover:text-velocity-red transition-colors duration-300" />
            </div>
            <span className="font-mono text-[10px] text-gray-200 uppercase tracking-widest">{title}</span>
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
  const { isAuthenticated, isLoading: authLoading, authKey, login, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [competitorIndex, setCompetitorIndex] = useState(0);
  const [monetizationIndex, setMonetizationIndex] = useState(0);
  const [riskIndex, setRiskIndex] = useState(0);
  const [domainIndex, setDomainIndex] = useState(0);
  const [promptChainIndex, setPromptChainIndex] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [showResults, setShowResults] = useState(false);



  // Pitch Deck State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPitchDeckFullscreen, setShowPitchDeckFullscreen] = useState(false);

  // Helper functions for new widgets
  const downloadHtml = (html: string, filename: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openInNewTab = (html: string) => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const [deletingId, setDeletingId] = useState<string | null>(null); // Track which analysis is being deleted
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null); // Track which analysis is showing delete confirmation
  const inputFormRef = useRef<HTMLFormElement>(null);

  // Fetch history when authenticated
  useEffect(() => {
    if (isAuthenticated && authKey) {
      getAnalyses(authKey).then(setHistory).catch(console.error);
    }
  }, [isAuthenticated, authKey]);

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

  // Progressive loading steps with percentage thresholds
  const loadingSteps = [
    { text: "Analysing idea", icon: Zap, threshold: 0 },
    { text: "Searching the web", icon: Globe, threshold: 14 },
    { text: "Researching competitors", icon: Target, threshold: 28 },
    { text: "Evaluating market size", icon: BarChart3, threshold: 42 },
    { text: "Identifying opportunities", icon: TrendingUp, threshold: 56 },
    { text: "Building strategy", icon: Cpu, threshold: 70 },
    { text: "Generating mockup", icon: Smartphone, threshold: 85 },
    { text: "Finalising report", icon: Rocket, threshold: 95 }
  ];

  // Get current step based on percentage
  const getCurrentStep = (percent: number) => {
    for (let i = loadingSteps.length - 1; i >= 0; i--) {
      if (percent >= loadingSteps[i].threshold) {
        return i;
      }
    }
    return 0;
  };

  useEffect(() => {
    if (isGenerating) {
      let animationId: number;
      let startTime: number | null = null;
      const duration = 40000; // 40 seconds to reach 99%

      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const elapsed = currentTime - startTime;

        // Ease-out curve: starts fast, slows down as it approaches 99%
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 2); // Quadratic ease-out
        const percent = Math.min(Math.floor(eased * 99), 99);

        setLoadingPercent(percent);
        setLoadingStep(getCurrentStep(percent));

        if (percent < 99) {
          animationId = requestAnimationFrame(animate);
        }
      };

      animationId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationId);
    } else {
      // Reset when not generating
      setLoadingPercent(0);
      setLoadingStep(0);
    }
  }, [isGenerating]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    // Check authentication first
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setIsGenerating(true);
    setData(null);
    setError(null);
    setShowResults(false);
    setCompetitorIndex(0);
    setMonetizationIndex(0);
    setRiskIndex(0);

    setDomainIndex(0);
    setPromptChainIndex(0);
    setLoadingStep(0);


    try {
      const result = await generateAnalysis(authKey!, idea);
      setData(result);

      // Refresh history after new analysis
      if (authKey) {
        getAnalyses(authKey).then(setHistory).catch(console.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate analysis');
      console.error('Analysis error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Load a previous analysis from history
  const loadFromHistory = (record: AnalysisRecord) => {
    setData(record.data);
    setIdea(record.idea);
    setShowHistory(false);
    setShowResults(true);
  };

  // Delete an analysis from history
  const handleDeleteAnalysis = async (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation(); // Prevent triggering loadFromHistory

    if (!authKey || deletingId) return;

    setDeletingId(recordId);
    try {
      await deleteAnalysis(authKey, recordId);
      // Update local state to remove the deleted item
      setHistory(prev => prev.filter(record => record.id !== recordId));
    } catch (err) {
      console.error('Delete analysis error:', err);
      setError('Failed to delete analysis');
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <section className="min-h-screen pt-32 md:pt-48 pb-24 px-6 relative overflow-hidden">
      {/* Login Modal */}
      <InviteCodeLogin
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={login}
      />

      {/* Auth Status Bar */}
      <div className="fixed top-24 right-6 z-[60] flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* History Button */}
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 bg-white/[0.02] border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all flex items-center gap-2 group"
              >
                <History className="w-4 h-4 group-hover:text-velocity-red transition-colors" />
                <span className="text-sm font-mono hidden sm:inline">History</span>
                {history.length > 0 && (
                  <span className="bg-velocity-red text-white text-xs px-1.5 py-0.5">
                    {history.length}
                  </span>
                )}
              </button>

              {/* History Dropdown */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-80 bg-white/[0.02] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md"
                  >
                    {/* Grid Background */}
                    <div
                      className="absolute inset-0 opacity-[0.03] pointer-events-none"
                      style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    />
                    <div className="relative z-10">
                      <div className="p-4 border-b border-white/10 flex items-center gap-2">
                        <div className="p-1.5 bg-white/5 border border-white/10">
                          <History className="w-3.5 h-3.5 text-velocity-red" />
                        </div>
                        <span className="font-mono text-[10px] text-gray-300 uppercase tracking-widest">Previous Analyses</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {history.length === 0 ? (
                          <p className="p-4 font-mono text-xs text-gray-500">No analyses yet</p>
                        ) : (
                          history.map((record) => (
                            <div
                              key={record.id}
                              className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-all border-b border-white/5 last:border-0 group"
                            >
                              <button
                                onClick={() => loadFromHistory(record)}
                                className="flex-1 text-left min-w-0"
                              >
                                <p className="font-mono text-sm text-white truncate group-hover:text-velocity-red transition-colors">{record.idea}</p>
                                <p className="font-mono text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                                  {new Date(record.createdAt).toLocaleDateString()}
                                </p>
                              </button>
                              <div className="relative flex items-center">
                                {confirmDeleteId === record.id ? (
                                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1">
                                    <span className="font-mono text-[9px] text-gray-400 whitespace-nowrap">Delete?</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAnalysis(e, record.id);
                                        setConfirmDeleteId(null);
                                      }}
                                      disabled={deletingId === record.id}
                                      className="font-mono text-[9px] text-velocity-red hover:text-white transition-colors disabled:opacity-50"
                                    >
                                      {deletingId === record.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        'Yes'
                                      )}
                                    </button>
                                    <span className="text-gray-600">|</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteId(null);
                                      }}
                                      className="font-mono text-[9px] text-gray-400 hover:text-white transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(record.id);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-velocity-red hover:bg-white/5 transition-all"
                                    title="Delete analysis"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 bg-white/[0.02] border border-white/10 hover:border-velocity-red/50 text-gray-400 hover:text-velocity-red transition-all group"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 bg-velocity-darkRed/20 border-2 border-velocity-red/50 hover:bg-velocity-red hover:border-velocity-red text-white font-mono text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,31,31,0.15)] hover:shadow-[0_0_40px_rgba(255,31,31,0.4)]"
          >
            Login
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 border rounded-lg flex items-center gap-3 max-w-2xl mx-auto ${error.includes('Daily limit reached')
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-red-500/10 border-red-500/20'
              }`}
          >
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${error.includes('Daily limit reached') ? 'text-amber-400' : 'text-red-400'
              }`} />
            <p className={`text-sm ${error.includes('Daily limit reached') ? 'text-amber-400' : 'text-red-400'
              }`}>{error}</p>
            <button onClick={() => setError(null)} className={`ml-auto ${error.includes('Daily limit reached')
              ? 'text-amber-400 hover:text-amber-300'
              : 'text-red-400 hover:text-red-300'
              }`}>×</button>
          </motion.div>
        )}

        {/* Header Section */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">

          <h1 className="flex flex-col items-center mb-8 leading-[0.85] select-none w-full">
            <AnimatedText
              text="READY TO BUILD?"
              className="font-sans font-black text-5xl md:text-7xl lg:text-8xl tracking-tighter text-white"
              delay={0.2}
            />
            <AnimatedText
              text="START HERE."
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
            You've got the spark. We'll find your market, your customers, and your starting point.
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
                  placeholder="An AI-powered meal planning app that learns your tastes..."
                  className="flex-1 bg-transparent text-white px-4 py-4 outline-none placeholder:text-gray-600 font-mono text-sm"
                  disabled={isGenerating}
                  maxLength={500}
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
                {/* Smooth progress bar with red glow */}
                <div className="relative w-64 h-1 bg-white/10 overflow-hidden">
                  {/* Progress fill - direct percentage */}
                  <div
                    className="absolute inset-y-0 left-0 bg-velocity-red transition-none"
                    style={{ width: `${loadingPercent}%` }}
                  />
                  {/* Glowing leading edge */}
                  <div
                    className="absolute inset-y-0 w-8 pointer-events-none"
                    style={{
                      left: `calc(${loadingPercent}% - 2rem)`,
                      background: 'radial-gradient(ellipse at right center, rgba(255, 31, 31, 0.6) 0%, rgba(255, 31, 31, 0.3) 30%, transparent 70%)',
                      filter: 'blur(4px)',
                    }}
                  />
                  {/* Subtle pulse on the bar */}
                  <motion.div
                    className="absolute inset-0 bg-velocity-red/20"
                    animate={{
                      opacity: [0, 0.3, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </div>
                {/* Percentage indicator */}
                <span className="font-mono text-[10px] text-gray-500 mt-2">
                  {loadingPercent}%
                </span>
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
                  >
                    <div className="flex flex-col h-full">
                      {/* Phone Mockup with Waitlist Preview */}
                      <div className="flex-1 flex items-center justify-center py-4">
                        <div className="relative w-full max-w-[220px] aspect-[9/19] bg-black border-[6px] border-[#1f1f1f] rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group/phone">
                          {/* Dynamic Notch */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-5 bg-[#1f1f1f] rounded-b-xl z-20"></div>

                          {/* Screen Content - Live Waitlist Preview */}
                          <div className="w-full h-full bg-[#0a0a0a] relative flex flex-col items-center justify-center overflow-hidden">
                            {data.artifacts?.waitlistHtml ? (
                              <div className="w-full h-full bg-white relative">
                                <iframe
                                  srcDoc={data.artifacts.waitlistHtml}
                                  title="Waitlist Preview"
                                  className="w-[200%] h-[200%] origin-top-left scale-50 border-0"
                                  sandbox="allow-scripts"
                                />
                                {/* Overlay to prevent interaction inside phone but allow seeing it */}
                                <div className="absolute inset-0 z-10 bg-transparent" />
                              </div>
                            ) : (
                              /* Loading State */
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 text-velocity-red animate-spin" />
                                <span className="font-mono text-[9px] text-gray-400 text-center px-4">
                                  Generating waitlist...
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Waitlist Actions */}
                      {data.artifacts?.waitlistHtml && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <button
                            onClick={() => downloadHtml(data.artifacts!.waitlistHtml!, 'index.html')}
                            className="p-2 bg-velocity-red/10 border border-velocity-red/30 rounded hover:bg-velocity-red/20 text-velocity-red transition-colors group/btn relative"
                            title="Download index.html"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(data.artifacts!.waitlistHtml!)}
                            className="p-2 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-300 transition-colors"
                            title="Copy HTML"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openInNewTab(data.artifacts!.waitlistHtml!)}
                            className="p-2 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-gray-300 transition-colors"
                            title="Open in New Tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Widget>

                  {/* Monetization Strategy - Moved to Left Column */}
                  <Widget
                    title="Monetization Strategy"
                    icon={Coins}
                    delay={0.4}
                    className="!h-auto !overflow-visible"
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
                        <div className="w-full bg-white/5 border border-white/10 p-3 rounded-sm hover:bg-white/10 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[10px] text-gray-200 font-bold">TAM</span>
                                <span className="text-[9px] text-gray-400 uppercase tracking-wide">Total Market</span>
                              </div>
                              <p className="font-sans font-bold text-2xl text-white leading-none">{data.validation.tam.value}</p>
                            </div>
                            <p className="font-mono text-[9px] text-gray-400 text-right max-w-[50%] leading-tight">{data.validation.tam.label}</p>
                          </div>
                        </div>

                        {/* SAM - Medium Bar */}
                        <div className="w-[85%] mx-auto bg-white/10 border border-white/10 p-3 rounded-sm hover:bg-white/15 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-[10px] text-gray-200 font-bold">SAM</span>
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
                      </div>
                    </Widget>

                    {/* Top Right: Market Position */}
                    <Widget
                      title="Market Position"
                      icon={Target}
                      delay={0.2}
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
                        <div className="relative w-full h-44 bg-white/[0.03] border border-white/10 rounded-sm shrink-0 overflow-hidden group/map">

                          {/* Central Axis Lines - span full container */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          </div>
                          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent pointer-events-none" />

                          {/* Axis labels - positioned in outer margin */}
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 font-mono text-[8px] text-gray-300 z-10">
                            {data.validation.marketGap?.yAxis.high}
                          </div>
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-[8px] text-gray-300 z-10">
                            {data.validation.marketGap?.yAxis.low}
                          </div>
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 font-mono text-[8px] text-gray-300 z-10">
                            {data.validation.marketGap?.xAxis.low}
                          </div>
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 font-mono text-[8px] text-gray-300 z-10">
                            {data.validation.marketGap?.xAxis.high}
                          </div>

                          {/* Inner plotting area - dots are positioned within this inset zone */}
                          <div className="absolute top-5 right-5 bottom-5 left-5">
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

                            {/* Your position */}
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.8, type: "spring" }}
                              className="absolute z-20"
                              style={{
                                left: `${data.validation.marketGap?.yourPosition.x ?? 50}%`,
                                bottom: `${data.validation.marketGap?.yourPosition.y ?? 50}%`,
                                transform: 'translate(-50%, 50%)'
                              }}
                            >
                              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                            </motion.div>
                          </div>
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-velocity-red" />
                                <span className="font-sans font-bold text-white text-sm">{data.validation.competitorList[competitorIndex].name}</span>
                              </div>
                              {data.validation.competitorList[competitorIndex].website && (
                                <a
                                  href={`https://${data.validation.competitorList[competitorIndex].website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-[9px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                                >
                                  {data.validation.competitorList[competitorIndex].website}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>

                            {/* Competitor Profile */}
                            {(data.validation.competitorList[competitorIndex].founded || data.validation.competitorList[competitorIndex].funding) && (
                              <div className="flex flex-wrap gap-x-3 gap-y-1 pl-4">
                                {data.validation.competitorList[competitorIndex].founded && (
                                  <span className="font-mono text-[9px] text-gray-400">
                                    🏢 {data.validation.competitorList[competitorIndex].founded}
                                  </span>
                                )}
                                {data.validation.competitorList[competitorIndex].hq && (
                                  <span className="font-mono text-[9px] text-gray-400">
                                    📍 {data.validation.competitorList[competitorIndex].hq}
                                  </span>
                                )}

                                {data.validation.competitorList[competitorIndex].employees && (
                                  <span className="font-mono text-[9px] text-gray-400">
                                    👥 {data.validation.competitorList[competitorIndex].employees}
                                  </span>
                                )}
                              </div>
                            )}

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
                        <div className="flex flex-col gap-2">
                          <p className="font-sans text-sm text-gray-200 leading-relaxed">
                            {data.validation.aiInsight}
                          </p>

                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
                            <AnimatedScoreBar label="Viability" targetValue={data.validation.scores?.viability ?? 80} delay={0.3} visible={showResults} />
                            <AnimatedScoreBar label="Scalability" targetValue={data.validation.scores?.scalability ?? 60} delay={0.4} visible={showResults} />
                            <AnimatedScoreBar label="Complexity" targetValue={data.validation.scores?.complexity ?? 40} delay={0.5} visible={showResults} invertColor />
                          </div>
                        </div>
                      </Widget>
                    </div>

                    {/* Pitch Deck Generator - Replaces Day 1 Tasks & Monetization & Risk */}
                    <div className="col-span-1 md:col-span-2">
                      <Widget
                        title="PITCH DECK GENERATOR"
                        icon={Presentation}
                        delay={0.3}
                        className="h-full min-h-[400px]"
                        visible={showResults}
                      >
                        <div className="flex flex-col h-full gap-4">
                          {data.artifacts?.pitchDeckHtml ? (
                            <>
                              {/* Slide Preview */}
                              <div className="flex-1 bg-black border border-white/10 relative rounded overflow-hidden group/slide">
                                <iframe
                                  srcDoc={data.artifacts.pitchDeckHtml}
                                  className="w-full h-full border-0"
                                  title="Pitch Deck Preview"
                                  id="pitch-deck-preview"
                                  sandbox="allow-scripts allow-modals allow-popups allow-forms allow-same-origin"
                                />
                                {/* Overlay for quick actions */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/slide:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none">
                                  <div className="pointer-events-auto flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const newWindow = window.open('', '_blank');
                                        newWindow?.document.write(data.artifacts!.pitchDeckHtml!);
                                      }}
                                      className="px-4 py-2 bg-velocity-red text-white uppercase font-mono text-xs tracking-widest hover:bg-red-600 transition-colors"
                                    >
                                      Present Fullscreen
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => downloadHtml(data.artifacts!.pitchDeckHtml!, 'pitch-deck.html')}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-colors text-xs font-mono text-gray-300"
                                  >
                                    <Download className="w-3 h-3" /> HTML
                                  </button>
                                  <button
                                    onClick={() => {
                                      const printWindow = window.open('', '_blank');
                                      printWindow?.document.write(data.artifacts!.pitchDeckHtml! + '<script>window.onload = () => { window.print(); window.close(); }</script>');
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-colors text-xs font-mono text-gray-300"
                                  >
                                    <FileText className="w-3 h-3" /> PDF
                                  </button>
                                </div>
                                <div className="font-mono text-[10px] text-gray-500">
                                  Powered by Reveal.js
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                              <Loader2 className="w-8 h-8 text-velocity-red animate-spin" />
                              <p className="font-mono text-xs text-gray-400">Generating pitch deck...</p>
                            </div>
                          )}
                        </div>
                      </Widget>
                    </div>
                  </div>
                </div>

                {/* Right Column: Brand & Strategy */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                  <Widget title="Potential Customer Segments" icon={Users} delay={0.3} visible={showResults} className="!h-auto !overflow-visible">
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
                            <span className="font-mono text-[9px] text-gray-200 border border-white/10 px-1 rounded bg-black/30">{segment.age}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[9px] text-gray-200 font-mono">
                              <span className="text-velocity-red">Target:</span> {segment.interest}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-gray-200 font-mono">
                              <span className="text-blue-400">Income:</span> {segment.income}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Widget>

                  <Widget title="Distribution Channels" icon={MessageCircle} delay={0.7} visible={showResults} className="!h-auto !overflow-visible">
                    <div className="flex flex-col gap-3">
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
                            className="flex items-center justify-between p-2 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-velocity-red/30 transition-all group/channel rounded-sm cursor-pointer relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-velocity-red/5 translate-x-[-100%] group-hover/channel:translate-x-0 transition-transform duration-500 ease-out" />

                            <div className="flex items-center gap-2.5 relative z-10">
                              <div className="w-1.5 h-1.5 rounded-full bg-velocity-red group-hover/channel:scale-150 transition-transform duration-300" />
                              <span className="font-sans text-xs text-gray-200 font-medium group-hover/channel:text-white transition-colors">{channel.name}</span>
                            </div>

                            <div className="flex items-center gap-2 relative z-10">
                              <span className="font-mono text-[8px] text-gray-300 border border-white/5 px-1.5 py-0.5 rounded uppercase bg-black/20 group-hover/channel:border-white/10 transition-colors">{channel.type}</span>
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
                    className="min-h-[280px]"
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
                                className="p-3 bg-white/5 border border-white/10 font-mono text-[10px] text-gray-300 h-full overflow-y-auto leading-relaxed cursor-pointer hover:border-velocity-red/30 hover:bg-white/[0.08] transition-all duration-300"
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
                    {/* Verified by Google Search Badge */}
                    {data.sources?.groundingChunks && data.sources.groundingChunks.length > 0 && (
                      <div className="mb-4 flex items-center gap-2 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-sm w-fit">
                        <div className="w-3 h-3 rounded-full bg-emerald-500/30 flex items-center justify-center">
                          <CheckCircle2 className="w-2 h-2 text-emerald-400" />
                        </div>
                        <span className="font-mono text-[9px] text-emerald-400 uppercase tracking-wider">Verified via Google Search</span>
                      </div>
                    )}

                    {/* Grounding Sources - Primary Display */}
                    {data.sources?.groundingChunks && data.sources.groundingChunks.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {data.sources.groundingChunks.map((source: { uri: string; title: string }, i: number) => (
                            <motion.a
                              key={i}
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1 + i * 0.05 }}
                              className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 hover:border-blue-500/30 transition-all group/source"
                            >
                              {/* Favicon */}
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}&sz=32`}
                                alt=""
                                className="w-4 h-4 rounded-sm shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-[10px] text-gray-300 group-hover/source:text-blue-400 transition-colors truncate">
                                  {source.title}
                                </p>
                                <p className="font-mono text-[8px] text-gray-500 truncate">
                                  {new URL(source.uri).hostname}
                                </p>
                              </div>
                              <ExternalLink className="w-3 h-3 text-gray-500 group-hover/source:text-blue-400 transition-colors shrink-0" />
                            </motion.a>
                          ))}
                        </div>

                        {/* Search Queries Used */}
                        {data.sources?.searchQueries && data.sources.searchQueries.length > 0 && (
                          <div className="pt-3 border-t border-white/5">
                            <p className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mb-2">Search Queries Used</p>
                            <div className="flex flex-wrap gap-2">
                              {data.sources.searchQueries.map((query: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-gray-400">
                                  "{query}"
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fallback to legacy sources */
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
                    )}

                    {/* AI Disclaimer */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Globe className="w-2 h-2 text-emerald-400" />
                      </div>
                      <p className="font-mono text-[9px] text-gray-400 leading-relaxed">
                        Data sourced via Google Search grounding for real-time accuracy. Click any source to verify the information directly.
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
