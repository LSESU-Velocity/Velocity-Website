/**
 * Shared Zod contract for the Automation Intake feature.
 * Single source of truth for both chat and form modes.
 */
import { z } from 'zod';

// --- Constants ---

export const SCHEMA_VERSION = 2;

export const STEP_IDS = [
  'business',
  'systems',
  'workflow-name',
  'workflow-ownership',
  'workflow-tools',
  'workflow-steps',
  'pain-points',
  'ai-usage',
  'ai-non-use',
  'constraints',
  'goals',
  'contact',
] as const;

export type StepId = (typeof STEP_IDS)[number];

export const TOOL_STACK_CATEGORIES = [
  'emailAndCalendar',
  'communication',
  'docsAndPresentations',
  'designAndCreative',
  'projectManagement',
  'fileStorage',
  'reportingAndDashboards',
  'crmAndSupport',
  'automationAndIntegrations',
  'other',
] as const;

export type ToolStackCategory = (typeof TOOL_STACK_CATEGORIES)[number];

export const CONTACT_EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
export const FINAL_BRIEF_CLIENT_SUMMARY_MAX_CHARS = 520;
export const FINAL_BRIEF_OPEN_QUESTIONS_MAX = 4;

// --- Length caps ---
// Kept deliberately conservative. Public endpoint so size matters.

const SHORT = 120;
const MEDIUM = 500;
const LONG = 2000;

const bounded = (max: number) => z.string().trim().max(max);
const boundedArray = (max: number, count = 40) =>
  z.array(bounded(max)).max(count).default([]);

// --- Sub-schemas ---

export const ChatRoleSchema = z.enum(['assistant', 'user', 'system']);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

