/**
 * Free-text sanitizer for Automation Intake.
 * Strips common prompt-injection patterns before anything is forwarded to the model.
 *
 * Deliberately not imported from api/analyze.ts — keeps the intake module
 * decoupled from Launchpad. Shares the same defensive patterns.
 */
import {
  FINAL_BRIEF_CLIENT_SUMMARY_MAX_CHARS,
  FINAL_BRIEF_OPEN_QUESTIONS_MAX,
  type AutomationIntakeDraft,
} from './schemas.js';

const DANGEROUS_PATTERNS: RegExp[] = [
  /```/g,
  /"""/g,
  /\n\s*---+\s*\n/g,
  /\n\s*===+\s*\n/g,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|.*?\|>/g,
  /<<SYS>>|<<\/SYS>>/gi,
  /IGNORE\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
  /DISREGARD\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
  /FORGET\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
  /NEW\s+INSTRUCTIONS?\s*:/gi,
  /SYSTEM\s*:/gi,
  /ASSISTANT\s*:/gi,
  /USER\s*:/gi,
  /HUMAN\s*:/gi,
];

export interface SanitizeOptions {
  /** Hard cap on characters after sanitization. Default 2000. */
  maxLength?: number;
  /** Collapse runs of whitespace into single spaces. Default true. */
  collapseWhitespace?: boolean;
}

export function sanitizeFreeText(input: string, options: SanitizeOptions = {}): string {
  const { maxLength = 2000, collapseWhitespace = true } = options;
  if (typeof input !== 'string') return '';

  let out = input;
  for (const pattern of DANGEROUS_PATTERNS) {
    out = out.replace(pattern, ' ');
  }

  if (collapseWhitespace) {
    out = out.replace(/\s+/g, ' ');
  }
  out = out.trim();

  if (out.length > maxLength) {
    out = out.substring(0, maxLength);
  }

  return out;
}

/**
 * Validate a URL string and return it normalized, or null if unsafe.
 * Accepts only http(s). Never linkifies untrusted strings without going through this.
 */
export function safeNormalizeUrl(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function sanitizeOptionalText(input: string | undefined, maxLength: number): string | undefined {
  if (typeof input !== 'string') return undefined;
  const sanitized = sanitizeFreeText(input, { maxLength });
  return sanitized || undefined;
}

function sanitizeStringArray(
  values: string[] | undefined,
  maxLength: number,
  maxItems = 40,
): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => sanitizeFreeText(value, { maxLength }))
    .filter((value) => value.length > 0)
    .slice(0, maxItems);
}

/**
 * Server-side hardening for the full submission payload. Public callers can post
 * arbitrary draft data, so every free-text field is sanitized again before brief
 * generation or persistence.
 */
export function sanitizeDraftForServer(draft: AutomationIntakeDraft): AutomationIntakeDraft {
  return {
    ...draft,
    chatAnswers: {
      business: sanitizeOptionalText(draft.chatAnswers.business, 2000),
      systems: sanitizeOptionalText(draft.chatAnswers.systems, 2000),
      'workflow-name': sanitizeOptionalText(draft.chatAnswers['workflow-name'], 2000),
      'workflow-ownership': sanitizeOptionalText(draft.chatAnswers['workflow-ownership'], 2000),
      'workflow-tools': sanitizeOptionalText(draft.chatAnswers['workflow-tools'], 2000),
      'workflow-steps': sanitizeOptionalText(draft.chatAnswers['workflow-steps'], 2000),
      'pain-points': sanitizeOptionalText(draft.chatAnswers['pain-points'], 2000),
      'ai-usage': sanitizeOptionalText(draft.chatAnswers['ai-usage'], 2000),
      'ai-non-use': sanitizeOptionalText(draft.chatAnswers['ai-non-use'], 2000),
      constraints: sanitizeOptionalText(draft.chatAnswers.constraints, 2000),
      goals: sanitizeOptionalText(draft.chatAnswers.goals, 2000),
      contact: sanitizeOptionalText(draft.chatAnswers.contact, 2000),
    },
    chatSkips: draft.chatSkips.filter((stepId, index, arr) => arr.indexOf(stepId) === index),
    business: {
      ...draft.business,
      businessName: sanitizeOptionalText(draft.business.businessName, 120),
      website: sanitizeOptionalText(draft.business.website, 120),
      sector: sanitizeOptionalText(draft.business.sector, 120),
      teamSizeBand: sanitizeOptionalText(draft.business.teamSizeBand, 120),
      whatTheyDo: sanitizeOptionalText(draft.business.whatTheyDo, 2000),
      whoTheyServe: sanitizeOptionalText(draft.business.whoTheyServe, 2000),
      primarySystems: sanitizeStringArray(draft.business.primarySystems, 120),
      toolStack: {
        emailAndCalendar: sanitizeStringArray(draft.business.toolStack.emailAndCalendar, 120),
        communication: sanitizeStringArray(draft.business.toolStack.communication, 120),
        docsAndPresentations: sanitizeStringArray(draft.business.toolStack.docsAndPresentations, 120),
        designAndCreative: sanitizeStringArray(draft.business.toolStack.designAndCreative, 120),
        projectManagement: sanitizeStringArray(draft.business.toolStack.projectManagement, 120),
        fileStorage: sanitizeStringArray(draft.business.toolStack.fileStorage, 120),
        reportingAndDashboards: sanitizeStringArray(
          draft.business.toolStack.reportingAndDashboards,
          120,
        ),
        crmAndSupport: sanitizeStringArray(draft.business.toolStack.crmAndSupport, 120),
        automationAndIntegrations: sanitizeStringArray(
          draft.business.toolStack.automationAndIntegrations,
          120,
        ),
        other: sanitizeStringArray(draft.business.toolStack.other, 120),
      },
    },
    workflows: draft.workflows.map((workflow) => ({
      ...workflow,
      name: sanitizeFreeText(workflow.name, { maxLength: 120 }),
      owner: sanitizeOptionalText(workflow.owner, 120),
      frequency: sanitizeOptionalText(workflow.frequency, 120),
      tools: sanitizeStringArray(workflow.tools, 120),
      currentSteps: sanitizeStringArray(workflow.currentSteps, 500),
      painPoints: sanitizeStringArray(workflow.painPoints, 500),
    })),
    aiUsage: {
      ...draft.aiUsage,
      currentTools: sanitizeStringArray(draft.aiUsage.currentTools, 120),
      currentUseCases: sanitizeStringArray(draft.aiUsage.currentUseCases, 500),
      nonUseAreas: sanitizeStringArray(draft.aiUsage.nonUseAreas, 500),
      blockers: sanitizeStringArray(draft.aiUsage.blockers, 500),
    },
    constraints: {
      ...draft.constraints,
      sensitiveDataNotes: sanitizeOptionalText(draft.constraints.sensitiveDataNotes, 500),
      approvalRequirements: sanitizeStringArray(draft.constraints.approvalRequirements, 500),
      complianceNotes: sanitizeStringArray(draft.constraints.complianceNotes, 500),
      integrationLimits: sanitizeStringArray(draft.constraints.integrationLimits, 500),
    },
    goals: {
      ...draft.goals,
      desiredOutcomes: sanitizeStringArray(draft.goals.desiredOutcomes, 500),
      successMetrics: sanitizeStringArray(draft.goals.successMetrics, 500),
      timeline: sanitizeOptionalText(draft.goals.timeline, 120),
      preferredProjectShape: sanitizeOptionalText(draft.goals.preferredProjectShape, 500),
    },
    contact: {
      ...draft.contact,
      name: sanitizeOptionalText(draft.contact.name, 120),
      role: sanitizeOptionalText(draft.contact.role, 120),
      email: sanitizeOptionalText(draft.contact.email, 120),
    },
    transcript: draft.transcript.map((message) => ({
      ...message,
      content: sanitizeFreeText(message.content, { maxLength: 2000 }),
    })),
    finalBrief: draft.finalBrief
      ? {
          clientSummary: sanitizeFreeText(draft.finalBrief.clientSummary, {
            maxLength: FINAL_BRIEF_CLIENT_SUMMARY_MAX_CHARS,
          }),
          internalSummary: sanitizeFreeText(draft.finalBrief.internalSummary, { maxLength: 2000 }),
          recommendedProjects: draft.finalBrief.recommendedProjects.map((project) => ({
            ...project,
            title: sanitizeFreeText(project.title, { maxLength: 120 }),
            targetWorkflow: sanitizeFreeText(project.targetWorkflow, { maxLength: 120 }),
            problemSummary: sanitizeFreeText(project.problemSummary, { maxLength: 500 }),
            proposedAutomation: sanitizeFreeText(project.proposedAutomation, { maxLength: 500 }),
            expectedImpact: sanitizeFreeText(project.expectedImpact, { maxLength: 500 }),
            studentDeliveryFit: sanitizeFreeText(project.studentDeliveryFit, { maxLength: 500 }),
          })),
          openQuestions: sanitizeStringArray(
            draft.finalBrief.openQuestions,
            500,
            FINAL_BRIEF_OPEN_QUESTIONS_MAX,
          ),
        }
      : undefined,
  };
}
