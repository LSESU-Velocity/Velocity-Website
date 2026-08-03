/**
 * Phase 1: Validation. Analyst council, market position, and market sizing.
 */
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, BookOpenText, ChevronLeft, ChevronRight, ExternalLink, Scale, Target } from 'lucide-react';
import type { AnalysisData } from '../../lib/api';
import { Widget } from '../LaunchpadWidgets';
import { CountUpNumber, useBarDraw, usePerceptualMapFx } from './gsapFx';
import {
    VerdictNeedle,
    buildMarketSizing,
    formatCompactUsers,
    getCouncilVerdictMeta,
    normalizeExternalHref,
    type RenderCitation,
} from './shared';

interface ValidationPhaseProps {
    data: AnalysisData;
    lab: NonNullable<AnalysisData['lab']>;
    councilJudge: NonNullable<NonNullable<AnalysisData['lab']>['council']['judge']>;
    showResults: boolean;
    renderCitation: RenderCitation;
}

const CAROUSEL_BUTTON =
    'flex h-7 w-7 flex-shrink-0 items-center justify-center border border-white/15 text-zinc-400 transition-colors hover:border-white/35 hover:text-white';

const BAR_TONES: Record<string, string> = {
    tam: 'bg-white/85',
    sam: 'bg-zinc-500',
    som: 'bg-velocity-red',
};

