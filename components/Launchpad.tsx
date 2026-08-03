import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Loader2, AlertTriangle, Key, X, PencilLine, Plus, GitBranch } from 'lucide-react';
import { ApiKeyEntry } from './ApiKeyEntry';
import {
  detectKeyProvider,
  generateAnalysisStream,
  generateFounderAssets,
  generateWidgetMutation,
  AnalysisInterruptError,
  PROVIDER_LABELS,
  type AnalysisData,
  type AnalysisIntake,
  type ClarificationQuestion,
  type LabPhaseId,
  type LabPromptHistoryEntry,
  type ProgressEvent,
  type WidgetTargetId,
} from '../lib/api';
import { LaunchpadDashboard } from './LaunchpadDashboard';
import { AnimatedText } from './LaunchpadWidgets';
import { SavedRunsPanel } from './launchpad/SavedRunsPanel';
import { deleteSavedAnalysis, getSavedAnalyses, type SavedLaunchpadAnalysis, upsertSavedAnalysis } from '../lib/launchpad-storage';

// The Remotion player + scripted demo is ~a third of this route's weight and
// purely decorative: split it so the idea input is interactive sooner.
const PreviewPlayer = lazy(() => import('./launchpad/PreviewPlayer'));
const PREVIEW_ASPECT_RATIO = '1280 / 720';

const SESSION_KEY = 'launchpad_provider_key';
const PERSIST_KEY = 'launchpad_provider_key_persist';
const LEGACY_SESSION_KEY = 'launchpad_gemini_key';
const LEGACY_PERSIST_KEY = 'launchpad_gemini_key_persist';

/** The rail printed under the hero, mirroring the homepage pipeline schematic. */
const STAGE_RAIL = ['Bull', 'Bear', 'Market', 'Position', 'Build'];

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

interface LiveFeedEntry {
  id: string;
  label: string;
  detail: string;
  tone: 'neutral' | 'bull' | 'bear' | 'judge';
}

/** Turn a progress payload into a short live-feed line, or null to skip it. */
function buildLiveFeedEntry(event: ProgressEvent): LiveFeedEntry | null {
  const data = (event.data ?? null) as Record<string, any> | null;
  if (!data) {
    return null;
  }

  if (event.node === 'classifyIdea' && data.intake) {
    const intake = data.intake as AnalysisIntake;
    return {
      id: event.node,
      label: 'Idea classified',
      detail: `${intake.domain} • ${intake.targetUser}`,
      tone: 'neutral',
    };
  }

  if (event.node === 'researchWeb') {
    if (data.skipped) {
      return {
        id: event.node,
        label: 'Web research',
        detail: 'Grounded search is Gemini-only: continuing without live sources.',
        tone: 'neutral',
      };
    }
    if (typeof data.summary === 'string') {
      return {
        id: event.node,
        label: `Web research • ${data.sourceCount ?? 0} sources`,
        detail: data.summary,
        tone: 'neutral',
      };
    }
  }

  if (event.node === 'runBullAnalyst' && data.memo?.recommendation) {
    return { id: event.node, label: 'Bull analyst', detail: data.memo.recommendation, tone: 'bull' };
  }

  if (event.node === 'runBearAnalyst' && data.memo?.recommendation) {
    return { id: event.node, label: 'Bear analyst', detail: data.memo.recommendation, tone: 'bear' };
  }

  if (event.node === 'runCouncilJudge' && data.judge?.finalTake) {
    return {
      id: event.node,
      label: `Council judge • ${data.judge.verdict || 'verdict'}`,
      detail: data.judge.finalTake,
      tone: 'judge',
    };
  }

  return null;
}

const LIVE_FEED_TONES: Record<LiveFeedEntry['tone'], string> = {
  neutral: 'text-zinc-500',
  bull: 'text-white',
  bear: 'text-velocity-red',
  judge: 'text-white',
};

