import { applyPatch, type StepPatch } from './patch.js';
import { createInitialDraft, makeId, nowIso } from './draft.js';
import {
  FIRST_STEP,
  LAST_STEP,
  STEP_DEFINITIONS,
  getStep,
} from './questions.js';
import { sanitizeFreeText } from './sanitize.js';
import {
  checkMinimumCompleteness,
  formatMissingRequirements,
  type AutomationIntakeDraft,
  type ChatAnswers,
  type ChatMessage,
  type FinalBrief,
  type StepId,
  TOOL_STACK_CATEGORIES,
} from './schemas.js';

export interface DeterministicAdvanceArgs {
  draft: AutomationIntakeDraft;
  answer: string;
}

export interface DeterministicAdvanceResult {
  draft: AutomationIntakeDraft;
  assistantMessage: ChatMessage;
  readyForReview: boolean;
}

const OPT_OUT_PATTERN =
  /^\s*(no+\b|nope|nah|stop\b|skip\b|done\b|end\b|that'?s? all|that'?s? it|nothing (else|more|to add)|no more|i'?m (good|done)|pass\b|leave (it|this)|move on)/i;
const CONTACT_CONSENT_PATTERN =
  /\b(i (agree|consent)|yes,?\s*(i )?(agree|consent)|consent (is )?ok|ok(ay)? to contact|you can contact me|happy for (you|velocity) to (contact me|store (this )?intake))\b/i;

export function rebuildDeterministicDraft(draft: AutomationIntakeDraft): AutomationIntakeDraft {
  const { answers, skips } = extractChatState(draft);
  const rebuilt = buildDraftFromChatState(draft.sessionId, answers, skips, draft.transcript);
  return {
    ...rebuilt,
    finalBrief: draft.finalBrief,
  };
}

export function getDeterministicAnswer(
  draft: AutomationIntakeDraft,
  stepId: StepId,
): string | undefined {
  return extractChatState(draft).answers[stepId];
}

export function getPreviousCompletedStep(draft: AutomationIntakeDraft): StepId | null {
  const { answers, skips } = extractChatState(draft);
  const currentIndex = STEP_DEFINITIONS.findIndex((step) => step.id === draft.currentStep);

  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const stepId = STEP_DEFINITIONS[index]?.id;
    if (!stepId) continue;
    if (hasCompletedStep(stepId, answers, skips)) return stepId;
  }

  if (currentIndex >= STEP_DEFINITIONS.length - 1) {
    for (let index = STEP_DEFINITIONS.length - 1; index >= 0; index -= 1) {
      const stepId = STEP_DEFINITIONS[index]!.id;
      if (hasCompletedStep(stepId, answers, skips)) return stepId;
    }
  }

  return null;
}

export function isRequiredCatchUpState(draft: AutomationIntakeDraft): boolean {
  const { answers, skips } = extractChatState(draft);
  return allCanonicalStepsCompleted(answers, skips) && draft.status !== 'review';
}

export function replaceDeterministicAnswer(
  draft: AutomationIntakeDraft,
  stepId: StepId,
  answer: string,
): DeterministicAdvanceResult {
  const safeAnswer = sanitizeFreeText(answer, { maxLength: 2000 });
  const { answers, skips } = extractChatState(draft);

  if (!safeAnswer.trim()) {
    delete answers[stepId];
  } else {
    answers[stepId] = safeAnswer;
    skips.delete(stepId);
  }

  const nextDraft = buildDraftFromChatState(draft.sessionId, answers, skips, draft.transcript);
  const assistantMessage = getTrailingAssistantMessage(nextDraft.transcript, nextDraft.currentStep);

  return {
    draft: nextDraft,
    assistantMessage,
    readyForReview: nextDraft.status === 'review',
  };
}

