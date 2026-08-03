/**
 * Shared helpers and primitives for the Launchpad dashboard phase components.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
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

/**
 * Verdict palette: bull reads as white, bear as red, split as neutral zinc.
 * `position` is the needle offset in percent along the BULL..BEAR rail.
 */
export function getCouncilVerdictMeta(verdict: 'bull' | 'bear' | 'split') {
    if (verdict === 'bull') {
        return {
            label: 'Bull leads',
            tone: 'text-white',
            badge: 'border-white/25 text-white',
            position: 4,
        };
    }

    if (verdict === 'bear') {
        return {
            label: 'Bear leads',
            tone: 'text-white',
            badge: 'border-velocity-red/50 text-velocity-red',
            position: 96,
        };
    }

    return {
        label: 'Split decision',
        tone: 'text-white',
        badge: 'border-white/15 text-zinc-300',
        position: 50,
    };
}

/** Instrument needle showing where the judge landed between the two poles. */
export const VerdictNeedle: React.FC<{ verdict: 'bull' | 'bear' | 'split'; className?: string }> = ({
    verdict,
    className = '',
}) => {
    const { position } = getCouncilVerdictMeta(verdict);

    return (
        <div className={`min-w-0 ${className}`}>
            <div className="relative h-px w-full bg-white/15">
                <span
                    aria-hidden
                    className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.6)]"
                    style={{ left: `${position}%` }}
                />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.2em]">
                <span className={verdict === 'bull' ? 'text-white' : 'text-zinc-600'}>Bull</span>
                <span className={verdict === 'split' ? 'text-white' : 'text-zinc-600'}>Split</span>
                <span className={verdict === 'bear' ? 'text-velocity-red' : 'text-zinc-600'}>Bear</span>
            </div>
        </div>
    );
};

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
        // Synthesized locally from memo fragments, flagged so the UI can say so.
        degraded: true,
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

/** One concrete what-if per target: shown as a click-to-fill example chip. */
const SCENARIO_EXAMPLES: Record<WidgetTargetId, string> = {
    validation: 'What if we launch on one campus first?',
    marketSizing: 'What if pricing is GBP 100/month for agencies?',
    marketPosition: 'What if boutique law firms are the wedge?',
    strategy: 'What if boutique law firms are our first segment?',
    monetization: 'What if pricing moves to GBP 100/month?',
    customerSegments: 'What if we only target fintech operators?',
    distributionChannels: 'What if we go campus-first instead of online?',
    waitlist: 'What if the waitlist targets enterprise buyers?',
    pitchDeck: 'What if the deck leads with ROI instead of vision?',
    promptChain: 'What if the MVP starts as a concierge service?',
};

export function getScenarioExample(targetId: WidgetTargetId) {
    return SCENARIO_EXAMPLES[targetId];
}

export function getLatestPromptForPhase(promptHistory: LabPromptHistoryEntry[], phaseId: LabPhaseId) {
    return [...promptHistory].reverse().find((entry) => entry.phaseId === phaseId) || null;
}

/**
 * Phase rail header: mono index, phase name, and a hairline rail that draws
 * out to the right edge when the band scrolls into view.
 */
