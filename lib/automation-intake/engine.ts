/**
 * Automation Intake engine — canonical server-side chat advancement.
 *
 * One entry point: `advanceChatTurn`. Takes the current draft + answer + mode,
 * returns the next draft, assistant message, and metadata for logging.
 *
 * Modes:
 *   - 'deterministic' — heuristic-only path, full rebuild from chatAnswers.
 *   - 'assisted'      — model extraction + step-local follow-ups layered on
 *                       incremental state updates.
 *
 * Editing an earlier answer rebuilds from canonical chatAnswers. Assisted
 * rebuilds re-run extraction so structured data stays rich, while transcript
 * rebuilds preserve untouched raw turns.
 *
 * AI-specific failures (missing key, timeout, malformed output, unsafe
 * follow-up text) degrade silently to deterministic handling — the client
 * never sees an "AI enabled/disabled" distinction.
 */
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

import {
  checkMinimumCompleteness,
  FinalBriefSchema,
  formatMissingRequirements,
  TOOL_STACK_CATEGORIES,
  type AutomationIntakeDraft,
  type ChatMessage,
  type FinalBrief,
  type StepId,
} from './schemas.js';
import {
  getStep,
  STEP_DEFINITIONS,
} from './questions.js';
import { sanitizeFreeText } from './sanitize.js';
import { createIntakeModel, hasModelKey, MissingModelKeyError } from './model.js';
import {
  applyPatch,
  type StepPatch,
} from './patch.js';
import {
  FINAL_BRIEF_SYSTEM_PROMPT,
  buildExtractionSystemPrompt,
} from './prompts.js';
import {
  assessStepScope,
  buildDeterministicFollowUpQuestion,
  formatScopeQualityForPrompt,
  type StepScopeQuality,
} from './scope-quality.js';
import { createInitialDraft, makeId, nowIso } from './draft.js';
import {
  advanceDeterministicDraftFromAnswer,
  buildHeuristicPatch,
  extractChatStateForRebuild,
  rebuildTranscriptFromState,
  replaceDeterministicAnswer,
  resolveStatusAndStep,
  trailingAssistantMessage,
  withDeterministicScopeHint,
  type DeterministicAdvanceResult,
} from './deterministic.js';
import type { ChatGuard, ChatMode } from './chat-runtime.js';

// Re-export pure helpers so existing imports from this module still resolve.
export { createInitialDraft, isDraftReadyForReview } from './draft.js';

// ---------- Per-step Zod extraction schemas ----------
// These are loose — every field optional. Model fills only what it observes.

const ackField = z.string().max(240).optional();
const followUpField = z.string().max(400).optional();

