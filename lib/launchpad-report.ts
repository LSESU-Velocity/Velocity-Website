/**
 * Self-contained HTML report for a Launchpad analysis.
 * No external assets: safe to download, share, and open offline.
 */
import type { AnalysisData } from './api';

function esc(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function list(items: string[]): string {
    if (!items.length) {
        return '<p class="muted">None recorded.</p>';
    }
    return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
}

function formatUsers(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return `${value}`;
}

export function buildAnalysisReportHtml(input: { idea: string; data: AnalysisData; generatedAt?: Date }): string {
    const { idea, data } = input;
    const generatedAt = input.generatedAt ?? new Date();
    const lab = data.lab;
    const judge = lab?.council?.judge;
    const sources = data.sources?.documents || [];

    const sizingSection = lab?.marketSizing?.length
        ? `<table>
            <thead><tr><th>Tier</th><th>Scope</th><th>Users</th></tr></thead>
            <tbody>
                ${lab.marketSizing.map((point) => `<tr><td>${esc(point.label)}</td><td>${esc(point.title)}</td><td>${esc(formatUsers(point.value))}</td></tr>`).join('')}
            </tbody>
        </table>`
        : '<p class="muted">No directional sizing recorded.</p>';

    const councilSection = judge
        ? `<p class="badge">Verdict: ${esc(judge.verdict)}</p>
           <p>${esc(judge.finalTake)}</p>
           <h3>Bull is right about</h3>${list(judge.bullCase)}
           <h3>Bear is right about</h3>${list(judge.bearCase)}
           <h3>What settles it</h3>${list(judge.decidingFactors)}`
        : '<p class="muted">No council verdict recorded.</p>';

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(data.identity.name)} | Launchpad Report</title>
<style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #0b0b0d; color: #ececf0; font: 15px/1.65 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .page { max-width: 880px; margin: 0 auto; padding: 48px 28px 96px; }
    header { border-bottom: 1px solid #26262c; padding-bottom: 28px; margin-bottom: 36px; }
    .kicker { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #8a8a94; }
    h1 { font-size: 40px; letter-spacing: -0.02em; margin: 10px 0 4px; }
    .tagline { font-style: italic; color: #b9b9c2; margin: 0 0 14px; }
    .idea { color: #9d9da7; font-size: 14px; }
    h2 { font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase; color: #ff4747; margin: 44px 0 14px; }
    h3 { font-size: 14px; margin: 18px 0 6px; color: #d9d9e0; }
    p { margin: 8px 0; }
    ul { margin: 8px 0; padding-left: 20px; }
    li { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; }
    th, td { border: 1px solid #26262c; padding: 9px 12px; text-align: left; vertical-align: top; }
    th { background: #141418; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #9d9da7; }
    .stat-row { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 18px; }
    .stat { flex: 1 1 160px; border: 1px solid #26262c; border-radius: 14px; padding: 14px 16px; background: #121216; }
    .stat .label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8a94; }
    .stat .value { font-size: 26px; font-weight: 700; margin-top: 6px; }
    .badge { display: inline-block; border: 1px solid #3a3a44; border-radius: 999px; padding: 3px 12px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #c9c9d2; }
    .muted { color: #77777f; }
    pre { background: #121216; border: 1px solid #26262c; border-radius: 12px; padding: 14px 16px; white-space: pre-wrap; word-wrap: break-word; font-size: 13px; color: #c9c9d2; }
    a { color: #7cc0ff; word-break: break-all; }
    footer { margin-top: 56px; border-top: 1px solid #26262c; padding-top: 16px; font-size: 12px; color: #77777f; }
    @media print { body { background: #fff; color: #111; } }
</style>
</head>
<body>
<div class="page">
    <header>
        <p class="kicker">Velocity Launchpad · Startup Analysis</p>
        <h1>${esc(data.identity.name)}</h1>
        <p class="tagline">${esc(data.identity.tagline)}</p>
        <p class="idea"><strong>Idea:</strong> ${esc(idea)}</p>
        ${lab ? `
        <div class="stat-row">
            <div class="stat"><div class="label">Confidence</div><div class="value">${esc(lab.summary.confidenceScore)}/100</div></div>
            <div class="stat"><div class="label">Confidence band</div><div class="value">${esc(lab.summary.confidenceLabel)}</div></div>
            <div class="stat"><div class="label">Competitors mapped</div><div class="value">${esc(data.validation.competitorList.length)}</div></div>
            <div class="stat"><div class="label">Grounded sources</div><div class="value">${esc(sources.length)}</div></div>
        </div>` : ''}
    </header>

    ${lab ? `
    <section>
        <h2>Recommendation</h2>
        <p>${esc(lab.summary.recommendation)}</p>
        <h3>Open risks</h3>${list(lab.summary.openRisks)}
        <h3>Next moves</h3>${list(lab.summary.nextMoves)}
    </section>` : ''}

    <section>
        <h2>Analyst Council</h2>
        ${councilSection}
    </section>

    <section>
        <h2>Market Sizing</h2>
        ${sizingSection}
    </section>

    <section>
        <h2>Market Position</h2>
        <p><strong>Your gap:</strong> ${esc(data.validation.marketGap.yourGap)}</p>
        <p class="muted">Axes: ${esc(data.validation.marketGap.xAxis.label)} (${esc(data.validation.marketGap.xAxis.low)} → ${esc(data.validation.marketGap.xAxis.high)}) ×
        ${esc(data.validation.marketGap.yAxis.label)} (${esc(data.validation.marketGap.yAxis.low)} → ${esc(data.validation.marketGap.yAxis.high)})</p>
        <table>
            <thead><tr><th>Competitor</th><th>Strength</th><th>Weakness</th></tr></thead>
            <tbody>
                ${data.validation.competitorList.map((competitor) => `<tr><td>${esc(competitor.name)}${competitor.website ? `<br /><a href="https://${esc(competitor.website.replace(/^https?:\/\//, ''))}">${esc(competitor.website)}</a>` : ''}</td><td>${esc(competitor.strength)}</td><td>${esc(competitor.weakness)}</td></tr>`).join('')}
            </tbody>
        </table>
    </section>

    <section>
        <h2>Market Evidence</h2>
        <h3>Key insights</h3>${list(data.validation.industryInsights.keyInsights)}
        <h3>Risks</h3>${list(data.validation.industryInsights.risks)}
        <h3>What to test first</h3>${list(data.validation.industryInsights.whatToTestFirst)}
        ${data.validation.marketReports.length ? `
        <h3>Market reports</h3>
        <ul>
            ${data.validation.marketReports.map((report) => `<li><strong>${esc(report.title)}</strong>, ${esc(report.publisher)}: ${esc(report.keyStat)}<br /><a href="${esc(report.url)}">${esc(report.url)}</a></li>`).join('')}
        </ul>` : ''}
    </section>

    <section>
        <h2>Customer Segments</h2>
        <table>
            <thead><tr><th>Segment</th><th>Age</th><th>Income</th><th>Key interest</th></tr></thead>
            <tbody>
                ${data.customerSegments.map((segment) => `<tr><td>${esc(segment.segment)}</td><td>${esc(segment.age)}</td><td>${esc(segment.income)}</td><td>${esc(segment.interest)}</td></tr>`).join('')}
            </tbody>
        </table>
    </section>

    <section>
        <h2>Monetization</h2>
        <table>
            <thead><tr><th>Model</th><th>Pricing</th><th>Strategies</th><th>Who does this well</th></tr></thead>
            <tbody>
                ${data.monetization.map((entry) => `<tr><td>${esc(entry.model)}</td><td>${esc(entry.pricing)}</td><td>${esc(entry.strategies.join('; '))}</td><td>${esc(entry.examples)}</td></tr>`).join('')}
            </tbody>
        </table>
    </section>

    <section>
        <h2>Distribution Channels</h2>
        <table>
            <thead><tr><th>Channel</th><th>Type</th><th>Size</th></tr></thead>
            <tbody>
                ${data.distributionChannels.map((channel) => `<tr><td>${esc(channel.name)}</td><td>${esc(channel.type)}</td><td>${esc(channel.members)}</td></tr>`).join('')}
            </tbody>
        </table>
    </section>

    <section>
        <h2>Build Prompt Chain</h2>
        ${data.promptChain.map((step) => `<h3>Step ${esc(step.step)}: ${esc(step.title)}</h3><pre>${esc(step.prompt)}</pre>`).join('')}
    </section>

    ${sources.length ? `
    <section>
        <h2>Grounded Sources</h2>
        <ul>
            ${sources.map((source) => `<li><strong>${esc(source.id)}</strong>: ${esc(source.title)} (${esc(source.domain)})<br /><a href="${esc(source.url)}">${esc(source.url)}</a></li>`).join('')}
        </ul>
    </section>` : ''}

    <footer>
        Generated by Velocity Launchpad on ${esc(generatedAt.toUTCString())}. Directional analysis: validate before betting the company on it.
    </footer>
</div>
</body>
</html>`;
}
