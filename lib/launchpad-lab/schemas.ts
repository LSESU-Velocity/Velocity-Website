/**
 * Zod schemas for Launchpad Lab analysis output.
 * These are the source of truth for the analysis contract — the prompt
 * and the dashboard both derive from these types.
 */
import { z } from 'zod';

// --- Sub-schemas (building blocks) ---

export const CitationRefSchema = z.object({
  sourceIds: z.array(z.string().regex(/^S\d+$/)).min(1).max(4),
});

export type CitationRef = z.infer<typeof CitationRefSchema>;

export const SourceCategorySchema = z.enum(['market', 'competitor', 'channel', 'report', 'general']);
export type SourceCategory = z.infer<typeof SourceCategorySchema>;

export const SourceDocumentSchema = z.object({
  id: z.string().regex(/^S\d+$/),
  title: z.string(),
  url: z.string(),
  domain: z.string(),
  snippet: z.string().max(280).optional(),
  categories: z.array(SourceCategorySchema).min(1),
});

export type SourceDocument = z.infer<typeof SourceDocumentSchema>;

export const SourceLinkSchema = z.object({
  id: z.string().regex(/^S\d+$/).optional(),
  name: z.string(),
  url: z.string(),
});

export type SourceLink = z.infer<typeof SourceLinkSchema>;

export const MarketReportSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  keyStat: z.string(),
  url: z.string(),
  sourceIds: z.array(z.string().regex(/^S\d+$/)).min(1).max(4).optional(),
});

export type MarketReport = z.infer<typeof MarketReportSchema>;

export const GroundedResearchSchema = z.object({
  summary: z.string().max(320),
  marketInsights: z.array(z.string().max(140)).min(3).max(5),
  risks: z.array(z.string().max(140)).min(2).max(4),
  whatToTestFirst: z.array(z.string().max(140)).min(2).max(4),
  competitors: z.array(z.object({
    name: z.string().max(40),
    website: z.string().max(80),
    strength: z.string().max(120),
    weakness: z.string().max(120),
  })).min(3).max(5),
  distributionChannels: z.array(z.object({
    name: z.string().max(40),
    type: z.string().max(20),
    members: z.string().max(25),
  })).min(5).max(7),
  marketReports: z.array(MarketReportSchema.omit({ sourceIds: true })).max(4),
});

export type GroundedResearch = z.infer<typeof GroundedResearchSchema>;

export const MonetizationSchema = z.object({
  model: z.string().describe('e.g. Freemium, Subscription (max 30 chars)'),
  pricing: z.string().describe('e.g. $29/mo, Free tier available (max 50 chars)'),
  strategies: z.array(z.string().describe('Strategy item (max 35 chars each)')),
  examples: z.string().describe('Similar companies using this model (max 60 chars)'),
});

export const MarketInsightsSchema = z.object({
  keyInsights: z.array(z.string().describe('Key market insight bullet (max 120 chars)')).min(3).max(5),
  risks: z.array(z.string().describe('Risk bullet focused on uncertainty or execution risk (max 120 chars)')).min(2).max(4),
  whatToTestFirst: z.array(z.string().describe('Early validation experiment bullet (max 120 chars)')).min(2).max(4),
});

export const CustomerSegmentSchema = z.object({
  segment: z.string().describe('Segment Name (max 35 chars)'),
  age: z.string().describe('Age range (max 10 chars, e.g. 25-45)'),
  income: z.string().describe('Income level (max 30 chars)'),
  interest: z.string().describe('Key interest/pain point (max 60 chars)'),
});

export const CompetitorSchema = z.object({
  name: z.string().describe('Competitor Name (max 25 chars)'),
  strength: z.string().describe('Their key strength/advantage (max 100 chars, complete sentence)'),
  weakness: z.string().describe('Their weakness you can exploit (max 100 chars, complete sentence)'),
  x: z.number().describe('0-100 position on X-axis'),
  y: z.number().describe('0-100 position on Y-axis'),
  website: z.string().describe('Company website domain (e.g. notion.so)'),
});

export const AxisSchema = z.object({
  label: z.string().describe('Determinant attribute (max 20 chars)'),
  low: z.string().describe('Low-end meaning (max 20 chars)'),
  high: z.string().describe('High-end meaning (max 20 chars)'),
});

