/**
 * Automation Intake engine.
 *
 * Turns one (draft, answer) pair into (next draft, assistant message, readyForReview).
 * Step order is deterministic — defined in ./questions.ts. The model only fills
 * extraction patches; it never decides the flow.
 */
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

import {
  checkMinimumCompleteness,
  FinalBriefSchema,
  TOOL_STACK_CATEGORIES,
  type AutomationIntakeDraft,
  type ChatMessage,
  type FinalBrief,
  type StepId,
} from './schemas.js';
import {
  getStep,
  MAX_FOLLOW_UPS,
  STEP_DEFINITIONS,
} from './questions.js';
import { sanitizeFreeText } from './sanitize.js';
import { createIntakeModel, hasModelKey, MissingModelKeyError } from './model.js';
import {
  applyPatch,
  shouldEmitFollowUp,
  type StepPatch,
} from './patch.js';
import {
  FINAL_BRIEF_SYSTEM_PROMPT,
  CATCH_UP_EXTRACTION_SYSTEM_PROMPT,
  buildExtractionSystemPrompt,
} from './prompts.js';
import { makeId, nowIso } from './draft.js';
import { formatMissingRequirements } from './schemas.js';

// Re-export pure helpers so existing imports from this module still resolve.
export { createInitialDraft, isDraftReadyForReview } from './draft.js';

// ---------- Per-step Zod extraction schemas ----------
// These are loose — every field optional. Model fills only what it observes.

const ackField = z.string().max(240).optional();

