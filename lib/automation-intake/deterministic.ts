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
  assessStepScope,
  buildDeterministicScopeHint,
} from './scope-quality.js';
import {
  checkMinimumCompleteness,
  FINAL_BRIEF_CLIENT_SUMMARY_MAX_CHARS,
  FINAL_BRIEF_OPEN_QUESTIONS_MAX,
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

/**
 * Strict opt-out matcher. The phrase must be *essentially the entire message*
 * (optionally with trailing punctuation) — otherwise a substantive reply like
 * "No, we don't use AI yet because of compliance concerns" would short-circuit
 * into a skip and drop the content.
 */
const OPT_OUT_PATTERN =
  /^\s*(no+|nope|nah|no+,?\s+that'?s? (it|all)( for now)?|no+,?\s+nothing( else| more| to add)?|stop|skip( (this|it|step))?|done|end|that'?s? all( i know| for now)?|that'?s? it( for now)?|nothing( else| more| to add)?|no more|i'?m (good|done)|pass|leave (it|this)|move on|i don'?t know|idk)\s*[.!?,]*\s*$/i;
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

  const nextDraft = buildDraftFromChatState(draft.sessionId, answers, skips, draft.transcript, {
    editedStepId: stepId,
  });
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
  const rawAnswer = typeof answer === 'string' ? answer.trim().slice(0, 2000) : '';
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
    // If the user already gave a substantive answer and is now saying "that's
    // all" / "move on", preserve what they said. A skip only marks the step as
    // genuinely skipped when there is no existing answer to keep.
    const existing = answers[draft.currentStep];
    if (existing?.trim()) {
      skips.delete(draft.currentStep);
    } else {
      delete answers[draft.currentStep];
      skips.add(draft.currentStep);
    }
  } else {
    const existing = answers[draft.currentStep];
    const shouldAppend = catchUpMode && Boolean(existing?.trim());
    answers[draft.currentStep] = shouldAppend
      ? `${existing}\n${safeAnswer}`
      : safeAnswer;
    skips.delete(draft.currentStep);
  }

  const transcriptSeed = rawAnswer
    ? [
        ...draft.transcript,
        {
          id: makeId(),
          role: 'user' as const,
          content: rawAnswer,
          createdAt: nowIso(),
          stepId: draft.currentStep,
        },
      ]
    : draft.transcript;
  const nextDraft = buildDraftFromChatState(draft.sessionId, answers, skips, transcriptSeed);
  const assistantMessage = getTrailingAssistantMessage(nextDraft.transcript, nextDraft.currentStep);

  return {
    draft: nextDraft,
    assistantMessage,
    readyForReview: nextDraft.status === 'review',
  };
}

export function withDeterministicScopeHint(
  result: DeterministicAdvanceResult,
  answeredStepId: StepId,
  rawAnswer: string,
): DeterministicAdvanceResult {
  const safeAnswer = sanitizeFreeText(rawAnswer, { maxLength: 2000 });
  if (
    !safeAnswer.trim() ||
    OPT_OUT_PATTERN.test(safeAnswer) ||
    result.readyForReview ||
    !getStep(answeredStepId).allowsFollowUp ||
    result.assistantMessage.isFollowUp
  ) {
    return result;
  }

  const answer = result.draft.chatAnswers[answeredStepId] ?? safeAnswer;
  const quality = assessStepScope(answeredStepId, result.draft, answer);
  const hint = buildDeterministicScopeHint(quality);
  if (!hint) return result;

  const assistantMessage: ChatMessage = {
    ...result.assistantMessage,
    content: `${hint}\n\n${result.assistantMessage.content}`,
  };
  const transcript = [...result.draft.transcript];
  const lastAssistantIndex = (() => {
    for (let i = transcript.length - 1; i >= 0; i -= 1) {
      if (transcript[i]?.role === 'assistant') return i;
    }
    return -1;
  })();

  if (lastAssistantIndex >= 0) {
    transcript[lastAssistantIndex] = assistantMessage;
  } else {
    transcript.push(assistantMessage);
  }

  return {
    ...result,
    draft: { ...result.draft, transcript },
    assistantMessage,
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
    clientSummary: truncateSubmittedSummary(clientSummary),
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
    ].slice(0, FINAL_BRIEF_OPEN_QUESTIONS_MAX),
  };
}