export const ValidationPhase: React.FC<ValidationPhaseProps> = ({
    data,
    lab,
    councilJudge,
    showResults,
    renderCitation,
}) => {
    const [competitorIndex, setCompetitorIndex] = useState(0);
    const prefersReducedMotion = useReducedMotion();
    const still = Boolean(prefersReducedMotion);

    useEffect(() => {
        setCompetitorIndex(0);
        // The data reference, not identity strings: branches share them.
    }, [data]);

    const councilVerdictMeta = getCouncilVerdictMeta(councilJudge.verdict);
    const mapRef = usePerceptualMapFx<HTMLDivElement>(
        `${data.identity?.name}|${(data.validation.competitorList || []).map((competitor) => competitor.name).join('|')}`,
    );
    const competitorList = Array.isArray(data.validation.competitorList) ? data.validation.competitorList : [];
    const marketGap = data.validation?.marketGap?.xAxis && data.validation?.marketGap?.yAxis && data.validation?.marketGap?.yourPosition
        ? data.validation.marketGap
        : {
            xAxis: { label: 'Ease of use', low: 'Simple', high: 'Advanced' },
            yAxis: { label: 'Focus', low: 'General', high: 'Specialized' },
            yourPosition: { x: 55, y: 60 },
            yourGap: 'A narrower wedge is still being defined.',
        };
    const marketSizing = (lab.marketSizing?.length === 3 ? lab.marketSizing : buildMarketSizing(data, lab.intake?.targetUser || undefined)).map((item) => ({
        key: item.key,
        label: item.label,
        title: item.title,
        value: item.value,
        ratio: item.ratio,
    }));
    const barsRef = useBarDraw<HTMLDivElement>(`${data.identity?.name}|${marketSizing.map((item) => item.value).join('|')}`);
    const activeCompetitor = competitorList.length ? competitorList[competitorIndex % competitorList.length] : null;
    const activeCompetitorWebsite = normalizeExternalHref(activeCompetitor?.website);
    const activeCompetitorCitation = activeCompetitor && competitorList.length
        ? data.citations?.validation?.competitors?.[competitorIndex % competitorList.length] || null
        : null;
    const marketReports = data.validation.marketReports.slice(0, 2);

    return (
        <>
            <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 xl:grid-cols-12">
                {/* Council ledger */}
                <Widget title="Analyst council" icon={Scale} visible={showResults} className="xl:col-span-5">
                    <div className="flex h-full min-w-0 flex-col gap-5">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] ${councilVerdictMeta.badge}`}>
                                    {councilVerdictMeta.label}
                                </span>
                                {councilJudge.degraded && (
                                    <span
                                        className="border border-dashed border-white/25 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400"
                                        title="The model returned too little for a full verdict, so this section was assembled from fallback content. Re-run the analysis for a stronger read."
                                    >
                                        Low-signal fallback
                                    </span>
                                )}
                            </div>
                            <p className={`mt-3 font-sans text-[15px] leading-relaxed ${councilVerdictMeta.tone}`}>
                                {councilJudge.finalTake}
                                {renderCitation(data.citations?.council?.finalTake, 'council-final-take')}
                            </p>
                            <VerdictNeedle verdict={councilJudge.verdict} className="mt-4" />
                        </div>

                        <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
                            <div className="min-w-0 bg-velocity-black p-4">
                                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">Bull case</p>
                                <div className="mt-3 space-y-2.5">
                                    {councilJudge.bullCase.map((item, index) => (
                                        <div key={`bull-${index}`} className="flex min-w-0 items-start gap-2.5">
                                            <span aria-hidden className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 bg-white" />
                                            <p className="min-w-0 font-sans text-[13px] leading-relaxed text-zinc-300">
                                                {item}
                                                {renderCitation(data.citations?.council?.bullCase?.[index], `council-bull-${index}`)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="min-w-0 bg-velocity-black p-4">
                                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">Bear case</p>
                                <div className="mt-3 space-y-2.5">
                                    {councilJudge.bearCase.map((item, index) => (
                                        <div key={`bear-${index}`} className="flex min-w-0 items-start gap-2.5">
                                            <span aria-hidden className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 bg-velocity-red" />
                                            <p className="min-w-0 font-sans text-[13px] leading-relaxed text-zinc-300">
                                                {item}
                                                {renderCitation(data.citations?.council?.bearCase?.[index], `council-bear-${index}`)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto min-w-0 border-t border-white/10 pt-4">
                            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">Deciding signals</p>
                            <div className="mt-3 space-y-2.5">
                                {councilJudge.decidingFactors.map((item, index) => (
                                    <div key={`judge-factor-${index}`} className="flex min-w-0 items-start gap-2.5">
                                        <span aria-hidden className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 border border-velocity-red" />
                                        <p className="min-w-0 font-sans text-[13px] leading-relaxed text-zinc-300">
                                            {item}
                                            {renderCitation(data.citations?.council?.decidingFactors?.[index], `council-factor-${index}`)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Widget>

                {/* Position map */}
                <Widget
                    title="Market position"
                    icon={Target}
                    visible={showResults}
                    className="xl:col-span-7"
                    action={
                        competitorList.length > 1 ? (
                            <div className="flex flex-shrink-0 items-center gap-1.5">
                                <button
                                    onClick={() => setCompetitorIndex((prev) => (prev - 1 + competitorList.length) % competitorList.length)}
                                    aria-label="Previous competitor"
                                    className={CAROUSEL_BUTTON}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <span className="select-none font-mono text-[10px] tabular-nums text-zinc-500" aria-live="polite">
                                    {competitorIndex + 1}/{competitorList.length}
                                </span>
                                <button
                                    onClick={() => setCompetitorIndex((prev) => (prev + 1) % competitorList.length)}
                                    aria-label="Next competitor"
                                    className={CAROUSEL_BUTTON}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : undefined
                    }
                >
                    <div className="flex h-full min-w-0 flex-col border border-white/10">
                        <div ref={mapRef} className="relative min-h-[260px] flex-1 overflow-hidden">
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div data-map-axis="x" className="h-px w-full bg-white/10" />
                                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2">
                                    <div data-map-axis="y" className="h-full w-full bg-white/10" />
                                </div>
                            </div>

                            <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                                {marketGap.yAxis.high}
                            </span>
                            <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                                {marketGap.yAxis.low}
                            </span>
                            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                                {marketGap.xAxis.low}
                            </span>
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                                {marketGap.xAxis.high}
                            </span>

                            <div className="absolute inset-[26px]">
                                {competitorList.map((competitor, index) => {
                                    const isActive = index === (competitorIndex % Math.max(competitorList.length, 1));

                                    return (
                                        <button
                                            key={competitor.name}
                                            type="button"
                                            onClick={() => setCompetitorIndex(index)}
                                            aria-label={`Show ${competitor.name}`}
                                            aria-pressed={isActive}
                                            className="absolute -translate-x-1/2 translate-y-1/2 text-left"
                                            style={{
                                                left: `${competitor.x}%`,
                                                bottom: `${competitor.y}%`,
                                            }}
                                        >
                                            <span
                                                data-map-pin
                                                className={`flex items-center gap-1.5 border px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                                                    isActive
                                                        ? 'border-velocity-red/60 bg-velocity-darkRed/40 text-white'
                                                        : 'border-white/15 bg-velocity-black text-zinc-500 hover:text-white'
                                                }`}
                                            >
                                                <span aria-hidden className={`h-1.5 w-1.5 flex-shrink-0 ${isActive ? 'bg-velocity-red' : 'bg-white/40'}`} />
                                                {index + 1}. {competitor.name}
                                            </span>
                                        </button>
                                    );
                                })}

                                <div
                                    className="absolute -translate-x-1/2 translate-y-1/2"
                                    style={{
                                        left: `${marketGap.yourPosition.x}%`,
                                        bottom: `${marketGap.yourPosition.y}%`,
                                    }}
                                >
                                    <div data-map-you className="relative">
                                        <span data-map-pulse aria-hidden className="pointer-events-none absolute inset-0 border border-velocity-red/60" />
                                        <div className="relative flex items-center gap-1.5 border border-velocity-red/60 bg-velocity-darkRed/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white">
                                            <span aria-hidden className="h-1.5 w-1.5 bg-velocity-red shadow-[0_0_10px_rgba(255,31,31,0.8)]" />
                                            You
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-2">
                            <div className="min-w-0 bg-velocity-black p-4">
                                {activeCompetitor ? (
                                    /* Keyed remount instead of AnimatePresence: the
                                       detail must swap the instant the pin changes. */
                                    <motion.div
                                        key={activeCompetitor.name}
                                        initial={still ? false : { opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.22, ease: 'easeOut' }}
                                        className="min-w-0"
                                    >
                                            <div className="flex min-w-0 items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">Competitor</p>
                                                    <p className="mt-2 font-sans text-base font-bold tracking-tight text-white">
                                                        {activeCompetitor.name}
                                                        {renderCitation(activeCompetitorCitation, 'active-competitor')}
                                                    </p>
                                                </div>
                                                {activeCompetitorWebsite && (
                                                    <a
                                                        href={activeCompetitorWebsite}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex flex-shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-velocity-red"
                                                    >
                                                        Site
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </div>

                                            <div className="mt-3 space-y-2.5">
                                                <div className="flex min-w-0 items-start gap-2.5">
                                                    <span aria-hidden className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 bg-white" />
                                                    <p className="min-w-0 font-sans text-[13px] leading-relaxed text-zinc-300">
                                                        {activeCompetitor.strength}
                                                        {renderCitation(activeCompetitorCitation, 'active-competitor-strength')}
                                                    </p>
                                                </div>
                                                <div className="flex min-w-0 items-start gap-2.5">
                                                    <span aria-hidden className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 bg-velocity-red" />
                                                    <p className="min-w-0 font-sans text-[13px] leading-relaxed text-zinc-400">
                                                        {activeCompetitor.weakness}
                                                        {renderCitation(activeCompetitorCitation, 'active-competitor-weakness')}
                                                    </p>
                                                </div>
                                            </div>
                                    </motion.div>
                                ) : (
                                    <p className="font-sans text-[13px] leading-relaxed text-zinc-500">
                                        No competitor map yet. Run another analysis once the market framing is sharper.
                                    </p>
                                )}
                            </div>

                            <div className="min-w-0 bg-velocity-black p-4">
                                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">
                                    Your gap <span className="text-velocity-red">//</span>
                                </p>
                                <p className="mt-3 font-sans text-[13px] leading-relaxed text-white">
                                    {marketGap.yourGap}
                                    {renderCitation(data.citations?.validation?.marketGap, 'market-gap')}
                                </p>
                            </div>
                        </div>
                    </div>
                </Widget>
            </div>

            {/* Market sizing instrument */}
            <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 xl:grid-cols-12">
                <Widget
                    title="Market sizing"
                    icon={BarChart3}
                    visible={showResults}
                    className={marketReports.length ? 'xl:col-span-8' : 'xl:col-span-12'}
                >
                    <div ref={barsRef} className="min-w-0 space-y-5">
                        {marketSizing.map((item) => (
                            <div key={item.key} className="min-w-0">
                                <div className="flex items-baseline justify-between gap-4">
                                    <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                                        <span className="text-white">{item.label}</span> <span className="text-velocity-red">//</span> {item.title}
                                    </p>
                                    <p className="flex-shrink-0 font-mono text-lg leading-none tracking-tight text-white">
                                        <CountUpNumber value={item.value} format={formatCompactUsers} />
                                        <span className="ml-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">users</span>
                                    </p>
                                </div>
                                <div className="mt-2 h-2 w-full bg-white/[0.06]">
                                    <div
                                        data-bar
                                        className={`h-full origin-left ${BAR_TONES[item.key] || 'bg-white/85'}`}
                                        style={{ width: `${Math.max(item.ratio * 100, 2)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-5 font-sans text-[11px] leading-relaxed text-zinc-400">
                        Heuristic reach estimate. Revise assumptions in the scenario console.
                    </p>
                </Widget>

                {marketReports.length > 0 && (
                    <Widget title="Grounded reports" icon={BookOpenText} visible={showResults} className="xl:col-span-4" dense>
                        <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10">
                            {marketReports.map((report, index) => {
                                const href = normalizeExternalHref(report.url);
                                const body = (
                                    <>
                                        <div className="flex min-w-0 items-start justify-between gap-3">
                                            <p className="min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                                                {report.publisher}
                                            </p>
                                            {href && <ExternalLink className="h-3 w-3 flex-shrink-0 text-zinc-600" />}
                                        </div>
                                        <p className="mt-2 font-sans text-[13px] leading-relaxed text-white">
                                            {report.title}
                                            {renderCitation(
                                                data.citations?.validation?.marketReports?.[index],
                                                `market-report-${index}`,
                                                href ? { interactive: false } : undefined,
                                            )}
                                        </p>
                                        <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-zinc-500">{report.keyStat}</p>
                                    </>
                                );

                                return href ? (
                                    <a
                                        key={`${report.title}-${index}`}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="min-w-0 bg-velocity-black p-4 transition-colors hover:bg-white/[0.03]"
                                    >
                                        {body}
                                    </a>
                                ) : (
                                    <div key={`${report.title}-${index}`} className="min-w-0 bg-velocity-black p-4">
                                        {body}
                                    </div>
                                );
                            })}
                        </div>
                    </Widget>
                )}
            </div>
        </>
    );
};
