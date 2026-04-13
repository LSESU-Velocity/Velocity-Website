/**
 * LangGraph execution pipeline for Launchpad Lab analysis.
 * Keeps the workflow staged and the analyst council distinct.
 */
import { Annotation, StateGraph } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { createModel } from './model.js';
import {
  RawAnalysisSchema,
  IdeaIntakeSchema,
  AnalystMemoSchema,
  CouncilJudgeSchema,
  type RawAnalysis,
  type IdeaIntake,
  type AnalystMemo,
  type CouncilJudge,
  type ClarificationQuestion,
  type InterruptPayload,
} from './schemas.js';
import { buildAnalysisSystemPrompt, buildUserMessage } from './prompts.js';

export interface NodeProgress {
  node: string;
  status: 'running' | 'done' | 'error';
  error?: string;
}

export type ProgressCallback = (progress: NodeProgress) => void;

const GraphState = Annotation.Root({
  apiKey: Annotation<string>,
  modelName: Annotation<string>,
  idea: Annotation<string>,
  intake: Annotation<IdeaIntake | null>({ reducer: (_, v) => v, default: () => null }),
  bullMemo: Annotation<AnalystMemo | null>({ reducer: (_, v) => v, default: () => null }),
  bearMemo: Annotation<AnalystMemo | null>({ reducer: (_, v) => v, default: () => null }),
  judgeMemo: Annotation<CouncilJudge | null>({ reducer: (_, v) => v, default: () => null }),
  synthesis: Annotation<RawAnalysis | null>({ reducer: (_, v) => v, default: () => null }),
  result: Annotation<RawAnalysis | null>({ reducer: (_, v) => v, default: () => null }),
  error: Annotation<string | null>({ reducer: (_, v) => v, default: () => null }),
  failedNode: Annotation<string | null>({ reducer: (_, v) => v, default: () => null }),
  onProgress: Annotation<ProgressCallback | null>({ reducer: (_, v) => v, default: () => null }),
  interrupt: Annotation<InterruptPayload | null>({ reducer: (_, v) => v, default: () => null }),
  clarifications: Annotation<Record<string, string> | null>({ reducer: (_, v) => v, default: () => null }),
});

type GraphStateType = typeof GraphState.State;

const AnalystMemoLooseSchema = z.object({
  perspective: z.enum(['bull', 'bear']),
  keyPoints: z.array(z.string()).min(2).max(4),
  opportunities: z.array(z.string()).min(1).max(2),
  risks: z.array(z.string()).min(1).max(2),
  recommendation: z.string(),
});

const CouncilJudgeLooseSchema = z.object({
  verdict: z.enum(['bull', 'bear', 'split']),
  finalTake: z.string(),
  bullCase: z.array(z.string()).min(1).max(2),
  bearCase: z.array(z.string()).min(1).max(2),
  decidingFactors: z.array(z.string()).min(1).max(2),
});

function shortenText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const trimmed = normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd();
  const lastSpace = trimmed.lastIndexOf(' ');
  const compact = lastSpace > Math.floor(maxLength * 0.6) ? trimmed.slice(0, lastSpace) : trimmed;
  return `${compact.trimEnd()}...`;
}

function normalizeMemoList(items: string[], maxItems: number, maxLength: number, fallbackItems: string[]): string[] {
  const normalized = Array.from(
    new Set(
      items
        .map((item) => shortenText(item, maxLength))
        .filter((item) => item.length > 0),
    ),
  ).slice(0, maxItems);

  if (normalized.length > 0) {
    return normalized;
  }

  return fallbackItems.map((item) => shortenText(item, maxLength)).slice(0, maxItems);
}