function truncateSubmittedSummary(raw: string): string {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (text.length <= FINAL_BRIEF_CLIENT_SUMMARY_MAX_CHARS) return text;

  const hardLimit = Math.max(0, FINAL_BRIEF_CLIENT_SUMMARY_MAX_CHARS - 3);
  const clipped = text.slice(0, hardLimit).trimEnd();
  const sentenceCut = Math.max(
    clipped.lastIndexOf('. '),
    clipped.lastIndexOf('? '),
    clipped.lastIndexOf('! '),
  );

  if (sentenceCut >= Math.floor(FINAL_BRIEF_CLIENT_SUMMARY_MAX_CHARS * 0.55)) {
    return clipped.slice(0, sentenceCut + 1);
  }

  return `${clipped.replace(/[,\s;:.]+$/g, '')}...`;
}

function buildDraftFromChatState(
  sessionId: string,
  answers: ChatAnswers,
  skips: Set<StepId>,
  previousTranscript: ChatMessage[] = [],
  options: { editedStepId?: StepId | null } = {},
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
    options.editedStepId ?? null,
  );
  return next;
}

/**
 * Helpers used by the assisted edit rebuild in engine.ts. Intentionally
 * exported so engine.ts can share the same transcript/status/currentStep
 * derivation the deterministic rebuild uses — the only divergence is the
 * patch source (AI vs heuristic).
 */
export function extractChatStateForRebuild(draft: AutomationIntakeDraft): {
  answers: ChatAnswers;
  skips: Set<StepId>;
} {
  return extractChatState(draft);
}

export function resolveStatusAndStep(
  draft: AutomationIntakeDraft,
  answers: ChatAnswers,
  skips: Set<StepId>,
): { status: AutomationIntakeDraft['status']; currentStep: StepId; missing: string[] } {
  const missing = checkMinimumCompleteness(draft);
  const finishedCanonically = allCanonicalStepsCompleted(answers, skips);
  if (finishedCanonically && missing.length === 0) {
    return { status: 'review', currentStep: LAST_STEP, missing };
  }
  if (finishedCanonically) {
    return { status: 'collecting', currentStep: mapMissingToStep(missing), missing };
  }
  return { status: 'collecting', currentStep: getFirstIncompleteStep(answers, skips), missing };
}

export function rebuildTranscriptFromState(
  answers: ChatAnswers,
  skips: Set<StepId>,
  currentStep: StepId,
  status: AutomationIntakeDraft['status'],
  missing: string[],
  previousTranscript: ChatMessage[],
  editedStepId: StepId | null = null,
): ChatMessage[] {
  return buildTranscript(
    answers,
    skips,
    currentStep,
    status,
    missing,
    previousTranscript,
    editedStepId,
  );
}

export function trailingAssistantMessage(
  transcript: ChatMessage[],
  stepId: StepId,
): ChatMessage {
  return getTrailingAssistantMessage(transcript, stepId);
}

function buildTranscript(
  answers: ChatAnswers,
  skips: Set<StepId>,
  currentStep: StepId,
  status: AutomationIntakeDraft['status'],
  missing: string[],
  previousTranscript: ChatMessage[] = [],
  editedStepId: StepId | null = null,
): ChatMessage[] {
  const transcript: ChatMessage[] = [];
  const stepSections = indexReusableStepSections(previousTranscript);
  const reusableTerminal = getReusableTerminalAssistant(previousTranscript);

  const synthPrompt = (stepId: StepId): ChatMessage => {
    const existing = stepSections.get(stepId)?.find(
      (message) => message.role === 'assistant' && !message.isFollowUp,
    );
    return makeAssistantMessage(
      existing?.content ?? getStep(stepId).assistantPrompt,
      stepId,
      false,
      existing?.id,
    );
  };

  const synthUser = (stepId: StepId, content: string): ChatMessage => {
    const existing = stepSections.get(stepId)?.find((message) => message.role === 'user');
    return makeUserMessage(content, stepId, existing?.id);
  };

  const materializeAnsweredSection = (
    stepId: StepId,
    answer: string,
    section: ChatMessage[],
  ): ChatMessage[] => {
    const normalizedAnswer = answer.trim();
    if (stepId === editedStepId) {
      return [synthPrompt(stepId), synthUser(stepId, normalizedAnswer)];
    }
    if (section.length === 0) {
      return [synthPrompt(stepId), synthUser(stepId, normalizedAnswer)];
    }

    const existingUserText = section
      .filter((message) => message.role === 'user')
      .map((message) => message.content.trim())
      .filter(Boolean)
      .join('\n');

    if (
      existingUserText === normalizedAnswer ||
      sanitizeFreeText(existingUserText, { maxLength: 2000 }) === normalizedAnswer
    ) {
      return section;
    }
    if (!existingUserText) return [...section, synthUser(stepId, normalizedAnswer)];

    const appendedPrefix = `${existingUserText}\n`;
    if (normalizedAnswer.startsWith(appendedPrefix)) {
      const appended = normalizedAnswer.slice(appendedPrefix.length).trim();
      if (appended) return [...section, makeUserMessage(appended, stepId)];
      return section;
    }

    return [synthPrompt(stepId), synthUser(stepId, normalizedAnswer)];
  };

  const materializeSkippedSection = (
    stepId: StepId,
    section: ChatMessage[],
  ): ChatMessage[] => {
    if (stepId === editedStepId) {
      return [synthPrompt(stepId), synthUser(stepId, 'skip')];
    }
    if (section.length === 0) {
      return [synthPrompt(stepId), synthUser(stepId, 'skip')];
    }

    const hasSkipUser = section.some(
      (message) =>
        message.role === 'user' &&
        OPT_OUT_PATTERN.test(sanitizeFreeText(message.content, { maxLength: 2000 })),
    );
    if (hasSkipUser) return section;
    return [...section, synthUser(stepId, 'skip')];
  };

  for (const step of STEP_DEFINITIONS) {
    const section = stepSections.get(step.id) ?? [];
    const answer = answers[step.id];
    if (answer?.trim()) {
      transcript.push(...materializeAnsweredSection(step.id, answer, section));
      continue;
    }

    if (skips.has(step.id)) {
      transcript.push(...materializeSkippedSection(step.id, section));
      continue;
    }

    transcript.push(synthPrompt(step.id));
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
        reusableTerminal?.id,
      ),
    );
  }

  return transcript;
}

