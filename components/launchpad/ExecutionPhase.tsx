/**
 * Phase 3: Execution — founder asset workspace and the build prompt chain.
 */
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Download, ExternalLink, Loader2, Presentation, Sparkles, Terminal } from 'lucide-react';
import type { AnalysisData } from '../../lib/api';
import { Widget } from '../LaunchpadWidgets';
import { ArtifactFrame, downloadHtml, normalizePitchDeckHtml, openArtifactInNewTab } from './ArtifactFrame';
import { getPromptPreview } from './shared';

interface ExecutionPhaseProps {
    data: AnalysisData;
    showResults: boolean;
    onGenerateFounderAssets?: () => void;
    isGeneratingAssets: boolean;
}

export const ExecutionPhase: React.FC<ExecutionPhaseProps> = ({
    data,
    showResults,
    onGenerateFounderAssets,
    isGeneratingAssets,
}) => {
    const [promptChainIndex, setPromptChainIndex] = useState(0);
    const [showFullPrompt, setShowFullPrompt] = useState(false);

    useEffect(() => {
        setPromptChainIndex(0);
        setShowFullPrompt(false);
    }, [data.identity?.name, data.identity?.tagline]);

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
        <>
            <Widget title="Founder Asset Workspace" icon={Presentation} visible={showResults}>
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="font-sans text-sm text-white">Optional founder assets</p>
                            <p className="font-sans text-xs text-white/45 mt-1 leading-relaxed">
                                Generate the waitlist page and pitch deck only when you need them, then iterate on each one with the execution prompt above.
                            </p>
                        </div>

                        {!hasFounderAssets && (
                            <button
                                onClick={onGenerateFounderAssets}
                                disabled={!onGenerateFounderAssets || isGeneratingAssets}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-sans font-semibold uppercase tracking-[0.18em] text-white hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isGeneratingAssets ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating Assets
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Generate Founder Assets
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <p className="font-sans text-sm text-white">Waitlist page</p>
                                {data.artifacts?.waitlistHtml && (
                                    <div className="flex gap-2">
                                        <button onClick={() => downloadHtml(data.artifacts!.waitlistHtml!, 'waitlist.html')} aria-label="Download waitlist page" className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openArtifactInNewTab(data.artifacts!.waitlistHtml!)} aria-label="Preview waitlist page in new tab" className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {data.artifacts?.waitlistHtml ? (
                                <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
                                    <div className="mx-auto w-full max-w-[330px] rounded-[2.8rem] border border-white/10 bg-[#050505] p-[12px] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                                        <div className="relative overflow-hidden rounded-[2.25rem] border border-white/5 bg-black aspect-[9/19.5]">
                                            <div className="pointer-events-none absolute left-1/2 top-3 z-10 h-6 w-28 -translate-x-1/2 rounded-full border border-white/5 bg-black/90" />
                                            <ArtifactFrame
                                                html={data.artifacts.waitlistHtml}
                                                title="Waitlist preview"
                                                className="absolute inset-0 h-[200%] w-[200%] origin-top-left scale-50 border-0 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center font-sans text-sm text-white/45">
                                    No waitlist asset generated yet.
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <p className="font-sans text-sm text-white">Pitch deck</p>
                                {data.artifacts?.pitchDeckHtml && (
                                    <div className="flex gap-2">
                                        <button onClick={() => openArtifactInNewTab(normalizePitchDeckHtml(data.artifacts!.pitchDeckHtml!))} aria-label="Open pitch deck fullscreen" className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => downloadHtml(data.artifacts!.pitchDeckHtml!, 'pitch-deck.html')} aria-label="Download pitch deck" className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {data.artifacts?.pitchDeckHtml ? (
                                <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-white/10 bg-black">
                                    <ArtifactFrame
                                        html={normalizePitchDeckHtml(data.artifacts.pitchDeckHtml)}
                                        title="Pitch deck preview"
                                        className="h-full w-full border-0"
                                    />
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center font-sans text-sm text-white/45">
                                    No pitch deck generated yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Widget>

            <Widget
                title="Prompt Chain"
                icon={Terminal}
                visible={showResults}
                action={
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPromptChainIndex((prev) => (prev - 1 + promptSteps.length) % promptSteps.length)}
                            aria-label="Previous prompt step"
                            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-sans text-[10px] text-white/45 tabular-nums px-1" aria-live="polite">
                            {(promptChainIndex % promptSteps.length) + 1}/{promptSteps.length}
                        </span>
                        <button
                            onClick={() => setPromptChainIndex((prev) => (prev + 1) % promptSteps.length)}
                            aria-label="Next prompt step"
                            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                }
            >
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/40 mb-2">
                    Step {activePromptStep.step}
                </p>
                <h3 className="font-sans text-xl font-black tracking-tight text-white">{activePromptStep.title}</h3>
                <p className="mt-3 font-sans text-sm text-white/50 leading-relaxed">
                    Cycle through the build phases, or update the entire prompt chain from the execution prompt above.
                </p>
                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Copy prompt to clipboard"
                    onClick={copyPrompt}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyPrompt(); } }}
                    className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-5 font-mono text-sm text-gray-300 leading-relaxed cursor-pointer hover:bg-white/[0.05] transition-colors mt-5"
                >
                    {getPromptPreview(activePromptStep.prompt, showFullPrompt)}
                    <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-velocity-red px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-white">
                        <Copy className="w-3 h-3" />
                        Copy
                    </div>
                </div>
                {activePromptStep.prompt.length > 260 && (
                    <button
                        type="button"
                        onClick={() => setShowFullPrompt((current) => !current)}
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-sans uppercase tracking-[0.18em] text-white/60 hover:text-white"
                    >
                        {showFullPrompt ? 'Collapse Prompt' : 'Show Full Prompt'}
                    </button>
                )}
            </Widget>
        </>
    );
};
