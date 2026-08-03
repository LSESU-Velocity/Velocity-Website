/**
 * Phase 2: Strategy. Customer segments, monetization, distribution channels.
 */
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Coins, MessageCircle, Users } from 'lucide-react';
import type { AnalysisData } from '../../lib/api';
import { Widget } from '../LaunchpadWidgets';
import type { RenderCitation } from './shared';

interface StrategyPhaseProps {
    data: AnalysisData;
    showResults: boolean;
    renderCitation: RenderCitation;
    getChannelHref: (channelName: string, index: number) => string;
}

const CAROUSEL_BUTTON =
    'flex h-7 w-7 flex-shrink-0 items-center justify-center border border-white/15 text-zinc-400 transition-colors hover:border-white/35 hover:text-white';

export const StrategyPhase: React.FC<StrategyPhaseProps> = ({
    data,
    showResults,
    renderCitation,
    getChannelHref,
}) => {
    const [monetizationIndex, setMonetizationIndex] = useState(0);
    const prefersReducedMotion = useReducedMotion();
    const still = Boolean(prefersReducedMotion);

    // Reset on the data reference, not identity strings: branches keep the
    // same name/tagline, so a string key would carry state across runs.
    useEffect(() => {
        setMonetizationIndex(0);
    }, [data]);

    const monetizationItems = data.monetization.length ? data.monetization : [{
        model: 'Monetization still being defined',
        pricing: 'TBD',
        strategies: ['Validate willingness to pay first'],
        examples: 'N/A',
    }];
    const activeMonetization = monetizationItems[monetizationIndex % monetizationItems.length];

    return (
        <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 xl:grid-cols-12">
            <Widget title="Customers" icon={Users} visible={showResults} className="xl:col-span-4" dense>
                <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10">
                    {data.customerSegments.slice(0, 3).map((segment, index) => (
                        <motion.div
                            key={`${segment.segment}-${index}`}
                            initial={still ? false : { opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.35, delay: still ? 0 : index * 0.07, ease: 'easeOut' }}
                            className="min-w-0 bg-velocity-black p-4"
                        >
                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <p className="min-w-0 font-sans text-sm font-bold leading-tight tracking-tight text-white">
                                    {segment.segment}
                                </p>
                                <span className="flex-shrink-0 border border-white/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400">
                                    {segment.age}
                                </span>
                            </div>

                            <div className="mt-2.5 space-y-1.5 font-sans text-[13px] leading-relaxed">
                                <div className="flex min-w-0 items-start gap-2">
                                    <span className="w-14 flex-shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-velocity-red">
                                        Target
                                    </span>
                                    <span className="min-w-0 text-zinc-300">{segment.interest}</span>
                                </div>
                                <div className="flex min-w-0 items-start gap-2">
                                    <span className="w-14 flex-shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                                        Income
                                    </span>
                                    <span className="min-w-0 text-zinc-300">{segment.income}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Widget>

            <Widget
                title="Revenue model"
                icon={Coins}
                visible={showResults}
                className="xl:col-span-4"
                dense
                action={
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                        <button
                            onClick={() => setMonetizationIndex((prev) => (prev - 1 + monetizationItems.length) % monetizationItems.length)}
                            aria-label="Previous monetization model"
                            className={CAROUSEL_BUTTON}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="select-none font-mono text-[10px] tabular-nums text-zinc-500" aria-live="polite">
                            {(monetizationIndex % monetizationItems.length) + 1}/{monetizationItems.length}
                        </span>
                        <button
                            onClick={() => setMonetizationIndex((prev) => (prev + 1) % monetizationItems.length)}
                            aria-label="Next monetization model"
                            className={CAROUSEL_BUTTON}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                }
            >
                {/* Keyed remount instead of AnimatePresence: the swap has to be
                    instant, and a waiting exit would hold the stale model. */}
                <motion.div
                    key={monetizationIndex}
                    initial={still ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="flex h-full min-w-0 flex-col gap-4"
                >
                        <div className="min-w-0">
                            <p className="font-sans text-2xl font-bold leading-tight tracking-tight text-white">
                                {activeMonetization.model}
                            </p>
                            <p className="mt-2 font-mono text-sm tracking-tight text-velocity-red">{activeMonetization.pricing}</p>
                        </div>

                        <div className="space-y-2.5">
                            {activeMonetization.strategies.map((strategy, index) => (
                                <div key={index} className="flex min-w-0 items-start gap-2.5">
                                    <span aria-hidden className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 bg-velocity-red" />
                                    <p className="min-w-0 font-sans text-[13px] leading-relaxed text-zinc-300">{strategy}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto border-t border-white/10 pt-4">
                            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">Who does this well</p>
                            <p className="mt-2 font-sans text-[13px] leading-relaxed text-zinc-300">
                                {activeMonetization.examples}
                            </p>
                        </div>
                </motion.div>
            </Widget>

            <Widget title="Channels" icon={MessageCircle} visible={showResults} className="xl:col-span-4" dense>
                <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10">
                    {data.distributionChannels.slice(0, 5).map((channel, index) => (
                        <motion.div
                            key={`${channel.name}-${index}`}
                            initial={still ? false : { opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.35, delay: still ? 0 : index * 0.05, ease: 'easeOut' }}
                            className="flex min-w-0 items-center justify-between gap-3 bg-velocity-black px-4 py-3 transition-colors hover:bg-white/[0.03]"
                        >
                            <div className="flex min-w-0 items-center gap-2.5">
                                <span aria-hidden className="h-1.5 w-1.5 flex-shrink-0 bg-velocity-red" />
                                <p className="min-w-0 truncate font-sans text-[13px] font-bold text-white">
                                    <a
                                        href={getChannelHref(channel.name, index)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="transition-colors hover:text-velocity-red"
                                    >
                                        {channel.name}
                                    </a>
                                    {renderCitation(data.citations?.strategy?.distributionChannels?.[index], `distribution-channel-${index}`)}
                                </p>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-3">
                                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">{channel.type}</span>
                                <span className="font-mono text-[11px] text-velocity-red">{channel.members}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Widget>
        </div>
    );
};