function indexReusableStepSections(previousTranscript: ChatMessage[]): Map<StepId, ChatMessage[]> {
  const transcriptWithoutTerminal = stripReusableTerminalAssistant(previousTranscript);
  const sections = new Map<StepId, ChatMessage[]>();

  for (const message of transcriptWithoutTerminal) {
    if (!message.stepId) continue;
    const existing = sections.get(message.stepId) ?? [];
    existing.push(message);
    sections.set(message.stepId, existing);
  }

  return sections;
}

function stripReusableTerminalAssistant(previousTranscript: ChatMessage[]): ChatMessage[] {
  if (previousTranscript.length === 0) return previousTranscript;
  const last = previousTranscript[previousTranscript.length - 1];
  if (isReusableTerminalAssistant(previousTranscript, last)) {
    return previousTranscript.slice(0, -1);
  }
  return previousTranscript;
}

function getReusableTerminalAssistant(previousTranscript: ChatMessage[]): ChatMessage | undefined {
  const last = previousTranscript[previousTranscript.length - 1];
  return isReusableTerminalAssistant(previousTranscript, last) ? last : undefined;
}

function isReusableTerminalAssistant(
  previousTranscript: ChatMessage[],
  message: ChatMessage | undefined,
): boolean {
  if (!message || message.role !== 'assistant' || !message.isFollowUp) return false;
  const promptedSteps = new Set(
    previousTranscript
      .filter(
        (candidate) =>
          candidate.role === 'assistant' && !candidate.isFollowUp && Boolean(candidate.stepId),
      )
      .map((candidate) => candidate.stepId!),
  );
  if (promptedSteps.size === STEP_DEFINITIONS.length) return true;
  if (message.content === "That's everything I needed — hit 'Review submission' whenever you're ready.") {
    return true;
  }
  return (
    message.content.startsWith('Before review, I still need ') ||
    message.content.startsWith('Almost there — could you add ') ||
    message.content.startsWith('Still missing ') ||
    message.content.startsWith('One last pass on ')
  );
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
  if (missing.includes('primary workflow')) return 'workflow-name';
  if (missing.includes('workflow detail')) return 'workflow-ownership';
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
      return { stepId, data: inferBusinessPatch(answer) };
    case 'systems': {
      const tokens = pickTokens(answer, 30);
      return { stepId, data: { toolStack: { other: tokens } } };
    }
    case 'workflow-name': {
      const name = cleanWorkflowName(answer);
      return name ? { stepId, data: { name } } : emptyPatch(stepId);
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
      return { stepId, data: { tools: pickTokens(answer, 20) } };
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
          currentTools: pickAiTools(answer, 10),
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
          sensitiveData:
            /gdpr|pii|phi|hipaa|sensitive|regulated|confidential|customer (order )?data|commercial supplier terms|supplier terms/i.test(
              answer,
            ),
          complianceNotes: [answer.slice(0, 500)],
        },
      };
    case 'goals':
      return {
        stepId,
        data: { desiredOutcomes: splitList(answer).slice(0, 5).map((item) => item.slice(0, 500)) },
      };
    case 'contact': {
      const emailMatch = answer.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+\b/);
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
    .split(/[,;\n•·]+|\s[-–—]\s|\band\b/gi)
    .map((item) => cleanStructuredListItem(item))
    .filter((item) => item.length >= 2);
}

