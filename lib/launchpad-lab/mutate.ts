import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { createModel, detectProvider, getDefaultModel, structuredOutputOptions } from './model.js';
import { classifyProviderError, getErrorMessage } from './errors.js';
import { buildDirectionalMarketSizing, buildFallbackCouncilJudge } from './lab.js';
import {
  type ArtifactPromptContext,
  buildPitchDeckHtmlPrompt,
  buildWaitlistHtmlPrompt,
} from './prompts.js';
import {
  AnalystMemoSchema,
  CouncilJudgeSchema,
  CustomerSegmentSchema,
  DashboardDTOSchema,
  DistributionChannelSchema,
  IdeaIntakeSchema,
  LabPhaseSchema,
  LabSummarySchema,
  MarketGapSchema,
  MarketSizingPointSchema,
  MonetizationSchema,
  PromptChainStepSchema,
  WidgetTargetSchema,
  type DashboardDTO,
  type LabPhase,
  type WidgetTarget,
} from './schemas.js';

const ValidationMutationSchema = z.object({
  marketSizing: z.array(MarketSizingPointSchema).length(3).optional(),
  marketGap: MarketGapSchema.optional(),
  summary: LabSummarySchema.optional(),
  bull: AnalystMemoSchema.optional().nullable(),
  bear: AnalystMemoSchema.optional().nullable(),
  judge: CouncilJudgeSchema.optional().nullable(),
  rationale: z.string(),
});

const StrategyMutationSchema = z.object({
  monetization: z.array(MonetizationSchema).min(3).optional(),
  customerSegments: z.array(CustomerSegmentSchema).min(3).optional(),
  distributionChannels: z.array(DistributionChannelSchema).min(5).optional(),
  summary: LabSummarySchema.optional(),
  rationale: z.string(),
});

const PromptChainMutationSchema = z.object({
  promptChain: z.array(PromptChainStepSchema).min(3).max(3),
  rationale: z.string(),
});

const phaseTargets: Record<LabPhase, WidgetTarget[]> = {
  validation: ['validation', 'marketSizing', 'marketPosition'],
  strategy: ['strategy', 'monetization', 'customerSegments', 'distributionChannels'],
  execution: ['waitlist', 'pitchDeck', 'promptChain'],
};

export interface WidgetMutationOptions {
  apiKey: string;
  idea: string;
  analysis: DashboardDTO;
  phaseId: LabPhase;
  targetId: WidgetTarget;
  instruction: string;
}

export interface WidgetMutationResult {
  success: true;
  data: DashboardDTO;
  summary: string;
  phaseId: LabPhase;
  targetId: WidgetTarget;
}

export interface WidgetMutationError {
  success: false;
  error: string;
  statusCode: number;
  details?: string;
}

export type WidgetMutationOutcome = WidgetMutationResult | WidgetMutationError;

function sanitizeHtmlDocument(rawText: string): string | undefined {
  let html = rawText.trim();

  if (!html) {
    return undefined;
  }

  html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  const lower = html.toLowerCase();
  const doctypeIndex = lower.indexOf('<!doctype');
  const htmlIndex = lower.indexOf('<html');
  const startIndex = doctypeIndex >= 0 ? doctypeIndex : htmlIndex;

  if (startIndex > 0) {
    html = html.slice(startIndex).trim();
  }

  return html.includes('<html') ? html : undefined;
}

function extractTextContent(result: unknown): string {
  if (typeof result === 'string') {
    return result;
  }

  if (result && typeof result === 'object' && 'content' in result) {
    const content = (result as { content: unknown }).content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }

          if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
            return part.text;
          }

          return '';
        })
        .filter(Boolean)
        .join('\n');
    }
  }

  return '';
}

