/**
 * Shared helpers and primitives for the Launchpad dashboard phase components.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import type { AnalysisData, CitationRef, LabPhaseId, LabPromptHistoryEntry, SourceDocument, WidgetTargetId } from '../../lib/api';
import { useDividerDraw } from './gsapFx';

export type RenderCitation = (
    citation?: CitationRef | null,
    keyPrefix?: string,
    options?: { interactive?: boolean },
) => React.ReactNode;

export const PHASE_TARGETS: Record<LabPhaseId, Array<{ id: WidgetTargetId; label: string }>> = {
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

export function uniqueStrings(items: Array<string | undefined>, limit: number) {
    return Array.from(new Set(items.filter((item): item is string => Boolean(item && item.trim())))).slice(0, limit);
}

export function isStringArray(value: unknown) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseAudienceSize(value: string): number | null {
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

export function formatCompactUsers(value: number) {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return `${value}`;
}

export function normalizeExternalHref(value?: string | null) {
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

export function getCouncilVerdictMeta(verdict: 'bull' | 'bear' | 'split') {
    if (verdict === 'bull') {
        return {
            label: 'Bull leads',
            tone: 'text-blue-300',
            badge: 'border-blue-500/25 bg-blue-500/10 text-blue-200',
        };
    }

    if (verdict === 'bear') {
        return {
            label: 'Bear leads',
            tone: 'text-red-300',
            badge: 'border-velocity-red/25 bg-velocity-red/10 text-red-200',
        };
    }

    return {
        label: 'Split decision',
        tone: 'text-white/85',
        badge: 'border-white/15 bg-white/[0.06] text-white/70',
    };
}

export function buildFallbackJudge(
    bull: NonNullable<NonNullable<AnalysisData['lab']>['council']['bull']>,
    bear: NonNullable<NonNullable<AnalysisData['lab']>['council']['bear']>,
    recommendation: string,
) {
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

export function createFallbackLab(data: AnalysisData): NonNullable<AnalysisData['lab']> {
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

export function hasValidLab(data: AnalysisData['lab'] | undefined): data is NonNullable<AnalysisData['lab']> {
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

export function buildMarketSizing(data: AnalysisData, targetUser?: string) {
    const reachableAudience = data.distributionChannels
        .map((channel) => parseAudienceSize(channel.members))
        .filter((value): value is number => value !== null)
        .reduce((sum, value) => sum + value, 0);

    const baseAudience = reachableAudience || Math.max(75_000, data.customerSegments.length * 45_000);
    const tam = Math.round(baseAudience * 6.5);
    const sam = Math.round(tam * 0.21);
    const som = Math.round(sam * 0.09);

    return [
        { key: 'tam', label: 'TAM', title: `All ${targetUser || 'potential users'}`, value: tam, ratio: 1 },
        { key: 'sam', label: 'SAM', title: 'Reachable first wedge', value: sam, ratio: sam / tam },
        { key: 'som', label: 'SOM', title: 'Initial beachhead', value: som, ratio: som / tam },
    ];
}

export function getPromptPreview(prompt: string, expanded: boolean) {
    if (expanded || prompt.length <= 260) {
        return prompt;
    }

    return `${prompt.slice(0, 260).trim()}...`;
}

export function getPhasePromptPlaceholder(phaseId: LabPhaseId, targetId: WidgetTargetId) {
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

export function getLatestPromptForPhase(promptHistory: LabPromptHistoryEntry[], phaseId: LabPhaseId) {
    return [...promptHistory].reverse().find((entry) => entry.phaseId === phaseId) || null;
}

export const PhaseDivider: React.FC<{ label: string }> = ({ label }) => {
    const ref = useDividerDraw<HTMLDivElement>();

    return (
        <div ref={ref} className="flex items-center gap-4">
            <div data-divider-line="left" className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-velocity-red/40" />
            <span data-divider-label className="inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.22em] text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.45)]" />
                {label}
            </span>
            <div data-divider-line="right" className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-velocity-red/40" />
        </div>
    );
};

export interface CitationLinksProps {
    citation?: CitationRef | null;
    keyPrefix?: string;
    sourceMap: Map<string, SourceDocument>;
    sourcesPageHref: string | null;
    interactive?: boolean;
}

export const CitationLinks: React.FC<CitationLinksProps> = ({
    citation,
    keyPrefix = 'citation',
    sourceMap,
    sourcesPageHref,
    interactive = true,
}) => {
    if (!citation?.sourceIds?.length) {
        return null;
    }

    const badgeClass = 'rounded-full border border-blue-400/20 bg-blue-400/[0.08] px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-200';

    return (
        <span className="ml-1.5 inline-flex flex-wrap items-center gap-1 align-super">
            {citation.sourceIds.map((sourceId, index) => {
                const source = sourceMap.get(sourceId);
                const sourceTitle = source?.title ?? 'source';

                const sourceHref = normalizeExternalHref(source?.url);

                if (interactive && sourceHref) {
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

                if (interactive && sourcesPageHref) {
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

export interface PhasePromptComposerProps {
    phaseId: LabPhaseId;
    title: string;
    description: string;
    promptValue: string;
    onPromptChange: (phaseId: LabPhaseId, value: string) => void;
    targetId: WidgetTargetId;
    onTargetChange: (phaseId: LabPhaseId, targetId: WidgetTargetId) => void;
    latestPrompt: LabPromptHistoryEntry | null;
    isBusy: boolean;
    applyDisabled: boolean;
    onApply: (phaseId: LabPhaseId) => void;
}

export const PhasePromptComposer: React.FC<PhasePromptComposerProps> = ({
    phaseId,
    title,
    description,
    promptValue,
    onPromptChange,
    targetId,
    onTargetChange,
    latestPrompt,
    isBusy,
    applyDisabled,
    onApply,
}) => (
    <div data-reveal className="rounded-[2rem] border border-white/5 bg-black p-5 shadow-2xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-blue-300/80">{title}</p>
                <p className="font-sans text-sm text-white mt-2 leading-relaxed">{description}</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] text-white/55">
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
                        onClick={() => onTargetChange(phaseId, target.id)}
                        className={`rounded-full border px-3 py-1.5 font-sans text-[11px] uppercase tracking-[0.16em] transition-colors ${
                            selected
                                ? 'border-velocity-red/40 bg-velocity-red/15 text-white shadow-[0_0_18px_rgba(255,31,31,0.18)]'
                                : 'border-white/10 bg-white/[0.03] text-white/45 hover:text-white/75'
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
                value={promptValue}
                onChange={(event) => onPromptChange(phaseId, event.target.value)}
                placeholder={getPhasePromptPlaceholder(phaseId, targetId)}
                rows={3}
                className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-3 font-sans text-sm text-white outline-none placeholder:text-white/25 focus:border-velocity-red/40"
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
                onClick={() => onApply(phaseId)}
                disabled={applyDisabled}
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
