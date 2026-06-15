import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpenText, FileDown } from 'lucide-react';
import type { AnalysisData, CitationRef, LabPhaseId, LabPromptHistoryEntry, SourceDocument, WidgetTargetId } from '../lib/api';
import { buildAnalysisReportHtml } from '../lib/launchpad-report';
import { downloadHtml } from './launchpad/ArtifactFrame';
import { CountUpNumber, useRevealGroup } from './launchpad/gsapFx';
import {
    CitationLinks,
    PhaseDivider,
    PhasePromptComposer,
    buildFallbackJudge,
    createFallbackLab,
    getLatestPromptForPhase,
    hasValidLab,
    normalizeExternalHref,
} from './launchpad/shared';
import { ValidationPhase } from './launchpad/ValidationPhase';
import { StrategyPhase } from './launchpad/StrategyPhase';
import { ExecutionPhase } from './launchpad/ExecutionPhase';

interface LaunchpadDashboardProps {
    data: AnalysisData | null;
    idea?: string;
    analysisId?: string | null;
    showResults: boolean;
    onGenerateFounderAssets?: () => void;
    isGeneratingAssets?: boolean;
    onRunScopedPrompt?: (input: { phaseId: LabPhaseId; targetId: WidgetTargetId; instruction: string }) => void | Promise<void>;
    activeMutationTarget?: string | null;
    promptHistory?: LabPromptHistoryEntry[];
}

