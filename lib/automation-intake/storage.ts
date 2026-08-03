/**
 * Session-scoped draft storage for Automation Intake.
 * Lives in sessionStorage: draft data is not persisted across tabs/devices.
 * Cleared after successful submission.
 */
import { AutomationIntakeDraftSchema, type AutomationIntakeDraft } from './schemas.js';

const STORAGE_KEY = 'automation_intake_draft_v2';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function loadDraft(): AutomationIntakeDraft | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const result = AutomationIntakeDraftSchema.safeParse(parsed);
    if (!result.success) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

export function saveDraft(draft: AutomationIntakeDraft): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota exceeded: drop the transcript (the largest field) and retry once.
    try {
      const trimmed = { ...draft, transcript: draft.transcript.slice(-20) };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Give up silently; draft stays in memory only.
    }
  }
}

export function clearDraft(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