function normalizeAnalystMemo(
  rawMemo: z.infer<typeof AnalystMemoLooseSchema>,
  perspective: AnalystMemo['perspective'],
): AnalystMemo {
  const fallbackByPerspective: Record<AnalystMemo['perspective'], { keyPoints: string[]; opportunities: string[]; risks: string[]; recommendation: string }> = {
    bull: {
      keyPoints: ['There is a narrow wedge worth testing.', 'A focused user segment could respond to sharper positioning.'],
      opportunities: ['A clear founder-led channel can create early traction.'],
      risks: ['Differentiation still needs stronger proof.'],
      recommendation: 'Test the sharpest wedge first before broadening the offer.',
    },
    bear: {
      keyPoints: ['The wedge may be too broad for an early launch.', 'Retention could fail without a stronger recurring use case.'],
      opportunities: ['A narrower evidence-backed use case would reduce skepticism.'],
      risks: ['Weak differentiation could hurt activation quickly.'],
      recommendation: 'Narrow the positioning before committing to a full build.',
    },
  };

  const fallback = fallbackByPerspective[perspective];

  return AnalystMemoSchema.parse({
    perspective,
    keyPoints: normalizeMemoList(rawMemo.keyPoints, 4, 140, fallback.keyPoints),
    opportunities: normalizeMemoList(rawMemo.opportunities, 2, 140, fallback.opportunities),
    risks: normalizeMemoList(rawMemo.risks, 2, 140, fallback.risks),
    recommendation: shortenText(rawMemo.recommendation || fallback.recommendation, 180) || fallback.recommendation,
  });
}

function normalizeCouncilJudge(rawJudge: z.infer<typeof CouncilJudgeLooseSchema>): CouncilJudge {
  const fallback = {
    verdict: 'split' as const,
    finalTake: 'Both sides are directionally right, so the wedge should stay narrow until demand is proven.',
    bullCase: ['There is a plausible wedge if the initial user and workflow stay focused.'],
    bearCase: ['Differentiation and repeat usage still need harder evidence.'],
    decidingFactors: ['Run one concrete validation loop before broadening the product.'],
  };

  return CouncilJudgeSchema.parse({
    verdict: rawJudge.verdict || fallback.verdict,
    finalTake: shortenText(rawJudge.finalTake || fallback.finalTake, 220) || fallback.finalTake,
    bullCase: normalizeMemoList(rawJudge.bullCase, 2, 140, fallback.bullCase),
    bearCase: normalizeMemoList(rawJudge.bearCase, 2, 140, fallback.bearCase),
    decidingFactors: normalizeMemoList(rawJudge.decidingFactors, 2, 140, fallback.decidingFactors),
  });
}

async function classifyIdea(state: GraphStateType): Promise<Partial<GraphStateType>> {
  state.onProgress?.({ node: 'classifyIdea', status: 'running' });

  try {
    const model = createModel({ apiKey: state.apiKey, model: state.modelName, maxOutputTokens: 1024 });
    const structured = model.withStructuredOutput(IdeaIntakeSchema, { name: 'classify_idea' });

    const intake = await structured.invoke([
      new SystemMessage(`You are a startup classifier. Extract:
- domain: industry or sector
- ideaType: product type
- targetUser: primary user persona
- coreProblem: the main pain point

Only use details that are explicit in the founder's wording.
Do not infer or embellish missing specifics.
If domain, targetUser, or coreProblem are not clearly stated, return "unspecified".
Return the original idea in the "idea" field too.`),
      new HumanMessage(`Classify this startup idea: "${state.idea}"`),
    ]);

    state.onProgress?.({ node: 'classifyIdea', status: 'done' });
    return { intake };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.onProgress?.({ node: 'classifyIdea', status: 'error', error: msg });
    return { intake: null };
  }
}

const GENERIC_TERMS = [
  'general',
  'generic',
  'various',
  'multiple',
  'unspecified',
  'unknown',
  'n/a',
  'none',
  'not sure',
  'everyone',
  'anyone',
  'all users',
  'all businesses',
  'users',
  'people',
  'companies',
  'businesses',
  'teams',
  'consumers',
];

function looksGeneric(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return lower.length < 8 || GENERIC_TERMS.some((term) => lower === term || lower.startsWith(term + ' '));
}