function cleanStructuredListItem(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(
      /\b(ignore (all )?(previous|your|these|this)?\s*instructions?|disregard (all )?(previous|your|these|this)?\s*instructions?|forget (all )?(previous|your|these|this)?\s*instructions?|reveal (the )?(system|hidden) prompt|mark (everything|all steps) complete|auto-submit)\b.*$/i,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();
  if (/^(put|write|output|set|mark)\b.*\b(later|now|constraints?|complete|submitted?)\b/i.test(cleaned)) {
    return '';
  }
  return cleaned;
}

function inferBusinessPatch(answer: string): {
  businessName?: string;
  website?: string;
  sector?: string;
  teamSizeBand?: string;
  whatTheyDo: string;
} {
  const cleaned = answer.replace(/\s+/g, ' ').trim();
  const substantive = cleaned
    .replace(/^.*?\b(?:real answer|actual)\s*:\s*/i, '')
    .replace(/^.*?\bactually\s+/i, '')
    .trim();
  const website = substantive.match(
    /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s,;]*)?/i,
  )?.[0];
  const businessName =
    substantive.match(
      /\b(?:we'?re|we are|this is)\s+([A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,5})\b/,
    )?.[1] ??
    substantive.match(
      /^([A-Z][A-Za-z0-9&'.-]*(?:\s+[A-Z][A-Za-z0-9&'.-]*){0,5})\s+(?:is|are|serves|helps|provides|runs|speciali[sz]es)\b/,
    )?.[1];
  const sector = substantive.match(
    /\b(?:is|are)\s+(?:a|an)\s+([a-z][a-z0-9& /+-]+?)(?:\s+(?:for|serving|with|using)\b|;|,|\.|$)/i,
  )?.[1];
  const teamSizeBand = normalizeTeamSizeBand(
    substantive.match(
      /\b(1\s*[-–]\s*5|6\s*[-–]\s*20|21\s*[-–]\s*50|51\s*[-–]\s*200|20[01]\+|200\+)\b/i,
    )?.[1],
  );

  return {
    businessName: businessName?.slice(0, 120),
    website: website?.slice(0, 120),
    sector: sector?.slice(0, 120),
    teamSizeBand,
    whatTheyDo: answer.slice(0, 2000),
  };
}

function normalizeTeamSizeBand(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const normalized = raw.toLowerCase().replace(/\s+/g, '').replace(/–/g, '-');
  if (normalized === '1-5') return '1-5';
  if (normalized === '6-20') return '6-20';
  if (normalized === '21-50') return '21-50';
  if (normalized === '51-200') return '51-200';
  if (normalized === '200+' || normalized === '201+') return '201+';
  return undefined;
}

