import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpenText, FileDown } from 'lucide-react';
import type { AnalysisData, CitationRef, LabPhaseId, LabPromptHistoryEntry, SourceDocument, WidgetTargetId } from '../lib/api';
import { buildAnalysisReportHtml } from '../lib/launchpad-report';
import { downloadHtml } from './launchpad/ArtifactFrame';
import { CountUpNumber, useRevealGroup } from './launchpad/gsapFx';
import {
    CitationLinks,
    PhaseDivider,
    PhasePromptComposer,
    VerdictNeedle,
    buildFallbackJudge,
    createFallbackLab,
    getCouncilVerdictMeta,
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

const ACTION_BUTTON =
    'inline-flex items-center justify-center gap-2 border border-white/15 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-300 transition-colors duration-300 hover:border-white/35 hover:text-white';

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
    const prefersReducedMotion = useReducedMotion();
    const still = Boolean(prefersReducedMotion);
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
    // Only one scenario console is open at a time, so the phase bands stay
    // readable while a scoped mutation is being written.
    const [expandedConsole, setExpandedConsole] = useState<LabPhaseId | null>(null);

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
        setExpandedConsole(null);
        // The data reference, not identity strings: branches share name and
        // tagline, so a string key would carry drafts across loaded runs.
    }, [data]);

    if (!data) return null;

    const fallbackLab = createFallbackLab(data);
    const lab = hasValidLab(data.lab) ? data.lab : fallbackLab;
    const councilJudge = lab.council.judge || buildFallbackJudge(
        lab.council.bull || fallbackLab.council.bull!,
        lab.council.bear || fallbackLab.council.bear!,
        lab.summary.recommendation,
    );
    const verdictMeta = getCouncilVerdictMeta(councilJudge.verdict);

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

    const handleConsoleExpanded = (phaseId: LabPhaseId, expanded: boolean) => {
        setExpandedConsole(expanded ? phaseId : null);
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
        setExpandedConsole(null);
    };

    const renderComposer = (phaseId: LabPhaseId, title: string) => (
        <PhasePromptComposer
            phaseId={phaseId}
            title={title}
            promptValue={phasePrompts[phaseId]}
            onPromptChange={updatePhasePrompt}
            targetId={selectedTargets[phaseId]}
            onTargetChange={updateSelectedTarget}
            latestPrompt={getLatestPromptForPhase(promptHistory, phaseId)}
            isBusy={activeMutationTarget === `${phaseId}:${selectedTargets[phaseId]}`}
            applyDisabled={!phasePrompts[phaseId].trim() || !onRunScopedPrompt || Boolean(activeMutationTarget)}
            onApply={handleApplyPhasePrompt}
            expanded={expandedConsole === phaseId}
            onExpandedChange={handleConsoleExpanded}
        />
    );

    if (!showResults) return null;

    return (
        <motion.div
            ref={revealRef}
            initial={still ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-12 pt-12"
        >
            {/* Report band */}
            <div data-reveal className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 md:grid-cols-12">
                <div className="min-w-0 bg-velocity-black p-5 md:col-span-6 md:p-6">
                    <p className="truncate font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                        Report <span className="text-velocity-red">{data.identity.name}</span>
                    </p>
                    <h2 className="mt-4 font-sans text-3xl font-bold tracking-tight text-white md:text-4xl">
                        {data.identity.name}<span className="text-velocity-red">.</span>
                    </h2>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-zinc-400">{data.identity.tagline}</p>
                </div>

                <div className="min-w-0 bg-velocity-black p-5 md:col-span-2 md:p-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">Judge</p>
                    <p className="mt-4 font-sans text-base font-bold tracking-tight text-white">{verdictMeta.label}</p>
                    <VerdictNeedle verdict={councilJudge.verdict} className="mt-4" />
                </div>

                <div className="min-w-0 bg-velocity-black p-5 md:col-span-2 md:p-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">Confidence</p>
                    <p className="mt-4 font-mono text-[2rem] leading-none tracking-tight text-velocity-red">
                        <CountUpNumber value={lab.summary.confidenceScore} />
                        <span className="text-base text-zinc-600">/100</span>
                    </p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                        {lab.summary.confidenceLabel}
                    </p>
                    <p className="mt-2 font-sans text-[11px] leading-relaxed text-zinc-400">
                        Directional score. Not a measured probability.
                    </p>
                </div>

                <div className="min-w-0 bg-velocity-black p-5 md:col-span-2 md:p-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">Export</p>
                    <div className="mt-4 flex flex-col gap-2">
                        {sourcesPageHref && hasGroundedSources ? (
                            <a
                                href={sourcesPageHref}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    window.location.assign(sourcesPageHref);
                                }}
                                className={`${ACTION_BUTTON} cursor-pointer`}
                            >
                                <BookOpenText className="h-3.5 w-3.5" />
                                Sources page
                            </a>
                        ) : null}
                        <button
                            type="button"
                            onClick={handleDownloadReport}
                            className={ACTION_BUTTON}
                        >
                            <FileDown className="h-3.5 w-3.5" />
                            Report
                        </button>
                    </div>
                    {sourcesPageHref && hasGroundedSources ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {sourceDocuments.length > 0 && (
                                <span className="border border-white/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                                    {sourceDocuments.length} sources
                                </span>
                            )}
                            {(data.sources.queries?.length || 0) > 0 && (
                                <span className="border border-white/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                                    {data.sources.queries!.length} searches
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>

                <div className="min-w-0 bg-velocity-black p-5 md:col-span-6 md:p-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">Recommendation</p>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-zinc-200">
                        {lab.summary.recommendation}
                        {renderCitation(data.citations?.summary?.recommendation, 'summary-recommendation')}
                    </p>
                </div>

                <div className="min-w-0 bg-velocity-black p-5 md:col-span-3 md:p-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">Open risk</p>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-zinc-400">
                        {lab.summary.openRisks[0]}
                        {renderCitation(data.citations?.summary?.openRisks?.[0], 'summary-open-risk')}
                    </p>
                </div>

                <div className="min-w-0 bg-velocity-black p-5 md:col-span-3 md:p-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">Next move</p>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-zinc-400">
                        {lab.summary.nextMoves[0]}
                        {renderCitation(data.citations?.summary?.nextMoves?.[0], 'summary-next-move')}
                    </p>
                </div>
            </div>

            {/* Phase 1 */}
            <div className="flex flex-col gap-4">
                <PhaseDivider no="01" label="Validate" />
                {renderComposer('validation', 'Validation')}
                <ValidationPhase
                    data={data}
                    lab={lab}
                    councilJudge={councilJudge}
                    showResults={showResults}
                    renderCitation={renderCitation}
                />
            </div>

            {/* Phase 2 */}
            <div className="flex flex-col gap-4">
                <PhaseDivider no="02" label="Strategy" />
                {renderComposer('strategy', 'Strategy')}
                <StrategyPhase
                    data={data}
                    showResults={showResults}
                    renderCitation={renderCitation}
                    getChannelHref={getChannelHref}
                />
            </div>

            {/* Phase 3 */}
            <div className="flex flex-col gap-4">
                <PhaseDivider no="03" label="Execute" />
                {renderComposer('execution', 'Execution')}
                <ExecutionPhase
                    data={data}
                    showResults={showResults}
                    onGenerateFounderAssets={onGenerateFounderAssets}
                    isGeneratingAssets={isGeneratingAssets}
                />
            </div>
        </motion.div>
);
};
