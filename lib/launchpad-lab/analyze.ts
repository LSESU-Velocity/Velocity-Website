/**
 * Launchpad Lab analysis pipeline.
 * Uses LangChain structured output with Zod validation.
 */
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createModel, detectProvider, getDefaultModel, getFallbackModel } from './model.js';
import { classifyProviderError, getErrorMessage, isAuthError, isQuotaError } from './errors.js';
import { DashboardDTOSchema, type ArtifactBundle, type DashboardDTO, type IdeaIntake, type RawAnalysis } from './schemas.js';
import {
  type ArtifactPromptContext,
  buildPitchDeckHtmlPrompt,
  buildWaitlistHtmlPrompt,
} from './prompts.js';
import { toDashboardDTO } from './normalizer.js';
import { buildDashboardLab } from './lab.js';
import { generateFallbackArtifacts } from './fallback-assets.js';
import { extractTextContent, sanitizeHtmlDocument } from './html.js';

export interface AnalyzeOptions {
  apiKey: string;
  idea: string;
  includeArtifacts?: boolean;
  clarifications?: Record<string, string> | null;
  presetIntake?: IdeaIntake | null;
  /** Aborts in-flight model calls when the HTTP client disconnects. */
  signal?: AbortSignal | null;
}

export interface AnalyzeResult {
  success: true;
  data: DashboardDTO;
}

export interface AnalyzeError {
  success: false;
  error: string;
  statusCode: number;
  details?: string;
}

export interface AnalyzeInterrupt {
  success: false;
  interrupted: true;
  interrupt: import('./schemas.js').InterruptPayload;
}

export type AnalyzeOutcome = AnalyzeResult | AnalyzeError | AnalyzeInterrupt;
export type ArtifactGenerationOutcome = { success: true; data: ArtifactBundle } | AnalyzeError;

function createArtifactContextFromRawAnalysis(idea: string, rawAnalysis: RawAnalysis): ArtifactPromptContext {
  return {
    idea,
    identity: {
      name: rawAnalysis.name,
      tagline: rawAnalysis.tagline,
    },
    interface: rawAnalysis.interface,
    monetization: rawAnalysis.monetization,
    customerSegments: rawAnalysis.customerSegments,
    market: rawAnalysis.market,
    distributionChannels: rawAnalysis.distributionChannels,
    marketGap: rawAnalysis.marketGap.yourGap,
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

async function generateArtifact(
  apiKey: string,
  modelName: string,
  kind: 'waitlist' | 'pitchDeck',
  context: ArtifactPromptContext,
  signal?: AbortSignal | null,
): Promise<string | undefined> {
  const model = createModel({
    apiKey,
    model: modelName,
    temperature: 0.6,
    maxOutputTokens: 24576,
  });

  const prompt =
    kind === 'waitlist'
      ? buildWaitlistHtmlPrompt(context)
      : buildPitchDeckHtmlPrompt(context);

  try {
    const response = await model.invoke([
      new SystemMessage(prompt.system),
      new HumanMessage(prompt.user),
    ], signal ? { signal } : undefined);

    return sanitizeHtmlDocument(extractTextContent(response));
  } catch (error) {
    console.error(`[Launchpad Lab] ${kind} artifact generation failed:`, getErrorMessage(error));
    return undefined;
  }
}

async function generateArtifacts(
  apiKey: string,
  modelName: string,
  context: ArtifactPromptContext,
  signal?: AbortSignal | null,
): Promise<ArtifactBundle> {
  const [waitlistHtml, pitchDeckHtml] = await Promise.all([
    generateArtifact(apiKey, modelName, 'waitlist', context, signal),
    generateArtifact(apiKey, modelName, 'pitchDeck', context, signal),
  ]);

  return {
    waitlistHtml,
    pitchDeckHtml,
  };
}

function ensureArtifactsWithFallback(artifacts: ArtifactBundle, context: ArtifactPromptContext): ArtifactBundle {
  if (artifacts.waitlistHtml && artifacts.pitchDeckHtml) {
    return artifacts;
  }

  const fallback = generateFallbackArtifacts(context);

  return {
    waitlistHtml: artifacts.waitlistHtml || fallback.waitlistHtml,
    pitchDeckHtml: artifacts.pitchDeckHtml || fallback.pitchDeckHtml,
  };
}

/**
 * Run the full Launchpad analysis pipeline using LangGraph orchestration.
 * Returns either a successful DashboardDTO or a typed error.
 */
export async function runAnalysis(opts: AnalyzeOptions & { onProgress?: import('./graph.js').ProgressCallback }): Promise<AnalyzeOutcome> {
  const { apiKey, idea, includeArtifacts = false, onProgress, clarifications, presetIntake, signal } = opts;
  const { runGraph } = await import('./graph.js');

  try {
    const graphOutcome = await runGraph({ apiKey, idea, onProgress, clarifications, presetIntake, signal });

    if ('interrupted' in graphOutcome && graphOutcome.interrupted) {
      return {
        success: false,
        interrupted: true,
        interrupt: graphOutcome.interrupt,
      };
    }

    if (!graphOutcome.success) {
      const message = (graphOutcome as import('./graph.js').GraphRunError).error;
      const failedNode = (graphOutcome as import('./graph.js').GraphRunError).failedNode;
      console.error(`[Launchpad Lab] Graph failed at node "${failedNode}":`, message);

      return { success: false, ...classifyProviderError(message, { failedNode, context: 'the analysis' }) };
    }

    const rawAnalysis = graphOutcome.data;
    const lab = buildDashboardLab({
      raw: rawAnalysis,
      intake: graphOutcome.intake,
      council: graphOutcome.council,
    });
    const artifacts = includeArtifacts
      ? await generateArtifacts(
        apiKey,
        getDefaultModel(detectProvider(apiKey)),
        createArtifactContextFromRawAnalysis(idea, rawAnalysis),
        signal,
      )
      : {};

    const dto = DashboardDTOSchema.parse(toDashboardDTO(rawAnalysis, artifacts, lab, graphOutcome.research));
    return { success: true, data: dto };
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    console.error('[Launchpad Lab] Analysis failed:', message);
    return { success: false, ...classifyProviderError(message, { context: 'the analysis' }) };
  }
}

export async function generateFounderArtifacts(opts: {
  apiKey: string;
  idea: string;
  analysis: DashboardDTO;
  signal?: AbortSignal | null;
}): Promise<ArtifactGenerationOutcome> {
  const { apiKey, idea, analysis, signal } = opts;
  const context = createArtifactContextFromDashboard(idea, analysis);
  const provider = detectProvider(apiKey);

  try {
    let modelName = getDefaultModel(provider);
    let artifacts = await generateArtifacts(apiKey, modelName, context, signal);

    const fallbackModel = getFallbackModel(provider);
    if (!artifacts.waitlistHtml && !artifacts.pitchDeckHtml && fallbackModel && fallbackModel !== modelName) {
      modelName = fallbackModel;
      artifacts = await generateArtifacts(apiKey, modelName, context, signal);
    }

    return { success: true, data: ensureArtifactsWithFallback(artifacts, context) };
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    console.error('[Launchpad Lab] Founder asset generation failed:', message);

    if (isAuthError(message) || isQuotaError(message)) {
      return { success: false, ...classifyProviderError(message, { context: 'founder assets' }) };
    }

    return { success: true, data: generateFallbackArtifacts(context) };
  }
}
