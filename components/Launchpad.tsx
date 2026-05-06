import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Target, BarChart3, ArrowRight, Loader2, Zap, TrendingUp, Globe, Smartphone, AlertTriangle, Key, X, PencilLine, Plus, GitBranch, MessageCircle, Scale } from 'lucide-react';
import { ApiKeyEntry } from './ApiKeyEntry';
import {
  generateAnalysisStream,
  generateFounderAssets,
  generateWidgetMutation,
  AnalysisInterruptError,
  type AnalysisData,
  type ClarificationQuestion,
  type LabPhaseId,
  type LabPromptHistoryEntry,
  type ProgressEvent,
  type WidgetTargetId,
} from '../lib/api';
import { LaunchpadDashboard } from './LaunchpadDashboard';
import { AnimatedText } from './LaunchpadWidgets';
import { getSavedAnalyses, type SavedLaunchpadAnalysis, upsertSavedAnalysis } from '../lib/launchpad-storage';
import { Player } from '@remotion/player';
import {
  LaunchpadPreview,
  DURATION_IN_FRAMES as PREVIEW_DURATION,
  FPS as PREVIEW_FPS,
  PREVIEW_WIDTH,
  PREVIEW_HEIGHT,
} from './LaunchpadPreview';

const SESSION_KEY = 'launchpad_provider_key';
const PERSIST_KEY = 'launchpad_provider_key_persist';
const LEGACY_SESSION_KEY = 'launchpad_gemini_key';
const LEGACY_PERSIST_KEY = 'launchpad_gemini_key_persist';

function getStoredKey(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return (
    sessionStorage.getItem(SESSION_KEY) ||
    localStorage.getItem(PERSIST_KEY) ||
    sessionStorage.getItem(LEGACY_SESSION_KEY) ||
    localStorage.getItem(LEGACY_PERSIST_KEY)
  );
}

function storeKey(key: string, persist: boolean) {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.setItem(SESSION_KEY, key);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  if (persist) {
    localStorage.setItem(PERSIST_KEY, key);
  } else {
    localStorage.removeItem(PERSIST_KEY);
  }
  localStorage.removeItem(LEGACY_PERSIST_KEY);
}

function clearStoredKey() {
  if (typeof window === 'undefined') {
    return;
  }
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PERSIST_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  localStorage.removeItem(LEGACY_PERSIST_KEY);
}

