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

export interface AnalyzeOptions {
  apiKey: string;
  idea: string;
  includeArtifacts?: boolean;
  clarifications?: Record<string, string> | null;
  presetIntake?: IdeaIntake | null;
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
  const { apiKey, idea, includeArtifacts = false, onProgress, clarifications, presetIntake } = opts;
  const { runGraph } = await import('./graph.js');

  try {
    const graphOutcome = await runGraph({ apiKey, idea, onProgress, clarifications, presetIntake });

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
}): Promise<ArtifactGenerationOutcome> {
  const { apiKey, idea, analysis } = opts;
  const context = createArtifactContextFromDashboard(idea, analysis);
  const provider = detectProvider(apiKey);

  try {
    let modelName = getDefaultModel(provider);
    let artifacts = await generateArtifacts(apiKey, modelName, context);

    const fallbackModel = getFallbackModel(provider);
    if (!artifacts.waitlistHtml && !artifacts.pitchDeckHtml && fallbackModel && fallbackModel !== modelName) {
      modelName = fallbackModel;
      artifacts = await generateArtifacts(apiKey, modelName, context);
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
