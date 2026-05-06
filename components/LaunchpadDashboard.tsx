import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    BookOpenText,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Coins,
    Copy,
    Download,
    ExternalLink,
    Loader2,
    MessageCircle,
    Presentation,
    Scale,
    Sparkles,
    Terminal,
    Target,
    Users,
} from 'lucide-react';
import type { AnalysisData, CitationRef, LabPhaseId, LabPromptHistoryEntry, SourceDocument, WidgetTargetId } from '../lib/api';
import { Widget } from './LaunchpadWidgets';

interface LaunchpadDashboardProps {
    data: AnalysisData | null;
    analysisId?: string | null;
    showResults: boolean;
    onGenerateFounderAssets?: () => void;
    isGeneratingAssets?: boolean;
    onRunScopedPrompt?: (input: { phaseId: LabPhaseId; targetId: WidgetTargetId; instruction: string }) => void | Promise<void>;
    activeMutationTarget?: string | null;
    promptHistory?: LabPromptHistoryEntry[];
}

const PHASE_TARGETS: Record<LabPhaseId, Array<{ id: WidgetTargetId; label: string }>> = {
    validation: [
        { id: 'validation', label: 'Whole phase' },
        { id: 'marketSizing', label: 'TAM / SAM / SOM' },
        { id: 'marketPosition', label: 'Market position' },
    ],
    strategy: [
        { id: 'strategy', label: 'Whole phase' },
        { id: 'monetization', label: 'Monetization' },
        { id: 'customerSegments', label: 'Customers' },
        { id: 'distributionChannels', label: 'Channels' },
    ],
    execution: [
        { id: 'waitlist', label: 'Waitlist' },
        { id: 'pitchDeck', label: 'Pitch deck' },
        { id: 'promptChain', label: 'Prompt chain' },
    ],
};

function uniqueStrings(items: Array<string | undefined>, limit: number) {
    return Array.from(new Set(items.filter((item): item is string => Boolean(item && item.trim())))).slice(0, limit);
}

function isStringArray(value: unknown) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseAudienceSize(value: string): number | null {
    const normalized = value.trim().toLowerCase().replace(/,/g, '');
    const numericMatch = normalized.match(/(\d+(?:\.\d+)?)\s*([kmb])?/);

    if (numericMatch) {
        const amount = Number(numericMatch[1]);
        const suffix = numericMatch[2];
        const multiplier = suffix === 'm' ? 1_000_000 : suffix === 'b' ? 1_000_000_000 : suffix === 'k' ? 1_000 : 1;
        return Math.round(amount * multiplier);
    }

    if (normalized.includes('viral')) return 180_000;
    if (normalized.includes('active')) return 90_000;
    if (normalized.includes('founders')) return 60_000;

    return null;
}

function formatCompactUsers(value: number) {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return `${value}`;
}