export const Launchpad: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(getStoredKey);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);
  const [includeFounderAssets, setIncludeFounderAssets] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedLaunchpadAnalysis[]>([]);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);

  const [showResults, setShowResults] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);

  const [interruptQuestions, setInterruptQuestions] = useState<ClarificationQuestion[] | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [branchingFromId, setBranchingFromId] = useState<string | null>(null);
  const [activeMutationTarget, setActiveMutationTarget] = useState<string | null>(null);

  const resultsAnchorRef = useRef<HTMLDivElement>(null);
  const lastRenderedResultRef = useRef<AnalysisData | null>(null);
  const activeSavedRecord = activeSavedId ? savedAnalyses.find((record) => record.id === activeSavedId) || null : null;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setSavedAnalyses(getSavedAnalyses());
  }, []);

  useEffect(() => {
    if (!data) {
      lastRenderedResultRef.current = null;
      return;
    }

    if (isGenerating || lastRenderedResultRef.current === data) {
      return;
    }

    lastRenderedResultRef.current = data;
    setShowResults(true);

    requestAnimationFrame(() => {
      resultsAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [data, isGenerating]);

  // Node-to-display mapping for real progress
  const nodeDisplayMap: Record<string, { text: string; icon: typeof Zap }> = {
    classifyIdea: { text: "Classifying idea", icon: Zap },
    normalizeIntake: { text: "Preparing analysis", icon: Globe },
    researchWeb: { text: "Grounding live sources", icon: Globe },
    runBullAnalyst: { text: "Bull analyst evaluating", icon: TrendingUp },
    runBearAnalyst: { text: "Bear analyst stress-testing", icon: Target },
    runCouncilJudge: { text: "Council judge deciding", icon: Scale },
    synthesizeOpportunity: { text: "Synthesizing findings", icon: BarChart3 },
    qaAndRepair: { text: "Validating report", icon: Rocket },
    retry: { text: "Retrying with fallback model", icon: Smartphone },
  };

  const TOTAL_NODES = 8;

  const loadingPercent = isGenerating
    ? Math.min(Math.floor((completedNodes.length / TOTAL_NODES) * 99), 99)
    : 0;

  // Clear transient progress state when a run ends. Depends only on
  // isGenerating — including completedNodes here loops, because resetting it
  // creates a new [] reference that re-fires the effect.
  useEffect(() => {
    if (isGenerating) return;
    setActiveNode(null);
    setCompletedNodes((prev) => (prev.length === 0 ? prev : []));
  }, [isGenerating]);

  const handleKeySubmit = (key: string, remember: boolean) => {
    storeKey(key, remember);
    setApiKey(key);
    setShowKeyModal(false);
  };

  const handleClearKey = () => {
    clearStoredKey();
    setApiKey(null);
  };

  const persistAnalysis = (
    nextIdea: string,
    nextData: AnalysisData,
    targetId?: string | null,
    extra?: {
      interruptState?: import('../lib/launchpad-storage').InterruptSnapshot | null;
      parentId?: string | null;
      promptHistory?: LabPromptHistoryEntry[];
    },
  ) => {
    try {
      const saved = upsertSavedAnalysis({
        id: targetId === undefined ? activeSavedId : targetId,
        idea: nextIdea,
        data: nextData,
        interruptState: extra?.interruptState ?? null,
        parentId: extra?.parentId ?? null,
        promptHistory: extra?.promptHistory,
      });

      setSavedAnalyses(getSavedAnalyses());
      setActiveSavedId(saved.id);
      return saved;
    } catch (storageError) {
      console.warn('Failed to persist Launchpad analysis locally:', storageError);
      return null;
    }
  };

  const handleStartNewAnalysis = () => {
    setActiveSavedId(null);
    setBranchingFromId(null);
    setIdea('');
    setData(null);
    setShowResults(false);
    setError(null);
    setInterruptQuestions(null);
    setClarificationAnswers({});
  };

  const runAnalysis = async (streamClarifications?: Record<string, string> | null) => {
    if (!idea.trim() || !apiKey) return;

    setIsGenerating(true);
    setData(null);
    setError(null);
    setShowResults(false);
    setActiveNode(null);
    setCompletedNodes([]);
    setInterruptQuestions(null);

    const handleProgress = (event: ProgressEvent) => {
      if (event.status === 'running') {
        setActiveNode(event.node);
      } else if (event.status === 'done') {
        setCompletedNodes(prev => prev.includes(event.node) ? prev : [...prev, event.node]);
      }
    };

    try {
      const result = await generateAnalysisStream(idea, apiKey, handleProgress, {
        clarifications: streamClarifications || null,
      });
      let nextData = result;

      if (includeFounderAssets) {
        try {
          const artifacts = await generateFounderAssets(idea, apiKey, result);
          nextData = {
            ...result,
            artifacts,
          };
        } catch (assetErr: any) {
          const assetMessage = assetErr.message || 'Founder assets were unavailable for this run';
          setError(`Analysis completed, but founder assets failed.\n\n${assetMessage}`);
        }
      }

      setData(nextData);

      const targetId = branchingFromId ? activeSavedId : activeSavedId;
      const parentId = branchingFromId || null;
      persistAnalysis(idea, nextData, targetId, { interruptState: null, parentId });
      setBranchingFromId(null);
    } catch (err: any) {
      if (err instanceof AnalysisInterruptError) {
        setInterruptQuestions(err.interrupt.questions);
        setClarificationAnswers({});

        const interruptSnapshot = {
          reason: err.interrupt.reason,
          questions: err.interrupt.questions,
        };
        persistAnalysis(idea, data || {} as AnalysisData, activeSavedId, {
          interruptState: interruptSnapshot,
          parentId: branchingFromId || null,
        });
        return;
      }

      const msg = err.message || 'Failed to generate analysis';
      if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('403')) {
        setError('Your Google AI Studio key was rejected. Please check it and try again.');
        handleClearKey();
      } else {
        setError(msg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    await runAnalysis();
  };

  const handleResumeClarification = async () => {
    if (!apiKey || !idea.trim()) return;
    const answers = { ...clarificationAnswers };
    setInterruptQuestions(null);
    setClarificationAnswers({});
    await runAnalysis(answers);
  };

  const handleSkipClarification = async () => {
    if (!apiKey || !idea.trim()) return;
    const answers = { ...clarificationAnswers };
    setInterruptQuestions(null);
    setClarificationAnswers({});
    await runAnalysis(answers);
  };

  const handleGenerateFounderAssets = async () => {
    if (!apiKey || !data || !idea.trim()) {
      return;
    }

    setIsGeneratingAssets(true);
    setError(null);

    try {
      const artifacts = await generateFounderAssets(idea, apiKey, data);
      const nextData = {
        ...data,
        artifacts,
      };

      setData(nextData);
      persistAnalysis(idea, nextData);
    } catch (err: any) {
      const msg = err.message || 'Failed to generate founder assets';
      setError(msg);
    } finally {
      setIsGeneratingAssets(false);
    }
  };

  const handleRunScopedPrompt = async ({
    phaseId,
    targetId,
    instruction,
  }: {
    phaseId: LabPhaseId;
    targetId: WidgetTargetId;
    instruction: string;
  }) => {
    if (!apiKey || !data || !idea.trim()) {
      return;
    }

    const busyKey = `${phaseId}:${targetId}`;
    setActiveMutationTarget(busyKey);
    setError(null);

    try {
      const result = await generateWidgetMutation(idea, apiKey, data, {
        phaseId,
        targetId,
        instruction,
      });

      setData(result.data);
      setShowResults(true);
      setInterruptQuestions(null);

      const historyEntry: LabPromptHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        phaseId,
        targetId,
        instruction,
        summary: result.summary,
        createdAt: new Date().toISOString(),
      };

      const currentRecord = activeSavedRecord;
      const nextPromptHistory = [...(currentRecord?.promptHistory || []), historyEntry].slice(-18);

      let targetRecordId = currentRecord?.id || null;
      let parentId = currentRecord?.parentId || null;

      if (currentRecord && !currentRecord.parentId) {
        targetRecordId = null;
        parentId = currentRecord.id;
      }

      persistAnalysis(idea, result.data, targetRecordId, {
        interruptState: null,
        parentId,
        promptHistory: nextPromptHistory,
      });
      setBranchingFromId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update this widget');
    } finally {
      setActiveMutationTarget(null);
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

      {/* API Key Entry Modal */}
      <ApiKeyEntry
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSubmit={handleKeySubmit}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Error Display */}
        {error && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 border rounded-lg flex items-center gap-3 max-w-2xl mx-auto bg-red-500/10 border-red-500/20"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 text-red-400 hover:text-red-300"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Header Section */}
        <div className="flex flex-col items-center justify-center mb-16 text-center">

          <h1 className="flex flex-col items-center mb-8 leading-[0.85] select-none w-full">
            <AnimatedText
              text="Got an idea?"
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
            Turn a rough spark into a structured startup analysis: market, customers, risks, monetization, distribution, and next build prompts.
          </motion.p>

          {/* Key status indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.4 }}
            className="mb-4"
          >
            {apiKey ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-sans">
                <Key className="w-3 h-3" />
                <span>Gemini connected</span>
                <button
                  onClick={handleClearKey}
                  className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors"
                  aria-label="Clear API key"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowKeyModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-xs font-sans transition-all"
              >
                <Key className="w-3 h-3" />
                <span>Add AI API key to start</span>
              </button>
            )}
          </motion.div>

          {/* Input Section */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            onSubmit={handleLaunch}
            className="w-full max-w-3xl relative z-20"
          >
            <label htmlFor="launchpad-idea" className="sr-only">
              Describe your startup idea
            </label>
            <div className="relative group rounded-2xl md:rounded-full p-[1px] bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-2xl shadow-2xl transition-all duration-500">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-neutral-900/80 rounded-2xl md:rounded-full p-3 md:p-2 md:pl-6 border border-white/5 transition-all duration-500 group-hover:bg-neutral-900/60 focus-within:bg-neutral-900/90 focus-within:ring-1 focus-within:ring-velocity-red/50">

                <input
                  id="launchpad-idea"
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

            <div className="mt-4 flex justify-center">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFounderAssets}
                  onChange={(e) => setIncludeFounderAssets(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-black/30 text-velocity-red focus:ring-velocity-red/40"
                  disabled={isGenerating || isGeneratingAssets}
                />
                <span className="font-sans text-[11px] text-white/55">
                  Include founder assets (waitlist + pitch deck)
                </span>
              </label>
            </div>

            {activeSavedId && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-sans text-white/60">
                <PencilLine className="w-3.5 h-3.5 text-velocity-red" />
                Editing a saved Launchpad run
                <button
                  type="button"
                  onClick={handleStartNewAnalysis}
                  className="ml-2 inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/55 hover:border-white/20 hover:text-white"
                >
                  <Plus className="w-3 h-3" />
                  New
                </button>
              </div>
            )}
          </motion.form>

          {/* Interrupt / Clarification Panel */}
          <AnimatePresence>
            {interruptQuestions && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8 w-full max-w-xl mx-auto"
              >
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageCircle className="w-4 h-4 text-amber-400" />
                      <span className="font-sans text-sm font-semibold text-amber-300">
                        A few quick questions to clarify the idea
                      </span>
                    </div>

                  <div className="space-y-4">
                    {interruptQuestions.map((q) => (
                      <div key={q.field}>
                        <label className="block font-sans text-sm text-white/80 mb-1">
                          {q.question}
                        </label>
                        {q.hint && (
                          <p className="font-sans text-xs text-white/40 mb-2">{q.hint}</p>
                        )}
                        <input
                          type="text"
                          value={clarificationAnswers[q.field] || ''}
                          onChange={(e) =>
                            setClarificationAnswers((prev) => ({ ...prev, [q.field]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-500/40"
                          placeholder="Type your answer..."
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResumeClarification}
                      disabled={Object.values(clarificationAnswers).filter(Boolean).length === 0}
                      className="px-5 py-2.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-sans font-bold uppercase tracking-wide hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Continue Analysis
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipClarification}
                      className="px-4 py-2.5 rounded-full border border-white/10 text-white/50 text-xs font-sans uppercase tracking-wide hover:text-white/80 transition-colors"
                    >
                      Skip And Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Branching indicator */}
          {branchingFromId && !isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.06] px-4 py-2 text-[11px] font-sans text-violet-300"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Branching — edit the idea and relaunch to create a variant
              <button
                type="button"
                onClick={() => { setBranchingFromId(null); handleStartNewAnalysis(); }}
                className="ml-2 p-0.5 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {/* Loading State */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8 flex flex-col items-center"
                role="status"
                aria-live="polite"
              >
                {/* Active node display */}
                <div className="flex items-center gap-3 mb-4">
                  {activeNode && nodeDisplayMap[activeNode] ? (
                    <>
                      {React.createElement(nodeDisplayMap[activeNode].icon, {
                        className: "w-4 h-4 text-velocity-red"
                      })}
                      <span className="font-sans text-sm text-gray-400">
                        {nodeDisplayMap[activeNode].text}...
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-velocity-red" />
                      <span className="font-sans text-sm text-gray-400">
                        Starting analysis...
                      </span>
                    </>
                  )}
                </div>

                {/* Completed nodes indicator */}
                {completedNodes.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    {completedNodes.map((node) => (
                      <div
                        key={node}
                        className="w-2 h-2 rounded-full bg-velocity-red"
                        title={nodeDisplayMap[node]?.text || node}
                      />
                    ))}
                    {Array.from({ length: Math.max(0, TOTAL_NODES - completedNodes.length) }).map((_, i) => (
                      <div
                        key={`pending-${i}`}
                        className="w-2 h-2 rounded-full bg-white/10"
                      />
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                <div className="relative w-64 h-1 bg-white/10 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-velocity-red transition-all duration-500"
                    style={{ width: `${loadingPercent}%` }}
                  />
                  <div
                    className="absolute inset-y-0 w-8 pointer-events-none"
                    style={{
                      left: `calc(${loadingPercent}% - 2rem)`,
                      background: 'radial-gradient(ellipse at right center, rgba(255, 31, 31, 0.6) 0%, rgba(255, 31, 31, 0.3) 30%, transparent 70%)',
                      filter: 'blur(4px)',
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-velocity-red/20 motion-reduce:hidden"
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <span className="font-sans text-[10px] text-gray-500 mt-2">
                  {completedNodes.length}/{TOTAL_NODES} steps
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!showResults && !isGenerating && !interruptQuestions && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6 }}
            className="max-w-4xl mx-auto mb-10"
          >
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-2 overflow-hidden">
              <Player
                component={LaunchpadPreview}
                durationInFrames={PREVIEW_DURATION}
                compositionWidth={PREVIEW_WIDTH}
                compositionHeight={PREVIEW_HEIGHT}
                fps={PREVIEW_FPS}
                loop
                autoPlay
                controls={false}
                clickToPlay={false}
                style={{
                  width: '100%',
                  aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}`,
                  borderRadius: '1.25rem',
                  overflow: 'hidden',
                }}
              />
            </div>
            <p className="mt-3 text-center font-sans text-[11px] uppercase tracking-[0.22em] text-white/35">
              A preview of what Launchpad will do with your idea
            </p>
          </motion.div>
        )}

        {/* Results Dashboard */}
        <div ref={resultsAnchorRef} />
        <LaunchpadDashboard
          data={data}
          analysisId={activeSavedId}
          showResults={showResults}
          onGenerateFounderAssets={handleGenerateFounderAssets}
          isGeneratingAssets={isGeneratingAssets}
          onRunScopedPrompt={handleRunScopedPrompt}
          activeMutationTarget={activeMutationTarget}
          promptHistory={activeSavedRecord?.promptHistory || []}
        />
      </div>
    </section>
  );
};