function detectVagueness(idea: string, intake: IdeaIntake): { vague: boolean; questions: ClarificationQuestion[] } {
  const questions: ClarificationQuestion[] = [];
  const trimmedIdea = idea.trim().toLowerCase();
  const wordCount = trimmedIdea.split(/\s+/).filter(Boolean).length;
  const genericIdea =
    wordCount < 10 ||
    /^(an?\s+)?(ai|saas)\s+(app|tool|platform|marketplace|product)\b/.test(trimmedIdea) ||
    /\bfor everyone\b/.test(trimmedIdea) ||
    /\bfor users\b/.test(trimmedIdea) ||
    /\bfor businesses\b/.test(trimmedIdea);

  if (looksGeneric(intake.domain)) {
    questions.push({
      field: 'domain',
      question: 'What industry or market does this serve?',
      hint: 'e.g., healthcare, fintech, education, e-commerce',
    });
  }

  if (looksGeneric(intake.coreProblem) || intake.coreProblem.length < 15) {
    questions.push({
      field: 'coreProblem',
      question: 'What specific problem does this solve for users?',
      hint: 'Describe the pain point in one sentence',
    });
  }

  if (looksGeneric(intake.targetUser)) {
    questions.push({
      field: 'targetUser',
      question: 'Who is the primary user? Be specific about their role or situation.',
      hint: 'e.g., freelance designers, small restaurant owners, first-time parents',
    });
  }

  const vague = questions.length >= 2 || (genericIdea && questions.length >= 1);
  return { vague, questions };
}

function enrichIntakeWithClarifications(intake: IdeaIntake, clarifications: Record<string, string>): IdeaIntake {
  return {
    ...intake,
    domain: clarifications['domain'] || intake.domain,
    coreProblem: clarifications['coreProblem'] || intake.coreProblem,
    targetUser: clarifications['targetUser'] || intake.targetUser,
  };
}

async function normalizeIntake(state: GraphStateType): Promise<Partial<GraphStateType>> {
  state.onProgress?.({ node: 'normalizeIntake', status: 'running' });

  let intake = state.intake;

  if (!intake) {
    intake = {
      idea: state.idea,
      domain: 'general',
      ideaType: 'startup',
      targetUser: 'general consumers',
      coreProblem: 'unspecified problem',
    };
  }

  if (state.clarifications) {
    intake = enrichIntakeWithClarifications(intake, state.clarifications);
  }

  const { vague, questions } = detectVagueness(state.idea, intake);

  if (vague && !state.clarifications) {
    state.onProgress?.({ node: 'normalizeIntake', status: 'done' });
    return {
      intake,
      interrupt: {
        reason: 'Your idea needs a bit more detail for a strong analysis.',
        questions,
        partialIntake: intake,
      },
    };
  }

  state.onProgress?.({ node: 'normalizeIntake', status: 'done' });
  return { intake };
}

async function runBullAnalyst(state: GraphStateType): Promise<Partial<GraphStateType>> {
  state.onProgress?.({ node: 'runBullAnalyst', status: 'running' });

  try {
    const model = createModel({ apiKey: state.apiKey, model: state.modelName, maxOutputTokens: 1024 });
    const structured = model.withStructuredOutput(AnalystMemoLooseSchema, {
      name: 'bull_memo',
      method: 'jsonSchema',
    });
    const intake = state.intake!;

    const rawMemo = await structured.invoke([
      new SystemMessage(`You are the BULL analyst on a startup council.

Your only job is to make the GOOD case for this idea.

- recommendation: the strongest reason to pursue this in one sentence
- keyPoints: 2-4 short reasons the idea looks promising
- opportunities: 1-2 tailwinds or distribution advantages
- risks: 1-2 fragile assumptions even a bull would watch

Keep every line concrete, concise, and non-repetitive. Return perspective as "bull".`),
      new HumanMessage(`Analyze this opportunity:
Idea: ${intake.idea}
Domain: ${intake.domain}
Type: ${intake.ideaType}
Target User: ${intake.targetUser}
Core Problem: ${intake.coreProblem}

Focus on timing, differentiation, and why this wedge could be attractive right now.`),
    ]);

    const memo = normalizeAnalystMemo(rawMemo, 'bull');

    state.onProgress?.({ node: 'runBullAnalyst', status: 'done' });
    return { bullMemo: memo };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.onProgress?.({ node: 'runBullAnalyst', status: 'error', error: msg });
    return { error: msg, failedNode: 'runBullAnalyst' };
  }
}

