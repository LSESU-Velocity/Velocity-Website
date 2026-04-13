import type {
  AnalystMemo,
  CouncilJudge,
  DashboardLab,
  IdeaIntake,
  MarketSizingPoint,
  RawAnalysis,
} from './schemas.js';

interface BuildDashboardLabOptions {
  raw: RawAnalysis;
  intake: IdeaIntake | null;
  council: {
    bull: AnalystMemo | null;
    bear: AnalystMemo | null;
    judge: CouncilJudge | null;
  };
}

function uniqueItems(items: Array<string | undefined | null>, limit: number): string[] {
  return Array.from(
    new Set(
      items
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim()),
    ),
  ).slice(0, limit);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toSentence(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function formatConfidence(score: number): 'low' | 'medium' | 'high' {
  if (score >= 76) return 'high';
  if (score >= 58) return 'medium';
  return 'low';
}

export function buildFallbackCouncilJudge({
  bull,
  bear,
  fallbackRecommendation,
}: {
  bull: AnalystMemo | null;
  bear: AnalystMemo | null;
  fallbackRecommendation?: string;
}): CouncilJudge {
  const bullStrengths = uniqueItems(
    [
      bull?.keyPoints[0],
      bull?.opportunities[0],
      bull?.recommendation,
    ],
    2,
  );
  const bearStrengths = uniqueItems(
    [
      bear?.keyPoints[0],
      bear?.risks[0],
      bear?.recommendation,
    ],
    2,
  );

  const verdict: CouncilJudge['verdict'] =
    bull && !bear
      ? 'bull'
      : bear && !bull
        ? 'bear'
        : bullStrengths.length > bearStrengths.length
          ? 'bull'
          : bearStrengths.length > bullStrengths.length
            ? 'bear'
            : 'split';

  const finalTake =
    verdict === 'bull'
      ? bull?.recommendation || fallbackRecommendation || 'There is enough upside to test a narrow wedge.'
      : verdict === 'bear'
        ? bear?.recommendation || fallbackRecommendation || 'The current wedge needs more proof before a broader build.'
        : fallbackRecommendation || bull?.recommendation || bear?.recommendation || 'The opportunity is promising only if the first wedge stays narrow and measurable.';

  return {
    verdict,
    finalTake: toSentence(finalTake, 'Keep the wedge narrow until the strongest assumption is tested.'),
    bullCase: bullStrengths.length ? bullStrengths : ['There is a plausible wedge if the initial user and workflow stay focused.'],
    bearCase: bearStrengths.length ? bearStrengths : ['Differentiation and repeat usage still need stronger proof.'],
    decidingFactors: uniqueItems(
      [
        bull?.opportunities[0],
        bear?.opportunities[0],
        fallbackRecommendation,
      ],
      2,
    ).length
      ? uniqueItems(
        [
          bull?.opportunities[0],
          bear?.opportunities[0],
          fallbackRecommendation,
        ],
        2,
      )
      : ['Run a focused validation loop before broadening the product.'],
  };
}

function parseAudienceSize(value: string): number | null {
  const normalized = value.trim().toLowerCase().replace(/,/g, '');
  const numericMatch = normalized.match(/(\d+(?:\.\d+)?)\s*([kmb])?/);

  if (numericMatch) {
    const amount = Number(numericMatch[1]);
    const suffix = numericMatch[2];
    const multiplier = suffix === 'm' ? 1_000_000 : suffix === 'b' ? 1_000_000_000 : suffix === 'k' ? 1_000 : 1;
    return Math.round(amount * multiplier);
  }

  if (normalized.includes('viral')) return 180_000;
  if (normalized.includes('active')) return 90_000;
  if (normalized.includes('founders')) return 60_000;

  return null;
}

export function buildDirectionalMarketSizing({
  distributionChannels,
  customerSegmentCount,
  targetUser,
}: {
  distributionChannels: RawAnalysis['distributionChannels'];
  customerSegmentCount: number;
  targetUser?: string | null;
}): MarketSizingPoint[] {
  const reachableAudience = distributionChannels
    .map((channel) => parseAudienceSize(channel.members))
    .filter((value): value is number => value !== null)
    .reduce((sum, value) => sum + value, 0);

  const baseAudience = reachableAudience || Math.max(75_000, customerSegmentCount * 45_000);
  const tam = Math.round(baseAudience * 6.5);
  const sam = Math.round(tam * 0.21);
  const som = Math.round(sam * 0.09);

  return [
    {
      key: 'tam',
      label: 'TAM',
      title: `All ${targetUser || 'potential users'}`,
      value: tam,
      ratio: 1,
    },
    {
      key: 'sam',
      label: 'SAM',
      title: 'Reachable first wedge',
      value: sam,
      ratio: tam > 0 ? sam / tam : 0,
    },
    {
      key: 'som',
      label: 'SOM',
      title: 'Initial beachhead',
      value: som,
      ratio: tam > 0 ? som / tam : 0,
    },
  ];
}

export function buildDashboardLab({
  raw,
  intake,
  council,
}: BuildDashboardLabOptions): DashboardLab {
  const bull = council.bull;
  const bear = council.bear;
  const judge = council.judge || buildFallbackCouncilJudge({
    bull,
    bear,
    fallbackRecommendation: raw.market.whatToTestFirst[0],
  });

  let confidenceScore = 62;
  confidenceScore += judge.verdict === 'bull' ? 6 : judge.verdict === 'split' ? 1 : -6;
  confidenceScore += Math.min(8, (bull?.opportunities.length || 0) * 2);
  confidenceScore -= Math.min(12, (bear?.risks.length || 0) * 4);
  confidenceScore -= Math.max(0, raw.market.risks.length - 2) * 3;
  confidenceScore = clamp(confidenceScore, 38, 88);

  const confidenceLabel = formatConfidence(confidenceScore);
  const openRisks = uniqueItems(
    [
      ...judge.bearCase,
      ...(bear?.risks || []),
      ...(bear?.keyPoints || []),
      ...raw.market.risks,
    ],
    3,
  );
  const nextMoves = uniqueItems(
    [
      ...raw.market.whatToTestFirst,
      bull?.opportunities?.[0],
      bear?.opportunities?.[0],
    ],
    3,
  );

  const recommendationParts = uniqueItems(
    [
      judge.finalTake,
      bull?.recommendation,
      raw.market.whatToTestFirst[0],
    ],
    2,
  );
  const recommendation = toSentence(
    recommendationParts[0] || `${raw.name} looks strongest as a narrow first wedge`,
    `Pursue ${raw.name} as a narrow wedge first and validate the highest-risk assumption quickly.`,
  );

  return {
    intake,
    council: {
      bull,
      bear,
      judge,
    },
    summary: {
      recommendation,
      confidenceScore,
      confidenceLabel,
      openRisks: openRisks.length ? openRisks : ['Demand proof is still thin.', 'Positioning needs a sharper wedge.'],
      nextMoves: nextMoves.length ? nextMoves : ['Interview potential users this week.', 'Prototype the narrowest useful workflow.'],
    },
    marketSizing: buildDirectionalMarketSizing({
      distributionChannels: raw.distributionChannels,
      customerSegmentCount: raw.customerSegments.length,
      targetUser: intake?.targetUser || raw.customerSegments[0]?.segment || null,
    }),
  };
}
