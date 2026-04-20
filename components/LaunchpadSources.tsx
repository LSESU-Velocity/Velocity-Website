import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenText, ExternalLink, Search } from 'lucide-react';
import type { AnalysisData, CitationRef, SourceDocument } from '../lib/api';
import { getSavedAnalysisById } from '../lib/launchpad-storage';

const CATEGORY_LABELS: Record<SourceDocument['categories'][number], string> = {
  market: 'Market',
  competitor: 'Competitor',
  channel: 'Channel',
  report: 'Report',
  general: 'General',
};

function addCitationCount(counts: Map<string, number>, citation?: CitationRef | null) {
  for (const sourceId of citation?.sourceIds || []) {
    counts.set(sourceId, (counts.get(sourceId) || 0) + 1);
  }
}

function addCitationArray(counts: Map<string, number>, citations?: Array<CitationRef | null>) {
  for (const citation of citations || []) {
    addCitationCount(counts, citation);
  }
}

function normalizeExternalHref(value?: string | null) {
  const trimmed = (value || '')
    .trim()
    .replace(/^["'([{<]+/, '')
    .replace(/[>"')\]}.,;:!?]+$/g, '');

  if (!trimmed) {
    return null;
  }

  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function collectSourceUsage(data: AnalysisData): Map<string, number> {
  const counts = new Map<string, number>();

  addCitationCount(counts, data.citations?.summary?.recommendation);
  addCitationArray(counts, data.citations?.summary?.openRisks);
  addCitationArray(counts, data.citations?.summary?.nextMoves);

  addCitationCount(counts, data.citations?.council?.finalTake);
  addCitationArray(counts, data.citations?.council?.bullCase);
  addCitationArray(counts, data.citations?.council?.bearCase);
  addCitationArray(counts, data.citations?.council?.decidingFactors);

  addCitationArray(counts, data.citations?.validation?.marketInsights);
  addCitationArray(counts, data.citations?.validation?.risks);
  addCitationArray(counts, data.citations?.validation?.whatToTestFirst);
  addCitationArray(counts, data.citations?.validation?.competitors);
  addCitationCount(counts, data.citations?.validation?.marketGap);
  addCitationArray(counts, data.citations?.validation?.marketReports);

  addCitationArray(counts, data.citations?.strategy?.distributionChannels);

  return counts;
}

function getQuickLinks(data: AnalysisData) {
  const seen = new Set<string>();
  const quickLinks = [
    ...data.sources.market.map((item) => ({ ...item, group: 'Market' })),
    ...data.sources.competitors.map((item) => ({ ...item, group: 'Competitors' })),
    ...(data.sources.channels || []).map((item) => ({ ...item, group: 'Channels' })),
  ].filter((item) => {
    if (!item.url || seen.has(item.url)) {
      return false;
    }

    seen.add(item.url);
    return true;
  });

  return quickLinks;
}

function renderSourceBadges(sourceIds?: string[]) {
  if (!sourceIds?.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sourceIds.map((sourceId) => (
        <a
          key={sourceId}
          href={`#source-${sourceId}`}
          className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-2 py-1 font-sans text-[10px] uppercase tracking-[0.16em] text-sky-200"
        >
          {sourceId}
        </a>
      ))}
    </div>
  );
}

export const LaunchpadSources: React.FC = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const savedAnalysis = analysisId ? getSavedAnalysisById(analysisId) : null;

  if (!savedAnalysis) {
    return (
      <section className="min-h-screen bg-neutral-900 px-6 pb-24 pt-32 text-white">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/launchpad"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Lab
          </Link>

          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/35">Sources unavailable</p>
            <h1 className="mt-3 font-sans text-3xl font-black tracking-tight text-white">Saved analysis not found</h1>
            <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-white/60">
              This sources page only works for analyses that are still saved in your browser. Re-run the idea from Launchpad if you need a fresh grounded report.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { idea, data } = savedAnalysis;
  const sourceUsage = collectSourceUsage(data);
  const sourceDocuments = [...(data.sources.documents || [])].sort((left, right) => {
    const usageDelta = (sourceUsage.get(right.id) || 0) - (sourceUsage.get(left.id) || 0);
    if (usageDelta !== 0) {
      return usageDelta;
    }

    return left.id.localeCompare(right.id);
  });
  const quickLinks = getQuickLinks(data);
  const queryCount = data.sources.queries?.length || 0;
  const reportCount = data.validation.marketReports.length;
  const hasGroundedSources = Boolean(sourceDocuments.length || quickLinks.length || reportCount || queryCount);

  return (
    <section className="min-h-screen bg-neutral-900 px-6 pb-24 pt-32 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              to="/launchpad"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-white/70 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Lab
            </Link>

            <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.22em] text-white/35">Grounded Sources</p>
            <h1 className="mt-3 font-sans text-3xl font-black tracking-tight text-white md:text-5xl">{data.identity.name}</h1>
            <p className="mt-3 max-w-3xl font-sans text-base italic text-white/65">{data.identity.tagline}</p>
            <p className="mt-4 max-w-3xl font-sans text-sm leading-relaxed text-white/55">{idea}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-5 py-4">
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Documents</p>
              <p className="mt-2 font-sans text-3xl font-black tracking-tight text-white">{sourceDocuments.length}</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-5 py-4">
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Searches</p>
              <p className="mt-2 font-sans text-3xl font-black tracking-tight text-white">{queryCount}</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] px-5 py-4">
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Reports</p>
              <p className="mt-2 font-sans text-3xl font-black tracking-tight text-white">{reportCount}</p>
            </div>
          </div>
        </div>

        {!hasGroundedSources && (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-8">
            <p className="font-sans text-sm leading-relaxed text-white/55">
              This saved analysis does not include grounded source documents yet. Re-run the analysis after the new research flow is deployed to populate this page.
            </p>
          </div>
        )}

        {queryCount > 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-sky-300" />
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Search queries used</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.sources.queries!.map((query, index) => (
                <span
                  key={`${query}-${index}`}
                  className="rounded-full border border-white/10 bg-black/30 px-3 py-2 font-sans text-xs text-white/75"
                >
                  {query}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.validation.marketReports.length > 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2">
              <BookOpenText className="h-4 w-4 text-amber-300" />
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Market reports</p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {data.validation.marketReports.map((report, index) => (
                normalizeExternalHref(report.url) ? (
                  <a
                    key={`${report.title}-${index}`}
                    href={normalizeExternalHref(report.url)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">{report.publisher}</p>
                        <h2 className="mt-2 font-sans text-lg font-black tracking-tight text-white">{report.title}</h2>
                      </div>
                      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-sky-300" />
                    </div>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-white/65">{report.keyStat}</p>
                    {renderSourceBadges(report.sourceIds)}
                  </a>
                ) : (
                  <div
                    key={`${report.title}-${index}`}
                    className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5"
                  >
                    <div>
                      <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">{report.publisher}</p>
                      <h2 className="mt-2 font-sans text-lg font-black tracking-tight text-white">{report.title}</h2>
                    </div>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-white/65">{report.keyStat}</p>
                    {renderSourceBadges(report.sourceIds)}
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {quickLinks.length > 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Quick source links</p>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((link) => (
                normalizeExternalHref(link.url) ? (
                  <a
                    key={link.url}
                    href={normalizeExternalHref(link.url)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.16em] text-white/55">
                        {link.group}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-sky-300" />
                    </div>
                    <p className="mt-3 font-sans text-sm font-semibold text-white">{link.name}</p>
                    <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/35 break-all">{normalizeExternalHref(link.url)}</p>
                  </a>
                ) : (
                  <div
                    key={link.url}
                    className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.16em] text-white/55">
                        {link.group}
                      </span>
                    </div>
                    <p className="mt-3 font-sans text-sm font-semibold text-white">{link.name}</p>
                    <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/35 break-all">{link.url}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {sourceDocuments.length > 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/35">Saved source documents</p>
            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              {sourceDocuments.map((source) => (
                <article
                  key={source.id}
                  id={`source-${source.id}`}
                  className="rounded-[1.8rem] border border-white/10 bg-black/20 p-5 scroll-mt-32"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.16em] text-sky-200">
                          {source.id}
                        </span>
                        {source.categories.map((category) => (
                          <span
                            key={`${source.id}-${category}`}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.16em] text-white/55"
                          >
                            {CATEGORY_LABELS[category]}
                          </span>
                        ))}
                      </div>
                      <h2 className="mt-3 font-sans text-xl font-black tracking-tight text-white">{source.title}</h2>
                      <p className="mt-2 font-sans text-xs uppercase tracking-[0.16em] text-white/35">{source.domain}</p>
                    </div>

                    {normalizeExternalHref(source.url) ? (
                      <a
                        href={normalizeExternalHref(source.url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-sans text-[11px] uppercase tracking-[0.18em] text-white/75 hover:bg-white/10 hover:text-white"
                      >
                        Open source
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>

                  {sourceUsage.get(source.id) ? (
                    <p className="mt-4 font-sans text-xs uppercase tracking-[0.16em] text-emerald-300/80">
                      Referenced {sourceUsage.get(source.id)} time{sourceUsage.get(source.id) === 1 ? '' : 's'} in this analysis
                    </p>
                  ) : null}

                  {source.snippet ? (
                    <p className="mt-4 font-sans text-sm leading-relaxed text-white/70">{source.snippet}</p>
                  ) : (
                    <p className="mt-4 font-sans text-sm leading-relaxed text-white/45">
                      No snippet was saved for this result, but the source URL and category tags are preserved.
                    </p>
                  )}

                  <p className="mt-4 font-mono text-[11px] leading-relaxed text-white/35 break-all">{normalizeExternalHref(source.url) || source.url}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