function normalizeExternalHref(value?: string | null) {
    const trimmed = (value || '')
        .trim()
        .replace(/^["'([{<]+/, '')
        .replace(/[>"')\]}.,;:!?]+$/g, '');

    if (!trimmed) {
        return null;
    }

    try {
        const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        const url = new URL(withScheme);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
    } catch {
        return null;
    }
}

function getCouncilVerdictMeta(verdict: 'bull' | 'bear' | 'split') {
    if (verdict === 'bull') {
        return {
            label: 'Bull leads',
            tone: 'text-emerald-300',
            badge: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-200',
        };
    }

    if (verdict === 'bear') {
        return {
            label: 'Bear leads',
            tone: 'text-amber-300',
            badge: 'border-amber-500/20 bg-amber-500/[0.08] text-amber-200',
        };
    }

    return {
        label: 'Split decision',
        tone: 'text-blue-300',
        badge: 'border-blue-500/20 bg-blue-500/[0.08] text-blue-200',
    };
}

function buildFallbackJudge(bull: NonNullable<NonNullable<AnalysisData['lab']>['council']['bull']>, bear: NonNullable<NonNullable<AnalysisData['lab']>['council']['bear']>, recommendation: string) {
    const bullCase = uniqueStrings([bull.keyPoints[0], bull.opportunities[0], bull.recommendation], 2);
    const bearCase = uniqueStrings([bear.keyPoints[0], bear.risks[0], bear.recommendation], 2);
    const decidingFactors = uniqueStrings([bear.opportunities[0], bull.opportunities[0], recommendation], 2);

    return {
        verdict: 'split' as const,
        finalTake: recommendation || 'Both sides have a case, so keep the first wedge narrow and evidence-led.',
        bullCase: bullCase.length ? bullCase : ['There is a plausible wedge worth testing.'],
        bearCase: bearCase.length ? bearCase : ['Differentiation still needs stronger proof.'],
        decidingFactors: decidingFactors.length ? decidingFactors : ['Run one narrow validation loop before broadening the product.'],
    };
}

function createFallbackLab(data: AnalysisData): NonNullable<AnalysisData['lab']> {
    const insights = data.validation.industryInsights;
    const keyInsights = insights?.keyInsights || [];
    const risks = insights?.risks || [];
    const tests = insights?.whatToTestFirst || [];
    const bull = {
        perspective: 'bull' as const,
        keyPoints: keyInsights.slice(0, 3),
        opportunities: keyInsights.slice(0, 1),
        risks: risks.slice(0, 1),
        recommendation: keyInsights[0] || 'There is enough upside to test a narrow wedge.',
    };
    const bear = {
        perspective: 'bear' as const,
        keyPoints: risks.slice(0, 3),
        opportunities: tests.slice(0, 1),
        risks: risks.slice(0, 2),
        recommendation: risks[0] || 'The current positioning still needs sharper proof.',
    };
    const summaryRecommendation = tests[0] || 'Start with the smallest useful workflow.';

    return {
        intake: null,
        council: {
            bull,
            bear,
            judge: buildFallbackJudge(bull, bear, summaryRecommendation),
        },
        summary: {
            recommendation: summaryRecommendation,
            confidenceScore: 68,
            confidenceLabel: 'medium' as const,
            openRisks: uniqueStrings(risks, 2).length ? uniqueStrings(risks, 2) : ['Demand proof is still limited.', 'The wedge needs sharper positioning.'],
            nextMoves: uniqueStrings(tests, 2).length ? uniqueStrings(tests, 2) : ['Interview likely users.', 'Prototype the narrowest version first.'],
        },
        marketSizing: undefined,
    };
}

function hasValidLab(data: AnalysisData['lab'] | undefined): data is NonNullable<AnalysisData['lab']> {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const summary = data.summary;
    const council = data.council;

    if (
        !summary ||
        typeof summary.recommendation !== 'string' ||
        typeof summary.confidenceScore !== 'number' ||
        !['low', 'medium', 'high'].includes(summary.confidenceLabel) ||
        !isStringArray(summary.openRisks) ||
        !isStringArray(summary.nextMoves)
    ) {
        return false;
    }

    if (!council || typeof council !== 'object') {
        return false;
    }

    return true;
}

function buildMarketSizing(data: AnalysisData, targetUser?: string) {
    const reachableAudience = data.distributionChannels
        .map((channel) => parseAudienceSize(channel.members))
        .filter((value): value is number => value !== null)
        .reduce((sum, value) => sum + value, 0);

    const baseAudience = reachableAudience || Math.max(75_000, data.customerSegments.length * 45_000);
    const tam = Math.round(baseAudience * 6.5);
    const sam = Math.round(tam * 0.21);
    const som = Math.round(sam * 0.09);

    return [
        {
            key: 'tam',
            label: 'TAM',
            title: `All ${targetUser || 'potential users'}`,
            value: tam,
            ratio: 1,
            tone: 'bg-white/90',
        },
        {
            key: 'sam',
            label: 'SAM',
            title: 'Reachable first wedge',
            value: sam,
            ratio: sam / tam,
            tone: 'bg-amber-300',
        },
        {
            key: 'som',
            label: 'SOM',
            title: 'Initial beachhead',
            value: som,
            ratio: som / tam,
            tone: 'bg-velocity-red',
        },
    ];
}

function getPromptPreview(prompt: string, expanded: boolean) {
    if (expanded || prompt.length <= 260) {
        return prompt;
    }

    return `${prompt.slice(0, 260).trim()}...`;
}

function getPhasePromptPlaceholder(phaseId: LabPhaseId, targetId: WidgetTargetId) {
    if (phaseId === 'validation') {
        return targetId === 'marketPosition'
            ? 'Example: Reframe this for UK boutique law firms instead of broad SMBs. How should the market gap shift?'
            : 'Example: If the product is $100/month for agency teams, how do TAM, SAM, and SOM change?';
    }

    if (phaseId === 'strategy') {
        return targetId === 'customerSegments'
            ? 'Example: Which customer profile is most likely to pay $100/month, and why?'
            : targetId === 'distributionChannels'
                ? 'Example: If we target fintech operators first, which channels become highest intent?'
                : 'Example: If price moves to $100/month, what monetization strategy and customer mix make sense now?';
    }

    return targetId === 'promptChain'
        ? 'Example: Update the build prompts so the MVP starts with a premium concierge workflow first.'
        : targetId === 'pitchDeck'
            ? 'Example: Include a stronger ROI slide and make the narrative more enterprise-focused.'
            : 'Example: Change the waitlist palette from red to emerald and add founder credibility near the signup form.';
}

function getLatestPromptForPhase(promptHistory: LabPromptHistoryEntry[], phaseId: LabPhaseId) {
    return [...promptHistory].reverse().find((entry) => entry.phaseId === phaseId) || null;
}

export const LaunchpadDashboard: React.FC<LaunchpadDashboardProps> = ({
    data,
    analysisId = null,
    showResults,
    onGenerateFounderAssets,
    isGeneratingAssets = false,
    onRunScopedPrompt,
    activeMutationTarget,
    promptHistory = [],
}) => {
    const [competitorIndex, setCompetitorIndex] = useState(0);
    const [monetizationIndex, setMonetizationIndex] = useState(0);
    const [promptChainIndex, setPromptChainIndex] = useState(0);
    const [showFullPrompt, setShowFullPrompt] = useState(false);
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
    const pitchDeckIframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        setShowFullPrompt(false);
    }, [data?.identity?.name, data?.identity?.tagline]);

    useEffect(() => {
        setCompetitorIndex(0);
    }, [data?.identity?.name, data?.identity?.tagline]);

    useEffect(() => {
        setPromptChainIndex(0);
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
    const councilVerdictMeta = getCouncilVerdictMeta(councilJudge.verdict);
    const hasFounderAssets = Boolean(data.artifacts?.waitlistHtml || data.artifacts?.pitchDeckHtml);
    const monetizationItems = data.monetization.length ? data.monetization : [{
        model: 'Monetization still being defined',
        pricing: 'TBD',
        strategies: ['Validate willingness to pay first'],
        examples: 'N/A',
    }];
    const promptSteps = data.promptChain.length ? data.promptChain : [{
        step: 1,
        title: 'Starter prompt',
        prompt: 'Describe the first user flow, the main screen, and the smallest usable version before building.',
    }];
    const competitorList = Array.isArray(data.validation.competitorList) ? data.validation.competitorList : [];
    const marketGap = data.validation?.marketGap?.xAxis && data.validation?.marketGap?.yAxis && data.validation?.marketGap?.yourPosition
        ? data.validation.marketGap
        : {
            xAxis: { label: 'Ease of use', low: 'Simple', high: 'Advanced' },
            yAxis: { label: 'Focus', low: 'General', high: 'Specialized' },
            yourPosition: { x: 55, y: 60 },
            yourGap: 'A narrower wedge is still being defined.',
        };
    const marketSizing = (lab.marketSizing?.length === 3 ? lab.marketSizing : buildMarketSizing(data, lab.intake?.targetUser)).map((item) => ({
        key: item.key,
        label: item.label,
        title: item.title,
        value: item.value,
        ratio: item.ratio,
    }));
    const activeCompetitor = competitorList.length ? competitorList[competitorIndex % competitorList.length] : null;
    const activeCompetitorWebsite = normalizeExternalHref(activeCompetitor?.website);
    const activeMonetization = monetizationItems[monetizationIndex % monetizationItems.length];
    const activePromptStep = promptSteps[promptChainIndex % promptSteps.length];
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
    const activeCompetitorCitation = activeCompetitor && competitorList.length
        ? data.citations?.validation?.competitors?.[competitorIndex % competitorList.length] || null
        : null;

    const renderCitationLinks = (citation?: CitationRef | null, keyPrefix = 'citation') => {
        if (!citation?.sourceIds?.length) {
            return null;
        }

        const badgeClass = 'rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-200';

        return (
            <span className="ml-1.5 inline-flex flex-wrap items-center gap-1 align-super">
                {citation.sourceIds.map((sourceId, index) => {
                    const source = sourceMap.get(sourceId);
                    const sourceTitle = source?.title ?? 'source';

                    const sourceHref = normalizeExternalHref(source?.url);

                    if (sourceHref) {
                        return (
                            <a
                                key={`${keyPrefix}-${sourceId}-${index}`}
                                href={sourceHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`${sourceId}: ${sourceTitle}`}
                                aria-label={`Open source ${sourceId}: ${sourceTitle}`}
                                className={badgeClass}
                            >
                                {sourceId}
                            </a>
                        );
                    }

                    if (sourcesPageHref) {
                        return (
                            <Link
                                key={`${keyPrefix}-${sourceId}-${index}`}
                                to={sourcesPageHref}
                                title={`View saved sources for ${sourceId}`}
                                className={badgeClass}
                            >
                                {sourceId}
                            </Link>
                        );
                    }

                    return (
                        <span
                            key={`${keyPrefix}-${sourceId}-${index}`}
                            className={badgeClass}
                        >
                            {sourceId}
                        </span>
                    );
                })}
            </span>
        );
    };

    const getChannelHref = (channelName: string, index: number) => {
        const citedUrl = data.citations?.strategy?.distributionChannels?.[index]?.sourceIds
            ?.map((sourceId) => normalizeExternalHref(sourceMap.get(sourceId)?.url))
            .find((value): value is string => Boolean(value));

        return citedUrl || `https://google.com/search?q=${encodeURIComponent(channelName)}`;
    };

    const downloadHtml = (html: string, filename: string) => {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const openSandboxedHtmlPreview = (html: string, kind: 'waitlist' | 'pitchDeck') => {
        const key = `velocity:${kind}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
        localStorage.setItem(key, html);
        window.open(`/artifact-viewer.html#${encodeURIComponent(key)}`, '_blank', 'noopener,noreferrer');
    };

    const normalizePitchDeckHtml = (pitchDeckHtml: string) => {
        let html = pitchDeckHtml.trim();

        html = html
            .replace(/https?:\/\/cdn\.jsdelivr\.net\/npm\/reveal\.js@[^"' )]+\/dist\/reveal\.css/gi, '/reveal/reveal.css')
            .replace(/https?:\/\/cdn\.jsdelivr\.net\/npm\/reveal\.js@[^"' )]+\/dist\/theme\/black\.css/gi, '/reveal/theme/black.css')
            .replace(/https?:\/\/cdn\.jsdelivr\.net\/npm\/reveal\.js@[^"' )]+\/dist\/reveal\.js/gi, '/reveal/reveal.js');

        if (!/\/reveal\/reveal\.css/i.test(html)) {
            html = html.replace('</head>', '<link rel="stylesheet" href="/reveal/reveal.css" /></head>');
        }

        if (!/\/reveal\/theme\/black\.css/i.test(html)) {
            html = html.replace('</head>', '<link rel="stylesheet" href="/reveal/theme/black.css" /></head>');
        }

        html = html.replace(/<script\b[^>]*>[\s\S]*?Reveal\.initialize[\s\S]*?<\/script>/gi, '');

        if (!/\/reveal\/reveal\.js/i.test(html)) {
            html = html.replace('</body>', '<script src="/reveal/reveal.js"></script></body>');
        }

        if (!/\/deck-runtime\.js/i.test(html)) {
            html = html.replace('</body>', '<script src="/deck-runtime.js"></script></body>');
        }

        return html;
    };

    const openPitchDeckFullscreen = (pitchDeckHtml: string) => {
        const normalizedHtml = normalizePitchDeckHtml(pitchDeckHtml);
        const key = `velocity:deck:${Date.now()}:${Math.random().toString(16).slice(2)}`;
        localStorage.setItem(key, normalizedHtml);
        window.open(`/deck-viewer.html#${encodeURIComponent(key)}`, '_blank', 'noopener,noreferrer');
    };

    const getPitchDeckHtml = () => {
        if (!data.artifacts?.pitchDeckHtml) return '';
        return normalizePitchDeckHtml(data.artifacts.pitchDeckHtml);
    };

    const copyPrompt = () => {
        navigator.clipboard.writeText(activePromptStep.prompt);
    };

    const updatePhasePrompt = (phaseId: LabPhaseId, value: string) => {
        setPhasePrompts((current) => ({
            ...current,
            [phaseId]: value,
        }));
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

    const renderPhasePromptComposer = (
        phaseId: LabPhaseId,
        title: string,
        description: string,
    ) => {
        const latestPrompt = getLatestPromptForPhase(promptHistory, phaseId);
        const targetId = selectedTargets[phaseId];
        const mutationKey = `${phaseId}:${targetId}`;
        const isBusy = activeMutationTarget === mutationKey;

        return (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/40">{title}</p>
                        <p className="font-sans text-sm text-white mt-2 leading-relaxed">{description}</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] text-white/55">
                        Branch-aware update
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {PHASE_TARGETS[phaseId].map((target) => {
                        const selected = target.id === targetId;

                        return (
                            <button
                                key={`${phaseId}-${target.id}`}
                                type="button"
                                onClick={() => setSelectedTargets((current) => ({ ...current, [phaseId]: target.id }))}
                                className={`rounded-full border px-3 py-1.5 font-sans text-[11px] uppercase tracking-[0.16em] transition-colors ${
                                    selected
                                        ? 'border-velocity-red/35 bg-velocity-red/12 text-white'
                                        : 'border-white/10 bg-black/20 text-white/45 hover:text-white/75'
                                }`}
                            >
                                {target.label}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4">
                    <label className="sr-only" htmlFor={`phase-prompt-${phaseId}`}>
                        {title}
                    </label>
                    <textarea
                        id={`phase-prompt-${phaseId}`}
                        value={phasePrompts[phaseId]}
                        onChange={(event) => updatePhasePrompt(phaseId, event.target.value)}
                        placeholder={getPhasePromptPlaceholder(phaseId, targetId)}
                        rows={3}
                        className="w-full rounded-[1.5rem] border border-white/10 bg-black/30 px-4 py-3 font-sans text-sm text-white outline-none placeholder:text-white/25 focus:border-velocity-red/35"
                    />
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {latestPrompt ? (
                        <p className="font-sans text-xs text-white/40 leading-relaxed">
                            Latest update: <span className="text-white/65">{latestPrompt.summary}</span>
                        </p>
                    ) : (
                        <p className="font-sans text-xs text-white/30 leading-relaxed">
                            Use this to test a strategy shift against just this phase or one widget inside it.
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={() => handleApplyPhasePrompt(phaseId)}
                        disabled={!phasePrompts[phaseId].trim() || !onRunScopedPrompt || Boolean(activeMutationTarget)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[11px] font-sans font-semibold uppercase tracking-[0.18em] text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isBusy ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Apply to Widget
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {showResults && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-8 max-w-[1440px] mx-auto py-8"
                >
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/35">Launchpad Lab</p>
                                    <h2 className="mt-3 font-sans text-3xl font-black tracking-tight text-white md:text-4xl">{data.identity.name}</h2>
                                    <p className="mt-3 font-sans text-base italic text-white/70">{data.identity.tagline}</p>
                                    <p className="mt-5 max-w-3xl font-sans text-sm leading-relaxed text-white/80">
                                        {lab.summary.recommendation}
                                        {renderCitationLinks(data.citations?.summary?.recommendation, 'summary-recommendation')}
                                    </p>
                                </div>

                                {sourcesPageHref && hasGroundedSources ? (
                                    <div className="relative z-[60] flex flex-col items-start gap-2 pointer-events-auto md:items-end">
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
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-1">
                            <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-5">
                                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Confidence</p>
                                <p className="mt-3 font-sans text-3xl font-black tracking-tight text-white">{lab.summary.confidenceScore}<span className="text-lg text-white/35">/100</span></p>
                                <p className="mt-2 font-sans text-xs uppercase tracking-[0.16em] text-white/45">{lab.summary.confidenceLabel}</p>
                            </div>
                            <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-5">
                                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Open risk</p>
                                <p className="mt-3 font-sans text-sm leading-relaxed text-white/80">
                                    {lab.summary.openRisks[0]}
                                    {renderCitationLinks(data.citations?.summary?.openRisks?.[0], 'summary-open-risk')}
                                </p>
                            </div>
                            <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-5">
                                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Next move</p>
                                <p className="mt-3 font-sans text-sm leading-relaxed text-white/80">
                                    {lab.summary.nextMoves[0]}
                                    {renderCitationLinks(data.citations?.summary?.nextMoves?.[0], 'summary-next-move')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/40">Phase 1: Validation</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    {renderPhasePromptComposer(
                        'validation',
                        'Scenario prompt',
                        'Use one prompt to test a validation shift, or target just the market sizing / market position widget.',
                    )}

                    <Widget title="Analyst Council" icon={Scale} visible={showResults} className="h-full">
                        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/40">Final judge</p>
                                    <p className={`mt-3 font-sans text-lg leading-relaxed ${councilVerdictMeta.tone}`}>
                                        {councilJudge.finalTake}
                                        {renderCitationLinks(data.citations?.council?.finalTake, 'council-final-take')}
                                    </p>
                                </div>
                                <div className={`inline-flex items-center rounded-full border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.18em] ${councilVerdictMeta.badge}`}>
                                    {councilVerdictMeta.label}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <div className="rounded-[1.7rem] border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
                                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">Bull is right about</p>
                                <div className="mt-4 space-y-3">
                                    {councilJudge.bullCase.map((item, index) => (
                                        <div key={`bull-${index}`} className="flex items-start gap-3">
                                            <div className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            <p className="font-sans text-sm text-gray-100 leading-relaxed">
                                                {item}
                                                {renderCitationLinks(data.citations?.council?.bullCase?.[index], `council-bull-${index}`)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[1.7rem] border border-amber-500/20 bg-amber-500/[0.06] p-5">
                                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-amber-200/80">Bear is right about</p>
                                <div className="mt-4 space-y-3">
                                    {councilJudge.bearCase.map((item, index) => (
                                        <div key={`bear-${index}`} className="flex items-start gap-3">
                                            <div className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
                                            <p className="font-sans text-sm text-gray-100 leading-relaxed">
                                                {item}
                                                {renderCitationLinks(data.citations?.council?.bearCase?.[index], `council-bear-${index}`)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/40 mb-3">What settles it</p>
                            <div className="space-y-3">
                                {councilJudge.decidingFactors.map((item, index) => (
                                    <div key={`judge-factor-${index}`} className="flex items-start gap-3">
                                        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-300" />
                                        <p className="font-sans text-sm text-gray-200 leading-relaxed">
                                            {item}
                                            {renderCitationLinks(data.citations?.council?.decidingFactors?.[index], `council-factor-${index}`)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Widget>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                        <div className="xl:col-span-4">
                            <Widget title="Market Sizing" icon={BarChart3} visible={showResults} className="h-full">
                                <div className="space-y-4">
                                    {marketSizing.map((item) => (
                                        <div key={item.key} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/40">{item.label}</p>
                                                    <p className="font-sans text-sm text-white mt-2">{item.title}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-sans text-2xl font-black tracking-tight text-white">{formatCompactUsers(item.value)}</p>
                                                    <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">users</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                                                <div
                                                    className={`h-full rounded-full ${item.key === 'tam' ? 'bg-white/90' : item.key === 'sam' ? 'bg-amber-300' : 'bg-velocity-red'}`}
                                                    style={{ width: `${Math.max(item.ratio * 100, item.key === 'som' ? 10 : 18)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {data.validation.marketReports.length > 0 && (
                                    <div className="mt-5 space-y-3">
                                        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/40">Grounded reports</p>
                                        {data.validation.marketReports.slice(0, 2).map((report, index) => (
                                            normalizeExternalHref(report.url) ? (
                                            <a
                                                key={`${report.title}-${index}`}
                                                href={normalizeExternalHref(report.url)!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05]"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-white/35">{report.publisher}</p>
                                                    <p className="mt-1 font-sans text-sm leading-relaxed text-white">
                                                        {report.title}
                                                        {renderCitationLinks(data.citations?.validation?.marketReports?.[index], `market-report-${index}`)}
                                                    </p>
                                                    <p className="mt-2 font-sans text-xs leading-relaxed text-white/50">{report.keyStat}</p>
                                                </div>
                                                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                                            </a>
                                            ) : (
                                            <div
                                                key={`${report.title}-${index}`}
                                                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-white/35">{report.publisher}</p>
                                                    <p className="mt-1 font-sans text-sm leading-relaxed text-white">
                                                        {report.title}
                                                        {renderCitationLinks(data.citations?.validation?.marketReports?.[index], `market-report-${index}`)}
                                                    </p>
                                                    <p className="mt-2 font-sans text-xs leading-relaxed text-white/50">{report.keyStat}</p>
                                                </div>
                                            </div>
                                            )
                                        ))}
                                    </div>
                                )}

                                <p className="font-sans text-[11px] text-white/35 mt-5 leading-relaxed">
                                    Directional sizing that can now be revised with explicit scenario prompts instead of staying fixed.
                                </p>
                            </Widget>
                        </div>

                        <div className="xl:col-span-8">
                            <Widget
                                title="Market Position"
                                icon={Target}
                                visible={showResults}
                                className="h-full"
                                action={
                                    competitorList.length > 1 ? (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setCompetitorIndex((prev) => (prev - 1 + competitorList.length) % competitorList.length)}
                                                aria-label="Previous competitor"
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="font-sans text-[10px] text-gray-400 tabular-nums px-2 select-none" aria-live="polite">
                                                {competitorIndex + 1}/{competitorList.length}
                                            </span>
                                            <button
                                                onClick={() => setCompetitorIndex((prev) => (prev + 1) % competitorList.length)}
                                                aria-label="Next competitor"
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : undefined
                                }
                            >
                                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                                    <div className="relative min-h-[320px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_55%,rgba(255,255,255,0.01))] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-full h-px bg-white/10" />
                                            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
                                            <div className="h-24 w-24 rounded-full bg-white/5 blur-2xl" />
                                        </div>

                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.14em] text-white/45">
                                            {marketGap.yAxis.high}
                                        </div>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.14em] text-white/45">
                                            {marketGap.yAxis.low}
                                        </div>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.14em] text-white/45">
                                            {marketGap.xAxis.low}
                                        </div>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.14em] text-white/45">
                                            {marketGap.xAxis.high}
                                        </div>

                                        <div className="absolute inset-[20px]">
                                            {competitorList.map((competitor, index) => {
                                                const isActive = index === (competitorIndex % Math.max(competitorList.length, 1));

                                                return (
                                                    <motion.button
                                                        key={competitor.name}
                                                        type="button"
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ delay: 0.05 * index }}
                                                        onClick={() => setCompetitorIndex(index)}
                                                        className="absolute -translate-x-1/2 translate-y-1/2 text-left"
                                                        style={{
                                                            left: `${competitor.x}%`,
                                                            bottom: `${competitor.y}%`,
                                                        }}
                                                    >
                                                        <div className={`rounded-full border px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.14em] transition-all ${
                                                            isActive
                                                                ? 'border-velocity-red/40 bg-velocity-red/15 text-white shadow-[0_0_22px_rgba(255,31,31,0.25)]'
                                                                : 'border-white/10 bg-black/70 text-white/55 hover:text-white/80'
                                                        }`}>
                                                            {index + 1}. {competitor.name}
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}

                                            <motion.div
                                                initial={{ scale: 0.85, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.25 }}
                                                className="absolute -translate-x-1/2 translate-y-1/2"
                                                style={{
                                                    left: `${marketGap.yourPosition.x}%`,
                                                    bottom: `${marketGap.yourPosition.y}%`,
                                                }}
                                            >
                                                <div className="flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.16em] text-white shadow-[0_0_20px_rgba(16,185,129,0.18)]">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                                    You
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="flex min-h-[320px] flex-col gap-4">
                                        {activeCompetitor ? (
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={activeCompetitor.name}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Top competitor</p>
                                                            <p className="font-sans text-xl font-black tracking-tight text-white mt-2">
                                                                {activeCompetitor.name}
                                                                {renderCitationLinks(activeCompetitorCitation, 'active-competitor')}
                                                            </p>
                                                        </div>
                                                        {activeCompetitorWebsite && (
                                                            <a
                                                                href={activeCompetitorWebsite}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-[0.16em] text-sky-300 hover:text-sky-200"
                                                            >
                                                                Website
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4 mt-5">
                                                        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
                                                            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-emerald-300 mb-2">Strength</p>
                                                            <p className="font-sans text-sm text-white/90 leading-relaxed">
                                                                {activeCompetitor.strength}
                                                                {renderCitationLinks(activeCompetitorCitation, 'active-competitor-strength')}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                                            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35 mb-2">Weakness</p>
                                                            <p className="font-sans text-sm text-white/80 leading-relaxed">
                                                                {activeCompetitor.weakness}
                                                                {renderCitationLinks(activeCompetitorCitation, 'active-competitor-weakness')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </AnimatePresence>
                                        ) : (
                                            <div className="rounded-3xl border border-dashed border-white/10 px-5 py-8 font-sans text-sm text-white/45">
                                                No competitor map yet. Run another analysis once the market framing is sharper.
                                            </div>
                                        )}

                                        <div className="mt-auto rounded-3xl border border-emerald-500/15 bg-emerald-500/[0.05] p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-emerald-300">Your Gap</p>
                                            </div>
                                            <p className="font-sans text-sm text-white leading-relaxed">
                                                {marketGap.yourGap}
                                                {renderCitationLinks(data.citations?.validation?.marketGap, 'market-gap')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Widget>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/40">Phase 2: Strategy</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    {renderPhasePromptComposer(
                        'strategy',
                        'Scenario prompt',
                        'Use one prompt to test pricing, customer, or channel shifts without regenerating the entire lab.',
                    )}

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start">
                        <Widget title="Customer Segments" icon={Users} visible={showResults} className="h-full" compact>
                            <div className="space-y-4 pt-1">
                                {data.customerSegments.slice(0, 3).map((segment, index) => (
                                    <motion.div
                                        key={`${segment.segment}-${index}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.35 + index * 0.08 }}
                                        className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] px-5 py-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <p className="font-sans text-[1.05rem] leading-tight font-black tracking-tight text-white max-w-[75%]">{segment.segment}</p>
                                            <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] text-white/65">
                                                {segment.age}
                                            </span>
                                        </div>

                                        <div className="space-y-2.5 mt-4">
                                            <div className="flex items-start gap-3 font-sans text-[0.95rem] leading-relaxed">
                                                <span className="min-w-[56px] text-velocity-red">Target:</span>
                                                <span className="text-gray-200 line-clamp-2">{segment.interest}</span>
                                            </div>
                                            <div className="flex items-start gap-3 font-sans text-[0.95rem] leading-relaxed">
                                                <span className="min-w-[56px] text-blue-400">Income:</span>
                                                <span className="text-gray-200">{segment.income}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </Widget>

                        <Widget
                            title="Monetization Strategy"
                            icon={Coins}
                            visible={showResults}
                            compact
                            action={
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setMonetizationIndex((prev) => (prev - 1 + monetizationItems.length) % monetizationItems.length)}
                                        aria-label="Previous monetization model"
                                        className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="font-sans text-[10px] text-white/45 tabular-nums px-1" aria-live="polite">
                                        {(monetizationIndex % monetizationItems.length) + 1}/{monetizationItems.length}
                                    </span>
                                    <button
                                        onClick={() => setMonetizationIndex((prev) => (prev + 1) % monetizationItems.length)}
                                        aria-label="Next monetization model"
                                        className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            }
                            className="h-full"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={monetizationIndex}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col h-full gap-4 pt-1"
                                >
                                    <div>
                                        <p className="font-sans text-[10px] text-blue-300 uppercase tracking-[0.18em] mb-2">Model</p>
                                        <p className="font-sans text-[2.05rem] font-black tracking-tight text-white leading-none">{activeMonetization.model}</p>
                                        <p className="font-sans text-lg text-velocity-red mt-3 leading-snug">{activeMonetization.pricing}</p>
                                    </div>

                                    <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-4 space-y-3.5">
                                        {activeMonetization.strategies.map((strategy, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-velocity-red mt-0.5 flex-shrink-0" />
                                                <p className="font-sans text-[0.95rem] text-gray-200 leading-relaxed">{strategy}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-2">
                                        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-blue-400 mb-2.5">Who Does This Well</p>
                                        <p className="border-l-2 border-white/10 pl-3 font-sans text-[0.95rem] italic text-gray-300 leading-relaxed">
                                            {activeMonetization.examples}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </Widget>

                        <Widget title="Distribution Channels" icon={MessageCircle} visible={showResults} className="h-full" compact>
                            <div className="flex flex-col gap-4 pt-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-blue-200/80">
                                        Where Your Users Hang Out
                                    </p>
                                    <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-sans text-[10px] uppercase tracking-[0.14em] text-white/70">
                                        Top 5
                                    </div>
                                </div>

                                <div className="space-y-3.5">
                                    {data.distributionChannels.slice(0, 5).map((channel, index) => (
                                        <motion.a
                                            key={`${channel.name}-${index}`}
                                            href={getChannelHref(channel.name, index)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.45 + index * 0.08 }}
                                            className="flex items-center justify-between gap-4 rounded-[1.7rem] border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05]"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-2.5 w-2.5 rounded-full bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.45)]" />
                                                <p className="font-sans text-[0.95rem] font-bold text-white truncate">
                                                    {channel.name}
                                                    {renderCitationLinks(data.citations?.strategy?.distributionChannels?.[index], `distribution-channel-${index}`)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.14em] text-white/65">
                                                    {channel.type}
                                                </span>
                                                <span className="font-sans text-[0.95rem] font-bold text-velocity-red">{channel.members}</span>
                                            </div>
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        </Widget>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/40">Phase 3: Execution</span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    {renderPhasePromptComposer(
                        'execution',
                        'Asset prompt',
                        'Target the waitlist, the pitch deck, or the prompt chain directly when the strategy shifts.',
                    )}

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
                                                <button onClick={() => openSandboxedHtmlPreview(data.artifacts!.waitlistHtml!, 'waitlist')} aria-label="Preview waitlist page in new tab" className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
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
                                                    <iframe
                                                        srcDoc={data.artifacts.waitlistHtml}
                                                        title="Waitlist preview"
                                                        className="absolute inset-0 h-[200%] w-[200%] origin-top-left scale-50 border-0 bg-white"
                                                        sandbox="allow-scripts"
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
                                                <button onClick={() => openPitchDeckFullscreen(data.artifacts!.pitchDeckHtml!)} aria-label="Open pitch deck fullscreen" className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
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
                                            <iframe
                                                ref={pitchDeckIframeRef}
                                                srcDoc={getPitchDeckHtml()}
                                                title="Pitch deck preview"
                                                className="h-full w-full border-0"
                                                sandbox="allow-scripts"
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
                </motion.div>
            )}
        </AnimatePresence>
    );
};