export const ChatMessageSchema = z.object({
  id: z.string().max(64),
  role: ChatRoleSchema,
  content: bounded(LONG),
  createdAt: z.string().max(40),
  stepId: z.enum(STEP_IDS).optional(),
  isFollowUp: z.boolean().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatAnswersSchema = z
  .object({
    business: bounded(LONG).optional(),
    systems: bounded(LONG).optional(),
    'workflow-name': bounded(LONG).optional(),
    'workflow-ownership': bounded(LONG).optional(),
    'workflow-tools': bounded(LONG).optional(),
    'workflow-steps': bounded(LONG).optional(),
    'pain-points': bounded(LONG).optional(),
    'ai-usage': bounded(LONG).optional(),
    'ai-non-use': bounded(LONG).optional(),
    constraints: bounded(LONG).optional(),
    goals: bounded(LONG).optional(),
    contact: bounded(LONG).optional(),
  })
  .default({});
export type ChatAnswers = z.infer<typeof ChatAnswersSchema>;

export const ToolStackSchema = z.object({
  emailAndCalendar: boundedArray(SHORT),
  communication: boundedArray(SHORT),
  docsAndPresentations: boundedArray(SHORT),
  designAndCreative: boundedArray(SHORT),
  projectManagement: boundedArray(SHORT),
  fileStorage: boundedArray(SHORT),
  reportingAndDashboards: boundedArray(SHORT),
  crmAndSupport: boundedArray(SHORT),
  automationAndIntegrations: boundedArray(SHORT),
  other: boundedArray(SHORT),
});
export type ToolStack = z.infer<typeof ToolStackSchema>;

export const BusinessInfoSchema = z.object({
  businessName: bounded(SHORT).optional(),
  website: bounded(SHORT).optional(),
  sector: bounded(SHORT).optional(),
  teamSizeBand: bounded(SHORT).optional(),
  whatTheyDo: bounded(LONG).optional(),
  whoTheyServe: bounded(LONG).optional(),
  primarySystems: boundedArray(SHORT).optional().default([]),
  toolStack: ToolStackSchema.default(() => ({
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
  })),
});
export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;

export const WorkflowPrioritySchema = z.enum(['low', 'medium', 'high']);
export type WorkflowPriority = z.infer<typeof WorkflowPrioritySchema>;

export const WorkflowSchema = z.object({
  id: z.string().max(64),
  name: bounded(SHORT),
  owner: bounded(SHORT).optional(),
  frequency: bounded(SHORT).optional(),
  tools: boundedArray(SHORT).optional().default([]),
  currentSteps: boundedArray(MEDIUM).optional().default([]),
  painPoints: boundedArray(MEDIUM).optional().default([]),
  priority: WorkflowPrioritySchema.optional(),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

export const AiUsageSchema = z.object({
  currentTools: boundedArray(SHORT).optional().default([]),
  currentUseCases: boundedArray(MEDIUM).optional().default([]),
  nonUseAreas: boundedArray(MEDIUM).optional().default([]),
  blockers: boundedArray(MEDIUM).optional().default([]),
  maturity: z.enum(['none', 'experimental', 'active']).optional(),
});
export type AiUsage = z.infer<typeof AiUsageSchema>;

export const ConstraintsSchema = z.object({
  sensitiveData: z.boolean().optional(),
  sensitiveDataNotes: bounded(MEDIUM).optional(),
  approvalRequirements: boundedArray(MEDIUM).optional().default([]),
  complianceNotes: boundedArray(MEDIUM).optional().default([]),
  integrationLimits: boundedArray(MEDIUM).optional().default([]),
});
export type Constraints = z.infer<typeof ConstraintsSchema>;

export const GoalsSchema = z.object({
  desiredOutcomes: boundedArray(MEDIUM).optional().default([]),
  successMetrics: boundedArray(MEDIUM).optional().default([]),
  timeline: bounded(SHORT).optional(),
  preferredProjectShape: bounded(MEDIUM).optional(),
});
export type Goals = z.infer<typeof GoalsSchema>;

export const ContactSchema = z.object({
  name: bounded(SHORT).optional(),
  role: bounded(SHORT).optional(),
  email: bounded(SHORT).optional(),
  consent: z.boolean().default(false),
});
export type Contact = z.infer<typeof ContactSchema>;

// --- FinalBrief ---

export const RecommendedProjectSchema = z.object({
  title: bounded(SHORT),
  targetWorkflow: bounded(SHORT),
  problemSummary: bounded(MEDIUM),
  proposedAutomation: bounded(MEDIUM),
  expectedImpact: bounded(MEDIUM),
  dataSensitivity: z.enum(['low', 'medium', 'high']),
  studentDeliveryFit: bounded(MEDIUM),
  feasibility: z.enum(['low', 'medium', 'high']),
});
export type RecommendedProject = z.infer<typeof RecommendedProjectSchema>;

export const FinalBriefSchema = z.object({
  clientSummary: bounded(LONG),
  internalSummary: bounded(LONG),
  recommendedProjects: z.array(RecommendedProjectSchema).min(1).max(3),
  openQuestions: z.array(bounded(MEDIUM)).max(FINAL_BRIEF_OPEN_QUESTIONS_MAX).default([]),
});
export type FinalBrief = z.infer<typeof FinalBriefSchema>;

// --- Draft ---

export const DraftStatusSchema = z.enum(['collecting', 'review', 'submitted']);
export type DraftStatus = z.infer<typeof DraftStatusSchema>;

export const AutomationIntakeDraftSchema = z.object({
  sessionId: z.string().max(64),
  schemaVersion: z.literal(SCHEMA_VERSION),
  status: DraftStatusSchema,
  currentStep: z.enum(STEP_IDS),
  questionCount: z.number().int().min(0).max(50),
  followUpsUsed: z.number().int().min(0).max(20),
  chatAnswers: ChatAnswersSchema,
  chatSkips: z.array(z.enum(STEP_IDS)).max(STEP_IDS.length).default([]),
  business: BusinessInfoSchema,
  workflows: z.array(WorkflowSchema).max(5).default([]),
  aiUsage: AiUsageSchema,
  constraints: ConstraintsSchema,
  goals: GoalsSchema,
  contact: ContactSchema,
  transcript: z.array(ChatMessageSchema).max(120).default([]),
  finalBrief: FinalBriefSchema.optional(),
});
export type AutomationIntakeDraft = z.infer<typeof AutomationIntakeDraftSchema>;

// --- API contracts ---

export const MagicEmailStartRequestSchema = z
  .object({
    email: bounded(SHORT).email(),
    sessionId: z.string().max(64).optional(),
  })
  .strict();
export type MagicEmailStartRequest = z.infer<typeof MagicEmailStartRequestSchema>;

export const MagicEmailStartResponseSchema = z.object({
  success: z.literal(true),
  email: bounded(SHORT).email(),
  devVerificationUrl: z.string().url().optional(),
});
export type MagicEmailStartResponse = z.infer<typeof MagicEmailStartResponseSchema>;

export const EmailVerificationStatusResponseSchema = z.object({
  verified: z.boolean(),
  email: bounded(SHORT).email().optional(),
  expiresAt: z.number().int().positive().optional(),
});
export type EmailVerificationStatusResponse = z.infer<
  typeof EmailVerificationStatusResponseSchema
>;

export const ChatRequestSchema = z
  .object({
    draft: AutomationIntakeDraftSchema,
    answer: bounded(LONG),
    editingStepId: z.enum(STEP_IDS).optional(),
  })
  .strict();
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  draft: AutomationIntakeDraftSchema,
  assistantMessage: ChatMessageSchema,
  readyForReview: z.boolean(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const SubmissionModeSchema = z.enum(['chat', 'form']);
export type SubmissionMode = z.infer<typeof SubmissionModeSchema>;

export const SubmitRequestSchema = z
  .object({
    draft: AutomationIntakeDraftSchema,
    submissionMode: SubmissionModeSchema,
    honeypot: z.string().max(200).optional(),
  })
  .strict();
export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;

export const SubmitResponseSchema = z.object({
  success: z.literal(true),
  draft: AutomationIntakeDraftSchema,
  savedId: z.string().max(64),
  finalBrief: FinalBriefSchema,
});
export type SubmitResponse = z.infer<typeof SubmitResponseSchema>;

// --- Minimum completeness ---

/**
 * Server-side minimum completeness. Kept intentionally narrow, but a primary
 * workflow is required because the intake exists to scope an automation project.
 * Outcomes and metrics stay recommended rather than required: a partner may
 * not have concrete numbers yet, and blocking submission on them creates a
 * dead end.
 *
 * Required: what the business does + a primary workflow + contact details +
 * consent.
 */
export function checkMinimumCompleteness(draft: AutomationIntakeDraft): string[] {
  const missing: string[] = [];

  if (!draft.business.whatTheyDo || draft.business.whatTheyDo.trim().length < 8) {
    missing.push('business description');
  }

  const firstWorkflow = draft.workflows[0];
  if (!firstWorkflow || !firstWorkflow.name?.trim()) {
    missing.push('primary workflow');
  } else {
    const hasWorkflowDetail =
      (firstWorkflow.tools?.length ?? 0) > 0 ||
      (firstWorkflow.currentSteps?.length ?? 0) > 0 ||
      (firstWorkflow.painPoints?.length ?? 0) > 0 ||
      Boolean(firstWorkflow.owner?.trim()) ||
      Boolean(firstWorkflow.frequency?.trim());

    if (!hasWorkflowDetail) missing.push('workflow detail');
  }

  if (!draft.contact.name?.trim()) missing.push('contact name');
  if (!draft.contact.email?.trim()) missing.push('contact email');
  else if (!CONTACT_EMAIL_PATTERN.test(draft.contact.email.trim())) {
    missing.push('valid contact email');
  }
  if (!draft.contact.consent) missing.push('consent');

  return missing;
}

function joinNaturalLanguage(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function describeMissingRequirement(item: string): string {
  switch (item) {
    case 'valid contact email':
      return 'a valid contact email';
    case 'consent':
      return "type 'I consent' so Velocity can store this intake and contact you";
    case 'primary workflow':
      return 'at least one workflow to scope';
    case 'workflow detail':
      return 'a few workflow details such as owner, tools, steps, or pain points';
    default:
      return item;
  }
}

export function formatMissingRequirements(missing: string[]): string {
  return joinNaturalLanguage(missing.map(describeMissingRequirement));
}

/**
 * Non-blocking recommendations, shown in the UI so the partner knows what
 * detail would make the brief more useful, without forcing them to fill it.
 */
export function checkRecommendedCompleteness(draft: AutomationIntakeDraft): string[] {
  const recommended: string[] = [];

  if ((draft.goals.desiredOutcomes?.length ?? 0) === 0) {
    recommended.push('desired outcomes');
  }

  return recommended;
}