function trimForPrompt(value: string | undefined, maxLength: number): string {
  if (!value) {
    return '';
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n...`;
}

function ensureLabState(idea: string, analysis: DashboardDTO): NonNullable<DashboardDTO['lab']> {
  const targetUser = analysis.lab?.intake?.targetUser || analysis.customerSegments[0]?.segment || 'potential users';

  return {
    intake: analysis.lab?.intake || {
      idea,
      domain: 'general',
      ideaType: analysis.visuals.appInterface || 'startup product',
      targetUser,
      coreProblem: analysis.validation.industryInsights.keyInsights[0] || 'Users need a better workflow.',
    },
    council: {
      bull: analysis.lab?.council?.bull || null,
      bear: analysis.lab?.council?.bear || null,
      judge: analysis.lab?.council?.judge || buildFallbackCouncilJudge({
        bull: analysis.lab?.council?.bull || null,
        bear: analysis.lab?.council?.bear || null,
        fallbackRecommendation: analysis.lab?.summary?.recommendation || analysis.validation.industryInsights.whatToTestFirst[0],
      }),
    },
    summary: analysis.lab?.summary || {
      recommendation: `Refine ${analysis.identity.name} around the strongest wedge before broadening.`,
      confidenceScore: 64,
      confidenceLabel: 'medium',
      openRisks: analysis.validation.industryInsights.risks.slice(0, 3),
      nextMoves: analysis.validation.industryInsights.whatToTestFirst.slice(0, 3),
    },
    marketSizing: analysis.lab?.marketSizing || buildDirectionalMarketSizing({
      distributionChannels: analysis.distributionChannels,
      customerSegmentCount: analysis.customerSegments.length,
      targetUser,
    }),
  };
}

function createArtifactContextFromDashboard(idea: string, analysis: DashboardDTO): ArtifactPromptContext {
  return {
    idea,
    identity: analysis.identity,
    interface: analysis.visuals.appInterface,
    monetization: analysis.monetization,
    customerSegments: analysis.customerSegments,
    market: analysis.validation.industryInsights,
    distributionChannels: analysis.distributionChannels,
    marketGap: analysis.validation.marketGap.yourGap,
  };
}

function nullCitationArray(length: number): Array<null> {
  return Array.from({ length }, () => null);
}

async function runStructuredMutation<TSchema extends z.ZodTypeAny>({
  apiKey,
  schema,
  name,
  system,
  user,
}: {
  apiKey: string;
  schema: TSchema;
  name: string;
  system: string;
  user: string;
}): Promise<z.infer<TSchema>> {
  const model = createModel({
    apiKey,
    model: getDefaultModel(detectProvider(apiKey)),
    temperature: 0.35,
    maxOutputTokens: 8192,
  });
  const structured = model.withStructuredOutput(schema, structuredOutputOptions(apiKey, name));

  return structured.invoke([
    new SystemMessage(system),
    new HumanMessage(user),
  ]);
}

async function mutateValidation(opts: WidgetMutationOptions): Promise<WidgetMutationResult> {
  const currentLab = ensureLabState(opts.idea, opts.analysis);
  const targetLabel =
    opts.targetId === 'marketSizing'
      ? 'market sizing only'
      : opts.targetId === 'marketPosition'
        ? 'market position only'
        : 'the full validation phase';

  const mutation = await runStructuredMutation({
    apiKey: opts.apiKey,
    schema: ValidationMutationSchema,
    name: 'validation_widget_mutation',
    system: `You update the validation phase of a startup analysis after a founder changes an assumption.
Only revise the requested scope and keep the startup identity intact.
If the founder asks about pricing or willingness to pay, adjust TAM/SAM/SOM realistically rather than treating them as fixed.
Return concise, internally consistent data.`,
    user: `FOUNDER REQUEST:
${opts.instruction}

UPDATE SCOPE:
${targetLabel}

CURRENT VALIDATION SNAPSHOT:
${JSON.stringify({
  identity: opts.analysis.identity,
  marketSizing: currentLab.marketSizing,
  marketGap: opts.analysis.validation.marketGap,
  council: currentLab.council,
  summary: currentLab.summary,
}, null, 2)}

Rules:
- For marketSizing, return all 3 points with coherent value and ratio fields.
- For marketPosition, use marketGap only.
- Only include bull/bear/judge/summary changes when they materially shift because of the founder request.
- Do not rewrite strategy or execution widgets.`,
  });

  const nextData = DashboardDTOSchema.parse({
    ...opts.analysis,
    validation: {
      ...opts.analysis.validation,
      marketGap: mutation.marketGap || opts.analysis.validation.marketGap,
    },
    citations: {
      ...opts.analysis.citations,
      summary: mutation.summary ? {
        recommendation: undefined,
        openRisks: nullCitationArray((mutation.summary || currentLab.summary).openRisks.length),
        nextMoves: nullCitationArray((mutation.summary || currentLab.summary).nextMoves.length),
      } : opts.analysis.citations?.summary,
      council: mutation.judge ? {
        finalTake: undefined,
        bullCase: nullCitationArray((mutation.judge || currentLab.council.judge!).bullCase.length),
        bearCase: nullCitationArray((mutation.judge || currentLab.council.judge!).bearCase.length),
        decidingFactors: nullCitationArray((mutation.judge || currentLab.council.judge!).decidingFactors.length),
      } : opts.analysis.citations?.council,
      validation: {
        ...opts.analysis.citations?.validation,
        marketGap: mutation.marketGap ? undefined : opts.analysis.citations?.validation?.marketGap,
        marketSizing: mutation.marketSizing ? nullCitationArray(mutation.marketSizing.length) : opts.analysis.citations?.validation?.marketSizing,
      },
    },
    lab: {
      ...currentLab,
      council: {
        bull: mutation.bull ?? currentLab.council.bull,
        bear: mutation.bear ?? currentLab.council.bear,
        judge: mutation.judge ?? buildFallbackCouncilJudge({
          bull: mutation.bull ?? currentLab.council.bull,
          bear: mutation.bear ?? currentLab.council.bear,
          fallbackRecommendation: (mutation.summary || currentLab.summary).recommendation,
        }),
      },
      summary: mutation.summary || currentLab.summary,
      marketSizing: mutation.marketSizing || currentLab.marketSizing,
    },
  });

  return {
    success: true,
    data: nextData,
    summary: mutation.rationale,
    phaseId: opts.phaseId,
    targetId: opts.targetId,
  };
}

async function mutateStrategy(opts: WidgetMutationOptions): Promise<WidgetMutationResult> {
  const currentLab = ensureLabState(opts.idea, opts.analysis);
  const targetLabel =
    opts.targetId === 'monetization'
      ? 'monetization only'
      : opts.targetId === 'customerSegments'
        ? 'customer segments only'
        : opts.targetId === 'distributionChannels'
          ? 'distribution channels only'
          : 'the full strategy phase';

  const mutation = await runStructuredMutation({
    apiKey: opts.apiKey,
    schema: StrategyMutationSchema,
    name: 'strategy_widget_mutation',
    system: `You update strategy widgets for a startup analysis after a founder changes the go-to-market or pricing assumptions.
Keep the startup identity stable and only revise the requested strategy scope.
When pricing increases, prefer narrower high-intent segments and more plausible channels instead of broad wishful thinking.`,
    user: `FOUNDER REQUEST:
${opts.instruction}

UPDATE SCOPE:
${targetLabel}

CURRENT STRATEGY SNAPSHOT:
${JSON.stringify({
  identity: opts.analysis.identity,
  monetization: opts.analysis.monetization,
  customerSegments: opts.analysis.customerSegments,
  distributionChannels: opts.analysis.distributionChannels,
  summary: currentLab.summary,
}, null, 2)}

Rules:
- Keep monetization/customerSegments/distributionChannels internally consistent with each other.
- Only revise the fields needed for the requested scope.
- Do not rewrite waitlist, pitch deck, or prompt chain here.`,
  });

  const nextData = DashboardDTOSchema.parse({
    ...opts.analysis,
    monetization: mutation.monetization || opts.analysis.monetization,
    customerSegments: mutation.customerSegments || opts.analysis.customerSegments,
    distributionChannels: mutation.distributionChannels || opts.analysis.distributionChannels,
    citations: {
      ...opts.analysis.citations,
      summary: mutation.summary ? {
        recommendation: undefined,
        openRisks: nullCitationArray((mutation.summary || currentLab.summary).openRisks.length),
        nextMoves: nullCitationArray((mutation.summary || currentLab.summary).nextMoves.length),
      } : opts.analysis.citations?.summary,
      strategy: {
        ...opts.analysis.citations?.strategy,
        distributionChannels: mutation.distributionChannels
          ? nullCitationArray((mutation.distributionChannels || opts.analysis.distributionChannels).length)
          : opts.analysis.citations?.strategy?.distributionChannels,
      },
    },
    lab: {
      ...currentLab,
      summary: mutation.summary || currentLab.summary,
    },
  });

  return {
    success: true,
    data: nextData,
    summary: mutation.rationale,
    phaseId: opts.phaseId,
    targetId: opts.targetId,
  };
}

async function mutatePromptChain(opts: WidgetMutationOptions): Promise<WidgetMutationResult> {
  const mutation = await runStructuredMutation({
    apiKey: opts.apiKey,
    schema: PromptChainMutationSchema,
    name: 'prompt_chain_mutation',
    system: `You update a 3-step AI coding prompt chain for a startup.
Keep the same product idea, preserve a progressive step-by-step build order, and make the prompts directly pasteable.
Only rewrite the prompt chain to reflect the founder's change request.`,
    user: `FOUNDER REQUEST:
${opts.instruction}

CURRENT PRODUCT SNAPSHOT:
${JSON.stringify({
  identity: opts.analysis.identity,
  monetization: opts.analysis.monetization,
  customerSegments: opts.analysis.customerSegments,
  promptChain: opts.analysis.promptChain,
}, null, 2)}`,
  });

  return {
    success: true,
    data: DashboardDTOSchema.parse({
      ...opts.analysis,
      promptChain: mutation.promptChain,
    }),
    summary: mutation.rationale,
    phaseId: opts.phaseId,
    targetId: opts.targetId,
  };
}

