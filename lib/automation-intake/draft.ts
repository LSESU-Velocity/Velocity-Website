/**
 * Pure, browser-safe draft helpers. Zero dependency on Node-only modules
 * so this can be imported from both client components and server handlers.
 */
import {
  checkMinimumCompleteness,
  SCHEMA_VERSION,
  type AutomationIntakeDraft,
} from './schemas.js';
import { FIRST_STEP, STEP_DEFINITIONS } from './questions.js';

export function createInitialDraft(sessionId?: string): AutomationIntakeDraft {
  return {
    sessionId: sessionId || makeId(),
    schemaVersion: SCHEMA_VERSION,
    status: 'collecting',
    currentStep: FIRST_STEP,
    questionCount: 0,
    followUpsUsed: 0,
    chatAnswers: {},
    chatSkips: [],
    business: {
      primarySystems: [],
      toolStack: {
        emailAndCalendar: [],
        communication: [],
        docsAndPresentations: [],
        designAndCreative: [],
        projectManagement: [],
        fileStorage: [],
        reportingAndDashboards: [],
        crmAndSupport: [],
        automationAndIntegrations: [],
        other: [],
      },
    },
    workflows: [],
    aiUsage: {
      currentTools: [],
      currentUseCases: [],
      nonUseAreas: [],
      blockers: [],
    },
    constraints: {
      approvalRequirements: [],
      complianceNotes: [],
      integrationLimits: [],
    },
    goals: {
      desiredOutcomes: [],
      successMetrics: [],
    },
    contact: {
      consent: false,
    },
    transcript: [],
  };
}

export function isDraftReadyForReview(draft: AutomationIntakeDraft): boolean {
  if (draft.status === 'review' || draft.status === 'submitted') return true;
  const currentIndex = STEP_DEFINITIONS.findIndex((s) => s.id === draft.currentStep);
  const isPastContact =
    currentIndex === STEP_DEFINITIONS.length - 1 && draft.questionCount >= STEP_DEFINITIONS.length;
  if (!isPastContact) return false;
  return checkMinimumCompleteness(draft).length === 0;
}

export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