export const MarketGapSchema = z.object({
  xAxis: AxisSchema,
  yAxis: AxisSchema,
  yourPosition: z.object({
    x: z.number().describe('0-100 (find a gap)'),
    y: z.number().describe('0-100 (find a gap)'),
  }),
  yourGap: z.string().describe('Description of your unique market position (max 100 chars)'),
});

export const PromptChainStepSchema = z.object({
  step: z.number().describe('Step number (1, 2, or 3)'),
  title: z.string().describe('Short step title (max 40 chars)'),
  prompt: z.string().describe('Complete prompt for AI coding tool (600-900 chars)'),
});

export const DistributionChannelSchema = z.object({
  name: z.string().describe('Channel name (max 40 chars)'),
  type: z.string().describe('Reddit/Discord/Forum/Social (max 15 chars)'),
  members: z.string().describe('Size indicator (max 20 chars, e.g. 750K+ members)'),
});

export const IdeaIntakeSchema = z.object({
  idea: z.string(),
  domain: z.string(),
  ideaType: z.string(),
  targetUser: z.string(),
  coreProblem: z.string(),
});

export type IdeaIntake = z.infer<typeof IdeaIntakeSchema>;

export const AnalystMemoSchema = z.object({
  perspective: z.enum(['bull', 'bear']),
  keyPoints: z.array(z.string().max(140)).min(2).max(4),
  opportunities: z.array(z.string().max(140)).min(1).max(2),
  risks: z.array(z.string().max(140)).min(1).max(2),
  recommendation: z.string().max(180),
});

export type AnalystMemo = z.infer<typeof AnalystMemoSchema>;

export const CouncilJudgeSchema = z.object({
  verdict: z.enum(['bull', 'bear', 'split']),
  finalTake: z.string().max(220),
  bullCase: z.array(z.string().max(140)).min(1).max(2),
  bearCase: z.array(z.string().max(140)).min(1).max(2),
  decidingFactors: z.array(z.string().max(140)).min(1).max(2),
  citations: z.object({
    finalTake: CitationRefSchema.optional(),
    bullCase: z.array(CitationRefSchema).optional(),
    bearCase: z.array(CitationRefSchema).optional(),
    decidingFactors: z.array(CitationRefSchema).optional(),
  }).optional(),
});

export type CouncilJudge = z.infer<typeof CouncilJudgeSchema>;

export const LabSummarySchema = z.object({
  recommendation: z.string(),
  confidenceScore: z.number().min(0).max(100),
  confidenceLabel: z.enum(['low', 'medium', 'high']),
  openRisks: z.array(z.string()).min(2).max(4),
  nextMoves: z.array(z.string()).min(2).max(4),
});

export type LabSummary = z.infer<typeof LabSummarySchema>;

export const MarketSizingPointSchema = z.object({
  key: z.enum(['tam', 'sam', 'som']),
  label: z.enum(['TAM', 'SAM', 'SOM']),
  title: z.string(),
  value: z.number().int().nonnegative(),
  ratio: z.number().min(0).max(1),
});

export type MarketSizingPoint = z.infer<typeof MarketSizingPointSchema>;

export const DashboardLabSchema = z.object({
  intake: IdeaIntakeSchema.nullable(),
  council: z.object({
    bull: AnalystMemoSchema.nullable(),
    bear: AnalystMemoSchema.nullable(),
    judge: CouncilJudgeSchema.nullable(),
  }),
  summary: LabSummarySchema,
  marketSizing: z.array(MarketSizingPointSchema).length(3).optional(),
});

export type DashboardLab = z.infer<typeof DashboardLabSchema>;

export const LabPhaseSchema = z.enum(['validation', 'strategy', 'execution']);
export type LabPhase = z.infer<typeof LabPhaseSchema>;

export const WidgetTargetSchema = z.enum([
  'validation',
  'marketSizing',
  'marketPosition',
  'strategy',
  'monetization',
  'customerSegments',
  'distributionChannels',
  'waitlist',
  'pitchDeck',
  'promptChain',
]);

export type WidgetTarget = z.infer<typeof WidgetTargetSchema>;

// --- Interrupt / thread schemas (Phase 5) ---

export const ClarificationQuestionSchema = z.object({
  field: z.string(),
  question: z.string(),
  hint: z.string().optional(),
});

export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;