export const PhaseDivider: React.FC<{ no: string; label: string }> = ({ no, label }) => {
    const ref = useDividerDraw<HTMLDivElement>();

    return (
        <div ref={ref} className="flex items-center gap-4">
            <p data-divider-label className="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                <span className="text-velocity-red">{no}</span> {label}
            </p>
            <div data-divider-line="right" className="h-px min-w-0 flex-1 bg-white/10" />
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

    const badgeClass = 'inline-block border border-white/15 px-1 font-mono text-[9px] uppercase leading-[1.5] tracking-[0.1em] text-zinc-400 transition-colors hover:border-white/35 hover:text-white';

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
    /** Mono label after the SCENARIO CONSOLE prefix, e.g. "Validation". */
    title: string;
    promptValue: string;
    onPromptChange: (phaseId: LabPhaseId, value: string) => void;
    targetId: WidgetTargetId;
    onTargetChange: (phaseId: LabPhaseId, targetId: WidgetTargetId) => void;
    latestPrompt: LabPromptHistoryEntry | null;
    isBusy: boolean;
    applyDisabled: boolean;
    onApply: (phaseId: LabPhaseId) => void;
    expanded: boolean;
    onExpandedChange: (phaseId: LabPhaseId, expanded: boolean) => void;
}

/**
 * Scenario console: a collapsed terminal prompt line that opens into the
 * scoped-mutation composer (target chips, instruction, apply).
 */
export const PhasePromptComposer: React.FC<PhasePromptComposerProps> = ({
    phaseId,
    title,
    promptValue,
    onPromptChange,
    targetId,
    onTargetChange,
    latestPrompt,
    isBusy,
    applyDisabled,
    onApply,
    expanded,
    onExpandedChange,
}) => {
    const panelId = `scenario-console-${phaseId}`;
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const targetLabel = PHASE_TARGETS[phaseId].find((target) => target.id === targetId)?.label ?? 'target';

    return (
        // The red left edge, the what-if hint, and the Try it chip mark this
        // strip as the phase's rewrite input, not another static widget.
        <div className="border border-velocity-red/25 border-l-2 border-l-velocity-red bg-velocity-black">
            <button
                type="button"
                onClick={() => onExpandedChange(phaseId, !expanded)}
                aria-expanded={expanded}
                aria-controls={panelId}
                className="group flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 text-left transition-colors hover:bg-velocity-darkRed/10 md:px-5"
            >
                <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
                    What if <span className="text-velocity-red">{title}</span>
                </span>
                <span className="ml-auto flex flex-shrink-0 items-center gap-1.5 border border-white/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 transition-colors group-hover:border-velocity-red/60 group-hover:text-white md:order-last">
                    {expanded ? 'Close' : 'Try it'}
                    <ChevronDown
                        className={`h-3 w-3 flex-shrink-0 transition-transform duration-300 motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
                    />
                </span>
                {/* Full sentence on its own row below the title on mobile,
                    inline between title and chip on md and up. */}
                {!expanded && (
                    <span className="flex w-full min-w-0 items-baseline gap-2 font-mono text-[11px] text-zinc-400 md:w-auto md:flex-1">
                        <span aria-hidden className="flex-shrink-0 text-velocity-red">&gt;</span>
                        <span className="min-w-0 transition-colors group-hover:text-zinc-200 md:truncate">
                            Change an assumption. AI rewrites the widgets below.
                        </span>
                    </span>
                )}
            </button>

            {expanded && (
                <div id={panelId} className="border-t border-white/10 px-4 pb-4 pt-4 md:px-5">
                    <p className="font-mono text-[10px] leading-relaxed text-zinc-400">
                        AI rewrites only the selected target. Everything else stays.
                    </p>

                    <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">
                        Rewrite
                    </p>
                    <div className="mt-2 flex flex-wrap gap-px bg-white/10 p-px">
                        {PHASE_TARGETS[phaseId].map((target) => {
                            const selected = target.id === targetId;

                            return (
                                <button
                                    key={`${phaseId}-${target.id}`}
                                    type="button"
                                    onClick={() => onTargetChange(phaseId, target.id)}
                                    aria-pressed={selected}
                                    className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                                        selected
                                            ? 'bg-velocity-red text-white'
                                            : 'bg-velocity-black text-zinc-500 hover:text-white'
                                    }`}
                                >
                                    {target.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Click-to-fill example: teaches the input by doing. It
                        only fills the textarea, it never applies. */}
                    <button
                        type="button"
                        onClick={() => {
                            onPromptChange(phaseId, getScenarioExample(targetId));
                            textareaRef.current?.focus();
                        }}
                        className="mt-3 flex w-full min-w-0 items-baseline gap-2 border border-dashed border-white/20 px-3 py-2.5 text-left font-mono text-[11px] text-zinc-400 transition-colors hover:border-velocity-red/50 hover:text-white"
                    >
                        <span className="flex-shrink-0 uppercase tracking-[0.2em] text-velocity-red">
                            Try
                        </span>
                        <span className="min-w-0">{getScenarioExample(targetId)}</span>
                    </button>

                    <label className="sr-only" htmlFor={`phase-prompt-${phaseId}`}>
                        What-if scenario for the {title} phase
                    </label>
                    <textarea
                        ref={textareaRef}
                        id={`phase-prompt-${phaseId}`}
                        value={promptValue}
                        onChange={(event) => onPromptChange(phaseId, event.target.value)}
                        placeholder="Describe the change you want to test..."
                        rows={3}
                        className="mt-3 w-full border border-white/10 bg-black px-3 py-3 font-mono text-[12px] leading-relaxed text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-velocity-red/60"
                    />

                    <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {latestPrompt ? (
                            <p className="min-w-0 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                                Last update{' '}
                                <span className="normal-case tracking-normal text-zinc-300">{latestPrompt.summary}</span>
                            </p>
                        ) : (
                            <span />
                        )}

                        <button
                            type="button"
                            onClick={() => onApply(phaseId)}
                            disabled={applyDisabled}
                            className="inline-flex flex-shrink-0 items-center justify-center gap-2 border border-velocity-red/50 bg-velocity-darkRed/20 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white transition-colors duration-300 hover:border-velocity-red hover:bg-velocity-red disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-zinc-600"
                        >
                            {isBusy ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                                    Rewriting
                                </>
                            ) : (
                                `Rewrite ${targetLabel}`
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