const LIVE_FEED_MARKERS: Record<LiveFeedEntry['tone'], string> = {
  neutral: 'bg-white/25',
  bull: 'bg-white',
  bear: 'bg-velocity-red',
  judge: 'bg-velocity-red',
};

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
  const [interruptIntake, setInterruptIntake] = useState<AnalysisIntake | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [branchingFromId, setBranchingFromId] = useState<string | null>(null);
  const [activeMutationTarget, setActiveMutationTarget] = useState<string | null>(null);
  const [liveFeed, setLiveFeed] = useState<LiveFeedEntry[]>([]);

  const prefersReducedMotion = useReducedMotion();
  const still = Boolean(prefersReducedMotion);

  const progressAnchorRef = useRef<HTMLDivElement>(null);
  const resultsAnchorRef = useRef<HTMLDivElement>(null);
  const hasScrolledToProgressRef = useRef(false);
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
  const nodeDisplayMap: Record<string, { text: string; rail: string }> = {
    classifyIdea: { text: "Classifying idea", rail: 'Classify' },
    normalizeIntake: { text: "Preparing analysis", rail: 'Prepare' },
    researchWeb: { text: "Grounding live sources", rail: 'Research' },
    runBullAnalyst: { text: "Bull analyst evaluating", rail: 'Bull' },
    runBearAnalyst: { text: "Bear analyst stress-testing", rail: 'Bear' },
    runCouncilJudge: { text: "Council judge deciding", rail: 'Judge' },
    synthesizeOpportunity: { text: "Synthesizing findings", rail: 'Synthesize' },
    qaAndRepair: { text: "Validating report", rail: 'Validate' },
    retry: { text: "Retrying with fallback model", rail: 'Retry' },
  };

  // The eight graph nodes drawn on the build-log rail, in run order.
  const PIPELINE_NODES = [
    'classifyIdea',
    'normalizeIntake',
    'researchWeb',
    'runBullAnalyst',
    'runBearAnalyst',
    'runCouncilJudge',
    'synthesizeOpportunity',
    'qaAndRepair',
  ];

  const TOTAL_NODES = 8;

  const loadingPercent = isGenerating
    ? Math.min(Math.floor((completedNodes.length / TOTAL_NODES) * 99), 99)
    : 0;

  useEffect(() => {
    if (!isGenerating) {
      hasScrolledToProgressRef.current = false;
      return;
    }

    if (hasScrolledToProgressRef.current) {
      return;
    }

    hasScrolledToProgressRef.current = true;
    const timeoutId = window.setTimeout(() => {
      requestAnimationFrame(() => {
        const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth';

        progressAnchorRef.current?.scrollIntoView({
          behavior,
          block: 'center',
        });
      });
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [isGenerating]);

  // Clear transient progress state when a run ends. Depends only on
  // isGenerating: including completedNodes here loops, because resetting it
  // creates a new [] reference that re-fires the effect.
  useEffect(() => {
    if (isGenerating) return;
    setActiveNode(null);
    setCompletedNodes((prev) => (prev.length === 0 ? prev : []));
    setLiveFeed((prev) => (prev.length === 0 ? prev : []));
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
    nextData: AnalysisData | null,
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
    setInterruptIntake(null);
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
    setLiveFeed([]);
    setInterruptQuestions(null);

    const handleProgress = (event: ProgressEvent) => {
      if (event.status === 'running') {
        setActiveNode(event.node);
      } else if (event.status === 'done') {
        setCompletedNodes(prev => prev.includes(event.node) ? prev : [...prev, event.node]);

        const feedEntry = buildLiveFeedEntry(event);
        if (feedEntry) {
          setLiveFeed(prev => prev.some(entry => entry.id === feedEntry.id) ? prev : [...prev, feedEntry]);
        }
      }
    };

    try {
      const result = await generateAnalysisStream(idea, apiKey, handleProgress, {
        clarifications: streamClarifications || null,
        intake: streamClarifications ? interruptIntake : null,
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
      setInterruptIntake(null);

      const parentId = branchingFromId || null;
      persistAnalysis(idea, nextData, activeSavedId, { interruptState: null, parentId });
      setBranchingFromId(null);
    } catch (err: any) {
      if (err instanceof AnalysisInterruptError) {
        setInterruptQuestions(err.interrupt.questions);
        setInterruptIntake(err.interrupt.partialIntake || null);
        setClarificationAnswers({});

        const interruptSnapshot = {
          reason: err.interrupt.reason,
          questions: err.interrupt.questions,
        };
        // No analysis exists yet at interrupt time: persist the interrupt
        // marker alone instead of a stale or empty data object.
        persistAnalysis(idea, null, activeSavedId, {
          interruptState: interruptSnapshot,
          parentId: branchingFromId || null,
        });
        return;
      }

      const msg = err.message || 'Failed to generate analysis';
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes('api key') || lowerMsg.includes('key was rejected') || lowerMsg.includes('unauthorized') || lowerMsg.includes('403')) {
        setError(msg.includes('rejected') ? msg : 'Your AI provider key was rejected. Please check it and try again.');
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
    // Skip means proceed without answers: an empty object tells the server
    // the clarification step already happened.
    setInterruptQuestions(null);
    setClarificationAnswers({});
    await runAnalysis({});
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

  const handleLoadSavedRecord = (record: SavedLaunchpadAnalysis) => {
    if (!record.data) return;
    setIdea(record.idea);
    setData(record.data);
    setActiveSavedId(record.id);
    setBranchingFromId(null);
    setError(null);
    setInterruptQuestions(null);
    setInterruptIntake(null);
  };

  const handleBranchSavedRecord = (record: SavedLaunchpadAnalysis) => {
    if (!record.data) return;
    setIdea(record.idea);
    setData(record.data);
    setActiveSavedId(null);
    setBranchingFromId(record.id);
    setError(null);
    setInterruptQuestions(null);
    setInterruptIntake(null);
  };

  const handleDeleteSavedRecord = (record: SavedLaunchpadAnalysis) => {
    deleteSavedAnalysis(record.id);
    setSavedAnalyses(getSavedAnalyses());
    if (activeSavedId === record.id) {
      setActiveSavedId(null);
    }
    if (branchingFromId === record.id) {
      setBranchingFromId(null);
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

  const activeNodeLabel = activeNode && nodeDisplayMap[activeNode]
    ? nodeDisplayMap[activeNode].text
    : 'Starting analysis';

  return (
    <section className="relative min-h-screen overflow-hidden px-6 pb-24 pt-28 md:pt-36">
      {/* API Key Entry Modal */}
      <ApiKeyEntry
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSubmit={handleKeySubmit}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Error Display */}
        {error && (
          <motion.div
            role="alert"
            initial={still ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-start gap-3 border border-velocity-red/40 bg-velocity-darkRed/20 px-4 py-3"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-velocity-red" />
            <p className="min-w-0 flex-1 font-sans text-sm leading-relaxed text-zinc-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-zinc-400 transition-colors hover:text-white"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* Hero + command bar */}
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
          <motion.p
            initial={still ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 md:text-[11px]"
          >
            Launchpad <span className="text-velocity-red">//</span> Idea in. Analysis out.
          </motion.p>

          <h1 className="mt-8 flex w-full select-none flex-col items-center leading-[0.85]">
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
            initial={still ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: still ? 0 : 1.4, ease: 'easeOut' }}
            className="mt-6 max-w-xl font-sans text-sm leading-relaxed text-zinc-400 md:text-base"
          >
            A rough spark goes in. Market, customers, risks, monetization, distribution
            and the next build prompts come out.
          </motion.p>

          {/* Stage rail: the pipeline this console drives */}
          <motion.div
            initial={still ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: still ? 0 : 1.5 }}
            className="mt-8 w-full border-y border-white/10 py-3"
          >
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.26em] text-zinc-500">
              {STAGE_RAIL.map((stage, index) => (
                <React.Fragment key={stage}>
                  {index > 0 && <span className="text-velocity-red">/</span>}
                  <span>{stage}</span>
                </React.Fragment>
              ))}
            </p>
          </motion.div>

          {/* Provider status */}
          <motion.div
            initial={still ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: still ? 0 : 1.6 }}
            className="mt-8"
          >
            {apiKey ? (
              <span className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                <Key className="h-3 w-3 text-velocity-red" />
                Model <span className="text-velocity-red">//</span>
                {PROVIDER_LABELS[detectKeyProvider(apiKey)]} connected
                <button
                  onClick={handleClearKey}
                  className="ml-1 text-zinc-500 transition-colors hover:text-white"
                  aria-label="Clear API key"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : (
              <button
                onClick={() => setShowKeyModal(true)}
                className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 transition-colors hover:border-white/35 hover:text-white"
              >
                <Key className="h-3 w-3" />
                Connect model key
              </button>
            )}
          </motion.div>

          {/* Command bar */}
          <motion.form
            initial={still ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: still ? 0 : 1.6, ease: 'easeOut' }}
            onSubmit={handleLaunch}
            className="relative z-20 mt-3 w-full max-w-3xl text-left"
          >
            <label htmlFor="launchpad-idea" className="sr-only">
              Describe your startup idea
            </label>
            <div className="flex flex-col border border-white/15 bg-velocity-black transition-colors duration-300 focus-within:border-velocity-red/60 md:flex-row md:items-stretch">
              <span aria-hidden className="hidden items-center pl-4 font-mono text-sm text-velocity-red md:flex">
                &gt;
              </span>
              <input
                id="launchpad-idea"
                type="text"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe the idea in one sentence"
                className="w-full min-w-0 flex-1 appearance-none bg-transparent px-4 py-4 font-mono text-sm text-white outline-none placeholder:text-zinc-600 md:px-3"
                disabled={isGenerating}
                maxLength={500}
              />

              <button
                type="submit"
                disabled={isGenerating || !idea}
                className="group flex flex-shrink-0 items-center justify-center gap-3 border-t border-white/15 bg-velocity-red px-6 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:bg-velocity-red/85 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-zinc-600 md:border-l md:border-t-0"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Run analysis
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:transform-none" />
                  </>
                )}
              </button>
            </div>

            <label className="mt-px flex cursor-pointer items-center gap-3 border border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 transition-colors hover:text-zinc-300">
              <input
                type="checkbox"
                checked={includeFounderAssets}
                onChange={(e) => setIncludeFounderAssets(e.target.checked)}
                className="h-3.5 w-3.5 flex-shrink-0 appearance-none border border-white/25 bg-black outline-none transition-colors checked:border-velocity-red checked:bg-velocity-red focus-visible:border-velocity-red disabled:opacity-40"
                disabled={isGenerating || isGeneratingAssets}
              />
              Also draft waitlist + deck
            </label>

            {activeSavedId && (
              <div className="mt-px flex flex-wrap items-center gap-3 border border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                <PencilLine className="h-3 w-3 flex-shrink-0 text-velocity-red" />
                Editing saved run
                <button
                  type="button"
                  onClick={handleStartNewAnalysis}
                  className="ml-auto inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1 text-zinc-400 transition-colors hover:border-white/35 hover:text-white"
                >
                  <Plus className="h-2.5 w-2.5" />
                  New
                </button>
              </div>
            )}

            {branchingFromId && !isGenerating && (
              <div className="mt-px flex flex-wrap items-center gap-3 border border-velocity-red/40 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                <GitBranch className="h-3 w-3 flex-shrink-0 text-velocity-red" />
                Branch mode <span className="text-velocity-red">//</span> Edit, then rerun
                <button
                  type="button"
                  onClick={() => { setBranchingFromId(null); handleStartNewAnalysis(); }}
                  className="ml-auto text-zinc-500 transition-colors hover:text-white"
                  aria-label="Exit branch mode"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </motion.form>
        </div>

        {/* Interrupt / Clarification Panel. Rendered conditionally rather than
            through AnimatePresence: a stalled exit would leave an invisible
            block holding vertical space in the flow. */}
        {interruptQuestions && !isGenerating && (
          <motion.div
            initial={still ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mx-auto mt-8 w-full max-w-3xl border border-velocity-red/40 bg-velocity-black p-5 text-left md:p-6"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
              Clarify <span className="text-velocity-red">//</span> A few quick questions
            </p>

            <div className="mt-5 space-y-4">
              {interruptQuestions.map((q) => (
                <div key={q.field} className="min-w-0">
                  <label
                    htmlFor={`clarify-${q.field}`}
                    className="block font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400"
                  >
                    {q.question}
                  </label>
                  {q.hint && (
                    <p className="mt-1.5 font-sans text-xs leading-relaxed text-zinc-500">{q.hint}</p>
                  )}
                  <input
                    id={`clarify-${q.field}`}
                    type="text"
                    value={clarificationAnswers[q.field] || ''}
                    onChange={(e) =>
                      setClarificationAnswers((prev) => ({ ...prev, [q.field]: e.target.value }))
                    }
                    className="mt-2 w-full border border-white/10 bg-black px-3 py-2.5 font-mono text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-velocity-red/60"
                    placeholder="Type your answer"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleResumeClarification}
                disabled={Object.values(clarificationAnswers).filter(Boolean).length === 0}
                className="border border-velocity-red/50 bg-velocity-darkRed/20 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:border-velocity-red hover:bg-velocity-red disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-zinc-600"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={handleSkipClarification}
                className="border border-white/15 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400 transition-colors duration-300 hover:border-white/35 hover:text-white"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}

        {/* Build log */}
        {isGenerating && (
          <motion.div
            ref={progressAnchorRef}
            data-testid="launchpad-live-progress"
            initial={still ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mx-auto mt-10 w-full max-w-4xl"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                Build log <span className="text-velocity-red">//</span> {completedNodes.length}/{TOTAL_NODES}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                {activeNodeLabel}
              </p>
            </div>

            {/* Node rail */}
            <div className="mt-4 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-4 lg:grid-cols-8">
              {PIPELINE_NODES.map((node) => {
                const done = completedNodes.includes(node);
                const active = activeNode === node;

                return (
                  <div
                    key={node}
                    className={`flex min-w-0 flex-col gap-2 px-3 py-3 ${active ? 'bg-velocity-darkRed/25' : 'bg-velocity-black'}`}
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 flex-shrink-0 ${
                        active
                          ? 'bg-velocity-red shadow-[0_0_10px_rgba(255,31,31,0.9)]'
                          : done
                            ? 'bg-velocity-red'
                            : 'bg-white/15'
                      }`}
                    />
                    <span
                      className={`truncate font-mono text-[9px] uppercase tracking-[0.16em] ${
                        active ? 'text-white' : done ? 'text-zinc-400' : 'text-zinc-600'
                      }`}
                    >
                      {nodeDisplayMap[node].rail}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress rail */}
            <div className="relative mt-px h-px w-full bg-white/10">
              <div
                className="absolute inset-0 origin-left bg-velocity-red transition-transform duration-500 motion-reduce:transition-none"
                style={{ transform: `scaleX(${loadingPercent / 100})` }}
              />
            </div>

            {/* Streaming ledger */}
            {liveFeed.length > 0 && (
              <div className="mt-4 border border-white/10 bg-black">
                {/* Entries only ever append, so each one animates itself on
                    mount; no presence tracking is needed. */}
                {liveFeed.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={still ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex min-w-0 items-start gap-3 border-b border-white/5 px-4 py-3 last:border-b-0"
                  >
                    <span aria-hidden className={`mt-[7px] h-1.5 w-1.5 flex-shrink-0 ${LIVE_FEED_MARKERS[entry.tone]}`} />
                    <p className="min-w-0 font-mono text-[11px] leading-relaxed">
                      <span className={`uppercase tracking-[0.16em] ${LIVE_FEED_TONES[entry.tone]}`}>
                        {entry.label} <span className="text-velocity-red">//</span>
                      </span>{' '}
                      <span className="text-zinc-400">{entry.detail}</span>
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {!isGenerating && (
          <SavedRunsPanel
            records={savedAnalyses}
            activeId={activeSavedId}
            onLoad={handleLoadSavedRecord}
            onBranch={handleBranchSavedRecord}
            onDelete={handleDeleteSavedRecord}
            onRecordsChanged={() => setSavedAnalyses(getSavedAnalyses())}
          />
        )}

        {!showResults && !isGenerating && !interruptQuestions && (
          <motion.div
            initial={still ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: still ? 0 : 1.8, ease: 'easeOut' }}
            className="mx-auto mt-12 w-full max-w-4xl"
          >
            <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              Live demo <span className="text-velocity-red">//</span> Idea to build plan
            </p>
            <div className="border border-white/10 bg-velocity-black">
              <Suspense
                fallback={
                  <div
                    className="w-full animate-pulse bg-white/[0.03] motion-reduce:animate-none"
                    style={{ aspectRatio: PREVIEW_ASPECT_RATIO }}
                  />
                }
              >
                <PreviewPlayer />
              </Suspense>
            </div>
          </motion.div>
        )}

        {/* Results Dashboard */}
        <div ref={resultsAnchorRef} />
        <LaunchpadDashboard
          data={data}
          idea={idea}
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