export const InterruptPayloadSchema = z.object({
  reason: z.string(),
  questions: z.array(ClarificationQuestionSchema).min(1),
  partialIntake: IdeaIntakeSchema.nullable(),
});

export type InterruptPayload = z.infer<typeof InterruptPayloadSchema>;

// --- Top-level raw analysis schema (what the model outputs) ---

export const RawAnalysisSchema = z.object({
  name: z.string().describe('Catchy startup name (max 25 chars)'),
  tagline: z.string().describe('Short memorable tagline (max 60 chars)'),
  interface: z.string().describe('Brief description of main interface (max 80 chars)'),
  monetization: z.array(MonetizationSchema).min(3),
  market: MarketInsightsSchema,
  customerSegments: z.array(CustomerSegmentSchema).min(3),
  competitors: z.array(CompetitorSchema).min(3),
  marketGap: MarketGapSchema,
  promptChain: z.array(PromptChainStepSchema).min(3).max(3),
  distributionChannels: z.array(DistributionChannelSchema).min(5),
  citations: z.object({
    market: z.object({
      keyInsights: z.array(CitationRefSchema).optional(),
      risks: z.array(CitationRefSchema).optional(),
      whatToTestFirst: z.array(CitationRefSchema).optional(),
    }).optional(),
    competitors: z.array(CitationRefSchema).optional(),
    distributionChannels: z.array(CitationRefSchema).optional(),
    marketGap: CitationRefSchema.optional(),
  }).optional(),
});

export type RawAnalysis = z.infer<typeof RawAnalysisSchema>;

export const ArtifactBundleSchema = z.object({
  waitlistHtml: z.string().optional(),
  pitchDeckHtml: z.string().optional(),
});

export type ArtifactBundle = z.infer<typeof ArtifactBundleSchema>;

// --- Dashboard DTO (what the frontend expects from /api/analyze) ---

export const DashboardDTOSchema = z.object({
  identity: z.object({
    name: z.string(),
    tagline: z.string(),
  }),
  monetization: z.array(MonetizationSchema),
  visuals: z.object({
    logoStyle: z.string(),
    appInterface: z.string(),
  }),
  distributionChannels: z.array(DistributionChannelSchema),
  validation: z.object({
    industryInsights: MarketInsightsSchema,
    competitors: z.number(),
    competitorList: z.array(CompetitorSchema),
    marketReports: z.array(MarketReportSchema).default([]),
    marketGap: MarketGapSchema,
  }),
  sources: z.object({
    market: z.array(SourceLinkSchema).default([]),
    competitors: z.array(SourceLinkSchema).default([]),
    channels: z.array(SourceLinkSchema).default([]),
    queries: z.array(z.string()).default([]),
    documents: z.array(SourceDocumentSchema).default([]),
  }).default({
    market: [],
    competitors: [],
    channels: [],
    queries: [],
    documents: [],
  }),
  citations: z.object({
    summary: z.object({
      recommendation: CitationRefSchema.optional(),
      openRisks: z.array(CitationRefSchema.nullable()).optional(),
      nextMoves: z.array(CitationRefSchema.nullable()).optional(),
    }).optional(),
    council: z.object({
      finalTake: CitationRefSchema.optional(),
      bullCase: z.array(CitationRefSchema.nullable()).optional(),
      bearCase: z.array(CitationRefSchema.nullable()).optional(),
      decidingFactors: z.array(CitationRefSchema.nullable()).optional(),
    }).optional(),
    validation: z.object({
      marketInsights: z.array(CitationRefSchema.nullable()).optional(),
      risks: z.array(CitationRefSchema.nullable()).optional(),
      whatToTestFirst: z.array(CitationRefSchema.nullable()).optional(),
      competitors: z.array(CitationRefSchema.nullable()).optional(),
      marketGap: CitationRefSchema.optional(),
      marketSizing: z.array(CitationRefSchema.nullable()).optional(),
      marketReports: z.array(CitationRefSchema.nullable()).optional(),
    }).optional(),
    strategy: z.object({
      distributionChannels: z.array(CitationRefSchema.nullable()).optional(),
    }).optional(),
  }).optional(),
  customerSegments: z.array(CustomerSegmentSchema),
  promptChain: z.array(PromptChainStepSchema),
  artifacts: ArtifactBundleSchema,
  lab: DashboardLabSchema.optional(),
});

export type DashboardDTO = z.infer<typeof DashboardDTOSchema>;