async function mutateArtifact(
  opts: WidgetMutationOptions,
  kind: 'waitlist' | 'pitchDeck',
): Promise<WidgetMutationResult> {
  const context = createArtifactContextFromDashboard(opts.idea, opts.analysis);
  const prompt = kind === 'waitlist' ? buildWaitlistHtmlPrompt(context) : buildPitchDeckHtmlPrompt(context);
  const existingHtml = kind === 'waitlist' ? opts.analysis.artifacts?.waitlistHtml : opts.analysis.artifacts?.pitchDeckHtml;
  const model = createModel({
    apiKey: opts.apiKey,
    model: getDefaultModel(detectProvider(opts.apiKey)),
    temperature: 0.55,
    maxOutputTokens: 24576,
  });

  const response = await model.invoke([
    new SystemMessage(`${prompt.system}

Apply the founder's change request while preserving the startup's positioning and the existing asset's intent.
Return a single complete HTML document and nothing else.`),
    new HumanMessage(`${prompt.user}

FOUNDER CHANGE REQUEST:
${opts.instruction}

${existingHtml ? `CURRENT HTML TO EVOLVE:
${trimForPrompt(existingHtml, kind === 'waitlist' ? 12000 : 16000)}` : 'There is no existing HTML yet. Generate a fresh asset that follows the request.'}`),
  ]);

  const html = sanitizeHtmlDocument(extractTextContent(response));
  if (!html) {
    throw new Error(`The ${kind} update did not return a valid HTML document.`);
  }

  return {
    success: true,
    data: DashboardDTOSchema.parse({
      ...opts.analysis,
      artifacts: {
        ...opts.analysis.artifacts,
        ...(kind === 'waitlist' ? { waitlistHtml: html } : { pitchDeckHtml: html }),
      },
    }),
    summary: kind === 'waitlist'
      ? 'Waitlist concept updated for the new execution direction.'
      : 'Pitch deck updated for the new execution direction.',
    phaseId: opts.phaseId,
    targetId: opts.targetId,
  };
}