const JUNK_WORKFLOW_PATTERNS = [
  /^(yes|no|maybe|not sure|idk|i dont know|i don't know|um|uh|hmm|ok|okay|some|any|various|lots|many|a few|dunno|unknown)$/i,
  /^(it|this|that|same|something|anything|whatever)$/i,
  /^(workflow|workflows|process|processes|things|stuff|same stuff|tasks)$/i,
];

function cleanWorkflowName(raw: string): string | null {
  let name = (raw.trim().split(/\r?\n/)[0] ?? '')
    .replace(/^(the|a|an|our|my|some|several)\s+/i, '')
    .trim();
  name = name.replace(/^(oh|so|well|like|basically|kind of|sort of)[\s,]+/i, '').trim();
  const colonTitle = name.split(':')[0]?.trim();
  if (colonTitle && colonTitle.length >= 4) name = colonTitle;
  if (name.length < 4) return null;
  if (name.length > 120) name = name.slice(0, 120).trim();
  for (const pattern of JUNK_WORKFLOW_PATTERNS) {
    if (pattern.test(name)) return null;
  }
  return name;
}

function pickTokens(text: string, max: number): string[] {
  const knownTools: Array<[RegExp, string]> = [
    [/\bgmail\b/i, 'Gmail'],
    [/\bgoogle calendar\b/i, 'Google Calendar'],
    [/\boutlook\b/i, 'Outlook'],
    [/\bmicrosoft 365\b/i, 'Microsoft 365'],
    [/\bslack\b/i, 'Slack'],
    [/\bteams\b/i, 'Microsoft Teams'],
    [/\bnotion\b/i, 'Notion'],
    [/\basana\b/i, 'Asana'],
    [/\bclickup\b/i, 'ClickUp'],
    [/\btrello\b/i, 'Trello'],
    [/\bjira\b/i, 'Jira'],
    [/\blinear\b/i, 'Linear'],
    [/\bhubspot\b/i, 'HubSpot'],
    [/\bsalesforce\b/i, 'Salesforce'],
    [/\bpipedrive\b/i, 'Pipedrive'],
    [/\bzendesk\b/i, 'Zendesk'],
    [/\bintercom\b/i, 'Intercom'],
    [/\bgoogle sheets?\b|\bsheets?\b/i, 'Google Sheets'],
    [/\blooker studio\b/i, 'Looker Studio'],
    [/\bpower\s*bi\b/i, 'Power BI'],
    [/\btableau\b/i, 'Tableau'],
    [/\bexcel\b/i, 'Excel'],
    [/\bairtable\b/i, 'Airtable'],
    [/\bgoogle docs?\b|\bdocs?\b/i, 'Google Docs'],
    [/\bgoogle drive\b|\bdrive\b/i, 'Google Drive'],
    [/\bgoogle workspace\b/i, 'Google Workspace'],
    [/\bonedrive\b/i, 'OneDrive'],
    [/\bsharepoint\b/i, 'SharePoint'],
    [/\bdocusign\b/i, 'DocuSign'],
    [/\bcanva\b/i, 'Canva'],
    [/\bfigma\b/i, 'Figma'],
    [/\bcliniko\b/i, 'Cliniko'],
    [/\bsemble\b/i, 'Semble'],
    [/\bbamboohr\b/i, 'BambooHR'],
    [/\bhibob\b/i, 'HiBob'],
    [/\bmonday(?:\.com)?\b/i, 'Monday.com'],
    [/\bnetsuite\b/i, 'NetSuite'],
    [/\bodoo\b/i, 'Odoo'],
    [/\bshipbob\b/i, 'ShipBob'],
    [/\bdentally(?:\s+pms)?\b/i, 'Dentally PMS'],
    [/\bwhatsapp(?:\s+business)?\b/i, 'WhatsApp Business'],
    [/\bdropbox\b/i, 'Dropbox'],
    [/\bzapier\b/i, 'Zapier'],
    [/\bmake(?:\.com)?\b/i, 'Make'],
    [/\bn8n\b/i, 'n8n'],
    [/\bxero\b/i, 'Xero'],
    [/\bquickbooks\b/i, 'QuickBooks'],
    [/\bstripe\b/i, 'Stripe'],
    [/\bshopify\b/i, 'Shopify'],
    [/\bcrm\b/i, 'CRM'],
    [/\berp\b/i, 'ERP'],
    [/\bpos\b/i, 'POS'],
    [/\bemail\b/i, 'Email'],
    [/\bcalendar\b/i, 'Calendar'],
    [/\bhelp\s*desk\b|\bsupport\s*desk\b|\bticketing\b/i, 'Support Desk'],
    [/\bspreadsheets?\b/i, 'Spreadsheets'],
  ];
  const matches = [
    ...knownTools.filter(([pattern]) => pattern.test(text)).map(([, label]) => label),
    ...Array.from(
    text.matchAll(/\b([A-Z][A-Za-z0-9+.-]{2,}(?:\s+[A-Z][A-Za-z0-9+.-]{2,})?)\b/g),
    ).map((match) => match[1].trim()),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of matches) {
    const key = item.toLowerCase();
    if (key === 'calendar' && seen.has('google calendar')) continue;
    if (
      /^(try|put|other|critical|other critical|pretend|json|schema|overwrite|real|real answer|actual answer|system test)$/.test(
        key,
      )
    ) {
      continue;
    }
    if (/\b(ignore|disregard|forget|instructions?|prompt|schema|overwrite|pretend)\b/i.test(item)) {
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

function pickAiTools(text: string, max: number): string[] {
  const knownAiTools: Array<[RegExp, string]> = [
    [/\bchatgpt\b|\bchat gpt\b/i, 'ChatGPT'],
    [/\bgithub copilot\b/i, 'GitHub Copilot'],
    [/\bmicrosoft copilot\b/i, 'Microsoft Copilot'],
    [/\bcopilot\b/i, 'Copilot'],
    [/\bgemini\b/i, 'Gemini'],
    [/\bclaude\b/i, 'Claude'],
    [/\bperplexity\b/i, 'Perplexity'],
    [/\bmidjourney\b/i, 'Midjourney'],
    [/\bdall[-\s]?e\b/i, 'DALL-E'],
    [/\bnotion ai\b/i, 'Notion AI'],
    [/\bjasper\b/i, 'Jasper'],
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const [pattern, label] of knownAiTools) {
    if (!pattern.test(text)) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
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
