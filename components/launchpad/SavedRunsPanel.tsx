/**
 * Saved Launchpad runs: load, branch, compare, export, import, delete.
 * Records live in localStorage via lib/launchpad-storage.
 */
import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, FolderOpen, GitBranch, GitCompareArrows, Trash2, Upload, X } from 'lucide-react';
import type { AnalysisData } from '../../lib/api';
import {
    hasValidAnalysisShape,
    upsertSavedAnalysis,
    type SavedLaunchpadAnalysis,
} from '../../lib/launchpad-storage';

interface SavedRunsPanelProps {
    records: SavedLaunchpadAnalysis[];
    activeId: string | null;
    onLoad: (record: SavedLaunchpadAnalysis) => void;
    onBranch: (record: SavedLaunchpadAnalysis) => void;
    onDelete: (record: SavedLaunchpadAnalysis) => void;
    onRecordsChanged: () => void;
}

function recordTitle(record: SavedLaunchpadAnalysis): string {
    return record.data?.identity?.name || record.idea.slice(0, 42) || 'Untitled run';
}

function formatUpdatedAt(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) +
        ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function exportRecord(record: SavedLaunchpadAnalysis) {
    const payload = JSON.stringify({ format: 'velocity-launchpad-analysis', version: 1, record }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `launchpad-${recordTitle(record).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'analysis'}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

interface CompareField {
    label: string;
    pick: (data: AnalysisData) => string;
}

const COMPARE_FIELDS: CompareField[] = [
    { label: 'Tagline', pick: (data) => data.identity.tagline },
    { label: 'Recommendation', pick: (data) => data.lab?.summary.recommendation || '—' },
    { label: 'Confidence', pick: (data) => data.lab ? `${data.lab.summary.confidenceScore}/100 (${data.lab.summary.confidenceLabel})` : '—' },
    { label: 'Council verdict', pick: (data) => data.lab?.council.judge?.verdict || '—' },
    { label: 'Market gap', pick: (data) => data.validation.marketGap.yourGap },
    {
        label: 'SOM (beachhead)',
        pick: (data) => {
            const som = data.lab?.marketSizing?.find((point) => point.key === 'som');
            return som ? `${som.value.toLocaleString()} users` : '—';
        },
    },
    { label: 'Lead monetization', pick: (data) => data.monetization[0] ? `${data.monetization[0].model} — ${data.monetization[0].pricing}` : '—' },
    { label: 'Top segment', pick: (data) => data.customerSegments[0]?.segment || '—' },
    { label: 'Top risk', pick: (data) => data.lab?.summary.openRisks[0] || data.validation.industryInsights.risks[0] || '—' },
    { label: 'Next move', pick: (data) => data.lab?.summary.nextMoves[0] || data.validation.industryInsights.whatToTestFirst[0] || '—' },
];

export const SavedRunsPanel: React.FC<SavedRunsPanelProps> = ({
    records,
    activeId,
    onLoad,
    onBranch,
    onDelete,
    onRecordsChanged,
}) => {
    const [compareSelection, setCompareSelection] = useState<string[]>([]);
    const [showCompare, setShowCompare] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const comparable = records.filter((record) => Boolean(record.data));
    const compareRecords = compareSelection
        .map((id) => records.find((record) => record.id === id))
        .filter((record): record is SavedLaunchpadAnalysis => Boolean(record && record.data));

    const toggleCompare = (id: string) => {
        setCompareSelection((current) => {
            if (current.includes(id)) {
                return current.filter((value) => value !== id);
            }
            // Keep at most two: the previous pick plus the new one.
            return [...current, id].slice(-2);
        });
    };

    const handleImportFile = async (file: File) => {
        setImportError(null);
        try {
            const parsed = JSON.parse(await file.text());
            const record = parsed?.record ?? parsed;

            if (!record || typeof record.idea !== 'string' || !hasValidAnalysisShape(record.data)) {
                setImportError('That file does not look like an exported Launchpad analysis.');
                return;
            }

            // New id: imports never overwrite an existing local record.
            upsertSavedAnalysis({
                id: null,
                idea: record.idea,
                data: record.data,
                parentId: null,
                promptHistory: Array.isArray(record.promptHistory) ? record.promptHistory : [],
            });
            onRecordsChanged();
        } catch {
            setImportError('Could not read that file as JSON.');
        }
    };

    if (!records.length) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-10 w-full max-w-4xl"
        >
            <div className="rounded-3xl border border-white/5 bg-black p-5 shadow-2xl">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/40">
                        Saved runs ({records.length})
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {compareRecords.length === 2 && (
                            <button
                                type="button"
                                onClick={() => setShowCompare(true)}
                                className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/[0.08] px-4 py-2 font-sans text-[10px] uppercase tracking-[0.18em] text-blue-200 hover:bg-blue-500/[0.14]"
                            >
                                <GitCompareArrows className="h-3.5 w-3.5" />
                                Compare selected
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.18em] text-white/70 hover:bg-white/10 hover:text-white"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Import JSON
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                    void handleImportFile(file);
                                }
                                event.target.value = '';
                            }}
                        />
                    </div>
                </div>

                {importError && (
                    <p className="mt-3 font-sans text-xs text-red-400">{importError}</p>
                )}

                <div className="mt-4 space-y-2">
                    {records.map((record) => {
                        const isActive = record.id === activeId;
                        const isSelected = compareSelection.includes(record.id);
                        const parent = record.parentId ? records.find((candidate) => candidate.id === record.parentId) : null;

                        return (
                            <div
                                key={record.id}
                                className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 md:flex-row md:items-center md:justify-between ${
                                    isActive ? 'border-velocity-red/30 bg-velocity-red/[0.06]' : 'border-white/10 bg-black/20'
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate font-sans text-sm font-semibold text-white">{recordTitle(record)}</p>
                                        {record.parentId && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/[0.08] px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.16em] text-blue-200">
                                                <GitBranch className="h-2.5 w-2.5" />
                                                {parent ? `Branch of ${recordTitle(parent)}` : 'Branch'}
                                            </span>
                                        )}
                                        {record.interruptState && !record.data && (
                                            <span className="rounded-full border border-velocity-red/25 bg-velocity-red/[0.08] px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.16em] text-red-200">
                                                Awaiting answers
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 truncate font-sans text-xs text-white/40">
                                        {record.idea}
                                    </p>
                                    <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.16em] text-white/30">
                                        {formatUpdatedAt(record.updatedAt)}
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                                    {record.data && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => toggleCompare(record.id)}
                                                disabled={comparable.length < 2}
                                                title="Select for compare"
                                                aria-pressed={isSelected}
                                                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                                                    isSelected
                                                        ? 'border-blue-400/40 bg-blue-500/20 text-blue-100'
                                                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                                                }`}
                                            >
                                                <GitCompareArrows className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onLoad(record)}
                                                title="Load this run"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white"
                                            >
                                                <FolderOpen className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onBranch(record)}
                                                title="Branch from this run"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white"
                                            >
                                                <GitBranch className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => exportRecord(record)}
                                                title="Export as JSON"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onDelete(record)}
                                        title="Delete this run"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:border-red-500/30 hover:text-red-300"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {showCompare && compareRecords.length === 2 && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCompare(false)}
                            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 16 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
                        >
                            <div
                                role="dialog"
                                aria-modal="true"
                                aria-label="Compare saved runs"
                                className="relative max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-black p-6 shadow-2xl"
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowCompare(false)}
                                    aria-label="Close compare view"
                                    className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/40">Branch compare</p>

                                <div className="mt-4 grid grid-cols-[140px_1fr_1fr] gap-x-4 gap-y-0 md:grid-cols-[180px_1fr_1fr]">
                                    <div />
                                    {compareRecords.map((record) => (
                                        <div key={`head-${record.id}`} className="border-b border-white/10 pb-3">
                                            <p className="font-sans text-lg font-black tracking-tight text-white">{recordTitle(record)}</p>
                                            <p className="mt-1 line-clamp-2 font-sans text-xs text-white/45">{record.idea}</p>
                                            <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.16em] text-white/30">{formatUpdatedAt(record.updatedAt)}</p>
                                        </div>
                                    ))}

                                    {COMPARE_FIELDS.map((field) => {
                                        const values = compareRecords.map((record) => field.pick(record.data!));
                                        const differs = values[0] !== values[1];

                                        return (
                                            <React.Fragment key={field.label}>
                                                <div className="border-b border-white/5 py-3 font-sans text-[10px] uppercase tracking-[0.16em] text-white/40">
                                                    {field.label}
                                                </div>
                                                {values.map((value, index) => (
                                                    <div
                                                        key={`${field.label}-${index}`}
                                                        className={`border-b border-white/5 py-3 pr-2 font-sans text-sm leading-relaxed ${
                                                            differs ? 'text-white' : 'text-white/55'
                                                        }`}
                                                    >
                                                        {value}
                                                    </div>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>

                                <p className="mt-4 font-sans text-[11px] text-white/35">
                                    Rows in white differ between the two runs.
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