async function runBearAnalyst(state: GraphStateType): Promise<Partial<GraphStateType>> {
  state.onProgress?.({ node: 'runBearAnalyst', status: 'running' });

  try {
    const model = createModel({ apiKey: state.apiKey, model: state.modelName, maxOutputTokens: 1024 });
    const structured = model.withStructuredOutput(AnalystMemoLooseSchema, {
      name: 'bear_memo',
      method: 'jsonSchema',
    });
    const intake = state.intake!;

    const rawMemo = await structured.invoke([
      new SystemMessage(`You are the BEAR analyst on a startup council.

Your only job is to make the BAD case for this idea.

- recommendation: your blunt caution or pivot advice in one sentence
- keyPoints: 2-4 concrete reasons this could go badly
- opportunities: 1-2 conditions that would make you less skeptical
- risks: 1-2 highest-severity red flags

Keep every line concrete, concise, and non-repetitive. Return perspective as "bear".`),
      new HumanMessage(`Stress-test this opportunity:
Idea: ${intake.idea}
Domain: ${intake.domain}
Type: ${intake.ideaType}
Target User: ${intake.targetUser}
Core Problem: ${intake.coreProblem}

Focus on saturation, retention, distribution difficulty, weak differentiation, or regulatory trouble.`),
    ]);

    const memo = normalizeAnalystMemo(rawMemo, 'bear');

    state.onProgress?.({ node: 'runBearAnalyst', status: 'done' });
    return { bearMemo: memo };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.onProgress?.({ node: 'runBearAnalyst', status: 'error', error: msg });
    return { error: msg, failedNode: 'runBearAnalyst' };
  }
}

async function runCouncilJudge(state: GraphStateType): Promise<Partial<GraphStateType>> {
  state.onProgress?.({ node: 'runCouncilJudge', status: 'running' });

  try {
    const model = createModel({ apiKey: state.apiKey, model: state.modelName, maxOutputTokens: 1024 });
    const structured = model.withStructuredOutput(CouncilJudgeLooseSchema, {
      name: 'council_judge',
      method: 'jsonSchema',
    });
    const intake = state.intake!;
    const bullMemo = state.bullMemo;
    const bearMemo = state.bearMemo;

    const rawJudge = await structured.invoke([
      new SystemMessage(`You are the final JUDGE on a startup council.

You receive one bull memo and one bear memo.
Your job is to decide who is more right overall right now, while explicitly noting where each side is correct.

- verdict: "bull", "bear", or "split"
- finalTake: one concise sentence with your final call
- bullCase: 1-2 specific areas where the bull is right
- bearCase: 1-2 specific areas where the bear is right
- decidingFactors: 1-2 concrete tests, signals, or facts that should settle the disagreement

Do not invent a third viewpoint. Adjudicate only from the evidence and assumptions in the two memos.
Keep every line concrete, concise, and non-repetitive.`),
      new HumanMessage(`Judge this startup council:
Idea: ${intake.idea}
Domain: ${intake.domain}
Type: ${intake.ideaType}
Target User: ${intake.targetUser}
Core Problem: ${intake.coreProblem}

BULL MEMO:
- Key points: ${bullMemo?.keyPoints.join('; ') || 'Unavailable'}
- Opportunities: ${bullMemo?.opportunities.join('; ') || 'Unavailable'}
- Risks: ${bullMemo?.risks.join('; ') || 'Unavailable'}
- Recommendation: ${bullMemo?.recommendation || 'Unavailable'}

BEAR MEMO:
- Key points: ${bearMemo?.keyPoints.join('; ') || 'Unavailable'}
- Opportunities: ${bearMemo?.opportunities.join('; ') || 'Unavailable'}
- Risks: ${bearMemo?.risks.join('; ') || 'Unavailable'}
- Recommendation: ${bearMemo?.recommendation || 'Unavailable'}`),
    ]);

    const judge = normalizeCouncilJudge(rawJudge);

    state.onProgress?.({ node: 'runCouncilJudge', status: 'done' });
    return { judgeMemo: judge };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.onProgress?.({ node: 'runCouncilJudge', status: 'error', error: msg });
    return { error: msg, failedNode: 'runCouncilJudge' };
  }
}

