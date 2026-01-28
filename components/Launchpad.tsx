import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, Variants } from 'framer-motion';
import { Rocket, CheckCircle2, Cpu, Target, BarChart3, Palette, ArrowRight, Loader2, Zap, TrendingUp, Globe, Smartphone, Coins, Copy, Terminal, AlertTriangle, ChevronLeft, ChevronRight, Users, MessageCircle, BookOpen, ExternalLink, LogOut, History, Trash2, Download, Presentation, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { InviteCodeLogin } from './InviteCodeLogin';
import { generateAnalysis, getAnalyses, AnalysisRecord, AnalysesResponse, deleteAnalysis } from '../lib/api';
import { LaunchpadDashboard } from './LaunchpadDashboard';
import { AnimatedText } from './LaunchpadWidgets';
// Components moved to LaunchpadWidgets.tsx and LaunchpadDashboard.tsx

export const Launchpad: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyNextCursor, setHistoryNextCursor] = useState<string | null>(null);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);

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

  // Scroll to top when component mounts (fixes navigation from ChipScroll/navbar)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch history when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getAnalyses().then((response) => {
        setHistory(response.analyses);
        setHistoryHasMore(response.hasMore);
        setHistoryNextCursor(response.nextCursor);
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  // Load more history items
  const loadMoreHistory = async () => {
    if (loadingMoreHistory || !historyNextCursor) return;

    setLoadingMoreHistory(true);
    try {
      const response = await getAnalyses({ cursor: historyNextCursor });
      setHistory(prev => [...prev, ...response.analyses]);
      setHistoryHasMore(response.hasMore);
      setHistoryNextCursor(response.nextCursor);
    } catch (err) {
      console.error('Failed to load more history:', err);
    } finally {
      setLoadingMoreHistory(false);
    }
  };

  useEffect(() => {
    if (data && !isGenerating) {
      // First, show the results so the content renders and page expands
      setShowResults(true);

      // Capture current scroll position immediately
      const initialScrollY = window.scrollY;

      // Wait for the content to render and layout to settle
      // Use requestAnimationFrame + setTimeout to ensure DOM is fully updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          const element = inputFormRef.current;
          if (!element) {
            return;
          }

          // Now calculate target with the full page content rendered
          const elementRect = element.getBoundingClientRect();
          const elementBottom = elementRect.bottom;
          const navbarHeight = 80; // Account for fixed navbar
          const target = window.scrollY + elementBottom - navbarHeight;
          const distance = target - initialScrollY;

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
            }
          }

          requestAnimationFrame(animation);
        }, 100); // Give content time to render
      });
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

    setLoadingStep(0);


    try {
      const result = await generateAnalysis(idea);
      setData(result);

      // Refresh history after new analysis
      getAnalyses().then((response) => {
        setHistory(response.analyses);
        setHistoryHasMore(response.hasMore);
        setHistoryNextCursor(response.nextCursor);
      }).catch(console.error);
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

    if (deletingId) return;

    setDeletingId(recordId);
    try {
      await deleteAnalysis(recordId);
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
    <section className="min-h-screen pt-32 md:pt-48 pb-24 px-6 relative overflow-hidden bg-neutral-900">
      {/* Black Background Overlay with Fade */}
      <div
        className="absolute top-0 left-0 w-full bg-black pointer-events-none"
        style={{
          height: '85vh',
          maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
        }}
      />
      {/* Login Modal */}
      <InviteCodeLogin
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={login}
      />

      {/* Portal Buttons to Navbar */}
      {typeof document !== 'undefined' && document.getElementById('navbar-actions') && createPortal(
        <>
          {isAuthenticated ? (
            <>
              {/* History Button */}
              <div className="relative">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded-full transition-all flex items-center gap-2 group ${showHistory ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  <History className="w-5 h-5 group-hover:text-velocity-red transition-colors" />
                  {history.length > 0 && (
                    <span className="bg-velocity-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-1">
                      {history.length}
                    </span>
                  )}
                </button>

                {/* History Dropdown */}
                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="fixed md:absolute top-20 md:top-full left-4 right-4 md:left-auto md:right-0 mt-0 md:mt-4 w-auto md:w-80 bg-black/90 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md rounded-xl z-[70]"
                    >

                      <div className="relative z-10">
                        <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-white/5">
                          <div className="p-1.5 bg-white/5 border border-white/10 rounded-md">
                            <History className="w-3.5 h-3.5 text-velocity-red" />
                          </div>
                          <span className="font-sans text-[10px] text-gray-300 uppercase tracking-widest font-bold">Previous Analyses</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto custom-scrollbar">
                          {history.length === 0 ? (
                            <div className="p-8 text-center bg-black/50">
                              <History className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                              <p className="font-sans text-xs text-gray-500">No analyses yet</p>
                            </div>
                          ) : (
                            <>
                              {history.map((record) => (
                                <div
                                  key={record.id}
                                  className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-all border-b border-white/5 last:border-0 group cursor-pointer"
                                  onClick={() => loadFromHistory(record)}
                                >
                                  <div className="flex-1 text-left min-w-0">
                                    <p className="font-sans text-sm text-gray-200 truncate group-hover:text-velocity-red transition-colors font-medium">{record.idea}</p>
                                    <p className="font-sans text-[10px] text-gray-500 mt-1 uppercase tracking-wider flex items-center gap-2">
                                      <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                                      <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                      <span>{new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </p>
                                  </div>
                                  <div className="relative flex items-center">
                                    {confirmDeleteId === record.id ? (
                                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md" onClick={e => e.stopPropagation()}>
                                        <span className="font-sans text-[9px] text-red-300 whitespace-nowrap">Delete?</span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAnalysis(e, record.id);
                                            setConfirmDeleteId(null);
                                          }}
                                          disabled={deletingId === record.id}
                                          className="font-sans text-[9px] text-white bg-red-500/50 hover:bg-red-500 px-1.5 rounded transition-colors disabled:opacity-50"
                                        >
                                          {deletingId === record.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            'Y'
                                          )}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDeleteId(null);
                                          }}
                                          className="font-sans text-[9px] text-gray-400 hover:text-white transition-colors px-1"
                                        >
                                          N
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmDeleteId(record.id);
                                        }}
                                        className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete analysis"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {/* Load More Button */}
                              {historyHasMore && (
                                <button
                                  onClick={loadMoreHistory}
                                  disabled={loadingMoreHistory}
                                  className="w-full p-3 flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all border-t border-white/10 disabled:opacity-50"
                                >
                                  {loadingMoreHistory ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span className="font-sans text-xs">Loading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                                      <span className="font-sans text-xs">Load older analyses</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </>
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
                className="p-2 rounded-full text-white/60 hover:text-velocity-red hover:bg-velocity-red/10 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-5 py-2 bg-white text-black hover:bg-gray-200 font-sans text-xs font-bold uppercase tracking-widest transition-all rounded-full"
            >
              Login
            </button>
          )}
        </>,
        document.getElementById('navbar-actions')!
      )}

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
              text="Ready to build?"
              className="font-sans font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tighter text-white"
              delay={0.2}
            />
            <AnimatedText
              text="Start here."
              className="font-sans font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tighter text-velocity-red pb-4"
              delay={1.5}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="font-sans text-sm md:text-base text-white max-w-3xl mb-12 leading-relaxed text-balance"
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
            className="w-full max-w-3xl relative z-20"
          >
            <div className="relative group rounded-2xl md:rounded-full p-[1px] bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-2xl shadow-2xl transition-all duration-500">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-neutral-900/80 rounded-2xl md:rounded-full p-3 md:p-2 md:pl-6 border border-white/5 transition-all duration-500 group-hover:bg-neutral-900/60 focus-within:bg-neutral-900/90 focus-within:ring-1 focus-within:ring-velocity-red/50">

                <input
                  type="text"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="An AI-powered meal planning app that learns your tastes..."
                  className="flex-1 bg-transparent text-white px-2 py-3 outline-none placeholder:text-gray-500 font-sans text-base md:text-lg appearance-none w-full"
                  disabled={isGenerating}
                  maxLength={500}
                />

                <button
                  type="submit"
                  disabled={isGenerating || !idea}
                  className="relative w-full md:w-auto px-8 py-3.5 rounded-xl md:rounded-full font-sans text-sm font-bold uppercase tracking-wide transition-all duration-300 bg-velocity-red text-white hover:bg-red-600 hover:scale-[1.02] md:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group/btn shadow-lg md:shadow-none"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Launch <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
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
                  <span className="font-sans text-sm text-gray-400">
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
                <span className="font-sans text-[10px] text-gray-500 mt-2">
                  {loadingPercent}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Dashboard */}
        <LaunchpadDashboard data={data} showResults={showResults} />
      </div>
    </section>
  );
};