const businessPatchSchema = z.object({
  businessName: z.string().max(120).optional(),
  website: z.string().max(120).optional(),
  sector: z.string().max(120).optional(),
  teamSizeBand: z.string().max(40).optional(),
  whatTheyDo: z.string().max(2000).optional(),
  whoTheyServe: z.string().max(2000).optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const systemsPatchSchema = z.object({
  toolStack: z
    .object({
      emailAndCalendar: z.array(z.string().max(120)).max(10).optional(),
      communication: z.array(z.string().max(120)).max(10).optional(),
      docsAndPresentations: z.array(z.string().max(120)).max(10).optional(),
      designAndCreative: z.array(z.string().max(120)).max(10).optional(),
      projectManagement: z.array(z.string().max(120)).max(10).optional(),
      fileStorage: z.array(z.string().max(120)).max(10).optional(),
      reportingAndDashboards: z.array(z.string().max(120)).max(10).optional(),
      crmAndSupport: z.array(z.string().max(120)).max(10).optional(),
      automationAndIntegrations: z.array(z.string().max(120)).max(10).optional(),
      other: z.array(z.string().max(120)).max(10).optional(),
    })
    .optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const workflowNamePatchSchema = z.object({
  name: z.string().max(120).optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const workflowOwnershipPatchSchema = z.object({
  owner: z.string().max(120).optional(),
  frequency: z.string().max(120).optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const workflowToolsPatchSchema = z.object({
  tools: z.array(z.string().max(120)).max(10).optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const workflowStepsPatchSchema = z.object({
  currentSteps: z.array(z.string().max(500)).max(12).optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const painPointsPatchSchema = z.object({
  painPoints: z.array(z.string().max(500)).max(12).optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const aiUsagePatchSchema = z.object({
  currentTools: z.array(z.string().max(120)).max(10).optional(),
  currentUseCases: z.array(z.string().max(500)).max(10).optional(),
  maturity: z.enum(['none', 'experimental', 'active']).optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const aiNonUsePatchSchema = z.object({
  nonUseAreas: z.array(z.string().max(500)).max(10).optional(),
  blockers: z.array(z.string().max(500)).max(10).optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const constraintsPatchSchema = z.object({
  sensitiveData: z.boolean().optional(),
  sensitiveDataNotes: z.string().max(500).optional(),
  approvalRequirements: z.array(z.string().max(500)).max(10).optional(),
  complianceNotes: z.array(z.string().max(500)).max(10).optional(),
  integrationLimits: z.array(z.string().max(500)).max(10).optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const goalsPatchSchema = z.object({
  desiredOutcomes: z.array(z.string().max(500)).max(10).optional(),
  successMetrics: z.array(z.string().max(500)).max(10).optional(),
  timeline: z.string().max(120).optional(),
  preferredProjectShape: z.string().max(500).optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

const contactPatchSchema = z.object({
  name: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  email: z.string().max(120).optional(),
  consent: z.boolean().optional(),
  followUpQuestion: followUpField,
  acknowledgment: ackField,
});

function schemaForStep(stepId: StepId): z.ZodSchema<{ followUpQuestion?: string } & Record<string, unknown>> {
  switch (stepId) {
    case 'business':
      return businessPatchSchema as z.ZodSchema<any>;
    case 'systems':
      return systemsPatchSchema as z.ZodSchema<any>;
    case 'workflow-name':
      return workflowNamePatchSchema as z.ZodSchema<any>;
    case 'workflow-ownership':
      return workflowOwnershipPatchSchema as z.ZodSchema<any>;
    case 'workflow-tools':
      return workflowToolsPatchSchema as z.ZodSchema<any>;
    case 'workflow-steps':
      return workflowStepsPatchSchema as z.ZodSchema<any>;
    case 'pain-points':
      return painPointsPatchSchema as z.ZodSchema<any>;
    case 'ai-usage':
      return aiUsagePatchSchema as z.ZodSchema<any>;
    case 'ai-non-use':
      return aiNonUsePatchSchema as z.ZodSchema<any>;
    case 'constraints':
      return constraintsPatchSchema as z.ZodSchema<any>;
    case 'goals':
      return goalsPatchSchema as z.ZodSchema<any>;
    case 'contact':
      return contactPatchSchema as z.ZodSchema<any>;
  }
}

// ---------- Step sufficiency ----------

/**
 * Decides whether the server should advance off `stepId` given the draft state.
 * These rules are the server's call — a model-proposed follow-up is only emitted
 * when sufficiency is false AND budget remains. Plan §Phase 3.
 */
export function isStepSufficient(
  stepId: StepId,
  draft: AutomationIntakeDraft,
  answer: string,
): boolean {
  return assessStepScope(stepId, draft, answer).sufficient;
}

// ---------- Follow-up hardening ----------

const FOLLOW_UP_REJECT_PATTERNS: RegExp[] = [
  /```/,
  /<\s*[a-zA-Z][^>]*>/,
  /https?:\/\//i,
  /\bwww\.[a-z0-9-]+\.[a-z]/i,
];

const FILLER_OPENER =
  /^(great|awesome|perfect|amazing|love (it|that)|fantastic|wonderful)\b[!.,]*\s*/i;

/**
 * Clean a model-generated follow-up into plain text. Returns null when the
 * content fails the plan's contract (single question, <=200 chars, plain text,
 * no markdown/HTML/URLs). The caller degrades to advancing silently rather
 * than truncating mid-sentence or shipping a statement in place of a question.
 */
export function sanitizeFollowUpText(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.replace(/[​-‏﻿]/g, '').trim();
  if (!text) return null;
  text = text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  for (const pattern of FOLLOW_UP_REJECT_PATTERNS) {
    if (pattern.test(text)) return null;
  }
  if (FILLER_OPENER.test(text)) {
    text = text.replace(FILLER_OPENER, '').trim();
    if (!text) return null;
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }
  if (text.length > 200) return null;
  if (!/\?/.test(text)) return null;
  if (/^[-*]\s/.test(text) || /^\d+\.\s/.test(text)) return null;
  return text;
}

// ---------- Canonical advance ----------

export interface AdvanceChatTurnArgs {
  draft: AutomationIntakeDraft;
  answer: string;
  mode: ChatMode;
  /** When set, rebuild the draft treating this as an edit of that step's answer. */
  editingStepId?: StepId | null;
  /** How many AI follow-ups remain for the current step. 0 disables follow-ups for this turn. */
  stepFollowUpBudget: number;
  /**
   * Remaining model-call budget for the session. Edit rebuilds walk every
   * completed step; once this hits zero they degrade to heuristic per-step so
   * a single edit can't blow the whole session cap.
   */
  sessionModelCallBudget: number;
}

export interface AdvanceChatTurnResult {
  draft: AutomationIntakeDraft;
  assistantMessage: ChatMessage;
  readyForReview: boolean;
  modeUsed: ChatMode;
  followUpEmitted: boolean;
  /** Count of provider calls made during this turn (0+). Edit rebuilds may be >1. */
  modelCallsMade: number;
  tokensIn: number;
  tokensOut: number;
  guard: ChatGuard;
}

export async function advanceChatTurn(
  args: AdvanceChatTurnArgs,
): Promise<AdvanceChatTurnResult> {
  // 1. Edits rebuild from canonical chatAnswers. In assisted mode we re-run AI
  //    extraction so rich data (categorized tool stacks, structured business
  //    fields) isn't collapsed into heuristic `other`. In deterministic mode we
  //    stay on the heuristic rebuild path.
  if (args.editingStepId) {
    if (args.mode === 'assisted') {
      return rebuildEditAssisted(
        args.draft,
        args.editingStepId,
        args.answer,
        args.sessionModelCallBudget,
      );
    }
    const result = replaceDeterministicAnswer(args.draft, args.editingStepId, args.answer);
    return wrapDeterministic(result, 'edit');
  }

  // 2. Deterministic mode — flag off, missing key, limits hit, contact step.
  if (args.mode === 'deterministic') {
    const result = advanceDeterministicDraftFromAnswer({
      draft: args.draft,
      answer: args.answer,
    });
    return wrapDeterministic(
      withDeterministicScopeHint(result, args.draft.currentStep, args.answer),
      null,
    );
  }

  if (args.draft.currentStep === 'contact') {
    const result = advanceDeterministicDraftFromAnswer({
      draft: args.draft,
      answer: args.answer,
    });
    return wrapDeterministic(result, 'contact_step');
  }

  // 3. Assisted path.
  const safeAnswer = sanitizeFreeText(args.answer, { maxLength: 1500 });

  if (!safeAnswer.trim()) {
    const existing = findLastAssistant(args.draft.transcript) ?? synthAssistant(args.draft.currentStep);
    return {
      draft: args.draft,
      assistantMessage: existing,
      readyForReview: args.draft.status === 'review',
      modeUsed: 'assisted',
      followUpEmitted: false,
      modelCallsMade: 0,
      tokensIn: 0,
      tokensOut: 0,
      guard: null,
    };
  }

  if (isOptOut(safeAnswer)) {
    // If we already captured a substantive answer for this step (the user is
    // declining a follow-up with "that's all I know"), treat the opt-out as
    // "move on with what I have": preserve chatAnswers + structured state,
    // just advance to the next step. Otherwise — no data for this step — fall
    // through to deterministic, which marks it as a genuine skip.
    const hasExistingAnswer = Boolean(
      args.draft.chatAnswers[args.draft.currentStep]?.trim(),
    );
    if (hasExistingAnswer) {
      return advanceAfterOptOutWithData(args.draft, safeAnswer);
    }
    const result = advanceDeterministicDraftFromAnswer({
      draft: args.draft,
      answer: args.answer,
    });
    return wrapDeterministic(result, 'opt_out');
  }

  const stepId = args.draft.currentStep;
  const wasFollowUp = lastAssistantWasFollowUpOnStep(args.draft, stepId);

  // Maintain chatAnswers: append on same-step follow-ups, replace otherwise.
  const prevChat = args.draft.chatAnswers[stepId] ?? '';
  const nextChat = wasFollowUp && prevChat.trim() ? `${prevChat}\n${safeAnswer}` : safeAnswer;

  let working: AutomationIntakeDraft = {
    ...args.draft,
    chatAnswers: { ...args.draft.chatAnswers, [stepId]: nextChat },
    chatSkips: args.draft.chatSkips.filter((s) => s !== stepId),
    transcript: [
      ...args.draft.transcript,
      {
        id: makeId(),
        role: 'user',
        content: safeAnswer,
        createdAt: nowIso(),
        stepId,
      },
    ],
  };

  // Extract rich patch via model (or heuristic fallback). The deterministic
  // pre-check gives the model a bounded set of legitimate follow-up targets.
  const preliminaryScope = assessStepScope(
    stepId,
    applyPatch(working, buildHeuristicPatch(stepId, nextChat)),
    nextChat,
  );
  const extraction = await extractPatchForStep(stepId, safeAnswer, preliminaryScope);
  working = applyPatch(working, extraction.patch);
  working = { ...working, questionCount: working.questionCount + 1 };

  // Decide: follow-up or advance?
  const scopeQuality = assessStepScope(stepId, working, nextChat);
  const sufficient = scopeQuality.sufficient;
  const canFollowUp = args.stepFollowUpBudget > 0 && getStep(stepId).allowsFollowUp;
  const deterministicFollowUp = buildDeterministicFollowUpQuestion(scopeQuality) ?? undefined;
  const hasCriticalScopeGap = scopeQuality.missing.some((gap) => gap.critical);
  const proposed =
    canFollowUp && !sufficient
      ? hasCriticalScopeGap
        ? deterministicFollowUp ?? extraction.followUpQuestion ?? undefined
        : extraction.followUpQuestion ?? deterministicFollowUp
      : undefined;
  let cleanFollowUp = sanitizeFollowUpText(proposed);

  let guard: ChatGuard = extraction.guard;
  if (!cleanFollowUp && proposed) {
    guard = 'output_rejected';
    cleanFollowUp = sanitizeFollowUpText(buildDeterministicFollowUpQuestion(scopeQuality));
  }

  let assistantText: string;
  let isFollowUp = false;
  let nextStepId: StepId = stepId;

  if (cleanFollowUp) {
    assistantText = withAcknowledgment(
      scopeQuality.captured.length > 0 ? extraction.acknowledgment : undefined,
      cleanFollowUp,
    );
    isFollowUp = true;
    working = { ...working, followUpsUsed: working.followUpsUsed + 1 };
  } else {
    const idx = STEP_DEFINITIONS.findIndex((s) => s.id === stepId) + 1;
    const nextStep = STEP_DEFINITIONS[idx];
    if (nextStep) {
      nextStepId = nextStep.id;
      working = { ...working, currentStep: nextStep.id };
      assistantText = withAcknowledgment(extraction.acknowledgment, nextStep.assistantPrompt);
    } else {
      const missing = checkMinimumCompleteness(working);
      if (missing.length === 0) {
        working = { ...working, status: 'review' };
        assistantText = withAcknowledgment(
          extraction.acknowledgment,
          "That's everything I needed — hit 'Review submission' whenever you're ready.",
        );
      } else {
        assistantText = withAcknowledgment(extraction.acknowledgment, phraseCatchUp(missing, 0));
      }
    }
  }

  const assistantMessage: ChatMessage = {
    id: makeId(),
    role: 'assistant',
    content: assistantText,
    createdAt: nowIso(),
    stepId: nextStepId,
    isFollowUp,
  };
  working = { ...working, transcript: [...working.transcript, assistantMessage] };

  return {
    draft: working,
    assistantMessage,
    readyForReview: working.status === 'review',
    modeUsed: 'assisted',
    followUpEmitted: isFollowUp,
    modelCallsMade: extraction.modelCalled ? 1 : 0,
    tokensIn: extraction.tokensIn,
    tokensOut: extraction.tokensOut,
    guard,
  };
}

function wrapDeterministic(
  result: DeterministicAdvanceResult,
  guard: ChatGuard,
): AdvanceChatTurnResult {
  return {
    draft: result.draft,
    assistantMessage: result.assistantMessage,
    readyForReview: result.readyForReview,
    modeUsed: 'deterministic',
    followUpEmitted: false,
    modelCallsMade: 0,
    tokensIn: 0,
    tokensOut: 0,
    guard,
  };
}

/**
 * Post-answer opt-out: user has already provided substantive content for this
 * step (captured in `chatAnswers` + structured state) and is declining a
 * follow-up. Preserve everything and advance. We intentionally don't rebuild
 * the draft from chatAnswers here — that would replay heuristic patches and
 * collapse the rich AI-extracted state we're trying to protect.
 */
function advanceAfterOptOutWithData(
  draft: AutomationIntakeDraft,
  safeAnswer: string,
): AdvanceChatTurnResult {
  const stepId = draft.currentStep;

  let working: AutomationIntakeDraft = {
    ...draft,
    chatSkips: draft.chatSkips.filter((s) => s !== stepId),
    transcript: [
      ...draft.transcript,
      {
        id: makeId(),
        role: 'user',
        content: safeAnswer,
        createdAt: nowIso(),
        stepId,
      },
    ],
  };
  working = { ...working, questionCount: working.questionCount + 1 };

  const idx = STEP_DEFINITIONS.findIndex((s) => s.id === stepId) + 1;
  const nextStep = STEP_DEFINITIONS[idx];

  let assistantText: string;
  let nextStepId: StepId = stepId;
  if (nextStep) {
    nextStepId = nextStep.id;
    working = { ...working, currentStep: nextStep.id };
    assistantText = nextStep.assistantPrompt;
  } else {
    const missing = checkMinimumCompleteness(working);
    if (missing.length === 0) {
      working = { ...working, status: 'review' };
      assistantText = "That's everything I needed — hit 'Review submission' whenever you're ready.";
    } else {
      assistantText = phraseCatchUp(missing, 0);
    }
  }

  const assistantMessage: ChatMessage = {
    id: makeId(),
    role: 'assistant',
    content: assistantText,
    createdAt: nowIso(),
    stepId: nextStepId,
  };
  working = { ...working, transcript: [...working.transcript, assistantMessage] };

  return {
    draft: working,
    assistantMessage,
    readyForReview: working.status === 'review',
    modeUsed: 'assisted',
    followUpEmitted: false,
    modelCallsMade: 0,
    tokensIn: 0,
    tokensOut: 0,
    guard: 'opt_out',
  };
}

/**
 * Assisted edit rebuild. Walks every completed step and re-runs AI extraction
 * so rich data (categorized tool stacks, structured business fields) survives
 * the rebuild. Falls back to the heuristic patch per-step when the model call
 * fails or the session budget is exhausted — a single edit can't blow the
 * whole session cap, and any step-level failure only degrades that one step.
 */
async function rebuildEditAssisted(
  draft: AutomationIntakeDraft,
  editingStepId: StepId,
  answer: string,
  sessionModelCallBudget: number,
): Promise<AdvanceChatTurnResult> {
  const safeAnswer = sanitizeFreeText(answer, { maxLength: 2000 });
  const { answers, skips } = extractChatStateForRebuild(draft);

  if (!safeAnswer.trim()) {
    delete answers[editingStepId];
  } else {
    answers[editingStepId] = safeAnswer;
    skips.delete(editingStepId);
  }

  let working = createInitialDraft(draft.sessionId);
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let modelCallsMade = 0;
  let firstGuard: ChatGuard = null;

  for (const step of STEP_DEFINITIONS) {
    const ans = answers[step.id];
    if (!ans?.trim()) continue;

    if (modelCallsMade < sessionModelCallBudget) {
      const ext = await extractPatchForStep(step.id, ans);
      working = applyPatch(working, ext.patch);
      totalTokensIn += ext.tokensIn;
      totalTokensOut += ext.tokensOut;
      if (ext.modelCalled) modelCallsMade += 1;
      if (!firstGuard && ext.guard) firstGuard = ext.guard;
    } else {
      working = applyPatch(working, buildHeuristicPatch(step.id, ans));
      if (!firstGuard) firstGuard = 'session_cap';
    }
    working = { ...working, questionCount: working.questionCount + 1 };
  }

  working.chatAnswers = answers;
  working.chatSkips = Array.from(skips);
  working.followUpsUsed = 0;

  const { status, currentStep, missing } = resolveStatusAndStep(working, answers, skips);
  working.status = status;
  working.currentStep = currentStep;

  working.transcript = rebuildTranscriptFromState(
    answers,
    skips,
    currentStep,
    status,
    missing,
    draft.transcript,
    editingStepId,
  );

  const assistantMessage = trailingAssistantMessage(working.transcript, currentStep);

  return {
    draft: working,
    assistantMessage,
    readyForReview: working.status === 'review',
    modeUsed: modelCallsMade > 0 ? 'assisted' : 'deterministic',
    followUpEmitted: false,
    modelCallsMade,
    tokensIn: totalTokensIn,
    tokensOut: totalTokensOut,
    guard: firstGuard ?? 'edit',
  };
}

function findLastAssistant(transcript: ChatMessage[]): ChatMessage | null {
  for (let i = transcript.length - 1; i >= 0; i -= 1) {
    const m = transcript[i];
    if (m.role === 'assistant') return m;
  }
  return null;
}

function synthAssistant(stepId: StepId): ChatMessage {
  return {
    id: makeId(),
    role: 'assistant',
    content: getStep(stepId).assistantPrompt,
    createdAt: nowIso(),
    stepId,
  };
}

function lastAssistantWasFollowUpOnStep(
  draft: AutomationIntakeDraft,
  stepId: StepId,
): boolean {
  for (let i = draft.transcript.length - 1; i >= 0; i -= 1) {
    const m = draft.transcript[i];
    if (m.role !== 'assistant') continue;
    if (m.stepId !== stepId) return false;
    return Boolean(m.isFollowUp);
  }
  return false;
}

function withAcknowledgment(ack: string | undefined, question: string): string {
  if (!ack) return question;
  const punctuated = /[.!?…]$/.test(ack) ? ack : `${ack}.`;
  return `${punctuated}\n\n${question}`;
}

// ---------- Opt-out ----------

/**
 * Strict opt-out matcher. Must match the entire message (optionally with
 * trailing punctuation) — a substantive reply like "No, we don't use AI yet
 * because of compliance concerns" starts with "no" but is NOT an opt-out, so
 * anchoring to `$` prevents the prefix match that used to eat real answers.
 */
const OPT_OUT_PATTERN =
  /^\s*(no+|nope|nah|stop|skip( (this|it|step))?|done|end|that'?s? all( i know| for now)?|that'?s? it( for now)?|nothing( else| more| to add)?|no more|i'?m (good|done)|pass|leave (it|this)|move on|i don'?t know|idk)\s*[.!?,]*\s*$/i;

function isOptOut(answer: string): boolean {
  if (!answer) return false;
  const trimmed = answer.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return false;
  return OPT_OUT_PATTERN.test(trimmed);
}

// ---------- Catch-up phrasing ----------

function phraseCatchUp(missing: string[], retryIndex: number): string {
  const list = formatMissingRequirements(missing);
  const variants = [
    `Almost there — could you add ${list}? Type 'skip' if you'd rather not.`,
    `Still missing ${list}. A short reply is fine, or say 'skip' to stop.`,
    `One last pass on ${list} and you're done. Otherwise type 'skip'.`,
  ];
  const safeIndex = Math.min(retryIndex, variants.length - 1);
  return variants[safeIndex];
}

// ---------- Extraction ----------

interface ExtractionResult {
  patch: StepPatch;
  followUpQuestion?: string;
  acknowledgment?: string;
  modelCalled: boolean;
  tokensIn: number;
  tokensOut: number;
  guard: ChatGuard;
}

const EXTRACTION_TIMEOUT_MS = 8_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('extraction_timeout')), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function extractPatchForStep(
  stepId: StepId,
  safeAnswer: string,
  scopeQuality?: StepScopeQuality,
): Promise<ExtractionResult> {
  if (!safeAnswer.trim()) {
    return {
      patch: emptyPatch(stepId),
      modelCalled: false,
      tokensIn: 0,
      tokensOut: 0,
      guard: null,
    };
  }

  if (!hasModelKey()) {
    return {
      patch: buildHeuristicPatch(stepId, safeAnswer),
      modelCalled: false,
      tokensIn: 0,
      tokensOut: 0,
      guard: 'missing_model_key',
    };
  }

  const stepDef = getStep(stepId);
  const followUpFocus = scopeQuality ? formatScopeQualityForPrompt(scopeQuality) : undefined;
  const system = buildExtractionSystemPrompt(stepId, stepDef.allowsFollowUp, followUpFocus);
  const humanContent = `User answer:\n\n${safeAnswer}`;
  const estimatedTokensIn = estimateTokens(system.length + humanContent.length);

  try {
    const model = createIntakeModel({ maxOutputTokens: 1024, temperature: 0.3 });
    const schema = schemaForStep(stepId);
    // includeRaw: true returns { raw: AIMessage, parsed: T } so we can read the
    // provider's own usage_metadata. Char-count estimation stays as a fallback
    // for when the provider omits it (older SDKs, streaming, error paths).
    const structured = model.withStructuredOutput(schema, {
      name: `intake_extract_${stepId.replace('-', '_')}`,
      method: 'jsonSchema',
      includeRaw: true,
    });

    const result = await withTimeout(
      structured.invoke([new SystemMessage(system), new HumanMessage(humanContent)]),
      EXTRACTION_TIMEOUT_MS,
    );

    const rawMessage = (result as { raw?: unknown })?.raw;
    const parsed = ((result as { parsed?: unknown })?.parsed ?? {}) as Record<string, unknown>;

    const followUpQuestion =
      typeof parsed.followUpQuestion === 'string' ? parsed.followUpQuestion : undefined;
    const acknowledgment = sanitizeAcknowledgment(parsed.acknowledgment);

    const usage = readUsageMetadata(rawMessage);
    const tokensIn = usage.input > 0 ? usage.input : estimatedTokensIn;
    const tokensOut = usage.output > 0 ? usage.output : estimateTokens(JSON.stringify(parsed).length);

    return {
      patch: { stepId, data: parsed as any } as StepPatch,
      followUpQuestion,
      acknowledgment,
      modelCalled: true,
      tokensIn,
      tokensOut,
      guard: null,
    };
  } catch (error) {
    if (error instanceof MissingModelKeyError) {
      return {
        patch: buildHeuristicPatch(stepId, safeAnswer),
        modelCalled: false,
        tokensIn: 0,
        tokensOut: 0,
        guard: 'missing_model_key',
      };
    }
    const message = error instanceof Error ? error.message : 'unknown';
    const isTimeout = message === 'extraction_timeout';
    console.warn(
      'Intake extraction failed, falling back:',
      message,
    );
    return {
      patch: buildHeuristicPatch(stepId, safeAnswer),
      modelCalled: false,
      tokensIn: 0,
      tokensOut: 0,
      guard: isTimeout ? 'timeout' : 'extraction_failed',
    };
  }
}

/**
 * Pull input/output token counts off the raw AIMessage returned by LangChain.
 * `usage_metadata` is LangChain's cross-provider shape; providers occasionally
 * report via `response_metadata.usage` or `response_metadata.tokenUsage`
 * instead, so we probe both. Zero = fall back to char-count estimation.
 */
function readUsageMetadata(raw: unknown): { input: number; output: number } {
  if (!raw || typeof raw !== 'object') return { input: 0, output: 0 };
  const r = raw as {
    usage_metadata?: { input_tokens?: number; output_tokens?: number };
    response_metadata?: {
      usage?: { input_tokens?: number; output_tokens?: number; inputTokens?: number; outputTokens?: number };
      tokenUsage?: { promptTokens?: number; completionTokens?: number };
    };
  };
  const meta = r.usage_metadata;
  if (meta && typeof meta.input_tokens === 'number' && typeof meta.output_tokens === 'number') {
    return { input: meta.input_tokens, output: meta.output_tokens };
  }
  const u = r.response_metadata?.usage;
  if (u) {
    const input = u.input_tokens ?? u.inputTokens ?? 0;
    const output = u.output_tokens ?? u.outputTokens ?? 0;
    if (typeof input === 'number' && typeof output === 'number' && (input > 0 || output > 0)) {
      return { input, output };
    }
  }
  const tu = r.response_metadata?.tokenUsage;
  if (tu && typeof tu.promptTokens === 'number' && typeof tu.completionTokens === 'number') {
    return { input: tu.promptTokens, output: tu.completionTokens };
  }
  return { input: 0, output: 0 };
}

function estimateTokens(chars: number): number {
  if (!Number.isFinite(chars) || chars <= 0) return 0;
  return Math.ceil(chars / 4);
}

function sanitizeAcknowledgment(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  let trimmed = raw.trim();
  if (!trimmed) return undefined;
  // Plain text only — block smuggled instructions via newlines.
  trimmed = trimmed.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!trimmed) return undefined;
  if (/```/.test(trimmed)) return undefined;
  if (/<\s*[a-zA-Z][^>]*>/.test(trimmed)) return undefined;
  if (/https?:\/\//i.test(trimmed)) return undefined;
  if (trimmed.length > 240) trimmed = trimmed.slice(0, 240).trimEnd();
  if (FILLER_OPENER.test(trimmed)) {
    trimmed = trimmed.replace(FILLER_OPENER, '').trim();
    if (!trimmed) return undefined;
    trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return trimmed;
}

function emptyPatch(stepId: StepId): StepPatch {
  return { stepId, data: {} as any };
}

// ---------- Final brief generation ----------

export async function generateFinalBrief(draft: AutomationIntakeDraft): Promise<FinalBrief> {
  if (!hasModelKey()) {
    return buildHeuristicFinalBrief(draft);
  }

  try {
    const model = createIntakeModel({ maxOutputTokens: 3072, temperature: 0.3 });
    const structured = model.withStructuredOutput(FinalBriefSchema, {
      name: 'intake_final_brief',
      method: 'jsonSchema',
    });

    const summary = summarizeDraftForBrief(draft);

    const result = await structured.invoke([
      new SystemMessage(FINAL_BRIEF_SYSTEM_PROMPT),
      new HumanMessage(`Submission draft (JSON):\n\n${summary}`),
    ]);

    const parsed = FinalBriefSchema.safeParse(result);
    if (!parsed.success) return buildHeuristicFinalBrief(draft);
    return parsed.data;
  } catch (error) {
    console.warn(
      'Final brief generation failed, falling back:',
      error instanceof Error ? error.message : 'unknown',
    );
    return buildHeuristicFinalBrief(draft);
  }
}

function summarizeDraftForBrief(draft: AutomationIntakeDraft): string {
  const { transcript: _t, finalBrief: _b, ...rest } = draft;
  void _t;
  void _b;
  return JSON.stringify(rest);
}

function buildHeuristicFinalBrief(draft: AutomationIntakeDraft): FinalBrief {
  const primary = draft.workflows[0];
  const workflowName = primary?.name ?? 'the primary workflow';
  const toolsSeen = TOOL_STACK_CATEGORIES.flatMap((c) => draft.business.toolStack[c]);

  const clientSummary =
    `Thanks for sharing what ${draft.business.businessName ?? 'your team'} is working on. ` +
    `We captured the primary workflow (${workflowName}) along with the tools in play and the goals you outlined. ` +
    `We'll review this with the Velocity team and reach out with next steps.`;

  const internalSummary =
    `Partner: ${draft.business.businessName ?? 'unnamed'} (${draft.business.sector ?? 'sector unknown'}). ` +
    `Primary workflow "${workflowName}" touches ${primary?.tools?.join(', ') || 'unspecified tools'}. ` +
    `Reported pain points: ${primary?.painPoints?.join('; ') || 'none recorded'}. ` +
    `AI maturity: ${draft.aiUsage.maturity ?? 'unknown'}.`;

  return {
    clientSummary: clientSummary.slice(0, 2000),
    internalSummary: internalSummary.slice(0, 2000),
    recommendedProjects: [
      {
        title: `Automate ${workflowName}`,
        targetWorkflow: workflowName,
        problemSummary:
          primary?.painPoints?.[0] ??
          'No specific pain point captured — scope with the partner before starting.',
        proposedAutomation:
          'Lightweight integration between the tools currently in the workflow, prioritising manual handoffs.',
        expectedImpact: draft.goals.desiredOutcomes[0] ?? 'Reduce manual effort on recurring work.',
        dataSensitivity: draft.constraints.sensitiveData ? 'high' : 'medium',
        studentDeliveryFit:
          'A pair of students could scope, prototype, and hand off within 4–8 weeks, focusing first on the manual handoffs.',
        feasibility: toolsSeen.length > 0 ? 'medium' : 'low',
      },
    ],
    openQuestions: [
      'Which team member owns the target workflow day-to-day?',
      'Are there existing integrations or scripts we should plug into?',
    ],
  };
}
