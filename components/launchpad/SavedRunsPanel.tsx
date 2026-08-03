/**
 * Saved Launchpad runs: load, branch, compare, export, import, delete.
 * Records live in localStorage via lib/launchpad-storage.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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

const ICON_BUTTON =
    'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center bg-velocity-black text-zinc-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30';

const TOOL_BUTTON =
    'inline-flex items-center gap-2 border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:border-white/35 hover:text-white';

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
    { label: 'Recommendation', pick: (data) => data.lab?.summary.recommendation || 'N/A' },
    { label: 'Confidence', pick: (data) => data.lab ? `${data.lab.summary.confidenceScore}/100 (${data.lab.summary.confidenceLabel})` : 'N/A' },
    { label: 'Council verdict', pick: (data) => data.lab?.council.judge?.verdict || 'N/A' },
    { label: 'Market gap', pick: (data) => data.validation.marketGap.yourGap },
    {
        label: 'SOM (beachhead)',
        pick: (data) => {
            const som = data.lab?.marketSizing?.find((point) => point.key === 'som');
            return som ? `${som.value.toLocaleString()} users` : 'N/A';
        },
    },
    { label: 'Lead monetization', pick: (data) => data.monetization[0] ? `${data.monetization[0].model}: ${data.monetization[0].pricing}` : 'N/A' },
    { label: 'Top segment', pick: (data) => data.customerSegments[0]?.segment || 'N/A' },
    { label: 'Top risk', pick: (data) => data.lab?.summary.openRisks[0] || data.validation.industryInsights.risks[0] || 'N/A' },
    { label: 'Next move', pick: (data) => data.lab?.summary.nextMoves[0] || data.validation.industryInsights.whatToTestFirst[0] || 'N/A' },
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
    const prefersReducedMotion = useReducedMotion();
    const still = Boolean(prefersReducedMotion);

    const comparable = records.filter((record) => Boolean(record.data));
    const compareRecords = compareSelection
        .map((id) => records.find((record) => record.id === id))
        .filter((record): record is SavedLaunchpadAnalysis => Boolean(record && record.data));
    const compareOpen = showCompare && compareRecords.length === 2;

    const compareDialogRef = useRef<HTMLDivElement>(null);
    const compareOpenerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (compareOpen) {
            compareOpenerRef.current = document.activeElement as HTMLElement | null;
            // setTimeout rather than rAF: rAF never fires in hidden tabs.
            const timer = window.setTimeout(() => compareDialogRef.current?.focus(), 0);
            return () => window.clearTimeout(timer);
        }
        if (compareOpenerRef.current) {
            compareOpenerRef.current.focus();
            compareOpenerRef.current = null;
        }
    }, [compareOpen]);

    const handleCompareKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowCompare(false);
            return;
        }
        if (e.key === 'Tab' && compareDialogRef.current) {
            const focusable = compareDialogRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }, []);

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
            initial={still ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mx-auto mt-12 w-full max-w-4xl"
        >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                    Run archive <span className="text-velocity-red">//</span> {records.length} saved
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    {compareRecords.length === 2 && (
                        <button
                            type="button"
                            onClick={() => setShowCompare(true)}
                            className={TOOL_BUTTON}
                        >
                            <GitCompareArrows className="h-3.5 w-3.5" />
                            Compare selected
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={TOOL_BUTTON}
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
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-velocity-red">{importError}</p>
            )}

            <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10">
                {records.map((record) => {
                    const isActive = record.id === activeId;
                    const isSelected = compareSelection.includes(record.id);
                    const parent = record.parentId ? records.find((candidate) => candidate.id === record.parentId) : null;

                    return (
                        <div
                            key={record.id}
                            className={`flex min-w-0 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between ${
                                isActive ? 'bg-velocity-darkRed/25' : 'bg-velocity-black'
                            }`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate font-sans text-sm font-bold text-white">{recordTitle(record)}</p>
                                    {record.parentId && (
                                        <span className="inline-flex items-center gap-1 border border-white/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400">
                                            <GitBranch className="h-2.5 w-2.5" />
                                            {parent ? `Branch of ${recordTitle(parent)}` : 'Branch'}
                                        </span>
                                    )}
                                    {record.interruptState && !record.data && (
                                        <span className="border border-velocity-red/45 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-velocity-red">
                                            Awaiting answers
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 truncate font-mono text-[10px] tracking-[0.04em] text-zinc-500">
                                    {record.idea}
                                </p>
                            </div>

                            <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
                                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                                    {formatUpdatedAt(record.updatedAt)}
                                </span>
                                <div className="flex flex-wrap gap-px bg-white/10 p-px">
                                    {record.data && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => toggleCompare(record.id)}
                                                disabled={comparable.length < 2}
                                                title="Select for compare"
                                                aria-pressed={isSelected}
                                                className={`${ICON_BUTTON} ${isSelected ? 'bg-velocity-red text-white hover:text-white' : ''}`}
                                            >
                                                <GitCompareArrows className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onLoad(record)}
                                                title="Load this run"
                                                className={ICON_BUTTON}
                                            >
                                                <FolderOpen className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onBranch(record)}
                                                title="Branch from this run"
                                                className={ICON_BUTTON}
                                            >
                                                <GitBranch className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => exportRecord(record)}
                                                title="Export as JSON"
                                                className={ICON_BUTTON}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onDelete(record)}
                                        title="Delete this run"
                                        className={`${ICON_BUTTON} hover:text-velocity-red`}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Rendered conditionally rather than through AnimatePresence: a
                stalled exit would leave these fixed overlays swallowing clicks. */}
            {compareOpen && (
                <>
                    <motion.div
                        initial={still ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        aria-hidden
                        className="fixed inset-0 z-50 bg-black/85"
                    />
                    <motion.div
                        initial={still ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        onClick={(event) => {
                            // The wrapper covers the backdrop, so outside
                            // clicks land here: direct hits only.
                            if (event.target === event.currentTarget) {
                                setShowCompare(false);
                            }
                        }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
                    >
                        <div
                            ref={compareDialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Compare saved runs"
                            onKeyDown={handleCompareKeyDown}
                            tabIndex={-1}
                            className="relative max-h-[88vh] w-full max-w-4xl overflow-y-auto border border-white/15 bg-velocity-black p-5 outline-none md:p-6"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                                    Branch compare <span className="text-velocity-red">//</span> 02 runs
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowCompare(false)}
                                    aria-label="Close compare view"
                                    className="flex-shrink-0 border border-white/15 p-2 text-zinc-400 transition-colors hover:border-white/35 hover:text-white"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="mt-5 grid grid-cols-[110px_1fr_1fr] gap-px border border-white/10 bg-white/10 md:grid-cols-[170px_1fr_1fr]">
                                <div className="bg-velocity-black" />
                                {compareRecords.map((record) => (
                                    <div key={`head-${record.id}`} className="min-w-0 bg-velocity-black px-3 py-3">
                                        <p className="truncate font-sans text-sm font-bold text-white">{recordTitle(record)}</p>
                                        <p className="mt-1 truncate font-mono text-[10px] tracking-[0.04em] text-zinc-500">{record.idea}</p>
                                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">{formatUpdatedAt(record.updatedAt)}</p>
                                    </div>
                                ))}

                                {COMPARE_FIELDS.map((field) => {
                                    const values = compareRecords.map((record) => field.pick(record.data!));
                                    const differs = values[0] !== values[1];

                                    return (
                                        <React.Fragment key={field.label}>
                                            <div className="min-w-0 bg-velocity-black px-3 py-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.16em] text-zinc-500">
                                                {field.label}
                                            </div>
                                            {values.map((value, index) => (
                                                <div
                                                    key={`${field.label}-${index}`}
                                                    className={`min-w-0 bg-velocity-black px-3 py-3 font-sans text-[13px] leading-relaxed ${
                                                        differs ? 'text-white' : 'text-zinc-500'
                                                    }`}
                                                >
                                                    {value}
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                                Rows in white differ between the two runs.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
};
