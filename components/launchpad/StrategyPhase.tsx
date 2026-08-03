/**
 * Phase 2: Strategy. Customer segments, monetization, distribution channels.
 */
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, Coins, MessageCircle, Users } from 'lucide-react';
import type { AnalysisData } from '../../lib/api';
import { Widget } from '../LaunchpadWidgets';
import type { RenderCitation } from './shared';

interface StrategyPhaseProps {
    data: AnalysisData;
    showResults: boolean;
    renderCitation: RenderCitation;
    getChannelHref: (channelName: string, index: number) => string;
}

export const StrategyPhase: React.FC<StrategyPhaseProps> = ({
    data,
    showResults,
    renderCitation,
    getChannelHref,
}) => {
    const [monetizationIndex, setMonetizationIndex] = useState(0);

    const monetizationItems = data.monetization.length ? data.monetization : [{
        model: 'Monetization still being defined',
        pricing: 'TBD',
        strategies: ['Validate willingness to pay first'],
        examples: 'N/A',
    }];
    const activeMonetization = monetizationItems[monetizationIndex % monetizationItems.length];

    return (
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
                            <motion.div
                                key={`${channel.name}-${index}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.45 + index * 0.08 }}
                                className="flex items-center justify-between gap-4 rounded-[1.7rem] border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05]"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-2.5 w-2.5 rounded-full bg-velocity-red shadow-[0_0_12px_rgba(255,31,31,0.45)]" />
                                    <p className="font-sans text-[0.95rem] font-bold text-white truncate">
                                        <a
                                            href={getChannelHref(channel.name, index)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-blue-200"
                                        >
                                        {channel.name}
                                        </a>
                                        {renderCitation(data.citations?.strategy?.distributionChannels?.[index], `distribution-channel-${index}`)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.14em] text-white/65">
                                        {channel.type}
                                    </span>
                                    <span className="font-sans text-[0.95rem] font-bold text-velocity-red">{channel.members}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Widget>
        </div>
    );
};
