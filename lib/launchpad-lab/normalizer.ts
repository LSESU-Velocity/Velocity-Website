/**
 * Output normalizer: adapts the raw model output to the existing dashboard DTO.
 */
import type {
  ArtifactBundle,
  CitationRef,
  DashboardDTO,
  DashboardLab,
  RawAnalysis,
} from './schemas.js';
import type { GroundedResearchPacket } from './research.js';

function normalizeTextKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
}

function buildCitationLookup(raw: RawAnalysis, lab?: DashboardLab): Map<string, CitationRef> {
  const lookup = new Map<string, CitationRef>();
  const add = (text: string | undefined, citation: CitationRef | undefined) => {
    if (!text || !citation?.sourceIds?.length) {
      return;
    }

    const key = normalizeTextKey(text);
    if (!lookup.has(key)) {
      lookup.set(key, citation);
    }
  };

  raw.market.keyInsights.forEach((item, index) => add(item, raw.citations?.market?.keyInsights?.[index]));
  raw.market.risks.forEach((item, index) => add(item, raw.citations?.market?.risks?.[index]));
  raw.market.whatToTestFirst.forEach((item, index) => add(item, raw.citations?.market?.whatToTestFirst?.[index]));
  add(raw.marketGap.yourGap, raw.citations?.marketGap);

  raw.competitors.forEach((item, index) => {
    add(item.name, raw.citations?.competitors?.[index]);
    add(item.strength, raw.citations?.competitors?.[index]);
    add(item.weakness, raw.citations?.competitors?.[index]);
  });

  raw.distributionChannels.forEach((item, index) => {
    add(item.name, raw.citations?.distributionChannels?.[index]);
    add(item.members, raw.citations?.distributionChannels?.[index]);
  });

  if (lab?.council.judge?.citations) {
    add(lab.council.judge.finalTake, lab.council.judge.citations.finalTake);
    lab.council.judge.bullCase.forEach((item, index) => add(item, lab.council.judge?.citations?.bullCase?.[index] || undefined));
    lab.council.judge.bearCase.forEach((item, index) => add(item, lab.council.judge?.citations?.bearCase?.[index] || undefined));
    lab.council.judge.decidingFactors.forEach((item, index) => add(item, lab.council.judge?.citations?.decidingFactors?.[index] || undefined));
  }

  return lookup;
}

function getLookupCitation(text: string, lookup: Map<string, CitationRef>): CitationRef | null {
  return lookup.get(normalizeTextKey(text)) || null;
}

function alignCitationArray(length: number, values: Array<CitationRef | undefined>): Array<CitationRef | null> {
  return Array.from({ length }, (_, index) => values[index] || null);
}

function buildSources(research?: GroundedResearchPacket | null): DashboardDTO['sources'] {
  const documents = research?.sources || [];
  const toLink = (source: typeof documents[number]) => ({
    id: source.id,
    name: source.title,
    url: source.url,
  });

  return {
    market: documents.filter((source) => source.categories.includes('market') || source.categories.includes('report') || source.categories.includes('general')).map(toLink),
    competitors: documents.filter((source) => source.categories.includes('competitor')).map(toLink),
    channels: documents.filter((source) => source.categories.includes('channel')).map(toLink),
    queries: research?.queries || [],
    documents,
  };
}

/**
 * Convert the raw structured analysis output into the format
 * expected by LaunchpadDashboard.tsx.
 */
export function toDashboardDTO(
  raw: RawAnalysis,
  artifacts: ArtifactBundle = {},
  lab?: DashboardLab,
  research?: GroundedResearchPacket | null,
): DashboardDTO {
  const citationLookup = buildCitationLookup(raw, lab);

  return {
    identity: {
      name: raw.name,
      tagline: raw.tagline,
    },
    monetization: raw.monetization,
    visuals: {
      logoStyle: 'Minimalist',
      appInterface: raw.interface,
    },
    distributionChannels: raw.distributionChannels,
    validation: {
      industryInsights: {
        keyInsights: raw.market.keyInsights,
        risks: raw.market.risks,
        whatToTestFirst: raw.market.whatToTestFirst,
      },
      competitors: raw.competitors.length,
      competitorList: raw.competitors,
      marketReports: research?.marketReports || [],
      marketGap: raw.marketGap,
    },
    sources: buildSources(research),
    citations: {
      summary: lab ? {
        recommendation: getLookupCitation(lab.summary.recommendation, citationLookup) || undefined,
        openRisks: lab.summary.openRisks.map((item) => getLookupCitation(item, citationLookup)),
        nextMoves: lab.summary.nextMoves.map((item) => getLookupCitation(item, citationLookup)),
      } : undefined,
      council: lab?.council.judge ? {
        finalTake: lab.council.judge.citations?.finalTake,
        bullCase: alignCitationArray(lab.council.judge.bullCase.length, lab.council.judge.citations?.bullCase || []),
        bearCase: alignCitationArray(lab.council.judge.bearCase.length, lab.council.judge.citations?.bearCase || []),
        decidingFactors: alignCitationArray(lab.council.judge.decidingFactors.length, lab.council.judge.citations?.decidingFactors || []),
      } : undefined,
      validation: {
        marketInsights: alignCitationArray(raw.market.keyInsights.length, raw.citations?.market?.keyInsights || []),
        risks: alignCitationArray(raw.market.risks.length, raw.citations?.market?.risks || []),
        whatToTestFirst: alignCitationArray(raw.market.whatToTestFirst.length, raw.citations?.market?.whatToTestFirst || []),
        competitors: alignCitationArray(raw.competitors.length, raw.citations?.competitors || []),
        marketGap: raw.citations?.marketGap,
        marketSizing: lab?.marketSizing ? lab.marketSizing.map(() => null) : undefined,
        marketReports: research?.marketReports?.length
          ? research.marketReports.map((report) => report.sourceIds?.length ? { sourceIds: report.sourceIds } : null)
          : undefined,
      },
      strategy: {
        distributionChannels: alignCitationArray(raw.distributionChannels.length, raw.citations?.distributionChannels || []),
      },
    },
    customerSegments: raw.customerSegments,
    promptChain: raw.promptChain,
    artifacts,
    ...(lab ? { lab } : {}),
  };
}
