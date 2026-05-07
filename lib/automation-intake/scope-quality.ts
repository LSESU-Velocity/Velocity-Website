import {
  TOOL_STACK_CATEGORIES,
  type AutomationIntakeDraft,
  type StepId,
} from './schemas.js';

export type ScopeConfidence = 'low' | 'medium' | 'high';

export interface ScopeGap {
  id: string;
  label: string;
  prompt: string;
  critical: boolean;
}

export interface StepScopeQuality {
  stepId: StepId;
  score: number;
  maxScore: number;
  confidence: ScopeConfidence;
  captured: string[];
  missing: ScopeGap[];
  sufficient: boolean;
}

function hasText(value: string | undefined | null, minLength = 3): boolean {
  return Boolean(value?.trim() && value.trim().length >= minLength);
}

function addCaptured(items: string[], condition: boolean, label: string): void {
  if (condition) items.push(label);
}

function makeGap(id: string, label: string, prompt: string, critical = true): ScopeGap {
  return { id, label, prompt, critical };
}

function claimsNone(answer: string): boolean {
  return /^(no|none|nope|nothing( in particular)?|not really|n\/a|na)\b/i.test(answer.trim());
}

function mentionsAudience(answer: string): boolean {
  return /\b(for|serve|serves|serving|clients?|customers?|users?|teams?|students?|schools?|patients?|SMEs?|businesses?|founders?|operators?|managers?)\b/i.test(
    answer,
  );
}

function mentionsFrequency(answer: string): boolean {
  return /\b(daily|weekly|monthly|quarterly|yearly|annually|every\s+\w+|each\s+\w+|\d+\s*(times|x)\s+(a|per)\s+(day|week|month|quarter|year))\b/i.test(
    answer,
  );
}

function mentionsTool(answer: string): boolean {
  return /\b(gmail|outlook|slack|teams|notion|asana|trello|jira|linear|hubspot|salesforce|pipedrive|zendesk|intercom|sheets?|excel|airtable|docs?|drive|dropbox|sharepoint|zapier|make\.com|n8n|xero|quickbooks|stripe|shopify)\b/i.test(
    answer,
  );
}

function mentionsWorkflowStep(answer: string): boolean {
  return /\b(first|then|next|after|before|finally|send|copy|paste|check|approve|review|update|create|export|import|upload|download|email|notify)\b/i.test(
    answer,
  );
}

function mentionsPain(answer: string): boolean {
  return /\b(slow|manual|copy|paste|duplicate|error|mistake|delay|chase|waiting|bottleneck|rework|frustrat|tedious|time-consuming|takes?\s+\d+)\b/i.test(
    answer,
  );
}

