import type { AnalysisData, LabPromptHistoryEntry } from './api';

export interface InterruptSnapshot {
  reason: string;
  questions: Array<{ field: string; question: string; hint?: string }>;
}

export interface SavedLaunchpadAnalysis {
  id: string;
  idea: string;
  /** Null while a run is parked on a clarification interrupt. */
  data: AnalysisData | null;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
  label?: string;
  interruptState?: InterruptSnapshot | null;
  promptHistory?: LabPromptHistoryEntry[];
}

const STORAGE_KEY = 'launchpad_saved_analyses_v1';
const MAX_ANALYSES = 12;

function isBrowser() {
  return typeof window !== 'undefined';
}

function sortByUpdatedAt(records: SavedLaunchpadAnalysis[]) {
  return [...records].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function hasValidAnalysisShape(data: unknown): data is AnalysisData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const analysis = data as Partial<AnalysisData>;

  return Boolean(
    analysis.identity &&
    typeof analysis.identity.name === 'string' &&
    typeof analysis.identity.tagline === 'string' &&
    Array.isArray(analysis.customerSegments) &&
    Array.isArray(analysis.monetization) &&
    Array.isArray(analysis.distributionChannels) &&
    Array.isArray(analysis.promptChain) &&
    analysis.validation &&
    analysis.validation.marketGap &&
    Array.isArray(analysis.validation.competitorList),
  );
}

function coerceRecord(value: unknown): SavedLaunchpadAnalysis | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Partial<SavedLaunchpadAnalysis>;

  if (
    typeof record.id !== 'string' ||
    typeof record.idea !== 'string' ||
    typeof record.createdAt !== 'string' ||
    typeof record.updatedAt !== 'string'
  ) {
    return null;
  }

  const hasInterrupt = record.interruptState && typeof record.interruptState === 'object';
  if (!hasInterrupt && !hasValidAnalysisShape(record.data)) {
    return null;
  }

  return record as SavedLaunchpadAnalysis;
}

export function getSavedAnalyses(): SavedLaunchpadAnalysis[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortByUpdatedAt(parsed.map(coerceRecord).filter((record): record is SavedLaunchpadAnalysis => Boolean(record))).slice(0, MAX_ANALYSES);
  } catch {
    return [];
  }
}

export function getSavedAnalysisById(id: string): SavedLaunchpadAnalysis | null {
  return getSavedAnalyses().find((record) => record.id === id) || null;
}

function writeSavedAnalyses(records: SavedLaunchpadAnalysis[]) {
  if (!isBrowser()) {
    return;
  }

  const sorted = sortByUpdatedAt(records).slice(0, MAX_ANALYSES);

  for (let limit = sorted.length; limit >= 1; limit -= 1) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted.slice(0, limit)));
      return;
    } catch {
      // Reduce the number of stored analyses until the payload fits.
    }
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function upsertSavedAnalysis(input: {
  id?: string | null;
  idea: string;
  data: AnalysisData | null;
  interruptState?: InterruptSnapshot | null;
  parentId?: string | null;
  promptHistory?: LabPromptHistoryEntry[];
}): SavedLaunchpadAnalysis {
  const records = getSavedAnalyses();
  const now = new Date().toISOString();
  const existing = input.id ? records.find((record) => record.id === input.id) : null;

  const nextRecord: SavedLaunchpadAnalysis = {
    id: existing?.id || `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    idea: input.idea,
    data: input.data,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    parentId: input.parentId ?? existing?.parentId ?? null,
    label: existing?.label,
    interruptState: input.interruptState ?? null,
    promptHistory: input.promptHistory ?? existing?.promptHistory ?? [],
  };

  const nextRecords = [
    nextRecord,
    ...records.filter((record) => record.id !== nextRecord.id),
  ];

  writeSavedAnalyses(nextRecords);
  return nextRecord;
}

export function deleteSavedAnalysis(id: string): SavedLaunchpadAnalysis[] {
  const nextRecords = getSavedAnalyses().filter((record) => record.id !== id);
  writeSavedAnalyses(nextRecords);
  return nextRecords;
}

export function branchFromAnalysis(
  parentId: string,
  idea: string,
  label?: string,
): SavedLaunchpadAnalysis | null {
  const analyses = getSavedAnalyses();
  const parent = analyses.find((r) => r.id === parentId);
  if (!parent || !parent.data) {
    return null;
  }

  const now = new Date().toISOString();
  const branch: SavedLaunchpadAnalysis = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    idea,
    data: parent.data,
    createdAt: now,
    updatedAt: now,
    parentId,
    label: label || 'Branch',
    promptHistory: parent.promptHistory || [],
  };

  writeSavedAnalyses([branch, ...analyses]);
  return branch;
}

export function getBranchesOf(parentId: string): SavedLaunchpadAnalysis[] {
  return getSavedAnalyses().filter((r) => r.parentId === parentId);
}

export function clearSavedAnalyses() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}
