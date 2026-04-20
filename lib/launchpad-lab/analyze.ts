/**
 * Launchpad Lab analysis pipeline.
 * Uses LangChain structured output with Zod validation.
 */
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createModel } from './model.js';
import { DashboardDTOSchema, RawAnalysisSchema, type ArtifactBundle, type DashboardDTO, type RawAnalysis } from './schemas.js';
import {
  type ArtifactPromptContext,
  buildAnalysisSystemPrompt,
  buildPitchDeckHtmlPrompt,
  buildUserMessage,
  buildWaitlistHtmlPrompt,
} from './prompts.js';
import { toDashboardDTO } from './normalizer.js';
import { buildDashboardLab } from './lab.js';
import { generateFallbackArtifacts } from './fallback-assets.js';

export interface AnalyzeOptions {
  apiKey: string;
  idea: string;
  includeArtifacts?: boolean;
  clarifications?: Record<string, string> | null;
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

const DEFAULT_MODEL = process.env.LAUNCHPAD_GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
const FALLBACK_MODEL = process.env.LAUNCHPAD_GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite';
const IS_DEV = process.env.NODE_ENV !== 'production';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isModelUnavailableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('not_found') ||
    normalized.includes('model not found') ||
    normalized.includes('unsupported model') ||
    normalized.includes('unknown model') ||
    (normalized.includes('model') && normalized.includes('404'))
  );
}

function isHighDemandError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('high demand') ||
    normalized.includes('currently experiencing high demand') ||
    normalized.includes('overloaded') ||
    normalized.includes('temporarily unavailable') ||
    normalized.includes('try again later') ||
    normalized.includes('service unavailable') ||
    normalized.includes('503')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

async function invokeCoreAnalysis(apiKey: string, idea: string, modelName: string): Promise<RawAnalysis> {
  const model = createModel({ apiKey, model: modelName });
  const structuredModel = model.withStructuredOutput(RawAnalysisSchema, {
    name: 'startup_analysis',
    method: 'jsonSchema',
  });

  return structuredModel.invoke([
    new SystemMessage(buildAnalysisSystemPrompt()),
    new HumanMessage(buildUserMessage(idea)),
  ]);
}

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

async function invokeCoreAnalysisWithRecovery(apiKey: string, idea: string): Promise<{ rawAnalysis: RawAnalysis; modelName: string }> {
  let activeModel = DEFAULT_MODEL;

  try {
    return {
      rawAnalysis: await invokeCoreAnalysis(apiKey, idea, activeModel),
      modelName: activeModel,
    };
  } catch (error) {
    const firstMessage = getErrorMessage(error);

    if (isHighDemandError(firstMessage)) {
      console.warn(`[Launchpad Lab] Model ${activeModel} is overloaded, retrying once before fallback.`);
      await sleep(800);

      try {
        return {
          rawAnalysis: await invokeCoreAnalysis(apiKey, idea, activeModel),
          modelName: activeModel,
        };
      } catch (retryError) {
        const retryMessage = getErrorMessage(retryError);

        if (activeModel !== FALLBACK_MODEL) {
          console.warn(`[Launchpad Lab] Model ${activeModel} still overloaded, retrying with ${FALLBACK_MODEL}`);
          activeModel = FALLBACK_MODEL;
          return {
            rawAnalysis: await invokeCoreAnalysis(apiKey, idea, activeModel),
            modelName: activeModel,
          };
        }

        throw new Error(retryMessage);
      }
    }

    if (activeModel !== FALLBACK_MODEL && isModelUnavailableError(firstMessage)) {
      console.warn(`[Launchpad Lab] Model ${activeModel} unavailable, retrying with ${FALLBACK_MODEL}`);
      activeModel = FALLBACK_MODEL;
      return {
        rawAnalysis: await invokeCoreAnalysis(apiKey, idea, activeModel),
        modelName: activeModel,
      };
    }

    throw error;
  }
}