function classifyMutationError(message: string): WidgetMutationError {
  return { success: false, ...classifyProviderError(message, { context: 'this widget update' }) };
}

export async function mutateWidget(opts: WidgetMutationOptions): Promise<WidgetMutationOutcome> {
  const instruction = opts.instruction.trim();
  if (!instruction) {
    return {
      success: false,
      error: 'A widget update request is required.',
      statusCode: 400,
    };
  }

  const phaseId = LabPhaseSchema.parse(opts.phaseId);
  const targetId = WidgetTargetSchema.parse(opts.targetId);

  if (!phaseTargets[phaseId].includes(targetId)) {
    return {
      success: false,
      error: 'That widget does not belong to the selected phase.',
      statusCode: 400,
    };
  }

  const analysis = DashboardDTOSchema.parse(opts.analysis);

  try {
    if (phaseId === 'validation') {
      return mutateValidation({ ...opts, phaseId, targetId, instruction, analysis });
    }

    if (phaseId === 'strategy') {
      return mutateStrategy({ ...opts, phaseId, targetId, instruction, analysis });
    }

    if (targetId === 'promptChain') {
      return mutatePromptChain({ ...opts, phaseId, targetId, instruction, analysis });
    }

    if (targetId === 'waitlist') {
      return mutateArtifact({ ...opts, phaseId, targetId, instruction, analysis }, 'waitlist');
    }

    return mutateArtifact({ ...opts, phaseId, targetId, instruction, analysis }, 'pitchDeck');
  } catch (error) {
    return classifyMutationError(getErrorMessage(error));
  }
}