async function synthesizeOpportunity(state: GraphStateType): Promise<Partial<GraphStateType>> {
  state.onProgress?.({ node: 'synthesizeOpportunity', status: 'running' });

  try {
    const model = createModel({ apiKey: state.apiKey, model: state.modelName, maxOutputTokens: 16384 });
    const structured = model.withStructuredOutput(RawAnalysisSchema, {
      name: 'startup_analysis',
      method: 'jsonSchema',
    });

    const intake = state.intake!;
    const bullSummary = state.bullMemo
      ? `BULL ANALYST:\nWhy it could work: ${state.bullMemo.keyPoints.join('; ')}\nTailwinds: ${state.bullMemo.opportunities.join('; ')}\nWatchouts: ${state.bullMemo.risks.join('; ')}\nVerdict: ${state.bullMemo.recommendation}`
      : 'Bull analyst memo unavailable.';
    const bearSummary = state.bearMemo
      ? `BEAR ANALYST:\nWhy it could fail: ${state.bearMemo.keyPoints.join('; ')}\nRed flags: ${state.bearMemo.risks.join('; ')}\nWhat would change their mind: ${state.bearMemo.opportunities.join('; ')}\nVerdict: ${state.bearMemo.recommendation}`
      : 'Bear analyst memo unavailable.';
    const judgeSummary = state.judgeMemo
      ? `COUNCIL JUDGE:\nFinal call: ${state.judgeMemo.finalTake}\nVerdict: ${state.judgeMemo.verdict}\nBull is right about: ${state.judgeMemo.bullCase.join('; ')}\nBear is right about: ${state.judgeMemo.bearCase.join('; ')}\nWhat settles it: ${state.judgeMemo.decidingFactors.join('; ')}`
      : 'Council judge memo unavailable.';

    const synthesis = await structured.invoke([
      new SystemMessage(buildAnalysisSystemPrompt()),
      new HumanMessage(`${buildUserMessage(intake.idea)}

ANALYST COUNCIL FINDINGS:

${bullSummary}

${bearSummary}

${judgeSummary}

INTAKE CLASSIFICATION:
- Domain: ${intake.domain}
- Type: ${intake.ideaType}
- Target User: ${intake.targetUser}
- Core Problem: ${intake.coreProblem}

Use the council to make the final analysis sharper.
Treat the judge as the arbitration layer for the final recommendation, while keeping the upside and downside distinct instead of collapsing them into generic advice.`),
    ]);

    state.onProgress?.({ node: 'synthesizeOpportunity', status: 'done' });
    return { synthesis };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    state.onProgress?.({ node: 'synthesizeOpportunity', status: 'error', error: msg });
    return { error: msg, failedNode: 'synthesizeOpportunity' };
  }
}

async function qaAndRepair(state: GraphStateType): Promise<Partial<GraphStateType>> {
  state.onProgress?.({ node: 'qaAndRepair', status: 'running' });

  if (state.error) {
    state.onProgress?.({ node: 'qaAndRepair', status: 'error', error: state.error });
    return { error: state.error, failedNode: state.failedNode || 'qaAndRepair' };
  }

  if (!state.synthesis) {
    state.onProgress?.({ node: 'qaAndRepair', status: 'error', error: 'No synthesis to validate' });
    return { error: 'Synthesis step produced no output', failedNode: 'qaAndRepair' };
  }

  const parseResult = RawAnalysisSchema.safeParse(state.synthesis);

  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    state.onProgress?.({ node: 'qaAndRepair', status: 'error', error: `Validation failed: ${issues}` });
    return { error: `Output validation failed: ${issues}`, failedNode: 'qaAndRepair' };
  }

  state.onProgress?.({ node: 'qaAndRepair', status: 'done' });
  return { result: parseResult.data };
}

function shouldContinueAfterIntake(state: GraphStateType): string | string[] {
  if (state.interrupt) {
    return '__end__';
  }
  return ['runBullAnalyst', 'runBearAnalyst'];
}

function buildAnalysisGraph() {
  const graph = new StateGraph(GraphState)
    .addNode('classifyIdea', classifyIdea)
    .addNode('normalizeIntake', normalizeIntake)
    .addNode('runBullAnalyst', runBullAnalyst)
    .addNode('runBearAnalyst', runBearAnalyst)
    .addNode('runCouncilJudge', runCouncilJudge)
    .addNode('synthesizeOpportunity', synthesizeOpportunity)
    .addNode('qaAndRepair', qaAndRepair)
    .addEdge('__start__', 'classifyIdea')
    .addEdge('classifyIdea', 'normalizeIntake')
    .addConditionalEdges('normalizeIntake', shouldContinueAfterIntake, [
      'runBullAnalyst', 'runBearAnalyst', 'qaAndRepair', '__end__',
    ])
    .addEdge(['runBullAnalyst', 'runBearAnalyst'], 'runCouncilJudge')
    .addEdge('runCouncilJudge', 'synthesizeOpportunity')
    .addEdge('synthesizeOpportunity', 'qaAndRepair')
    .addEdge('qaAndRepair', '__end__');

  return graph.compile();
}