async function generateArtifact(
  apiKey: string,
  modelName: string,
  kind: 'waitlist' | 'pitchDeck',
  context: ArtifactPromptContext,
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
    ]);

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
): Promise<ArtifactBundle> {
  const [waitlistHtml, pitchDeckHtml] = await Promise.all([
    generateArtifact(apiKey, modelName, 'waitlist', context),
    generateArtifact(apiKey, modelName, 'pitchDeck', context),
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
  const { apiKey, idea, includeArtifacts = false, onProgress, clarifications } = opts;
  const { runGraph } = await import('./graph.js');

  try {
    const graphOutcome = await runGraph({ apiKey, idea, onProgress, clarifications });

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

      return classifyError(message, failedNode);
    }

    const rawAnalysis = graphOutcome.data;
    const lab = buildDashboardLab({
      raw: rawAnalysis,
      intake: graphOutcome.intake,
      council: graphOutcome.council,
    });
    const artifacts = includeArtifacts
      ? await generateArtifacts(apiKey, DEFAULT_MODEL, createArtifactContextFromRawAnalysis(idea, rawAnalysis))
      : {};

    const dto = DashboardDTOSchema.parse(toDashboardDTO(rawAnalysis, artifacts, lab, graphOutcome.research));
    return { success: true, data: dto };
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    console.error('[Launchpad Lab] Analysis failed:', message);
    return classifyError(message, null);
  }
}

function classifyError(message: string, failedNode: string | null): AnalyzeError {
  const nodePrefix = failedNode ? `[${failedNode}] ` : '';

  if (
    message.includes('API key') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('403') ||
    message.includes('401') ||
    message.includes('UNAUTHENTICATED')
  ) {
    return {
      success: false,
      error: `${nodePrefix}Your Gemini API key was rejected. Please check it and try again.`,
      statusCode: 401,
      ...(IS_DEV ? { details: message } : {}),
    };
  }

  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return {
      success: false,
      error: `${nodePrefix}Your Gemini account hit a rate or quota limit. Please wait and try again.`,
      statusCode: 429,
      ...(IS_DEV ? { details: message } : {}),
    };
  }

  if (isHighDemandError(message)) {
    return {
      success: false,
      error: `${nodePrefix}Gemini is temporarily overloaded. Please retry.`,
      statusCode: 503,
      ...(IS_DEV ? { details: message } : {}),
    };
  }

  if (isModelUnavailableError(message)) {
    return {
      success: false,
      error: `${nodePrefix}The configured Gemini model (${DEFAULT_MODEL}) is unavailable for this key.`,
      statusCode: 502,
      ...(IS_DEV ? { details: message } : {}),
    };
  }

  if (message.includes('INVALID_ARGUMENT') || message.includes('400')) {
    return {
      success: false,
      error: `${nodePrefix}Gemini rejected the analysis request.`,
      statusCode: 502,
      ...(IS_DEV ? { details: message } : {}),
    };
  }

  if (message.includes('Could not parse') || message.includes('validation') || message.includes('Validation failed')) {
    return {
      success: false,
      error: `${nodePrefix}The AI response did not match the expected format. Please try again.`,
      statusCode: 502,
      ...(IS_DEV ? { details: message } : {}),
    };
  }

  return {
    success: false,
    error: `${nodePrefix}Failed to generate analysis. Please try again.`,
    statusCode: 500,
    ...(IS_DEV ? { details: message } : {}),
  };
}

export async function generateFounderArtifacts(opts: {
  apiKey: string;
  idea: string;
  analysis: DashboardDTO;
}): Promise<ArtifactGenerationOutcome> {
  const { apiKey, idea, analysis } = opts;
  const context = createArtifactContextFromDashboard(idea, analysis);

  try {
    let modelName = DEFAULT_MODEL;
    let artifacts = await generateArtifacts(apiKey, modelName, context);

    if (!artifacts.waitlistHtml && !artifacts.pitchDeckHtml && modelName !== FALLBACK_MODEL) {
      modelName = FALLBACK_MODEL;
      artifacts = await generateArtifacts(apiKey, modelName, context);
    }

    return { success: true, data: ensureArtifactsWithFallback(artifacts, context) };
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    console.error('[Launchpad Lab] Founder asset generation failed:', message);

    if (
      message.includes('API key') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('403') ||
      message.includes('401') ||
      message.includes('UNAUTHENTICATED')
    ) {
      return {
        success: false,
        error: 'Your Gemini API key was rejected. Please check it and try again.',
        statusCode: 401,
        ...(IS_DEV ? { details: message } : {}),
      };
    }

    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
      return {
        success: false,
        error: 'Your Gemini account hit a rate or quota limit while generating founder assets.',
        statusCode: 429,
        ...(IS_DEV ? { details: message } : {}),
      };
    }

    if (isHighDemandError(message)) {
      return { success: true, data: generateFallbackArtifacts(context) };
    }

    return { success: true, data: generateFallbackArtifacts(context) };
  }
}