export const LaunchpadDashboard: React.FC<LaunchpadDashboardProps> = ({
    data,
    idea = '',
    analysisId = null,
    showResults,
    onGenerateFounderAssets,
    isGeneratingAssets = false,
    onRunScopedPrompt,
    activeMutationTarget,
    promptHistory = [],
}) => {
    const revealRef = useRevealGroup<HTMLDivElement>();
    const [phasePrompts, setPhasePrompts] = useState<Record<LabPhaseId, string>>({
        validation: '',
        strategy: '',
        execution: '',
    });
    const [selectedTargets, setSelectedTargets] = useState<Record<LabPhaseId, WidgetTargetId>>({
        validation: 'validation',
        strategy: 'strategy',
        execution: 'waitlist',
    });

    useEffect(() => {
        setPhasePrompts({
            validation: '',
            strategy: '',
            execution: '',
        });
        setSelectedTargets({
            validation: 'validation',
            strategy: 'strategy',
            execution: 'waitlist',
        });
    }, [data?.identity?.name, data?.identity?.tagline]);

    if (!data) return null;

    const fallbackLab = createFallbackLab(data);
    const lab = hasValidLab(data.lab) ? data.lab : fallbackLab;
    const councilJudge = lab.council.judge || buildFallbackJudge(
        lab.council.bull || fallbackLab.council.bull!,
        lab.council.bear || fallbackLab.council.bear!,
        lab.summary.recommendation,
    );

    const sourceDocuments = Array.isArray(data.sources.documents) ? data.sources.documents : [];
    const sourceMap = new Map<string, SourceDocument>(sourceDocuments.map((source) => [source.id, source]));
    const sourcesPageHref = analysisId ? `/launchpad/sources/${analysisId}` : null;
    const hasGroundedSources = Boolean(
        sourceDocuments.length ||
        data.validation.marketReports.length ||
        data.sources.market.length ||
        data.sources.competitors.length ||
        (data.sources.channels?.length || 0),
    );

    const renderCitation = (
        citation?: CitationRef | null,
        keyPrefix = 'citation',
        options?: { interactive?: boolean },
    ) => (
        <CitationLinks
            citation={citation}
            keyPrefix={keyPrefix}
            sourceMap={sourceMap}
            sourcesPageHref={sourcesPageHref}
            interactive={options?.interactive}
        />
    );

    const getChannelHref = (channelName: string, index: number) => {
        const citedUrl = data.citations?.strategy?.distributionChannels?.[index]?.sourceIds
            ?.map((sourceId) => normalizeExternalHref(sourceMap.get(sourceId)?.url))
            .find((value): value is string => Boolean(value));

        return citedUrl || `https://google.com/search?q=${encodeURIComponent(channelName)}`;
    };

    const handleDownloadReport = () => {
        const reportHtml = buildAnalysisReportHtml({ idea, data });
        const safeName = (data.identity.name || 'launchpad-analysis').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        downloadHtml(reportHtml, `${safeName || 'launchpad-analysis'}-report.html`);
    };

    const updatePhasePrompt = (phaseId: LabPhaseId, value: string) => {
        setPhasePrompts((current) => ({
            ...current,
            [phaseId]: value,
        }));
    };

    const updateSelectedTarget = (phaseId: LabPhaseId, targetId: WidgetTargetId) => {
        setSelectedTargets((current) => ({ ...current, [phaseId]: targetId }));
    };

    const handleApplyPhasePrompt = (phaseId: LabPhaseId) => {
        const instruction = phasePrompts[phaseId].trim();
        if (!instruction || !onRunScopedPrompt) {
            return;
        }

        onRunScopedPrompt({
            phaseId,
            targetId: selectedTargets[phaseId],
            instruction,
        });

        setPhasePrompts((current) => ({
            ...current,
            [phaseId]: '',
        }));
    };

    const renderComposer = (phaseId: LabPhaseId, title: string, description: string) => (
        <PhasePromptComposer
            phaseId={phaseId}
            title={title}
            description={description}
            promptValue={phasePrompts[phaseId]}
            onPromptChange={updatePhasePrompt}
            targetId={selectedTargets[phaseId]}
            onTargetChange={updateSelectedTarget}
            latestPrompt={getLatestPromptForPhase(promptHistory, phaseId)}
            isBusy={activeMutationTarget === `${phaseId}:${selectedTargets[phaseId]}`}
            applyDisabled={!phasePrompts[phaseId].trim() || !onRunScopedPrompt || Boolean(activeMutationTarget)}
            onApply={handleApplyPhasePrompt}
        />
    );

    return (
        <AnimatePresence>
            {showResults && (
                <motion.div
                    ref={revealRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-8 max-w-[1440px] mx-auto py-8"
                >
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
                        <div data-reveal className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-black p-6 shadow-2xl">
                            <div className="pointer-events-none absolute -top-28 right-0 h-56 w-[28rem] rounded-full bg-velocity-red/10 blur-[110px]" />
                            <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/35">Launchpad</p>
                                    <h2 className="mt-3 font-sans text-3xl font-black tracking-tight text-white md:text-4xl">{data.identity.name}</h2>
                                    <p className="mt-3 font-sans text-base italic text-white/70">{data.identity.tagline}</p>
                                    <p className="mt-5 max-w-3xl font-sans text-sm leading-relaxed text-white/80">
                                        {lab.summary.recommendation}
                                        {renderCitation(data.citations?.summary?.recommendation, 'summary-recommendation')}
                                    </p>
                                </div>

                                <div className="relative z-[60] flex flex-col items-start gap-2 pointer-events-auto md:items-end">
                                    {sourcesPageHref && hasGroundedSources ? (
                                        <div className="flex flex-wrap gap-2">
                                            {sourceDocuments.length > 0 && (
                                                <span className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] text-sky-200">
                                                    {sourceDocuments.length} sources
                                                </span>
                                            )}
                                            {(data.sources.queries?.length || 0) > 0 && (
                                                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] text-white/60">
                                                    {data.sources.queries!.length} searches
                                                </span>
                                            )}
                                        </div>
                                    ) : null}
                                    <div className="flex flex-wrap gap-2">
                                        {sourcesPageHref && hasGroundedSources ? (
                                            <a
                                                href={sourcesPageHref}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    window.location.assign(sourcesPageHref);
                                                }}
                                                className="relative z-[70] inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-white hover:bg-white/10"
                                            >
                                                <BookOpenText className="w-3.5 h-3.5" />
                                                Sources Page
                                            </a>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={handleDownloadReport}
                                            className="relative z-[70] inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-white hover:bg-white/10"
                                        >
                                            <FileDown className="w-3.5 h-3.5" />
                                            Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-1">
                            <div data-reveal className="rounded-[1.7rem] border border-white/5 bg-black p-5 shadow-2xl">
                                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-blue-300/80">Confidence</p>
                                <p className="mt-3 font-sans text-3xl font-black tracking-tight text-white">
                                    <CountUpNumber value={lab.summary.confidenceScore} />
                                    <span className="text-lg text-white/35">/100</span>
                                </p>
                                <p className="mt-2 font-sans text-xs uppercase tracking-[0.16em] text-velocity-red">{lab.summary.confidenceLabel}</p>
                            </div>
                            <div data-reveal className="rounded-[1.7rem] border border-white/5 bg-black p-5 shadow-2xl">
                                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-blue-300/80">Open risk</p>
                                <p className="mt-3 font-sans text-sm leading-relaxed text-white/80">
                                    {lab.summary.openRisks[0]}
                                    {renderCitation(data.citations?.summary?.openRisks?.[0], 'summary-open-risk')}
                                </p>
                            </div>
                            <div data-reveal className="rounded-[1.7rem] border border-white/5 bg-black p-5 shadow-2xl">
                                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-blue-300/80">Next move</p>
                                <p className="mt-3 font-sans text-sm leading-relaxed text-white/80">
                                    {lab.summary.nextMoves[0]}
                                    {renderCitation(data.citations?.summary?.nextMoves?.[0], 'summary-next-move')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <PhaseDivider label="Phase 1: Validation" />

                    {renderComposer(
                        'validation',
                        'Scenario prompt',
                        'Use one prompt to test a validation shift, or target just the market sizing / market position widget.',
                    )}

                    <ValidationPhase
                        data={data}
                        lab={lab}
                        councilJudge={councilJudge}
                        showResults={showResults}
                        renderCitation={renderCitation}
                    />

                    <PhaseDivider label="Phase 2: Strategy" />

                    {renderComposer(
                        'strategy',
                        'Scenario prompt',
                        'Use one prompt to test pricing, customer, or channel shifts without regenerating the entire analysis.',
                    )}

                    <StrategyPhase
                        data={data}
                        showResults={showResults}
                        renderCitation={renderCitation}
                        getChannelHref={getChannelHref}
                    />

                    <PhaseDivider label="Phase 3: Execution" />

                    {renderComposer(
                        'execution',
                        'Asset prompt',
                        'Target the waitlist, the pitch deck, or the prompt chain directly when the strategy shifts.',
                    )}

                    <ExecutionPhase
                        data={data}
                        showResults={showResults}
                        onGenerateFounderAssets={onGenerateFounderAssets}
                        isGeneratingAssets={isGeneratingAssets}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
