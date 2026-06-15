/**
 * Phase 1: Validation — analyst council, market sizing, and market position.
 */
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, ChevronLeft, ChevronRight, ExternalLink, Scale, Target } from 'lucide-react';
import type { AnalysisData } from '../../lib/api';
import { Widget } from '../LaunchpadWidgets';
import { CountUpNumber, usePerceptualMapFx } from './gsapFx';
import {
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

export const ValidationPhase: React.FC<ValidationPhaseProps> = ({
    data,
    lab,
    councilJudge,
    showResults,
    renderCitation,
}) => {
    const [competitorIndex, setCompetitorIndex] = useState(0);

    useEffect(() => {
        setCompetitorIndex(0);
    }, [data.identity?.name, data.identity?.tagline]);

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
    const activeCompetitor = competitorList.length ? competitorList[competitorIndex % competitorList.length] : null;
    const activeCompetitorWebsite = normalizeExternalHref(activeCompetitor?.website);
    const activeCompetitorCitation = activeCompetitor && competitorList.length
        ? data.citations?.validation?.competitors?.[competitorIndex % competitorList.length] || null
        : null;

    return (
        <>
            <Widget title="Analyst Council" icon={Scale} visible={showResults} className="h-full">
                <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/40">Final judge</p>
                            <p className={`mt-3 font-sans text-lg leading-relaxed ${councilVerdictMeta.tone}`}>
                                {councilJudge.finalTake}
                                {renderCitation(data.citations?.council?.finalTake, 'council-final-take')}
                            </p>
                        </div>
                        <div className={`inline-flex items-center rounded-full border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.18em] ${councilVerdictMeta.badge}`}>
                            {councilVerdictMeta.label}
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="rounded-[1.7rem] border border-blue-500/20 bg-blue-500/[0.06] p-5">
                        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-blue-200/80">Bull is right about</p>
                        <div className="mt-4 space-y-3">
                            {councilJudge.bullCase.map((item, index) => (
                                <div key={`bull-${index}`} className="flex items-start gap-3">
                                    <div className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.45)]" />
                                    <p className="font-sans text-sm text-gray-100 leading-relaxed">
                                        {item}
                                        {renderCitation(data.citations?.council?.bullCase?.[index], `council-bull-${index}`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[1.7rem] border border-velocity-red/20 bg-velocity-red/[0.06] p-5">
                        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-red-200/80">Bear is right about</p>
                        <div className="mt-4 space-y-3">
                            {councilJudge.bearCase.map((item, index) => (
                                <div key={`bear-${index}`} className="flex items-start gap-3">
                                    <div className="mt-2 h-1.5 w-1.5 rounded-full bg-velocity-red shadow-[0_0_10px_rgba(255,31,31,0.45)]" />
                                    <p className="font-sans text-sm text-gray-100 leading-relaxed">
                                        {item}
                                        {renderCitation(data.citations?.council?.bearCase?.[index], `council-bear-${index}`)}
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
                                <div className="mt-2 h-1.5 w-1.5 rounded-full bg-white/70" />
                                <p className="font-sans text-sm text-gray-200 leading-relaxed">
                                    {item}
                                    {renderCitation(data.citations?.council?.decidingFactors?.[index], `council-factor-${index}`)}
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
                                            <p className="font-sans text-2xl font-black tracking-tight text-white">
                                                <CountUpNumber value={item.value} format={formatCompactUsers} />
                                            </p>
                                            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">users</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                                        <div
                                            className={`h-full rounded-full ${item.key === 'tam' ? 'bg-white/90' : item.key === 'sam' ? 'bg-blue-400' : 'bg-velocity-red shadow-[0_0_14px_rgba(255,31,31,0.45)]'}`}
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
                                                {renderCitation(data.citations?.validation?.marketReports?.[index], `market-report-${index}`, { interactive: false })}
                                            </p>
                                            <p className="mt-2 font-sans text-xs leading-relaxed text-white/50">{report.keyStat}</p>
                                        </div>
                                        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
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
                                                {renderCitation(data.citations?.validation?.marketReports?.[index], `market-report-${index}`)}
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
                            <div ref={mapRef} className="relative min-h-[320px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_55%,rgba(255,255,255,0.01))] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div data-map-axis="x" className="w-full h-px bg-white/10" />
                                    <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2">
                                        <div data-map-axis="y" className="h-full w-full bg-white/10" />
                                    </div>
                                    <div className="h-24 w-24 rounded-full bg-velocity-red/5 blur-2xl" />
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
                                            <button
                                                key={competitor.name}
                                                type="button"
                                                onClick={() => setCompetitorIndex(index)}
                                                className="absolute -translate-x-1/2 translate-y-1/2 text-left"
                                                style={{
                                                    left: `${competitor.x}%`,
                                                    bottom: `${competitor.y}%`,
                                                }}
                                            >
                                                <div data-map-pin className={`rounded-full border px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.14em] transition-all ${
                                                    isActive
                                                        ? 'border-velocity-red/40 bg-velocity-red/15 text-white shadow-[0_0_22px_rgba(255,31,31,0.25)]'
                                                        : 'border-white/10 bg-black/70 text-white/55 hover:text-white/80'
                                                }`}>
                                                    {index + 1}. {competitor.name}
                                                </div>
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
                                            <span data-map-pulse className="pointer-events-none absolute inset-0 rounded-full border border-velocity-red/60" />
                                            <div className="relative flex items-center gap-2 rounded-full border border-velocity-red/40 bg-velocity-red/15 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.16em] text-white shadow-[0_0_24px_rgba(255,31,31,0.28)]">
                                                <span className="h-2.5 w-2.5 rounded-full bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.6)]" />
                                                You
                                            </div>
                                        </div>
                                    </div>
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
                                                        {renderCitation(activeCompetitorCitation, 'active-competitor')}
                                                    </p>
                                                </div>
                                                {activeCompetitorWebsite && (
                                                    <a
                                                        href={activeCompetitorWebsite}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-[0.16em] text-blue-300 hover:text-blue-200"
                                                    >
                                                        Website
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>

                                            <div className="space-y-4 mt-5">
                                                <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.05] p-4">
                                                    <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-blue-300 mb-2">Strength</p>
                                                    <p className="font-sans text-sm text-white/90 leading-relaxed">
                                                        {activeCompetitor.strength}
                                                        {renderCitation(activeCompetitorCitation, 'active-competitor-strength')}
                                                    </p>
                                                </div>
                                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                                    <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35 mb-2">Weakness</p>
                                                    <p className="font-sans text-sm text-white/80 leading-relaxed">
                                                        {activeCompetitor.weakness}
                                                        {renderCitation(activeCompetitorCitation, 'active-competitor-weakness')}
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

                                <div className="mt-auto rounded-3xl border border-velocity-red/20 bg-velocity-red/[0.06] p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.5)]" />
                                        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-red-300">Your Gap</p>
                                    </div>
                                    <p className="font-sans text-sm text-white leading-relaxed">
                                        {marketGap.yourGap}
                                        {renderCitation(data.citations?.validation?.marketGap, 'market-gap')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Widget>
                </div>
            </div>
        </>
    );
};
