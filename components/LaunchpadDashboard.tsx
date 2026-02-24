import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Zap, Target, Users, Coins, MessageCircle,
    Smartphone, Presentation, Terminal, ChevronLeft, ChevronRight,
    Download, Copy, ExternalLink, FileText, Loader2, ArrowRight
} from 'lucide-react';
import { Widget } from './LaunchpadWidgets';

interface LaunchpadDashboardProps {
    data: any;
    showResults: boolean;
}

export const LaunchpadDashboard: React.FC<LaunchpadDashboardProps> = ({ data, showResults }) => {
    const [competitorIndex, setCompetitorIndex] = useState(0);
    const [monetizationIndex, setMonetizationIndex] = useState(0);
    const [promptChainIndex, setPromptChainIndex] = useState(0);
    const pitchDeckIframeRef = useRef<HTMLIFrameElement>(null);

    const normalizeInsightList = (value: unknown): string[] => {
        if (!Array.isArray(value)) return [];
        return value
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.replace(/^[\s\-*.0-9)]+/, '').trim())
            .filter(Boolean);
    };

    const legacyInsightText = typeof data?.validation?.aiInsight === 'string'
        ? data.validation.aiInsight
        : '';

    const legacyInsightSentences = legacyInsightText
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);

    const legacyRiskBullets = legacyInsightSentences
        .filter((sentence) => /risk|challenge|uncertain|retention|cac|competition|regulator/i.test(sentence))
        .slice(0, 3);

    const keyInsights = normalizeInsightList(data?.validation?.industryInsights?.keyInsights);
    const risks = normalizeInsightList(data?.validation?.industryInsights?.risks);
    const whatToTestFirst = normalizeInsightList(data?.validation?.industryInsights?.whatToTestFirst);

    const industryInsightSections = [
        {
            title: 'Key Insights',
            items: keyInsights.length ? keyInsights : legacyInsightSentences.slice(0, 3),
        },
        {
            title: 'Risks',
            items: risks.length
                ? risks
                : (legacyRiskBullets.length ? legacyRiskBullets : legacyInsightSentences.slice(-1)),
        },
        {
            title: 'What to test first',
            items: whatToTestFirst.length ? whatToTestFirst : legacyInsightSentences.slice(-2),
        },
    ];

    // Prepare pitch deck HTML for secure iframe rendering
    // Uses external /deck-runtime.js instead of inline scripts to maintain strict CSP
    const getPitchDeckHtml = () => {
        if (!data?.artifacts?.pitchDeckHtml) return '';

        let html = data.artifacts.pitchDeckHtml;

        // Remove any existing inline Reveal.initialize script (API may include it)
        html = html.replace(/<script>[\s\S]*?Reveal\.initialize[\s\S]*?<\/script>/gi, '');

        // Inject external runtime script + styles before </body>
        // The external script handles Reveal init + postMessage navigation
        html = html.replace('</body>', `
    <script src="/deck-runtime.js"></script>
    <style>
        html, body { height: 100%; overflow: hidden !important; }
        .reveal { height: 100% !important; }
    </style>
</body>`);

        return html;
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const openInNewTab = (html: string) => {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    const openPitchDeckFullscreen = (pitchDeckHtml: string) => {
        // Store deck HTML so a same-origin viewer page can load it reliably
        const key = `velocity:deck:${Date.now()}:${Math.random().toString(16).slice(2)}`;
        localStorage.setItem(key, pitchDeckHtml);
        window.open(`/deck-viewer.html#${encodeURIComponent(key)}`, '_blank');
    };

    return (
        <AnimatePresence>
            {showResults && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-16 max-w-[1400px] mx-auto py-8"
                >
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 text-velocity-red mb-3">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-sans text-[10px] uppercase tracking-widest font-bold">Analysis Complete</span>
                        </div>
                        <h2 className="font-sans font-black text-4xl md:text-5xl tracking-tight text-white mb-3">{data.identity.name}</h2>
                        <p className="font-sans text-gray-400 text-sm md:text-base italic max-w-2xl mx-auto">{data.identity.tagline}</p>
                    </motion.div>

                    {/* Phase 1: Validation */}
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-px bg-white/10 flex-1"></div>
                            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Phase 1: Validation</span>
                            <div className="h-px bg-white/10 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Waitlist Inspiration */}
                            <div className="lg:col-span-3">
                                <Widget title="Waitlist Inspiration" icon={Smartphone} visible={showResults} className="h-full">
                                    <div className="flex flex-col h-full items-center gap-6 p-4">
                                        <p className="font-sans text-xs text-gray-400 text-center max-w-sm">
                                            <span className="text-white font-medium">Gauge real interest.</span> A waitlist proves demand.
                                        </p>

                                        <div className="relative w-full max-w-[240px] aspect-[9/19] bg-black border-[8px] border-[#1f1f1f] rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group/phone">
                                            <div className="w-full h-full bg-[#0a0a0a] relative flex flex-col items-center justify-center overflow-hidden">
                                                {data.artifacts?.waitlistHtml ? (
                                                    <div className="w-full h-full bg-white relative">
                                                        <iframe
                                                            srcDoc={data.artifacts.waitlistHtml.replace('</head>', `
                                                                <style>
                                                                    html, body {
                                                                        overflow: auto;
                                                                        scrollbar-width: none;
                                                                        -ms-overflow-style: none;
                                                                    }
                                                                    html::-webkit-scrollbar, body::-webkit-scrollbar {
                                                                        display: none;
                                                                    }
                                                                </style>
                                                                </head>
                                                            `)}
                                                            title="Waitlist Preview"
                                                            className="w-[200%] h-[200%] origin-top-left scale-50 border-0"
                                                            sandbox="allow-scripts"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="w-6 h-6 text-velocity-red animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {data.artifacts?.waitlistHtml && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => downloadHtml(data.artifacts!.waitlistHtml!, 'index.html')}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openInNewTab(data.artifacts!.waitlistHtml!)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </Widget>
                            </div>

                            {/* Industry Insights & Pitch Deck */}
                            <div className="lg:col-span-5 flex flex-col gap-6 h-full">
                                <Widget title="Industry Insights" icon={Zap} visible={showResults} className="flex-1">
                                    <div className="flex flex-col h-full max-h-[250px] pb-4">
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                            .industry-insights-scroll::-webkit-scrollbar {
                                                width: 6px;
                                            }
                                            .industry-insights-scroll::-webkit-scrollbar-track {
                                                background: rgba(255, 255, 255, 0.05);
                                                border-radius: 3px;
                                            }
                                            .industry-insights-scroll::-webkit-scrollbar-thumb {
                                                background: rgba(255, 255, 255, 0.15);
                                                border-radius: 3px;
                                                transition: background 0.2s;
                                            }
                                            .industry-insights-scroll::-webkit-scrollbar-thumb:hover {
                                                background: rgba(255, 31, 31, 0.6);
                                            }
                                        `}} />
                                        <div
                                            className="industry-insights-scroll font-sans text-sm md:text-base text-gray-200 leading-relaxed flex-1 min-h-0 mt-2 overflow-y-auto pr-2 pb-4"
                                            style={{
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: 'rgba(255, 255, 255, 0.15) rgba(255, 255, 255, 0.05)',
                                            }}
                                        >
                                            <div className="space-y-4">
                                                {industryInsightSections.map((section) => (
                                                    <div key={section.title}>
                                                        <h4 className="font-sans text-xs uppercase tracking-[0.12em] text-white/80">
                                                            {section.title}
                                                        </h4>
                                                        <ul className="mt-2 space-y-1.5 list-disc pl-5 marker:text-velocity-red">
                                                            {(section.items.length ? section.items : ['No data available.']).map((item, index) => (
                                                                <li key={`${section.title}-${index}`} className="text-gray-200">
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Widget>

                                {/* Pitch Deck */}
                                <Widget
                                    title="Pitch Deck Inspiration"
                                    icon={Presentation}
                                    visible={showResults}
                                    className="flex-1 min-h-0"
                                    action={data.artifacts?.pitchDeckHtml && (
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => {
                                                    pitchDeckIframeRef.current?.contentWindow?.postMessage({ type: 'prevSlide' }, '*');
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    pitchDeckIframeRef.current?.contentWindow?.postMessage({ type: 'nextSlide' }, '*');
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openPitchDeckFullscreen(data.artifacts!.pitchDeckHtml!)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                                title="Open in fullscreen"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => downloadHtml(data.artifacts!.pitchDeckHtml!, 'pitch-deck.html')}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                >
                                    <div className="flex flex-col h-full gap-4">
                                        <p className="font-sans text-[11px] text-gray-400 leading-relaxed">
                                            <span className="text-white font-medium">Build first, pitch second.</span> Use this as a starting point.
                                        </p>

                                        {data.artifacts?.pitchDeckHtml ? (
                                            <div className="flex-1 bg-black border border-white/10 relative rounded-2xl overflow-hidden">
                                                <iframe
                                                    ref={pitchDeckIframeRef}
                                                    srcDoc={getPitchDeckHtml()}
                                                    className="w-full h-full border-0"
                                                    title="Pitch Deck Preview"
                                                    id="pitch-deck-preview"
                                                    sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-forms"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="w-8 h-8 text-velocity-red animate-spin" />
                                                <p className="font-sans text-xs text-gray-400">Generating pitch deck...</p>
                                            </div>
                                        )}
                                    </div>
                                </Widget>
                            </div>

                            {/* Market Position */}
                            <div className="lg:col-span-4">
                                <Widget
                                    title="Market Position"
                                    icon={Target}
                                    visible={showResults}
                                    className="min-h-[400px]"
                                    action={
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setCompetitorIndex((prev) => (prev - 1 + data.validation.competitorList.length) % data.validation.competitorList.length)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="font-sans text-[10px] text-gray-400 tabular-nums px-2 select-none">
                                                {competitorIndex + 1}/{data.validation.competitorList.length}
                                            </span>
                                            <button
                                                onClick={() => setCompetitorIndex((prev) => (prev + 1) % data.validation.competitorList.length)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    }
                                >
                                    <div className="flex flex-col h-full py-1 gap-6">
                                        {/* Map */}
                                        <div className="relative w-full h-56 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent border border-white/10 rounded-2xl shrink-0 overflow-hidden group/map backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                                            {/* Axis Lines */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-full h-px bg-white/20" />
                                            </div>
                                            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-white/10 pointer-events-none" />
                                            {/* Center Glow */}
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/5 blur-xl rounded-full pointer-events-none" />

                                            {/* Labels */}
                                            <div className="absolute top-3 left-1/2 -translate-x-1/2 font-sans text-[9px] text-gray-400 font-medium z-10 bg-black/20 border border-white/5 px-2 py-0.5 rounded-full backdrop-blur-md">
                                                {data.validation.marketGap?.yAxis.high}
                                            </div>
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-sans text-[9px] text-gray-400 font-medium z-10 bg-black/20 border border-white/5 px-2 py-0.5 rounded-full backdrop-blur-md">
                                                {data.validation.marketGap?.yAxis.low}
                                            </div>
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-[9px] text-gray-400 font-medium z-10 bg-black/20 border border-white/5 px-2 py-0.5 rounded-full backdrop-blur-md">
                                                {data.validation.marketGap?.xAxis.low}
                                            </div>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-[9px] text-gray-400 font-medium z-10 bg-black/20 border border-white/5 px-2 py-0.5 rounded-full backdrop-blur-md">
                                                {data.validation.marketGap?.xAxis.high}
                                            </div>

                                            {/* Dots */}
                                            <div className="absolute top-6 right-6 bottom-6 left-6">
                                                {data.validation.competitorList.map((comp: any, i: number) => (
                                                    <motion.div
                                                        key={comp.name}
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                                                        className="absolute group/dot cursor-pointer"
                                                        style={{
                                                            left: `${comp.x}%`,
                                                            bottom: `${comp.y}%`,
                                                            transform: 'translate(-50%, 50%)'
                                                        }}
                                                        onClick={() => setCompetitorIndex(i)}
                                                    >
                                                        {competitorIndex === i ? (
                                                            <div className="w-5 h-5 rounded-full bg-velocity-red border-[3px] border-black shadow-[0_0_20px_rgba(255,31,31,0.8)] relative z-20 flex items-center justify-center">
                                                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-3 h-3 rounded-full bg-gray-600 border border-black/50 hover:bg-gray-400 transition-colors z-10" />
                                                        )}
                                                    </motion.div>
                                                ))}

                                                {/* Your position */}
                                                <motion.div
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ delay: 0.8, type: "spring" }}
                                                    className="absolute z-20"
                                                    style={{
                                                        left: `${data.validation.marketGap?.yourPosition.x ?? 50}%`,
                                                        bottom: `${data.validation.marketGap?.yourPosition.y ?? 50}%`,
                                                        transform: 'translate(-50%, 50%)'
                                                    }}
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-black shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={competitorIndex}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-velocity-red" />
                                                        <span className="font-sans font-bold text-white text-lg">{data.validation.competitorList[competitorIndex].name}</span>
                                                    </div>
                                                    {data.validation.competitorList[competitorIndex].website && (
                                                        <a
                                                            href={`https://${data.validation.competitorList[competitorIndex].website}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-sans text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 uppercase tracking-wider"
                                                        >
                                                            Visit Website <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>

                                                <p className="font-sans text-sm text-gray-300 leading-relaxed pl-4 border-l-2 border-emerald-500/30">
                                                    <span className="text-emerald-400 uppercase text-[10px] tracking-widest block mb-1">Strength</span>
                                                    {data.validation.competitorList[competitorIndex].strength}
                                                </p>

                                                <p className="font-sans text-sm text-gray-300 leading-relaxed pl-4 border-l-2 border-white/10">
                                                    <span className="text-gray-500 uppercase text-[10px] tracking-widest block mb-1">Weakness</span>
                                                    {data.validation.competitorList[competitorIndex].weakness}
                                                </p>
                                            </motion.div>
                                        </AnimatePresence>

                                        {/* Gap */}
                                        <div className="mt-auto pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="font-sans text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Your Gap</span>
                                            </div>
                                            <p className="font-sans text-sm text-white leading-relaxed pl-4">
                                                {data.validation.marketGap?.yourGap}
                                            </p>
                                        </div>
                                    </div>
                                </Widget>
                            </div>
                        </div>
                    </div>

                    {/* Phase 2: Strategy */}
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-px bg-white/10 flex-1"></div>
                            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Phase 2: Strategy</span>
                            <div className="h-px bg-white/10 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Customer Segments */}
                            <Widget title="Customer Segments" icon={Users} visible={showResults} className="h-full">
                                <div className="space-y-4 pt-2">
                                    {data.customerSegments.map((segment: any, i: number) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + i * 0.1 }}
                                            className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-sans font-bold text-white text-sm">{segment.segment}</span>
                                                <span className="font-sans text-[10px] text-gray-200 border border-white/10 px-2 py-0.5 rounded-full bg-black/50">{segment.age}</span>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-start gap-2 text-[11px] text-gray-300 font-sans">
                                                    <span className="text-velocity-red min-w-[40px] font-medium">Target:</span>
                                                    <span>{segment.interest}</span>
                                                </div>
                                                <div className="flex items-start gap-2 text-[11px] text-gray-300 font-sans">
                                                    <span className="text-blue-400 min-w-[40px] font-medium">Income:</span>
                                                    <span>{segment.income}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </Widget>

                            {/* Monetization */}
                            <Widget
                                title="Monetization Strategy"
                                icon={Coins}
                                visible={showResults}
                                className="h-full"
                                action={
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setMonetizationIndex((prev) => (prev - 1 + data.monetization.length) % data.monetization.length)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="font-sans text-[10px] text-gray-400 tabular-nums px-2 select-none">
                                            {monetizationIndex + 1}/{data.monetization.length}
                                        </span>
                                        <button
                                            onClick={() => setMonetizationIndex((prev) => (prev + 1) % data.monetization.length)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                }
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={monetizationIndex}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex flex-col h-full gap-4 pt-2"
                                    >
                                        <div>
                                            <p className="font-sans text-[10px] text-gray-400 mb-1 uppercase tracking-widest font-medium">Model</p>
                                            <p className="font-sans font-black text-white text-2xl tracking-tight leading-none mb-2">{data.monetization[monetizationIndex].model}</p>
                                            <p className="font-sans text-velocity-red font-bold text-sm tracking-wide">{data.monetization[monetizationIndex].pricing}</p>
                                        </div>

                                        <div className="space-y-2 mb-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                            {data.monetization[monetizationIndex].strategies.map((strat: string, i: number) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-velocity-red mt-0.5 flex-shrink-0" />
                                                    <span className="text-xs text-gray-200 leading-snug">{strat}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto">
                                            <p className="font-sans text-[10px] text-blue-400 uppercase tracking-widest mb-2 font-medium">Who Does This Well</p>
                                            <p className="font-sans text-xs text-gray-400 leading-relaxed italic border-l-2 border-white/10 pl-3">
                                                {data.monetization[monetizationIndex].examples}
                                            </p>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </Widget>

                            {/* Channels */}
                            <Widget title="Distribution Channels" icon={MessageCircle} visible={showResults} className="h-full">
                                <div className="flex flex-col gap-3 pt-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-sans text-[9px] text-gray-400 uppercase tracking-widest">
                                            Where Your Users Hang Out
                                        </p>
                                        <div className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-300 font-medium">TOP 5</div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {data.distributionChannels.map((channel: any, i: number) => (
                                            <motion.a
                                                href={`https://google.com/search?q=${encodeURIComponent(channel.name)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.8 + i * 0.1 }}
                                                className="flex items-center justify-between p-4 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-velocity-red/30 transition-all group/channel rounded-2xl cursor-pointer relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-velocity-red/5 translate-x-[-100%] group-hover/channel:translate-x-0 transition-transform duration-500 ease-out" />

                                                <div className="flex items-center gap-3 relative z-10">
                                                    <div className="w-2 h-2 rounded-full bg-velocity-red group-hover/channel:scale-125 transition-transform duration-300 shadow-[0_0_10px_rgba(255,31,31,0.5)]" />
                                                    <span className="font-sans text-sm text-gray-200 font-bold group-hover/channel:text-white transition-colors">{channel.name}</span>
                                                </div>

                                                <div className="flex items-center gap-2 relative z-10">
                                                    <span className="font-sans text-[9px] text-gray-400 border border-white/5 px-2 py-0.5 rounded-full uppercase bg-black/20 font-medium">{channel.type}</span>
                                                    <span className="font-sans text-[10px] text-velocity-red font-bold">{channel.members}</span>
                                                </div>
                                            </motion.a>
                                        ))}
                                    </div>
                                </div>
                            </Widget>
                        </div>
                    </div>

                    {/* Phase 3: Execution */}
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-px bg-white/10 flex-1"></div>
                            <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Phase 3: Execution</span>
                            <div className="h-px bg-white/10 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">

                            {/* Prompt Chain */}
                            <Widget
                                title="Prompt Chain"
                                icon={Terminal}
                                visible={showResults}
                                action={
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setPromptChainIndex((prev) => (prev - 1 + data.promptChain.length) % data.promptChain.length)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="font-sans text-[10px] text-gray-400 tabular-nums px-2 select-none">
                                            {promptChainIndex + 1}/{data.promptChain.length}
                                        </span>
                                        <button
                                            onClick={() => setPromptChainIndex((prev) => (prev + 1) % data.promptChain.length)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                }
                            >
                                <div className="flex flex-col h-full min-h-[300px]">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={promptChainIndex}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex-1 flex flex-col gap-4"
                                        >
                                            <div>
                                                <p className="font-sans text-[10px] text-gray-400 mb-1 uppercase tracking-widest font-medium">Step {data.promptChain[promptChainIndex].step}</p>
                                                <p className="font-sans font-bold text-white text-lg">{data.promptChain[promptChainIndex].title}</p>
                                            </div>

                                            <div
                                                className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-6 font-mono text-sm text-gray-300 overflow-y-auto max-h-[400px] leading-relaxed relative group/prompt cursor-pointer hover:bg-white/[0.07] transition-colors"
                                                onClick={() => copyToClipboard(data.promptChain[promptChainIndex].prompt)}
                                            >
                                                {data.promptChain[promptChainIndex].prompt}

                                                <div className="absolute top-4 right-4 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
                                                    <div className="flex items-center gap-2 bg-velocity-red text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                                        <Copy className="w-3 h-3" /> Copy
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </Widget>
                        </div>

                    </div>

                    {/* CTA */}
                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center justify-center py-2 mt-0"
                    >
                        <a
                            href="https://www.lsesu.com/communities/societies/group/Velocity/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-8 py-4 bg-velocity-red text-white text-sm font-bold uppercase tracking-wider rounded-full hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(255,31,31,0.3)] hover:shadow-[0_0_30px_rgba(255,31,31,0.5)] hover:scale-105 active:scale-95"
                        >
                            Join Velocity & Start Building <ArrowRight className="w-4 h-4" />
                        </a>
                    </motion.div>

                    {/* Disclaimer */}
                    <div className="text-center pb-8">
                        <p className="font-sans text-[10px] text-white/20 font-medium tracking-wide">
                            Velocity AI can make mistakes. Please verify important information.
                        </p>
                    </div>

                </motion.div>
            )
            }
        </AnimatePresence >
    );
};