function wordCount(text: string | undefined | null): number {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasExplicitSmallStack(answer: string): boolean {
  return /\b(just|only|mainly|mostly|small|minimal|simple|basic|nothing else|that'?s it|that is it)\b/i.test(
    answer,
  );
}

function mentionsAiUseCase(answer: string): boolean {
  return /\b(for|to|helps?|draft|write|summari[sz]e|analy[sz]e|generate|translate|research|customer|support|emails?|reports?|content|meeting|notes?|coding|classify|tag|triage)\b/i.test(
    answer,
  );
}

function ownerLooksVague(answer: string, owner: string | undefined | null): boolean {
  const text = `${owner ?? ''} ${answer}`.trim();
  return /\b(someone|somebody|whoever|not sure|unknown|tbd|some manager|a manager|one of the managers|someone on the team|somebody on the team|the team)\b/i.test(
    text,
  );
}

function totalToolCount(draft: AutomationIntakeDraft): number {
  return TOOL_STACK_CATEGORIES.reduce(
    (count, category) => count + (draft.business.toolStack[category]?.length ?? 0),
    0,
  );
}

function naturalList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function finalize(
  stepId: StepId,
  captured: string[],
  missing: ScopeGap[],
  sufficientOverride?: boolean,
): StepScopeQuality {
  const criticalMissing = missing.filter((gap) => gap.critical);
  const maxScore = captured.length + missing.length;
  const score = captured.length;
  const sufficient = sufficientOverride ?? criticalMissing.length === 0;
  const ratio = maxScore === 0 ? 1 : score / maxScore;
  const confidence: ScopeConfidence =
    sufficient && ratio >= 0.85 ? 'high' : ratio >= 0.5 ? 'medium' : 'low';

  return {
    stepId,
    score,
    maxScore,
    confidence,
    captured,
    missing,
    sufficient,
  };
}

export function assessStepScope(
  stepId: StepId,
  draft: AutomationIntakeDraft,
  latestAnswer = '',
): StepScopeQuality {
  const answer = latestAnswer.trim();
  const captured: string[] = [];
  const missing: ScopeGap[] = [];
  const workflow = draft.workflows[0];

  switch (stepId) {
    case 'business': {
      const hasBusinessDescription = hasText(draft.business.whatTheyDo, 8);
      const hasAudience = hasText(draft.business.whoTheyServe, 3) || mentionsAudience(answer);
      const hasIdentity =
        hasText(draft.business.businessName) ||
        hasText(draft.business.website) ||
        hasText(draft.business.sector);

      addCaptured(captured, hasBusinessDescription, 'what the business does');
      addCaptured(captured, hasAudience, 'who it serves');
      addCaptured(captured, hasIdentity, 'business name, website, or sector');
      if (!hasBusinessDescription) {
        missing.push(
          makeGap(
            'business-description',
            'what the business does',
            'Ask what the business does in one plain sentence.',
          ),
        );
      }
      if (!hasAudience) {
        missing.push(
          makeGap(
            'audience',
            'who it serves',
            'Ask who the main customers, users, or internal team are.',
          ),
        );
      }
      if (!hasIdentity) {
        missing.push(
          makeGap(
            'identity',
            'business name, website, or sector',
            'Ask for the company name, website, or sector if they know it.',
            false,
          ),
        );
      }
      return finalize(stepId, captured, missing);
    }

    case 'systems': {
      const count = totalToolCount(draft);
      const hasTools = count > 0 || mentionsTool(answer);
      const hasEnoughTools = count >= 3 || (count >= 1 && hasExplicitSmallStack(answer));
      addCaptured(captured, hasTools, 'at least one core tool');
      addCaptured(captured, hasEnoughTools, 'enough of the operating stack');
      if (!hasTools) {
        missing.push(
          makeGap(
            'tools',
            'core tools',
            'Ask which tools the team relies on day to day.',
          ),
        );
      } else if (!hasEnoughTools) {
        missing.push(
          makeGap(
            'tool-coverage',
            'the other important systems',
            'Ask whether the workflow also touches email, documents, CRM, reporting, or file storage.',
            false,
          ),
        );
      }
      return finalize(stepId, captured, missing, hasTools && hasEnoughTools);
    }

    case 'workflow-name': {
      const hasName = hasText(workflow?.name, 4);
      addCaptured(captured, hasName, 'workflow name');
      if (!hasName) {
        missing.push(
          makeGap(
            'workflow-name',
            'the recurring workflow to scope',
            'Ask for one recurring workflow they want to improve first.',
          ),
        );
      }
      return finalize(stepId, captured, missing);
    }

    case 'workflow-ownership': {
      const ownerIsVague = ownerLooksVague(answer, workflow?.owner);
      const hasOwner =
        (hasText(workflow?.owner) ||
          /\b(owner|owns|handled by|run by|ops|operations|admin|manager|team|assistant|coordinator)\b/i.test(
            answer,
          )) &&
        !ownerIsVague;
      const hasCadence = hasText(workflow?.frequency) || mentionsFrequency(answer);
      addCaptured(captured, hasOwner, 'owner');
      addCaptured(captured, hasCadence, 'cadence');
      if (!hasOwner) {
        missing.push(
          makeGap('owner', 'who owns it', 'Ask who owns or runs the workflow day to day.'),
        );
      }
      if (!hasCadence) {
        missing.push(
          makeGap('cadence', 'how often it runs', 'Ask roughly how often the workflow happens.'),
        );
      }
      return finalize(stepId, captured, missing);
    }

    case 'workflow-tools': {
      const toolCount = workflow?.tools?.length ?? 0;
      const hasTools = toolCount > 0 || mentionsTool(answer);
      const enoughTools =
        toolCount >= 2 ||
        (hasTools && /\b(everything|all of (it|this)|entirely)\s+(in|inside|within)\b/i.test(answer));
      addCaptured(captured, hasTools, 'workflow tools');
      addCaptured(captured, enoughTools, 'tool handoff coverage');
      if (!hasTools) {
        missing.push(
          makeGap(
            'workflow-tools',
            'apps the workflow touches',
            'Ask which apps or systems the workflow touches from start to finish.',
          ),
        );
      } else if (!enoughTools) {
        missing.push(
          makeGap(
            'handoffs',
            'where information moves between tools',
            'Ask whether data moves between this tool and any other system.',
            false,
          ),
        );
      }
      return finalize(stepId, captured, missing, hasTools && enoughTools);
    }

    case 'workflow-steps': {
      const stepCount = workflow?.currentSteps?.length ?? 0;
      const hasSteps = stepCount >= 2 || mentionsWorkflowStep(answer);
      const hasSequence = stepCount >= 3;
      addCaptured(captured, hasSteps, 'current workflow steps');
      addCaptured(captured, hasSequence, 'sequence of at least three steps');
      if (!hasSteps) {
        missing.push(
          makeGap(
            'steps',
            'what happens first, next, and last',
            'Ask for a short walkthrough of the first few steps.',
          ),
        );
      } else if (!hasSequence) {
        missing.push(
          makeGap(
            'sequence',
            'a clearer step-by-step sequence',
            'Ask what happens first, next, and last in the workflow.',
            false,
          ),
        );
      }
      return finalize(stepId, captured, missing, hasSteps && hasSequence);
    }

    case 'pain-points': {
      const hasPain = (workflow?.painPoints?.length ?? 0) > 0 || mentionsPain(answer);
      const hasPainDetail =
        hasPain &&
        (wordCount(answer) >= 4 ||
          Boolean(workflow?.painPoints?.some((point) => wordCount(point) >= 4)));
      addCaptured(captured, hasPain, 'pain point or manual handoff');
      addCaptured(captured, hasPainDetail, 'where the pain shows up');
      if (!hasPain) {
        missing.push(
          makeGap(
            'pain',
            'the bottleneck or manual handoff',
            'Ask where the workflow is slow, error-prone, or repetitive.',
          ),
        );
      } else if (!hasPainDetail) {
        missing.push(
          makeGap(
            'pain-detail',
            'where the pain shows up',
            'Ask where that pain appears in the workflow.',
            false,
          ),
        );
      }
      return finalize(stepId, captured, missing, hasPain && hasPainDetail);
    }

    case 'ai-usage': {
      const noCurrentAi = claimsNone(answer) || draft.aiUsage.maturity === 'none';
      const hasAiTools = (draft.aiUsage.currentTools?.length ?? 0) > 0;
      const hasUseCases =
        (draft.aiUsage.currentUseCases?.length ?? 0) > 0 &&
        !noCurrentAi &&
        mentionsAiUseCase(answer);
      const hasUsage =
        hasAiTools ||
        hasUseCases ||
        Boolean(draft.aiUsage.maturity) ||
        noCurrentAi;
      addCaptured(captured, hasUsage, 'current AI usage or no current usage');
      addCaptured(captured, noCurrentAi || hasUseCases, 'where AI helps today');
      if (!hasUsage) {
        missing.push(
          makeGap(
            'ai-usage',
            'current AI usage',
            'Ask whether they use AI today and where it has genuinely helped.',
          ),
        );
      } else if (hasAiTools && !hasUseCases) {
        missing.push(
          makeGap(
            'ai-use-case',
            'where AI helps today',
            'Ask where those AI tools actually help.',
            false,
          ),
        );
      }
      return finalize(stepId, captured, missing, hasUsage && (noCurrentAi || hasUseCases));
    }

    case 'ai-non-use': {
      const explicitNoGap = claimsNone(answer);
      const hasArea = (draft.aiUsage.nonUseAreas?.length ?? 0) > 0;
      const hasBlocker = (draft.aiUsage.blockers?.length ?? 0) > 0;
      const hasGapOrBlocker = hasArea || hasBlocker || explicitNoGap;
      addCaptured(captured, hasArea || explicitNoGap, 'AI opportunity or no obvious gap');
      addCaptured(captured, hasBlocker || explicitNoGap, 'blocker');
      if (!hasGapOrBlocker) {
        missing.push(
          makeGap(
            'ai-blocker',
            'AI opportunity or blocker',
            'Ask where AI could help and what is blocking adoption.',
          ),
        );
      } else if (!explicitNoGap && !hasArea) {
        missing.push(
          makeGap(
            'ai-area',
            'where AI could help',
            'Ask where AI could help if the blocker were removed.',
          ),
        );
      } else if (!explicitNoGap && !hasBlocker) {
        missing.push(
          makeGap(
            'ai-blocker',
            'what is blocking adoption',
            'Ask what is blocking AI adoption.',
          ),
        );
      }
      return finalize(stepId, captured, missing, explicitNoGap || (hasArea && hasBlocker));
    }

    case 'constraints': {
      const explicitNoConstraints = claimsNone(answer);
      const hasConstraintsSignal =
        typeof draft.constraints.sensitiveData === 'boolean' ||
        (draft.constraints.complianceNotes?.length ?? 0) > 0 ||
        (draft.constraints.approvalRequirements?.length ?? 0) > 0 ||
        (draft.constraints.integrationLimits?.length ?? 0) > 0 ||
        explicitNoConstraints;
      const hasConstraintDetail =
        explicitNoConstraints ||
        wordCount(answer) >= 4 ||
        hasText(draft.constraints.sensitiveDataNotes) ||
        (draft.constraints.approvalRequirements?.length ?? 0) > 0 ||
        (draft.constraints.integrationLimits?.length ?? 0) > 0;
      addCaptured(captured, hasConstraintsSignal, 'constraints or explicit no constraints');
      addCaptured(captured, hasConstraintDetail, 'constraint detail');
      if (!hasConstraintsSignal) {
        missing.push(
          makeGap(
            'constraints',
            'constraints or explicit no constraints',
            'Ask whether there are sensitive data, compliance, approval, or integration limits.',
          ),
        );
      } else if (!hasConstraintDetail) {
        missing.push(
          makeGap(
            'constraint-detail',
            'what the constraint affects',
            'Ask what the constraint affects in the workflow.',
            false,
          ),
        );
      }
      return finalize(stepId, captured, missing, hasConstraintsSignal && hasConstraintDetail);
    }

    case 'goals': {
      const hasOutcome =
        (draft.goals.desiredOutcomes?.length ?? 0) > 0 ||
        hasText(draft.goals.preferredProjectShape) ||
        /\b(save|reduce|faster|less|more|improve|free up|hours?|time|errors?|cost|revenue|response|turnaround)\b/i.test(answer);
      const hasMeasure = (draft.goals.successMetrics?.length ?? 0) > 0 || hasText(draft.goals.timeline);
      addCaptured(captured, hasOutcome, 'desired outcome');
      addCaptured(captured, hasMeasure, 'metric or timeline');
      if (!hasOutcome) {
        missing.push(
          makeGap(
            'outcome',
            'desired outcome',
            'Ask what would change for the team if the automation worked.',
          ),
        );
      }
      if (!hasMeasure) {
        missing.push(
          makeGap(
            'measure',
            'metric or timeline',
            'Ask how they would measure success or when they want to see progress.',
            false,
          ),
        );
      }
      return finalize(stepId, captured, missing, hasOutcome && hasMeasure);
    }

    case 'contact':
      return finalize(stepId, ['contact handled by required-field validation'], [], true);
  }
}

export function formatScopeQualityForPrompt(quality: StepScopeQuality): string {
  if (quality.missing.length === 0) {
    return `DETERMINISTIC SCOPE CHECK: The current step appears scoped. You may still ask one follow-up if the user's latest answer is vague, ambiguous, or would be risky to brief from.`;
  }

  const missing = quality.missing
    .slice(0, 4)
    .map((gap) => `- ${gap.label}: ${gap.prompt}`)
    .join('\n');

  return `DETERMINISTIC SCOPE CHECK:
- Confidence: ${quality.confidence}
- Captured: ${quality.captured.length ? quality.captured.join(', ') : 'nothing reliable yet'}
- Legitimate missing details:
${missing}

If you emit followUpQuestion, ask about one of the legitimate missing details above. If the user's answer already contains that detail and is clear enough to brief from, extract it and leave followUpQuestion empty.`;
}

export function buildDeterministicFollowUpQuestion(quality: StepScopeQuality): string | null {
  const critical = quality.missing.filter((gap) => gap.critical);
  const gaps = critical.length ? critical : quality.missing;
  if (gaps.length === 0) return null;
  const missingIds = new Set(gaps.map((gap) => gap.id));

  switch (quality.stepId) {
    case 'business': {
      const needsDescription = missingIds.has('business-description');
      const needsAudience = missingIds.has('audience');
      const needsIdentity = missingIds.has('identity');
      if (needsDescription && !needsAudience) {
        return 'What does the business do in one plain sentence?';
      }
      if (needsAudience && !needsDescription) {
        return 'Who does the business mainly serve?';
      }
      if (needsIdentity && !needsDescription && !needsAudience) {
        return 'What is the company name, website, or sector if you can share it?';
      }
      return 'Who does the business mainly serve, and what problem does it solve for them?';
    }
    case 'systems':
      if (missingIds.has('tool-coverage')) {
        return 'Any other tools that matter, like docs, CRM, reporting, or file storage?';
      }
      return 'Which core tools does the team rely on day to day?';
    case 'workflow-name':
      return 'What recurring workflow should we scope first?';
    case 'workflow-ownership': {
      const needsOwner = missingIds.has('owner');
      const needsCadence = missingIds.has('cadence');
      if (needsCadence && !needsOwner) {
        return 'Roughly how often does this workflow happen?';
      }
      if (needsOwner && !needsCadence) {
        return 'Who owns or runs this workflow day to day?';
      }
      return 'Who owns this day to day, and how often does it run?';
    }
    case 'workflow-tools':
      if (missingIds.has('handoffs')) {
        return 'Does data move between that tool and any other system?';
      }
      return 'Which apps does this workflow touch from start to finish?';
    case 'workflow-steps':
      if (missingIds.has('sequence')) {
        return 'What happens first, next, and last in the workflow?';
      }
      return 'What are the first three steps in the workflow today?';
    case 'pain-points':
      if (missingIds.has('pain-detail')) {
        return 'Where does that pain show up in the workflow?';
      }
      return 'Where does this workflow slow down, create errors, or require copy-paste?';
    case 'ai-usage':
      if (missingIds.has('ai-use-case')) {
        return 'Where do those AI tools actually help today?';
      }
      return 'Which AI tools are used today, and where have they actually helped?';
    case 'ai-non-use':
      if (missingIds.has('ai-area')) {
        return 'Where could AI help if the blocker were removed?';
      }
      if (missingIds.has('ai-blocker')) {
        return 'What is blocking AI adoption there?';
      }
      return 'Where could AI help, and what is blocking adoption?';
    case 'constraints':
      if (missingIds.has('constraint-detail')) {
        return 'What does that constraint affect in the workflow?';
      }
      return 'Are there sensitive data, compliance, approval, or integration limits to know about?';
    case 'goals':
      if (missingIds.has('measure') && !missingIds.has('outcome')) {
        return 'How would you measure success, or when would you want progress by?';
      }
      return 'What outcome would make this worth doing, and how would you measure it?';
    case 'contact':
      return null;
  }
}

export function buildDeterministicScopeHint(quality: StepScopeQuality): string | null {
  if (quality.sufficient || quality.missing.length === 0) return null;
  const gaps = quality.missing
    .filter((gap) => gap.critical)
    .slice(0, 2)
    .map((gap) => gap.label);
  if (gaps.length === 0) return null;
  return `For stronger scoping, add ${naturalList(gaps)} when you can.`;
}
