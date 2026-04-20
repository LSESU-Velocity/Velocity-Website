/**
 * Safe merge helpers for Automation Intake.
 * Model-produced patches are treated as untrusted — every merge clamps lengths,
 * dedupes arrays, and ignores unknown keys.
 */
import {
  TOOL_STACK_CATEGORIES,
  type AutomationIntakeDraft,
  type ToolStack,
  type Workflow,
  type StepId,
} from './schemas.js';

const MAX_ARRAY_APPEND = 20;

function clamp(str: unknown, max: number): string | undefined {
  if (typeof str !== 'string') return undefined;
  const trimmed = str.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function toStringArray(val: unknown, maxPerItem = 500): string[] {
  if (!Array.isArray(val)) return [];
  const out: string[] = [];
  for (const item of val) {
    const s = clamp(item, maxPerItem);
    if (s) out.push(s);
    if (out.length >= MAX_ARRAY_APPEND) break;
  }
  return out;
}

function dedupeAppend(existing: string[] | undefined, next: string[], maxTotal = 40): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of [...(existing ?? []), ...next]) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= maxTotal) break;
  }
  return result;
}

// ----- Step-specific patch shapes coming from the model -----

export interface BusinessPatch {
  businessName?: string;
  website?: string;
  sector?: string;
  teamSizeBand?: string;
  whatTheyDo?: string;
  whoTheyServe?: string;
}

export interface SystemsPatch {
  toolStack?: Partial<Record<keyof ToolStack, string[]>>;
}

export interface WorkflowNamePatch {
  name?: string;
}

export interface WorkflowOwnershipPatch {
  owner?: string;
  frequency?: string;
}

export interface WorkflowToolsPatch {
  tools?: string[];
}

export interface WorkflowStepsPatch {
  currentSteps?: string[];
}

export interface PainPointsPatch {
  painPoints?: string[];
}

export interface AiUsagePatch {
  currentTools?: string[];
  currentUseCases?: string[];
  maturity?: 'none' | 'experimental' | 'active';
}

export interface AiNonUsePatch {
  nonUseAreas?: string[];
  blockers?: string[];
}

export interface ConstraintsPatch {
  sensitiveData?: boolean;
  sensitiveDataNotes?: string;
  approvalRequirements?: string[];
  complianceNotes?: string[];
  integrationLimits?: string[];
}

export interface GoalsPatch {
  desiredOutcomes?: string[];
  successMetrics?: string[];
  timeline?: string;
  preferredProjectShape?: string;
}

export interface ContactPatch {
  name?: string;
  role?: string;
  email?: string;
  consent?: boolean;
}

export type StepPatch =
  | { stepId: 'business'; data: BusinessPatch; followUpQuestion?: string }
  | { stepId: 'systems'; data: SystemsPatch; followUpQuestion?: string }
  | { stepId: 'workflow-name'; data: WorkflowNamePatch; followUpQuestion?: string }
  | { stepId: 'workflow-ownership'; data: WorkflowOwnershipPatch; followUpQuestion?: string }
  | { stepId: 'workflow-tools'; data: WorkflowToolsPatch; followUpQuestion?: string }
  | { stepId: 'workflow-steps'; data: WorkflowStepsPatch; followUpQuestion?: string }
  | { stepId: 'pain-points'; data: PainPointsPatch; followUpQuestion?: string }
  | { stepId: 'ai-usage'; data: AiUsagePatch; followUpQuestion?: string }
  | { stepId: 'ai-non-use'; data: AiNonUsePatch; followUpQuestion?: string }
  | { stepId: 'constraints'; data: ConstraintsPatch; followUpQuestion?: string }
  | { stepId: 'goals'; data: GoalsPatch; followUpQuestion?: string }
  | { stepId: 'contact'; data: ContactPatch; followUpQuestion?: string };

// ----- Apply a patch to a draft (pure function, returns new draft) -----

