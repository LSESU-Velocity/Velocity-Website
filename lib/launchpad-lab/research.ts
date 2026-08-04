import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createResearchModel } from './model.js';
import {
  GroundedResearchSchema,
  type CitationRef,
  type GroundedResearch,
  type MarketReport,
  type SourceCategory,
  type SourceDocument,
} from './schemas.js';

interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

interface GroundingSupport {
  segment?: {
    startIndex?: number;
    endIndex?: number;
    text?: string;
  };
  groundingChunkIndices?: number[];
}

interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
}

interface TextCitationItem {
  text: string;
  citation?: CitationRef;
}

interface CompetitorCitationItem {
  name: string;
  website: string;
  strength: string;
  weakness: string;
  citation?: CitationRef;
}

interface DistributionCitationItem {
  name: string;
  type: string;
  members: string;
  citation?: CitationRef;
}

type MarketReportCitationItem = MarketReport;

export interface GroundedResearchPacket {
  summary: string;
  queries: string[];
  sources: SourceDocument[];
  marketInsights: TextCitationItem[];
  risks: TextCitationItem[];
  whatToTestFirst: TextCitationItem[];
  competitors: CompetitorCitationItem[];
  distributionChannels: DistributionCitationItem[];
  marketReports: MarketReportCitationItem[];
  sourceCatalog: string;
  evidenceDigest: string;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeExternalUrl(value: string): string | null {
  const trimmed = normalizeWhitespace(value)
    .replace(/^["'([{<]+/, '')
    .replace(/[>"')\]}.,;:!?]+$/g, '');

  if (!trimmed) {
    return null;
  }

  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function getRawText(message: AIMessage): string {
  if (typeof message.text === 'string' && message.text.trim()) {
    return message.text;
  }

  if (typeof message.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
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

  return '';
}

function getGroundingMetadata(message: AIMessage): GroundingMetadata | null {
  const responseMetadata = (message.response_metadata ?? {}) as Record<string, unknown>;
  const metadata =
    responseMetadata['groundingMetadata'] ??
    responseMetadata['grounding_metadata'] ??
    null;

  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  return metadata as GroundingMetadata;
}

function getDomain(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./i, '');
  } catch {
    return value;
  }
}

const BLOCKED_DOMAIN_SUFFIXES = [
  'accessnewswire.com',
  'benzinga.com',
  'businesswire.com',
  'marketintelo.com',
  'businessresearchinsights.com',
  'custommarketinsights.com',
  'databridgemarketresearch.com',
  'digitaljournal.com',
  'fortunebusinessinsights.com',
  'futuremarketinsights.com',
  'globalmarketestimates.com',
  'marketresearchfuture.com',
  'marketresearchintellect.com',
  'gminsights.com',
  'grandviewresearch.com',
  'industryarc.com',
  'marknteladvisors.com',
  'marketdigits.com',
  'marketsandmarkets.com',
  'maximizemarketresearch.com',
  'precedenceresearch.com',
  'pressreleasepoint.com',
  'reportlinker.com',
  'reportsanddata.com',
  'researchandmarkets.com',
  'researchnester.com',
  'openpr.com',
  'einnews.com',
  'sphericalinsights.com',
  'straitsresearch.com',
  'techsciresearch.com',
  'thebusinessresearchcompany.com',
  'towardshealthcare.com',
  'verifiedmarketresearch.com',
  'globenewswire.com',
  'prnewswire.com',
  'skyquestt.com',
] as const;

const BLOCKED_DOMAIN_SUBSTRINGS = [
  'businessresearch',
  'databridgemarketresearch',
  'fortunebusinessinsights',
  'futuremarketinsights',
  'globalmarketestimates',
  'industryreports',
  'marketinsights',
  'marketintelligence',
  'marketresearch',
  'newswire',
  'pressrelease',
  'precedenceresearch',
  'reportsanddata',
  'researchnester',
  'sphericalinsights',
  'verifiedmarketresearch',
] as const;

const SOURCE_PREFERENCE_GUIDANCE = `Prefer high-quality source families for grounding.

Prefer official and institutional sources:
- oecd.org
- worldbank.org
- imf.org
- census.gov
- bls.gov
- bea.gov
- sec.gov
- ons.gov.uk
- gov.uk / companieshouse.gov.uk
- ec.europa.eu / eurostat

Prefer major reputable business and economics reporting:
- reuters.com
- ft.com
- theguardian.com
- bloomberg.com
- wsj.com
- economist.com
- apnews.com

Prefer reputable market/company intelligence only when official sources are not enough:
- statista.com
- crunchbase.com
- pitchbook.com
- cbinsights.com
- g2.com
- capterra.com
- producthunt.com
- github.com
- stackoverflow.com
- reddit.com
- ycombinator.com

Do not rely on low-quality market-report sites, SEO farms, generic report resellers, press-release wires, or sites like Market Intelo and Business Research Insights unless there is no better corroborating evidence available.
If the domain name itself looks like a market-report vendor or a press-release wire, skip it.`; 

function normalizeReferenceDomain(value: string): string | null {
  const normalizedUrl = normalizeExternalUrl(value);
  return normalizedUrl ? getDomain(normalizedUrl).toLowerCase() : null;
}

function isBlockedDomain(domain: string): boolean {
  const normalized = domain.toLowerCase();
  const compact = normalized.replace(/[^a-z]/g, '');

  if (BLOCKED_DOMAIN_SUFFIXES.some((suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`))) {
    return true;
  }

  if (BLOCKED_DOMAIN_SUBSTRINGS.some((token) => compact.includes(token))) {
    return true;
  }

  const looksLikeMarketReportFarm =
    compact.includes('market') &&
    (
      compact.includes('research') ||
      compact.includes('report') ||
      compact.includes('reports') ||
      compact.includes('insight') ||
      compact.includes('insights')
    );

  return looksLikeMarketReportFarm;
}

function isAllowedReferenceUrl(value: string): boolean {
  const domain = normalizeReferenceDomain(value);
  if (!domain) {
    return false;
  }

  return !isBlockedDomain(domain);
}

function addCategory(
  usage: Map<string, Set<SourceCategory>>,
  sourceIds: string[] | undefined,
  category: SourceCategory,
) {
  for (const sourceId of sourceIds || []) {
    if (!usage.has(sourceId)) {
      usage.set(sourceId, new Set());
    }

    usage.get(sourceId)!.add(category);
  }
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function buildSources(
  metadata: GroundingMetadata,
): {
  sources: SourceDocument[];
  chunkIndexToSourceId: Map<number, string>;
  rejectedDomains: string[];
} {
  const sources: SourceDocument[] = [];
  const chunkIndexToSourceId = new Map<number, string>();
  const sourceIdByUrl = new Map<string, string>();
  const rejectedDomains = new Set<string>();

  (metadata.groundingChunks || []).forEach((chunk, index) => {
    const uri = chunk.web?.uri;
    if (!uri) {
      return;
    }

    const normalizedUrl = normalizeExternalUrl(uri);
    if (!normalizedUrl) {
      return;
    }

    const domain = getDomain(normalizedUrl).toLowerCase();
    if (isBlockedDomain(domain)) {
      rejectedDomains.add(domain);
      return;
    }

    const existingId = sourceIdByUrl.get(normalizedUrl);
    if (existingId) {
      chunkIndexToSourceId.set(index, existingId);
      return;
    }

    const id = `S${sources.length + 1}`;
    sourceIdByUrl.set(normalizedUrl, id);
    chunkIndexToSourceId.set(index, id);
    sources.push({
      id,
      title: normalizeWhitespace(chunk.web?.title || getDomain(normalizedUrl)),
      url: normalizedUrl,
      domain,
      categories: ['general'],
    });
  });

  return {
    sources,
    chunkIndexToSourceId,
    rejectedDomains: Array.from(rejectedDomains).sort(),
  };
}

function findValueRange(rawText: string, value: string, fromIndex = 0): { start: number; end: number } | null {
  const normalizedValue = normalizeWhitespace(value);
  if (!normalizedValue) {
    return null;
  }

  const exactIndex = rawText.indexOf(normalizedValue, fromIndex);
  if (exactIndex >= 0) {
    return { start: exactIndex, end: exactIndex + normalizedValue.length };
  }

  const fallbackIndex = rawText.indexOf(normalizedValue);
  if (fallbackIndex >= 0) {
    return { start: fallbackIndex, end: fallbackIndex + normalizedValue.length };
  }

  return null;
}

function toCitationRef(
  rawText: string,
  value: string,
  supports: GroundingSupport[],
  chunkIndexToSourceId: Map<number, string>,
  fromIndex = 0,
): CitationRef | undefined {
  const range = findValueRange(rawText, value, fromIndex);
  if (!range) {
    return undefined;
  }

  const sourceIds = new Set<string>();

  for (const support of supports) {
    const start = support.segment?.startIndex;
    const end = support.segment?.endIndex;

    if (typeof start !== 'number' || typeof end !== 'number' || !overlaps(range.start, range.end, start, end)) {
      continue;
    }

    for (const chunkIndex of support.groundingChunkIndices || []) {
      const sourceId = chunkIndexToSourceId.get(chunkIndex);
      if (sourceId) {
        sourceIds.add(sourceId);
      }
    }
  }

  if (!sourceIds.size) {
    return undefined;
  }

  return {
    sourceIds: Array.from(sourceIds).slice(0, 4),
  };
}

function mergeCitationRefs(...refs: Array<CitationRef | undefined>): CitationRef | undefined {
  const sourceIds = new Set<string>();

  for (const ref of refs) {
    for (const sourceId of ref?.sourceIds || []) {
      sourceIds.add(sourceId);
    }
  }

  if (!sourceIds.size) {
    return undefined;
  }

  return {
    sourceIds: Array.from(sourceIds).slice(0, 4),
  };
}

function formatCitation(ref?: CitationRef): string {
  if (!ref?.sourceIds?.length) {
    return '';
  }

  return `[${ref.sourceIds.join(', ')}]`;
}

function buildSourceCatalog(sources: SourceDocument[]): string {
  return sources
    .map((source) => `- ${source.id} | ${source.domain} | ${source.title}`)
    .join('\n');
}

function buildEvidenceDigest(packet: Omit<GroundedResearchPacket, 'sourceCatalog' | 'evidenceDigest'>): string {
  const lines: string[] = [];

  lines.push(`Research summary: ${packet.summary}`);
  lines.push('Grounded market insights:');
  for (const item of packet.marketInsights.slice(0, 4)) {
    lines.push(`- ${formatCitation(item.citation)} ${item.text}`.trim());
  }

  lines.push('Grounded risks:');
  for (const item of packet.risks.slice(0, 3)) {
    lines.push(`- ${formatCitation(item.citation)} ${item.text}`.trim());
  }

  lines.push('Grounded competitors:');
  for (const competitor of packet.competitors.slice(0, 4)) {
    lines.push(`- ${formatCitation(competitor.citation)} ${competitor.name} | ${competitor.website} | ${competitor.strength}`.trim());
  }

  lines.push('Grounded channels:');
  for (const channel of packet.distributionChannels.slice(0, 5)) {
    lines.push(`- ${formatCitation(channel.citation)} ${channel.name} | ${channel.type} | ${channel.members}`.trim());
  }

  return lines.join('\n');
}

function stripCodeFence(value: string): string {
  return value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

const RESEARCH_SECTIONS = [
  'SUMMARY',
  'MARKET_INSIGHTS',
  'RISKS',
  'WHAT_TO_TEST_FIRST',
  'COMPETITORS',
  'DISTRIBUTION_CHANNELS',
  'MARKET_REPORTS',
] as const;

type ResearchSection = (typeof RESEARCH_SECTIONS)[number];

function bulletize(line: string): string {
  return normalizeWhitespace(line.replace(/^(?:[-*]|\d+\.)\s*/, ''));
}

function trimToMax(value: string, maxLength: number): string {
  const normalized = normalizeWhitespace(value.replace(/^["']+|["']+$/g, ''));

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength).trimEnd();
}

function normalizeBoundedList(
  items: string[],
  opts: {
    maxItems: number;
    maxLength: number;
  },
): string[] {
  return Array.from(
    new Set(
      items
        .map((item) => trimToMax(bulletize(item), opts.maxLength))
        .filter(Boolean),
    ),
  ).slice(0, opts.maxItems);
}

function extractResearchSections(rawText: string): Record<ResearchSection, string[]> {
  const sections = Object.fromEntries(
    RESEARCH_SECTIONS.map((section) => [section, [] as string[]]),
  ) as Record<ResearchSection, string[]>;

  let current: ResearchSection | null = null;
  const lines = stripCodeFence(rawText).replace(/\r\n?/g, '\n').split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const headingMatch = line.match(/^(?:#+\s*)?([A-Z_]+):\s*(.*)$/);
    if (headingMatch) {
      const heading = headingMatch[1] as ResearchSection;
      if ((RESEARCH_SECTIONS as readonly string[]).includes(heading)) {
        current = heading;
        if (headingMatch[2].trim()) {
          sections[current].push(headingMatch[2].trim());
        }
        continue;
      }
    }

    if (current) {
      sections[current].push(line);
    }
  }

  return sections;
}

function parseSectionedGroundedResearch(rawText: string): GroundedResearch {
  const sections = extractResearchSections(rawText);

  const summary = trimToMax(sections.SUMMARY.map((line) => bulletize(line)).join(' '), 320);
  const marketInsights = normalizeBoundedList(sections.MARKET_INSIGHTS, { maxItems: 5, maxLength: 140 });
  const risks = normalizeBoundedList(sections.RISKS, { maxItems: 4, maxLength: 140 });
  const whatToTestFirst = normalizeBoundedList(sections.WHAT_TO_TEST_FIRST, { maxItems: 4, maxLength: 140 });

  const competitors = sections.COMPETITORS
    .map((line) => bulletize(line))
    .map((line) => line.split('|').map((part) => normalizeWhitespace(part)))
    .filter((parts) => parts.length >= 4)
    .map(([name, website, strength, weakness]) => ({
      name: trimToMax(name, 40),
      website: trimToMax(website, 80),
      strength: trimToMax(strength, 120),
      weakness: trimToMax(weakness, 120),
    }))
    .filter((competitor) => competitor.name && competitor.website && competitor.strength && competitor.weakness)
    .slice(0, 5);

  const distributionChannels = sections.DISTRIBUTION_CHANNELS
    .map((line) => bulletize(line))
    .map((line) => line.split('|').map((part) => normalizeWhitespace(part)))
    .filter((parts) => parts.length >= 3)
    .map(([name, type, members]) => ({
      name: trimToMax(name, 40),
      type: trimToMax(type, 20),
      members: trimToMax(members, 25),
    }))
    .filter((channel) => channel.name && channel.type && channel.members)
    .slice(0, 7);

  const marketReports = sections.MARKET_REPORTS
    .map((line) => bulletize(line))
    .map((line) => line.split('|').map((part) => normalizeWhitespace(part)))
    .filter((parts) => parts.length >= 4)
    .map(([title, publisher, keyStat, url]) => ({
      title: trimToMax(title, 120),
      publisher: trimToMax(publisher, 80),
      keyStat: trimToMax(keyStat, 160),
      url: trimToMax(normalizeExternalUrl(url) || url, 200),
    }))
    .filter((report) => report.title && report.publisher && report.keyStat && report.url)
    .slice(0, 4);

  const result = GroundedResearchSchema.safeParse({
    summary,
    marketInsights,
    risks,
    whatToTestFirst,
    competitors,
    distributionChannels,
    marketReports,
  });

  if (!result.success) {
    throw new Error(`Grounded research section parse failed: ${result.error.message}`);
  }

  return result.data;
}

function getRawPreview(rawText: string): string {
  return normalizeWhitespace(stripCodeFence(rawText)).slice(0, 220);
}

function extractJsonObject(rawText: string): string {
  const cleaned = stripCodeFence(rawText);

  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    return cleaned;
  }

  const start = cleaned.indexOf('{');
  if (start < 0) {
    throw new Error('Grounded research returned no JSON object.');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return cleaned.slice(start, index + 1);
      }
    }
  }

  throw new Error('Grounded research returned malformed JSON.');
}

/** Exported for unit tests: pure text-to-structure parsing with a sectioned-text fallback. */
export function parseGroundedResearch(rawText: string): GroundedResearch {
  try {
    const jsonText = extractJsonObject(rawText);
    const parsed = JSON.parse(jsonText);
    const result = GroundedResearchSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Grounded research validation failed: ${result.error.message}`);
    }

    return result.data;
  } catch (jsonError) {
    try {
      return parseSectionedGroundedResearch(rawText);
    } catch (sectionError) {
      const jsonMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
      const sectionMessage = sectionError instanceof Error ? sectionError.message : String(sectionError);
      throw new Error(
        `Grounded research parse failed. JSON: ${jsonMessage}. Sections: ${sectionMessage}. Raw preview: ${getRawPreview(rawText)}`,
      );
    }
  }
}

export async function runGroundedResearch(opts: {
  apiKey: string;
  idea: string;
  intake: {
    domain: string;
    ideaType: string;
    targetUser: string;
    coreProblem: string;
  };
  signal?: AbortSignal | null;
}): Promise<GroundedResearchPacket> {
  const groundedResearchModel = createResearchModel({
    apiKey: opts.apiKey,
    model: process.env.LAUNCHPAD_RESEARCH_MODEL || 'gemini-2.5-flash-lite',
    temperature: 0.1,
    maxOutputTokens: 8192,
  });

  const rawMessage = await groundedResearchModel.invoke([
    new SystemMessage(`You are the web research node for a startup analysis graph.

Use Google Search grounding to gather current public web evidence before any later reasoning happens.

Rules:
- Return only information that is grounded in current web results.
- Prefer primary or authoritative sources when possible.
- Use official statistics portals, regulators, company filings, and major newsrooms before niche market-report sites.
- When citing competitors, use the competitor's official site rather than listicles or profile mirrors.
- Competitors and communities must be real.
- Distribution channels should be real communities, directories, or platforms where the target user actually spends time.
- Market reports can be titled reports, official data releases, or authoritative industry articles with a concrete stat or signal.
- If you cannot find 2 trustworthy market reports, return 1 or 0 rather than using low-quality report sellers or SEO pages.
- Keep every field concise and useful for downstream product analysis.
- Do not use markdown fences.
- ${SOURCE_PREFERENCE_GUIDANCE}
- Return only these sections in plain text:
SUMMARY:
one concise sentence

MARKET_INSIGHTS:
- insight

RISKS:
- risk

WHAT_TO_TEST_FIRST:
- test

COMPETITORS:
- name | website | strength | weakness

DISTRIBUTION_CHANNELS:
- name | type | members

MARKET_REPORTS:
- title | publisher | keyStat | url`),
    new HumanMessage(`Research this startup idea for downstream analysis.

IDEA: ${opts.idea}
DOMAIN: ${opts.intake.domain}
PRODUCT TYPE: ${opts.intake.ideaType}
TARGET USER: ${opts.intake.targetUser}
CORE PROBLEM: ${opts.intake.coreProblem}

Return grounded research for:
- market insights
- execution risks
- what to test first
- real competitors with websites
- real distribution channels with audience-size cues
- up to 4 market reports or authoritative sources with one key stat or takeaway each. Return fewer when only weak sources are available.`),
  ], opts.signal ? { signal: opts.signal } : undefined) as AIMessage;

  const rawText = getRawText(rawMessage);
  const parsedResearch = parseGroundedResearch(rawText);
  const groundingMetadata = getGroundingMetadata(rawMessage);

  if (!groundingMetadata || !(groundingMetadata.groundingChunks || []).length) {
    throw new Error('Grounded research returned no source metadata.');
  }

  const { sources, chunkIndexToSourceId, rejectedDomains } = buildSources(groundingMetadata);
  if (!sources.length) {
    const rejectedSummary = rejectedDomains.length
      ? ` Rejected domains: ${rejectedDomains.slice(0, 12).join(', ')}.`
      : ' All grounded sources were blocked.';
    throw new Error(`Grounded research returned no usable sources after blocked-domain filtering.${rejectedSummary}`);
  }

  const supports = groundingMetadata.groundingSupports || [];
  const sourceUrlById = new Map(sources.map((source) => [source.id, source.url]));
  const categoryUsage = new Map<string, Set<SourceCategory>>();

  let marketCursor = 0;
  const marketInsights = parsedResearch.marketInsights.map((text) => {
    const citation = toCitationRef(rawText, text, supports, chunkIndexToSourceId, marketCursor);
    const range = findValueRange(rawText, text, marketCursor);
    if (range) {
      marketCursor = range.end;
    }
    addCategory(categoryUsage, citation?.sourceIds, 'market');
    return { text, citation };
  });

  let riskCursor = marketCursor;
  const risks = parsedResearch.risks.map((text) => {
    const citation = toCitationRef(rawText, text, supports, chunkIndexToSourceId, riskCursor);
    const range = findValueRange(rawText, text, riskCursor);
    if (range) {
      riskCursor = range.end;
    }
    addCategory(categoryUsage, citation?.sourceIds, 'market');
    return { text, citation };
  });

  let testCursor = riskCursor;
  const whatToTestFirst = parsedResearch.whatToTestFirst.map((text) => {
    const citation = toCitationRef(rawText, text, supports, chunkIndexToSourceId, testCursor);
    const range = findValueRange(rawText, text, testCursor);
    if (range) {
      testCursor = range.end;
    }
    addCategory(categoryUsage, citation?.sourceIds, 'market');
    return { text, citation };
  });

  const competitors = parsedResearch.competitors.map((competitor) => {
    const citation = mergeCitationRefs(
      toCitationRef(rawText, competitor.name, supports, chunkIndexToSourceId),
      toCitationRef(rawText, competitor.website, supports, chunkIndexToSourceId),
      toCitationRef(rawText, competitor.strength, supports, chunkIndexToSourceId),
      toCitationRef(rawText, competitor.weakness, supports, chunkIndexToSourceId),
    );
    addCategory(categoryUsage, citation?.sourceIds, 'competitor');
    return {
      ...competitor,
      citation,
    };
  });

  const distributionChannels = parsedResearch.distributionChannels.map((channel) => {
    const citation = mergeCitationRefs(
      toCitationRef(rawText, channel.name, supports, chunkIndexToSourceId),
      toCitationRef(rawText, channel.members, supports, chunkIndexToSourceId),
    );
    addCategory(categoryUsage, citation?.sourceIds, 'channel');
    return {
      ...channel,
      citation,
    };
  });

  const marketReports = parsedResearch.marketReports
    .map((report) => {
      const citation = mergeCitationRefs(
        toCitationRef(rawText, report.title, supports, chunkIndexToSourceId),
        toCitationRef(rawText, report.keyStat, supports, chunkIndexToSourceId),
      );
      const citedSourceUrl = citation?.sourceIds
        ?.map((sourceId) => sourceUrlById.get(sourceId))
        .find((value): value is string => Boolean(value));
      const normalizedReportUrl = normalizeExternalUrl(report.url);
      const resolvedUrl = citedSourceUrl || normalizedReportUrl;

      if (!resolvedUrl || !isAllowedReferenceUrl(resolvedUrl)) {
        return null;
      }

      addCategory(categoryUsage, citation?.sourceIds, 'report');
      return {
        ...report,
        url: resolvedUrl,
        ...(citation ? { sourceIds: citation.sourceIds } : {}),
      };
    });
    
  const nextMarketReports = marketReports.filter((report): report is MarketReportCitationItem => Boolean(report));

  const summaryCitation = toCitationRef(rawText, parsedResearch.summary, supports, chunkIndexToSourceId);
  addCategory(categoryUsage, summaryCitation?.sourceIds, 'general');

  const nextSources = sources.map((source) => ({
    ...source,
    categories: Array.from(categoryUsage.get(source.id) || new Set<SourceCategory>(['general'])),
  }));

  const packetBase = {
    summary: parsedResearch.summary,
    queries: groundingMetadata.webSearchQueries || [],
    sources: nextSources,
    marketInsights,
    risks,
    whatToTestFirst,
    competitors,
    distributionChannels,
    marketReports: nextMarketReports,
  };

  return {
    ...packetBase,
    sourceCatalog: buildSourceCatalog(nextSources),
    evidenceDigest: buildEvidenceDigest(packetBase),
  };
}