const businessPatchSchema = z.object({
  businessName: z.string().max(120).optional(),
  website: z.string().max(120).optional(),
  sector: z.string().max(120).optional(),
  teamSizeBand: z.string().max(40).optional(),
  whatTheyDo: z.string().max(2000).optional(),
  whoTheyServe: z.string().max(2000).optional(),
  followUpQuestion: z.string().max(400).optional(),
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
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const workflowNamePatchSchema = z.object({
  name: z.string().max(120).optional(),
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const workflowOwnershipPatchSchema = z.object({
  owner: z.string().max(120).optional(),
  frequency: z.string().max(120).optional(),
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const workflowToolsPatchSchema = z.object({
  tools: z.array(z.string().max(120)).max(10).optional(),
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const workflowStepsPatchSchema = z.object({
  currentSteps: z.array(z.string().max(500)).max(12).optional(),
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const painPointsPatchSchema = z.object({
  painPoints: z.array(z.string().max(500)).max(12).optional(),
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const aiUsagePatchSchema = z.object({
  currentTools: z.array(z.string().max(120)).max(10).optional(),
  currentUseCases: z.array(z.string().max(500)).max(10).optional(),
  maturity: z.enum(['none', 'experimental', 'active']).optional(),
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const aiNonUsePatchSchema = z.object({
  nonUseAreas: z.array(z.string().max(500)).max(10).optional(),
  blockers: z.array(z.string().max(500)).max(10).optional(),
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const constraintsPatchSchema = z.object({
  sensitiveData: z.boolean().optional(),
  sensitiveDataNotes: z.string().max(500).optional(),
  approvalRequirements: z.array(z.string().max(500)).max(10).optional(),
  complianceNotes: z.array(z.string().max(500)).max(10).optional(),
  integrationLimits: z.array(z.string().max(500)).max(10).optional(),
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const goalsPatchSchema = z.object({
  desiredOutcomes: z.array(z.string().max(500)).max(10).optional(),
  successMetrics: z.array(z.string().max(500)).max(10).optional(),
  timeline: z.string().max(120).optional(),
  preferredProjectShape: z.string().max(500).optional(),
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const contactPatchSchema = z.object({
  name: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  email: z.string().max(120).optional(),
  consent: z.boolean().optional(),
  followUpQuestion: z.string().max(400).optional(),
  acknowledgment: ackField,
});

const catchUpPatchSchema = z.object({
  business: z
    .object({
      businessName: z.string().max(120).optional(),
      website: z.string().max(120).optional(),
      sector: z.string().max(120).optional(),
      whatTheyDo: z.string().max(2000).optional(),
      whoTheyServe: z.string().max(2000).optional(),
    })
    .optional(),
  workflow: z
    .object({
      name: z.string().max(120).optional(),
    })
    .optional(),
  goals: z
    .object({
      desiredOutcomes: z.array(z.string().max(500)).max(10).optional(),
    })
    .optional(),
  contact: z
    .object({
      name: z.string().max(120).optional(),
      role: z.string().max(120).optional(),
      email: z.string().max(120).optional(),
      consent: z.boolean().optional(),
    })
    .optional(),
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

// ---------- Public API ----------

export interface AdvanceArgs {
  draft: AutomationIntakeDraft;
  answer: string;
}

export interface AdvanceResult {
  draft: AutomationIntakeDraft;
  assistantMessage: ChatMessage;
  readyForReview: boolean;
}

export async function advanceDraftFromAnswer(args: AdvanceArgs): Promise<AdvanceResult> {
  const { draft, answer } = args;
  const safeAnswer = sanitizeFreeText(answer, { maxLength: 2000 });

  // Record the user's message (always — even if empty extraction).
  let working: AutomationIntakeDraft = {
    ...draft,
    transcript: [
      ...draft.transcript,
      {
        id: makeId(),
        role: 'user',
        content: safeAnswer,
        createdAt: nowIso(),
        stepId: draft.currentStep,
      },
    ],
  };

  const stepDef = getStep(working.currentStep);
  const isPastFinalStep =
    working.currentStep === 'contact' && working.questionCount >= STEP_DEFINITIONS.length;
  const optOut = isOptOut(safeAnswer);

  // If we're past the end and the user is opting out, stop asking.
  if (isPastFinalStep && optOut) {
    const text = canSubmit(working)
      ? "Got it — no worries. You can review and submit what you have whenever you're ready."
      : "Understood. I'll stop here — you can still fill the required details in form mode before submitting.";
    return finalize(working, text, false, canSubmit(working));
  }

  // Past the final step: run a multi-field catch-up extraction instead of the
  // per-step pipeline. This lets a single catch-up answer fill any missing field.
  if (isPastFinalStep) {
    working = await applyCatchUpExtraction(working, safeAnswer);
    working = { ...working, questionCount: working.questionCount + 1 };

    const missing = checkMinimumCompleteness(working);
    if (missing.length === 0) {
      const text = "Thanks — that's everything I needed. Hit 'Review submission' whenever you're ready.";
      return finalize({ ...working, status: 'review' }, text, false, true);
    }

    // Give up re-asking after a few attempts so the flow doesn't loop.
    const retries = countCatchUpRetries(working);
    if (retries >= 3) {
      const text =
        "No problem — I'll stop asking. Form mode lets you fill the last bits in whenever you're ready.";
      return finalize(working, text, false, false);
    }

    const text = phraseCatchUp(missing, retries);
    return finalize(working, text, false, false);
  }

  // Opt-out during the normal flow: skip this step entirely and advance.
  // No extraction runs — the user explicitly declined to answer.
  if (optOut) {
    working = { ...working, questionCount: working.questionCount + 1 };
    const nextStepIndex = STEP_DEFINITIONS.findIndex((s) => s.id === working.currentStep) + 1;
    const nextStep = STEP_DEFINITIONS[nextStepIndex];
    if (nextStep) {
      working = { ...working, currentStep: nextStep.id };
      return finalize(
        working,
        `No problem — skipping that. ${nextStep.assistantPrompt}`,
        false,
        false,
      );
    }
    // Opt-out on the last step: move into catch-up state.
    const missing = checkMinimumCompleteness(working);
    if (missing.length === 0) {
      return finalize(
        { ...working, status: 'review' },
        "All good — hit 'Review submission' whenever you're ready.",
        false,
        true,
      );
    }
    return finalize(working, phraseCatchUp(missing, 0), false, false);
  }

  // Normal per-step extraction.
  const extraction = await extractPatchForStep(working.currentStep, safeAnswer);
  working = applyPatch(working, extraction.patch);
  working = { ...working, questionCount: working.questionCount + 1 };

  // Decide whether to emit a follow-up on the same step, or advance.
  const followUpAllowed =
    stepDef.allowsFollowUp &&
    working.followUpsUsed < MAX_FOLLOW_UPS &&
    // only one follow-up per step — track via the transcript tail
    !isFollowUpOnSameStep(working);

  const wantsFollowUp =
    followUpAllowed &&
    !optOut &&
    shouldEmitFollowUp(working.currentStep, working, extraction.followUpQuestion);

  let assistantText: string;
  let isFollowUp = false;

  if (wantsFollowUp && extraction.followUpQuestion) {
    assistantText = withAcknowledgment(extraction.acknowledgment, extraction.followUpQuestion.trim());
    isFollowUp = true;
    working = { ...working, followUpsUsed: working.followUpsUsed + 1 };
  } else {
    // Move to the next step — or mark ready for review at the end.
    const nextStepIndex = STEP_DEFINITIONS.findIndex((s) => s.id === working.currentStep) + 1;
    const nextStep = STEP_DEFINITIONS[nextStepIndex];

    if (nextStep) {
      working = { ...working, currentStep: nextStep.id };
      assistantText = withAcknowledgment(extraction.acknowledgment, nextStep.assistantPrompt);
    } else {
      // We've just finished the last step.
      const missing = checkMinimumCompleteness(working);
      if (missing.length === 0) {
        assistantText = withAcknowledgment(
          extraction.acknowledgment,
          "That's everything I needed — hit 'Review submission' whenever you're ready.",
        );
        working = { ...working, status: 'review' };
      } else {
        assistantText = withAcknowledgment(extraction.acknowledgment, phraseCatchUp(missing, 0));
      }
    }
  }

  return finalize(working, assistantText, isFollowUp, canSubmit(working));
}

function withAcknowledgment(ack: string | undefined, question: string): string {
  if (!ack) return question;
  // Ensure trailing punctuation on the ack so the join reads naturally.
  const punctuated = /[.!?…]$/.test(ack) ? ack : `${ack}.`;
  return `${punctuated}\n\n${question}`;
}

function finalize(
  working: AutomationIntakeDraft,
  assistantText: string,
  isFollowUp: boolean,
  readyForReview: boolean,
): AdvanceResult {
  const assistantMessage: ChatMessage = {
    id: makeId(),
    role: 'assistant',
    content: assistantText,
    createdAt: nowIso(),
    stepId: working.currentStep,
    isFollowUp,
  };
  const next = { ...working, transcript: [...working.transcript, assistantMessage] };
  return { draft: next, assistantMessage, readyForReview };
}

function canSubmit(draft: AutomationIntakeDraft): boolean {
  return checkMinimumCompleteness(draft).length === 0;
}

const OPT_OUT_PATTERN =
  /^\s*(no+\b|nope|nah|stop\b|skip\b|done\b|end\b|that'?s? all|that'?s? it|nothing (else|more|to add)|no more|i'?m (good|done)|pass\b|leave (it|this)|move on)/i;
const CONTACT_CONSENT_PATTERN =
  /\b(i (agree|consent)|yes,?\s*(i )?(agree|consent)|consent (is )?ok|ok(ay)? to contact|you can contact me|happy for (you|velocity) to (contact me|store (this )?intake))\b/i;

function isOptOut(answer: string): boolean {
  if (!answer) return false;
  const trimmed = answer.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 80) return false; // long answers aren't opt-outs
  return OPT_OUT_PATTERN.test(trimmed);
}

function countCatchUpRetries(draft: AutomationIntakeDraft): number {
  // Once we're past the last step, every additional question is a retry.
  return Math.max(0, draft.questionCount - STEP_DEFINITIONS.length);
}

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

async function applyCatchUpExtraction(
  working: AutomationIntakeDraft,
  safeAnswer: string,
): Promise<AutomationIntakeDraft> {
  if (!safeAnswer.trim()) return working;

  const missing = checkMinimumCompleteness(working);
  if (!hasModelKey()) {
    return applyCatchUpHeuristics(working, safeAnswer, missing);
  }

  try {
    const model = createIntakeModel({ maxOutputTokens: 768, temperature: 0.2 });
    const structured = model.withStructuredOutput(catchUpPatchSchema, {
      name: 'intake_catch_up_extract',
      method: 'jsonSchema',
    });

    const raw = await structured.invoke([
      new SystemMessage(CATCH_UP_EXTRACTION_SYSTEM_PROMPT),
      new HumanMessage(
        `Missing fields to focus on:\n- ${missing.join('\n- ')}\n\nUser answer:\n\n${safeAnswer}`
      ),
    ]);

    const parsed = (raw ?? {}) as z.infer<typeof catchUpPatchSchema>;
    let next = working;

    if (parsed.business) {
      next = applyPatch(next, { stepId: 'business', data: parsed.business });
    }
    if (parsed.workflow) {
      next = applyPatch(next, { stepId: 'workflow-name', data: parsed.workflow });
    }
    if (parsed.goals) {
      next = applyPatch(next, { stepId: 'goals', data: parsed.goals });
    }
    if (parsed.contact) {
      next = applyPatch(next, { stepId: 'contact', data: parsed.contact });
    }

    if (CONTACT_CONSENT_PATTERN.test(safeAnswer)) {
      next = { ...next, contact: { ...next.contact, consent: true } };
    }

    return next;
  } catch (error) {
    if (!(error instanceof MissingModelKeyError)) {
      console.warn(
        'Intake catch-up extraction failed, falling back:',
        error instanceof Error ? error.message : 'unknown',
      );
    }
  }

  return applyCatchUpHeuristics(working, safeAnswer, missing);
}

function applyCatchUpHeuristics(
  working: AutomationIntakeDraft,
  safeAnswer: string,
  missing: string[],
): AutomationIntakeDraft {
  const candidateSteps: StepId[] = [];
  if (missing.includes('business description')) candidateSteps.push('business');
  if (missing.some((m) => m.startsWith('contact'))) candidateSteps.push('contact');
  if (missing.includes('consent')) candidateSteps.push('contact');
  if (!working.workflows[0]?.name) candidateSteps.push('workflow-name');
  if ((working.goals.desiredOutcomes?.length ?? 0) === 0) candidateSteps.push('goals');

  const unique = Array.from(new Set(candidateSteps));
  let next = working;
  for (const step of unique) {
    next = applyPatch(next, buildHeuristicPatch(step, safeAnswer));
  }

  // Treat explicit consent language as consent.
  if (CONTACT_CONSENT_PATTERN.test(safeAnswer)) {
    next = { ...next, contact: { ...next.contact, consent: true } };
  }

  return next;
}

function isFollowUpOnSameStep(draft: AutomationIntakeDraft): boolean {
  // Look at the most recent assistant message — if it was a follow-up on this step, don't emit another.
  for (let i = draft.transcript.length - 1; i >= 0; i -= 1) {
    const m = draft.transcript[i];
    if (m.role !== 'assistant') continue;
    if (m.stepId !== draft.currentStep) return false;
    return Boolean(m.isFollowUp);
  }
  return false;
}

// ---------- Extraction ----------

interface ExtractionResult {
  patch: StepPatch;
  followUpQuestion?: string;
  acknowledgment?: string;
}

async function extractPatchForStep(
  stepId: StepId,
  safeAnswer: string,
): Promise<ExtractionResult> {
  // Empty answer → empty patch.
  if (!safeAnswer.trim()) {
    return { patch: emptyPatch(stepId) };
  }

  if (!hasModelKey()) {
    return { patch: buildHeuristicPatch(stepId, safeAnswer) };
  }

  try {
    const model = createIntakeModel({ maxOutputTokens: 1024, temperature: 0.3 });
    const schema = schemaForStep(stepId);
    const stepDef = getStep(stepId);

    const structured = model.withStructuredOutput(schema, {
      name: `intake_extract_${stepId.replace('-', '_')}`,
      method: 'jsonSchema',
    });

    const system = buildExtractionSystemPrompt(stepId, stepDef.allowsFollowUp);

    const raw = await structured.invoke([
      new SystemMessage(system),
      new HumanMessage(`User answer:\n\n${safeAnswer}`),
    ]);

    const parsed = (raw ?? {}) as Record<string, unknown>;
    const followUpQuestion =
      typeof parsed.followUpQuestion === 'string' ? parsed.followUpQuestion : undefined;
    const acknowledgment = sanitizeAcknowledgment(parsed.acknowledgment);

    return {
      patch: { stepId, data: parsed as any } as StepPatch,
      followUpQuestion,
      acknowledgment,
    };
  } catch (error) {
    if (error instanceof MissingModelKeyError) {
      return { patch: buildHeuristicPatch(stepId, safeAnswer) };
    }
    console.warn('Intake extraction failed, falling back:', error instanceof Error ? error.message : 'unknown');
    return { patch: buildHeuristicPatch(stepId, safeAnswer) };
  }
}

function sanitizeAcknowledgment(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  let trimmed = raw.trim();
  if (!trimmed) return undefined;
  // Guard against the model trying to smuggle instructions back — plain text only.
  trimmed = trimmed.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
  if (trimmed.length > 240) trimmed = trimmed.slice(0, 240).trimEnd();
  // Kill the filler openers we tried to ban in the prompt.
  if (/^(great|awesome|perfect|amazing|love (it|that)|fantastic|wonderful)\b[!.,]*/i.test(trimmed)) {
    trimmed = trimmed.replace(/^(great|awesome|perfect|amazing|love (it|that)|fantastic|wonderful)\b[!.,]*\s*/i, '');
    if (!trimmed) return undefined;
    trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return trimmed;
}

function emptyPatch(stepId: StepId): StepPatch {
  return { stepId, data: {} as any };
}

/**
 * Deterministic fallback when the model is unavailable.
 * Does the minimum needed to keep the flow moving — dumps the answer into the
 * most obvious field and lets the user correct in form mode.
 */
export function buildHeuristicPatch(stepId: StepId, safeAnswer: string): StepPatch {
  const answer = safeAnswer.trim();
  if (!answer) return emptyPatch(stepId);

  switch (stepId) {
    case 'business':
      return { stepId, data: { whatTheyDo: answer.slice(0, 2000) } };
    case 'systems': {
      const tokens = pickTokens(answer, 12);
      return { stepId, data: { toolStack: { other: tokens } } };
    }
    case 'workflow-name': {
      const name = cleanWorkflowName(answer) ?? answer.slice(0, 120);
      return { stepId, data: { name } };
    }
    case 'workflow-ownership': {
      const frequency = answer.match(/\b(daily|weekly|monthly|quarterly|yearly|every [a-z]+|each [a-z]+)\b/i)?.[0];
      return {
        stepId,
        data: {
          owner: answer.slice(0, 120),
          frequency: frequency ? frequency.toLowerCase() : undefined,
        },
      };
    }
    case 'workflow-tools':
      return { stepId, data: { tools: pickTokens(answer, 10) } };
    case 'workflow-steps':
      return {
        stepId,
        data: { currentSteps: splitList(answer).slice(0, 8).map((s) => s.slice(0, 500)) },
      };
    case 'pain-points':
      return { stepId, data: { painPoints: splitList(answer).slice(0, 6).map((p) => p.slice(0, 500)) } };
    case 'ai-usage':
      return {
        stepId,
        data: {
          currentUseCases: [answer.slice(0, 500)],
          maturity: /not using|don'?t use|never|none/i.test(answer)
            ? 'none'
            : /regular|daily|weekly|embed/i.test(answer)
              ? 'active'
              : 'experimental',
        },
      };
    case 'ai-non-use':
      return { stepId, data: { nonUseAreas: [answer.slice(0, 500)] } };
    case 'constraints':
      return {
        stepId,
        data: {
          sensitiveData: /gdpr|pii|phi|hipaa|sensitive|regulated|confidential/i.test(answer),
          complianceNotes: [answer.slice(0, 500)],
        },
      };
    case 'goals':
      return { stepId, data: { desiredOutcomes: splitList(answer).slice(0, 5).map((g) => g.slice(0, 500)) } };
    case 'contact': {
      const emailMatch = answer.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
      const email = emailMatch ? emailMatch[0] : undefined;
      const consent = CONTACT_CONSENT_PATTERN.test(answer) ? true : undefined;
      // Name heuristic: first capitalized word pair, excluding the email.
      const withoutEmail = answer.replace(email ?? '', '').trim();
      const nameMatch = withoutEmail.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
      const role = inferContactRole(withoutEmail, nameMatch?.[1]);
      return {
        stepId,
        data: {
          name: nameMatch ? nameMatch[1] : undefined,
          role,
          email,
          consent,
        },
      };
    }
  }
}

function splitList(text: string): string[] {
  return text
    .split(/[,;\n•·\-]+|\band\b/gi)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
}

const JUNK_WORKFLOW_PATTERNS = [
  /^(yes|no|maybe|not sure|idk|i dont know|i don't know|um|uh|hmm|ok|okay|some|any|various|lots|many|a few|dunno|unknown)$/i,
  /^(workflow|workflows|process|processes|things|stuff|tasks)$/i,
];

function cleanWorkflowName(raw: string): string | null {
  let name = raw.trim().replace(/^(the|a|an|our|my|some|several)\s+/i, '').trim();
  // Strip leading filler tokens like "oh", "so", "well".
  name = name.replace(/^(oh|so|well|like|basically|kind of|sort of)[\s,]+/i, '').trim();
  if (name.length < 4) return null;
  if (name.length > 120) name = name.slice(0, 120).trim();
  for (const pat of JUNK_WORKFLOW_PATTERNS) {
    if (pat.test(name)) return null;
  }
  return name;
}

function pickTokens(text: string, max: number): string[] {
  // Very crude: pull capitalised words (likely product names) up to max.
  const matches = Array.from(text.matchAll(/\b([A-Z][A-Za-z0-9+.-]{2,}(?:\s+[A-Z][A-Za-z0-9+.-]{2,})?)\b/g)).map(
    (m) => m[1].trim(),
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of matches) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

function inferContactRole(raw: string, name: string | undefined): string | undefined {
  const stripped = raw
    .replace(name ?? '', '')
    .replace(CONTACT_CONSENT_PATTERN, '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/, '')
    .trim();
  if (!stripped) return undefined;

  const segments = stripped
    .split(/[,|\n]|(?:\s+-\s+)|(?:\s+–\s+)/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const role = segments.find((segment) => {
    if (segment.length < 3 || segment.length > 120) return false;
    if (/^(hi|hello|thanks|thank you)$/i.test(segment)) return false;
    return true;
  });

  return role ? role.slice(0, 120) : undefined;
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
    if (!parsed.success) {
      return buildHeuristicFinalBrief(draft);
    }
    return parsed.data;
  } catch (error) {
    console.warn('Final brief generation failed, falling back:', error instanceof Error ? error.message : 'unknown');
    return buildHeuristicFinalBrief(draft);
  }
}

function summarizeDraftForBrief(draft: AutomationIntakeDraft): string {
  // Strip the transcript (redundant for the brief) and emit a compact JSON blob.
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