export function applyPatch(draft: AutomationIntakeDraft, patch: StepPatch): AutomationIntakeDraft {
  const next: AutomationIntakeDraft = {
    ...draft,
    business: { ...draft.business, toolStack: { ...draft.business.toolStack } },
    workflows: draft.workflows.map((w) => ({ ...w })),
    aiUsage: { ...draft.aiUsage },
    constraints: { ...draft.constraints },
    goals: { ...draft.goals },
    contact: { ...draft.contact },
    transcript: [...draft.transcript],
  };

  switch (patch.stepId) {
    case 'business': {
      const p = patch.data;
      next.business.businessName = clamp(p.businessName, 120) ?? next.business.businessName;
      next.business.website = clamp(p.website, 120) ?? next.business.website;
      next.business.sector = clamp(p.sector, 120) ?? next.business.sector;
      next.business.teamSizeBand = clamp(p.teamSizeBand, 120) ?? next.business.teamSizeBand;
      next.business.whatTheyDo = clamp(p.whatTheyDo, 2000) ?? next.business.whatTheyDo;
      next.business.whoTheyServe = clamp(p.whoTheyServe, 2000) ?? next.business.whoTheyServe;
      break;
    }
    case 'systems': {
      const stack = patch.data.toolStack ?? {};
      for (const category of TOOL_STACK_CATEGORIES) {
        const incoming = toStringArray(stack[category], 120);
        if (incoming.length) {
          next.business.toolStack[category] = dedupeAppend(
            next.business.toolStack[category],
            incoming,
            20,
          );
        }
      }
      break;
    }
    case 'workflow-name': {
      const name = clamp(patch.data.name, 120);
      if (name) {
        if (next.workflows.length === 0) {
          next.workflows.push(createWorkflow(name));
        } else {
          next.workflows[0] = { ...next.workflows[0], name };
        }
      }
      break;
    }
    case 'workflow-ownership': {
      if (next.workflows.length === 0) next.workflows.push(createWorkflow(''));
      const w = next.workflows[0];
      if (patch.data.owner) w.owner = clamp(patch.data.owner, 120) ?? w.owner;
      if (patch.data.frequency) w.frequency = clamp(patch.data.frequency, 120) ?? w.frequency;
      break;
    }
    case 'workflow-tools': {
      if (next.workflows.length === 0) next.workflows.push(createWorkflow(''));
      const w = next.workflows[0];
      if (patch.data.tools?.length) {
        w.tools = dedupeAppend(w.tools, toStringArray(patch.data.tools, 120), 20);
      }
      break;
    }
    case 'workflow-steps': {
      if (next.workflows.length === 0) next.workflows.push(createWorkflow(''));
      const w = next.workflows[0];
      if (patch.data.currentSteps?.length) {
        w.currentSteps = dedupeAppend(w.currentSteps, toStringArray(patch.data.currentSteps, 500), 20);
      }
      break;
    }
    case 'pain-points': {
      if (next.workflows.length === 0) {
        next.workflows.push(createWorkflow(''));
      }
      const w = next.workflows[0];
      if (patch.data.painPoints?.length) {
        w.painPoints = dedupeAppend(w.painPoints, toStringArray(patch.data.painPoints, 500), 20);
      }
      break;
    }
    case 'ai-usage': {
      const p = patch.data;
      if (p.currentTools?.length) {
        next.aiUsage.currentTools = dedupeAppend(
          next.aiUsage.currentTools,
          toStringArray(p.currentTools, 120),
          20,
        );
      }
      if (p.currentUseCases?.length) {
        next.aiUsage.currentUseCases = dedupeAppend(
          next.aiUsage.currentUseCases,
          toStringArray(p.currentUseCases, 500),
          20,
        );
      }
      if (p.maturity) next.aiUsage.maturity = p.maturity;
      break;
    }
    case 'ai-non-use': {
      const p = patch.data;
      if (p.nonUseAreas?.length) {
        next.aiUsage.nonUseAreas = dedupeAppend(
          next.aiUsage.nonUseAreas,
          toStringArray(p.nonUseAreas, 500),
          20,
        );
      }
      if (p.blockers?.length) {
        next.aiUsage.blockers = dedupeAppend(
          next.aiUsage.blockers,
          toStringArray(p.blockers, 500),
          20,
        );
      }
      break;
    }
    case 'constraints': {
      const p = patch.data;
      if (typeof p.sensitiveData === 'boolean') next.constraints.sensitiveData = p.sensitiveData;
      if (p.sensitiveDataNotes)
        next.constraints.sensitiveDataNotes =
          clamp(p.sensitiveDataNotes, 500) ?? next.constraints.sensitiveDataNotes;
      if (p.approvalRequirements?.length) {
        next.constraints.approvalRequirements = dedupeAppend(
          next.constraints.approvalRequirements,
          toStringArray(p.approvalRequirements, 500),
          20,
        );
      }
      if (p.complianceNotes?.length) {
        next.constraints.complianceNotes = dedupeAppend(
          next.constraints.complianceNotes,
          toStringArray(p.complianceNotes, 500),
          20,
        );
      }
      if (p.integrationLimits?.length) {
        next.constraints.integrationLimits = dedupeAppend(
          next.constraints.integrationLimits,
          toStringArray(p.integrationLimits, 500),
          20,
        );
      }
      break;
    }
    case 'goals': {
      const p = patch.data;
      if (p.desiredOutcomes?.length) {
        next.goals.desiredOutcomes = dedupeAppend(
          next.goals.desiredOutcomes,
          toStringArray(p.desiredOutcomes, 500),
          20,
        );
      }
      if (p.successMetrics?.length) {
        next.goals.successMetrics = dedupeAppend(
          next.goals.successMetrics,
          toStringArray(p.successMetrics, 500),
          20,
        );
      }
      if (p.timeline) next.goals.timeline = clamp(p.timeline, 120) ?? next.goals.timeline;
      if (p.preferredProjectShape)
        next.goals.preferredProjectShape =
          clamp(p.preferredProjectShape, 500) ?? next.goals.preferredProjectShape;
      break;
    }
    case 'contact': {
      const p = patch.data;
      if (p.name) next.contact.name = clamp(p.name, 120) ?? next.contact.name;
      if (p.role) next.contact.role = clamp(p.role, 120) ?? next.contact.role;
      if (p.email) {
        const candidate = clamp(p.email, 120);
        if (candidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
          next.contact.email = candidate;
        }
      }
      if (typeof p.consent === 'boolean') next.contact.consent = p.consent;
      break;
    }
  }

  return next;
}

function createWorkflow(name: string): Workflow {
  return {
    id: makeId(),
    name,
    tools: [],
    currentSteps: [],
    painPoints: [],
  };
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ----- Follow-up gating -----

export function shouldEmitFollowUp(
  stepId: StepId,
  draft: AutomationIntakeDraft,
  followUpQuestion: string | undefined,
): boolean {
  if (!followUpQuestion || !followUpQuestion.trim()) return false;

  // Follow up on workflow-steps when we failed to capture any steps at all.
  if (stepId === 'workflow-steps') {
    const w = draft.workflows[0];
    return (w?.currentSteps?.length ?? 0) === 0;
  }

  if (stepId === 'pain-points') {
    const w = draft.workflows[0];
    return (w?.painPoints?.length ?? 0) < 2;
  }

  if (stepId === 'systems') {
    const stack = draft.business.toolStack;
    const total = Object.values(stack).reduce((a, b) => a + b.length, 0);
    return total < 3;
  }

  return false;
}
