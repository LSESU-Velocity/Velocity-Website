/**
 * Phase 3: Execution. Build prompt terminal and the founder asset workspace.
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Copy, Download, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import type { AnalysisData } from '../../lib/api';
import { ArtifactFrame, downloadHtml, normalizePitchDeckHtml, openArtifactInNewTab } from './ArtifactFrame';
import { getPromptPreview } from './shared';

interface ExecutionPhaseProps {
    data: AnalysisData;
    showResults: boolean;
    onGenerateFounderAssets?: () => void;
    isGeneratingAssets: boolean;
}

const CAROUSEL_BUTTON =
    'flex h-7 w-7 flex-shrink-0 items-center justify-center border border-white/15 text-zinc-400 transition-colors hover:border-white/35 hover:text-white';

const ICON_BUTTON =
    'flex h-7 w-7 flex-shrink-0 items-center justify-center border border-white/15 text-zinc-400 transition-colors hover:border-white/35 hover:text-white';

const TEXT_BUTTON =
    'inline-flex items-center gap-2 border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-colors duration-300 hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50';

const pad = (value: number) => value.toString().padStart(2, '0');

export const ExecutionPhase: React.FC<ExecutionPhaseProps> = ({
    data,
    onGenerateFounderAssets,
    isGeneratingAssets,
}) => {
    const [promptChainIndex, setPromptChainIndex] = useState(0);
    const [showFullPrompt, setShowFullPrompt] = useState(false);
    const terminalRef = useRef<HTMLDivElement>(null);
    const inView = useInView(terminalRef, { margin: '80px 0px' });
    const prefersReducedMotion = useReducedMotion();
    const still = Boolean(prefersReducedMotion);

    useEffect(() => {
        setPromptChainIndex(0);
        setShowFullPrompt(false);
        // The data reference, not identity strings: branches share them.
    }, [data]);

    const hasFounderAssets = Boolean(data.artifacts?.waitlistHtml || data.artifacts?.pitchDeckHtml);
    const promptSteps = data.promptChain.length ? data.promptChain : [{
        step: 1,
        title: 'Starter prompt',
        prompt: 'Describe the first user flow, the main screen, and the smallest usable version before building.',
    }];
    const activePromptStep = promptSteps[promptChainIndex % promptSteps.length];

    const copyPrompt = () => {
        navigator.clipboard.writeText(activePromptStep.prompt);
    };

    return (
        <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 xl:grid-cols-12">
            {/* Build prompt terminal */}
            <div ref={terminalRef} className="flex min-w-0 flex-col bg-velocity-black xl:col-span-4">
                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                    <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                        Build prompt <span className="text-velocity-red">Step {pad((promptChainIndex % promptSteps.length) + 1)}/{pad(promptSteps.length)}</span>
                    </p>
                    {promptSteps.length > 1 && (
                        <div className="flex flex-shrink-0 items-center gap-1.5">
                            <button
                                onClick={() => setPromptChainIndex((prev) => (prev - 1 + promptSteps.length) % promptSteps.length)}
                                aria-label="Previous prompt step"
                                className={CAROUSEL_BUTTON}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <span className="select-none font-mono text-[10px] tabular-nums text-zinc-500" aria-live="polite">
                                {(promptChainIndex % promptSteps.length) + 1}/{promptSteps.length}
                            </span>
                            <button
                                onClick={() => setPromptChainIndex((prev) => (prev + 1) % promptSteps.length)}
                                aria-label="Next prompt step"
                                className={CAROUSEL_BUTTON}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col p-5">
                    <p className="font-sans text-sm font-bold tracking-tight text-white">{activePromptStep.title}</p>

                    <div
                        role="button"
                        tabIndex={0}
                        aria-label="Copy prompt to clipboard"
                        onClick={copyPrompt}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyPrompt(); } }}
                        className="mt-3 min-w-0 flex-1 cursor-pointer border border-white/10 bg-black p-4 font-mono text-[11px] leading-relaxed text-zinc-400 transition-colors hover:border-white/25 hover:text-zinc-300"
                    >
                        <span className="text-velocity-red">&gt;</span> {getPromptPreview(activePromptStep.prompt, showFullPrompt)}
                        {still || !inView ? (
                            <span aria-hidden className="ml-1 inline-block h-3 w-[7px] translate-y-[2px] bg-velocity-red" />
                        ) : (
                            <motion.span
                                aria-hidden
                                className="ml-1 inline-block h-3 w-[7px] translate-y-[2px] bg-velocity-red"
                                animate={{ opacity: [1, 1, 0, 0] }}
                                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                            />
                        )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={copyPrompt} className={TEXT_BUTTON}>
                            <Copy className="h-3 w-3" />
                            Copy prompt
                        </button>
                        {activePromptStep.prompt.length > 260 && (
                            <button
                                type="button"
                                onClick={() => setShowFullPrompt((current) => !current)}
                                aria-expanded={showFullPrompt}
                                className={TEXT_BUTTON}
                            >
                                {showFullPrompt ? 'Collapse' : 'Expand'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Founder asset workspace. No transformed ancestors here: the
                artifact iframes must never sit inside an animated element. */}
            <div className="flex min-w-0 flex-col bg-velocity-black xl:col-span-8">
                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                    <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                        Founder assets <span className="text-velocity-red">Waitlist + deck</span>
                    </p>
                </div>

                {hasFounderAssets ? (
                    <div className="grid grid-cols-1 gap-px bg-white/10 md:grid-cols-2">
                        <div className="min-w-0 bg-velocity-black p-4">
                            <div className="flex min-w-0 items-center justify-between gap-3">
                                <p className="min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">Waitlist</p>
                                {data.artifacts?.waitlistHtml && (
                                    <div className="flex flex-shrink-0 gap-1.5">
                                        <button
                                            onClick={() => downloadHtml(data.artifacts!.waitlistHtml!, 'waitlist.html')}
                                            aria-label="Download waitlist page"
                                            className={ICON_BUTTON}
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => openArtifactInNewTab(data.artifacts!.waitlistHtml!)}
                                            aria-label="Preview waitlist page in new tab"
                                            className={ICON_BUTTON}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {data.artifacts?.waitlistHtml ? (
                                <div className="mt-3 h-[300px] border border-white/10 bg-black">
                                    <ArtifactFrame
                                        html={data.artifacts.waitlistHtml}
                                        title="Waitlist preview"
                                        className="h-full w-full border-0 bg-white"
                                    />
                                </div>
                            ) : (
                                <p className="mt-3 border border-dashed border-white/15 px-4 py-6 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                                    No waitlist asset yet
                                </p>
                            )}
                        </div>

                        <div className="min-w-0 bg-velocity-black p-4">
                            <div className="flex min-w-0 items-center justify-between gap-3">
                                <p className="min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">Pitch deck</p>
                                {data.artifacts?.pitchDeckHtml && (
                                    <div className="flex flex-shrink-0 gap-1.5">
                                        <button
                                            onClick={() => openArtifactInNewTab(normalizePitchDeckHtml(data.artifacts!.pitchDeckHtml!))}
                                            aria-label="Open pitch deck fullscreen"
                                            className={ICON_BUTTON}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => downloadHtml(data.artifacts!.pitchDeckHtml!, 'pitch-deck.html')}
                                            aria-label="Download pitch deck"
                                            className={ICON_BUTTON}
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {data.artifacts?.pitchDeckHtml ? (
                                <div className="mt-3 h-[300px] border border-white/10 bg-black">
                                    <ArtifactFrame
                                        html={normalizePitchDeckHtml(data.artifacts.pitchDeckHtml)}
                                        title="Pitch deck preview"
                                        className="h-full w-full border-0"
                                    />
                                </div>
                            ) : (
                                <p className="mt-3 border border-dashed border-white/15 px-4 py-6 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                                    No pitch deck yet
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
                        <p className="min-w-0 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                            No assets <span className="text-velocity-red">Generate waitlist + deck</span>
                        </p>
                        <button
                            onClick={onGenerateFounderAssets}
                            disabled={!onGenerateFounderAssets || isGeneratingAssets}
                            className="inline-flex flex-shrink-0 items-center justify-center gap-2 border border-velocity-red/50 bg-velocity-darkRed/20 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:border-velocity-red hover:bg-velocity-red disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-zinc-600"
                        >
                            {isGeneratingAssets ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Drafting
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Generate
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