let compiledGraph: ReturnType<typeof buildAnalysisGraph> | null = null;

function getGraph() {
  if (!compiledGraph) {
    compiledGraph = buildAnalysisGraph();
  }
  return compiledGraph;
}

export interface GraphRunOptions {
  apiKey: string;
  idea: string;
  modelName?: string;
  onProgress?: ProgressCallback;
  clarifications?: Record<string, string> | null;
}

export interface CouncilMemos {
  bull: AnalystMemo | null;
  bear: AnalystMemo | null;
  judge: CouncilJudge | null;
}

export interface GraphRunResult {
  success: true;
  data: RawAnalysis;
  intake: IdeaIntake | null;
  council: CouncilMemos;
}

export interface GraphRunError {
  success: false;
  error: string;
  failedNode: string | null;
}

export interface GraphRunInterrupt {
  success: false;
  interrupted: true;
  interrupt: InterruptPayload;
  intake: IdeaIntake | null;
}

export type GraphRunOutcome = GraphRunResult | GraphRunError | GraphRunInterrupt;

const DEFAULT_MODEL = process.env.LAUNCHPAD_GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
const FALLBACK_MODEL = process.env.LAUNCHPAD_GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite';

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
    normalized.includes('overloaded') ||
    normalized.includes('temporarily unavailable') ||
    normalized.includes('service unavailable') ||
    normalized.includes('503')
  );
}

export async function runGraph(opts: GraphRunOptions): Promise<GraphRunOutcome> {
  const modelName = opts.modelName || DEFAULT_MODEL;
  const graph = getGraph();

  const finalState = await graph.invoke({
    apiKey: opts.apiKey,
    modelName,
    idea: opts.idea,
    onProgress: opts.onProgress || null,
    clarifications: opts.clarifications || null,
  });

  if (finalState.interrupt) {
    return {
      success: false,
      interrupted: true,
      interrupt: finalState.interrupt,
      intake: finalState.intake,
    };
  }

  if (finalState.result) {
    return {
      success: true,
      data: finalState.result,
      intake: finalState.intake,
      council: {
        bull: finalState.bullMemo,
        bear: finalState.bearMemo,
        judge: finalState.judgeMemo,
      },
    };
  }

  if (finalState.error && modelName !== FALLBACK_MODEL) {
    if (isModelUnavailableError(finalState.error) || isHighDemandError(finalState.error)) {
      opts.onProgress?.({ node: 'retry', status: 'running' });
      const retryState = await graph.invoke({
        apiKey: opts.apiKey,
        modelName: FALLBACK_MODEL,
        idea: opts.idea,
        onProgress: opts.onProgress || null,
        clarifications: opts.clarifications || null,
      });

      if (retryState.result) {
        opts.onProgress?.({ node: 'retry', status: 'done' });
        return {
          success: true,
          data: retryState.result,
          intake: retryState.intake,
          council: {
            bull: retryState.bullMemo,
            bear: retryState.bearMemo,
            judge: retryState.judgeMemo,
          },
        };
      }

      return {
        success: false,
        error: retryState.error || 'Fallback analysis finished without a result. The graph did not complete a terminal output.',
        failedNode: retryState.failedNode || 'runGraph:fallback',
      };
    }
  }

  return {
    success: false,
    error: finalState.error || 'Analysis finished without a result. The graph did not complete a terminal output.',
    failedNode: finalState.failedNode || 'runGraph',
  };
}

export const GRAPH_NODES = [
  'classifyIdea',
  'normalizeIntake',
  'runBullAnalyst',
  'runBearAnalyst',
  'runCouncilJudge',
  'synthesizeOpportunity',
  'qaAndRepair',
] as const;