export function advanceDeterministicDraftFromAnswer(
  args: DeterministicAdvanceArgs,
): DeterministicAdvanceResult {
  const { draft, answer } = args;
  const safeAnswer = sanitizeFreeText(answer, { maxLength: 2000 });
  const { answers, skips } = extractChatState(draft);

  if (!safeAnswer.trim()) {
    const assistantMessage = getTrailingAssistantMessage(draft.transcript, draft.currentStep);
    return {
      draft,
      assistantMessage,
      readyForReview: draft.status === 'review',
    };
  }

  const answerIsSkip = OPT_OUT_PATTERN.test(safeAnswer);
  const catchUpMode = isRequiredCatchUpState(draft);

  if (answerIsSkip && catchUpMode) {
    const unchanged = buildDraftFromChatState(draft.sessionId, answers, skips, draft.transcript);
    const assistantMessage = getTrailingAssistantMessage(unchanged.transcript, unchanged.currentStep);
    return {
      draft: unchanged,
      assistantMessage,
      readyForReview: unchanged.status === 'review',
    };
  }

  if (answerIsSkip) {
    delete answers[draft.currentStep];
    skips.add(draft.currentStep);
  } else {
    const existing = answers[draft.currentStep];
    const shouldAppend = catchUpMode && Boolean(existing?.trim());
    answers[draft.currentStep] = shouldAppend
      ? `${existing}\n${safeAnswer}`
      : safeAnswer;
    skips.delete(draft.currentStep);
  }

  const nextDraft = buildDraftFromChatState(draft.sessionId, answers, skips, draft.transcript);
  const assistantMessage = getTrailingAssistantMessage(nextDraft.transcript, nextDraft.currentStep);

  return {
    draft: nextDraft,
    assistantMessage,
    readyForReview: nextDraft.status === 'review',
  };
}

export async function generateDeterministicFinalBrief(
  draft: AutomationIntakeDraft,
): Promise<FinalBrief> {
  const primary = draft.workflows[0];
  const workflowName = primary?.name ?? 'the primary workflow';

  const toolsSeen = TOOL_STACK_CATEGORIES.flatMap((category) => draft.business.toolStack[category]);

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

function buildDraftFromChatState(
  sessionId: string,
  answers: ChatAnswers,
  skips: Set<StepId>,
  previousTranscript: ChatMessage[] = [],
): AutomationIntakeDraft {
  let next = createInitialDraft(sessionId);

  for (const step of STEP_DEFINITIONS) {
    const answer = answers[step.id];
    if (!answer?.trim()) continue;
    next = applyPatch(next, buildHeuristicPatch(step.id, answer));
    next.questionCount += 1;
  }

  next.chatAnswers = answers;
  next.chatSkips = Array.from(skips);
  next.followUpsUsed = 0;

  const missing = checkMinimumCompleteness(next);
  const finishedCanonically = allCanonicalStepsCompleted(answers, skips);

  if (finishedCanonically && missing.length === 0) {
    next.status = 'review';
    next.currentStep = LAST_STEP;
  } else if (finishedCanonically) {
    next.status = 'collecting';
    next.currentStep = mapMissingToStep(missing);
  } else {
    next.status = 'collecting';
    next.currentStep = getFirstIncompleteStep(answers, skips);
  }

  next.transcript = buildTranscript(
    answers,
    skips,
    next.currentStep,
    next.status,
    missing,
    previousTranscript,
  );
  return next;
}

function buildTranscript(
  answers: ChatAnswers,
  skips: Set<StepId>,
  currentStep: StepId,
  status: AutomationIntakeDraft['status'],
  missing: string[],
  previousTranscript: ChatMessage[] = [],
): ChatMessage[] {
  const transcript: ChatMessage[] = [];

  const reusePromptId = (stepId: StepId): string | undefined =>
    previousTranscript.find(
      (m) => m.role === 'assistant' && m.stepId === stepId && !m.isFollowUp,
    )?.id;

  const reuseUserId = (stepId: StepId): string | undefined =>
    previousTranscript.find((m) => m.role === 'user' && m.stepId === stepId)?.id;

  const reuseFollowUpId = (): string | undefined =>
    previousTranscript.find((m) => m.role === 'assistant' && m.isFollowUp)?.id;

  for (const step of STEP_DEFINITIONS) {
    transcript.push(
      makeAssistantMessage(step.assistantPrompt, step.id, false, reusePromptId(step.id)),
    );

    const answer = answers[step.id];
    if (answer?.trim()) {
      transcript.push(makeUserMessage(answer, step.id, reuseUserId(step.id)));
      continue;
    }

    if (skips.has(step.id)) {
      transcript.push(makeUserMessage('skip', step.id, reuseUserId(step.id)));
      continue;
    }

    break;
  }

  if (allCanonicalStepsCompleted(answers, skips)) {
    transcript.push(
      makeAssistantMessage(
        status === 'review'
          ? "That's everything I needed — hit 'Review submission' whenever you're ready."
          : buildCatchUpPrompt(currentStep, missing),
        currentStep,
        true,
        reuseFollowUpId(),
      ),
    );
  }

  return transcript;
}

function buildCatchUpPrompt(currentStep: StepId, missing: string[]): string {
  if (currentStep === 'business') {
    return 'Before review, I still need a clearer business description. Tell me in one or two sentences what the business does, or use Edit on your earlier answer.';
  }

  return `Before review, I still need ${formatMissingRequirements(missing)}. Reply here or use Edit on your earlier answer.`;
}

function getFirstIncompleteStep(answers: ChatAnswers, skips: Set<StepId>): StepId {
  const next = STEP_DEFINITIONS.find((step) => !hasCompletedStep(step.id, answers, skips));
  return next?.id ?? FIRST_STEP;
}

function allCanonicalStepsCompleted(answers: ChatAnswers, skips: Set<StepId>): boolean {
  return STEP_DEFINITIONS.every((step) => hasCompletedStep(step.id, answers, skips));
}

function hasCompletedStep(
  stepId: StepId,
  answers: ChatAnswers,
  skips: Set<StepId>,
): boolean {
  return Boolean(answers[stepId]?.trim()) || skips.has(stepId);
}

function mapMissingToStep(missing: string[]): StepId {
  if (missing.includes('business description')) return 'business';
  return 'contact';
}

function extractChatState(draft: AutomationIntakeDraft): {
  answers: ChatAnswers;
  skips: Set<StepId>;
} {
  const answers: ChatAnswers = { ...draft.chatAnswers };
  const skips = new Set<StepId>(draft.chatSkips);

  for (const message of draft.transcript) {
    if (message.role !== 'user' || !message.stepId) continue;
    const stepId = message.stepId;
    // chatAnswers is authoritative — the transcript is derived from it. Only fall
    // back to transcript content for legacy drafts where chatAnswers is missing
    // a step; otherwise this loop would re-append every saved answer on each call.
    if (answers[stepId]?.trim() || skips.has(stepId)) continue;
    const value = sanitizeFreeText(message.content, { maxLength: 2000 });
    if (!value) continue;

    if (OPT_OUT_PATTERN.test(value)) {
      skips.add(stepId);
      continue;
    }

    answers[stepId] = value;
  }

  return { answers, skips };
}

function makeAssistantMessage(
  content: string,
  stepId: StepId,
  isFollowUp = false,
  reuseId?: string,
): ChatMessage {
  return {
    id: reuseId ?? makeId(),
    role: 'assistant',
    content,
    createdAt: nowIso(),
    stepId,
    isFollowUp,
  };
}

function makeUserMessage(content: string, stepId: StepId, reuseId?: string): ChatMessage {
  return {
    id: reuseId ?? makeId(),
    role: 'user',
    content,
    createdAt: nowIso(),
    stepId,
  };
}

function getTrailingAssistantMessage(
  transcript: ChatMessage[],
  stepId: StepId,
): ChatMessage {
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const candidate = transcript[index];
    if (candidate?.role === 'assistant') return candidate;
  }

  return makeAssistantMessage(getStep(stepId).assistantPrompt, stepId);
}

function emptyPatch(stepId: StepId): StepPatch {
  return { stepId, data: {} as never };
}

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
        data: { currentSteps: splitList(answer).slice(0, 8).map((item) => item.slice(0, 500)) },
      };
    case 'pain-points':
      return {
        stepId,
        data: { painPoints: splitList(answer).slice(0, 6).map((item) => item.slice(0, 500)) },
      };
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
      return {
        stepId,
        data: { desiredOutcomes: splitList(answer).slice(0, 5).map((item) => item.slice(0, 500)) },
      };
    case 'contact': {
      const emailMatch = answer.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
      const email = emailMatch ? emailMatch[0] : undefined;
      const consent = CONTACT_CONSENT_PATTERN.test(answer) ? true : undefined;
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
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

const JUNK_WORKFLOW_PATTERNS = [
  /^(yes|no|maybe|not sure|idk|i dont know|i don't know|um|uh|hmm|ok|okay|some|any|various|lots|many|a few|dunno|unknown)$/i,
  /^(workflow|workflows|process|processes|things|stuff|tasks)$/i,
];

function cleanWorkflowName(raw: string): string | null {
  let name = raw.trim().replace(/^(the|a|an|our|my|some|several)\s+/i, '').trim();
  name = name.replace(/^(oh|so|well|like|basically|kind of|sort of)[\s,]+/i, '').trim();
  if (name.length < 4) return null;
  if (name.length > 120) name = name.slice(0, 120).trim();
  for (const pattern of JUNK_WORKFLOW_PATTERNS) {
    if (pattern.test(name)) return null;
  }
  return name;
}

function pickTokens(text: string, max: number): string[] {
  const matches = Array.from(
    text.matchAll(/\b([A-Z][A-Za-z0-9+.-]{2,}(?:\s+[A-Z][A-Za-z0-9+.-]{2,})?)\b/g),
  ).map((match) => match[1].trim());
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
