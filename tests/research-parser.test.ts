import { describe, expect, it } from 'vitest';
import { parseGroundedResearch } from '../lib/launchpad-lab/research.js';

const VALID = {
  summary: 'The market is growing among small clinics.',
  marketInsights: ['Insight one', 'Insight two', 'Insight three'],
  risks: ['Risk one', 'Risk two'],
  whatToTestFirst: ['Test one', 'Test two'],
  competitors: [
    { name: 'Alpha', website: 'alpha.com', strength: 'Brand', weakness: 'Price' },
    { name: 'Beta', website: 'beta.com', strength: 'Speed', weakness: 'Support' },
    { name: 'Gamma', website: 'gamma.com', strength: 'Scale', weakness: 'Focus' },
  ],
  distributionChannels: [
    { name: 'r/dentistry', type: 'Reddit', members: '50K' },
    { name: 'DentalTown', type: 'Forum', members: '250K' },
    { name: 'Dental FB Group', type: 'Social', members: '80K' },
    { name: 'Clinic Owners Slack', type: 'Community', members: '5K' },
    { name: 'Product Hunt', type: 'Directory', members: '1M' },
  ],
  marketReports: [],
};

describe('parseGroundedResearch', () => {
  it('parses a clean JSON payload', () => {
    const parsed = parseGroundedResearch(JSON.stringify(VALID));
    expect(parsed.summary).toBe(VALID.summary);
    expect(parsed.competitors).toHaveLength(3);
  });

  it('extracts JSON wrapped in code fences and prose', () => {
    const raw = `Here is the research:\n\`\`\`json\n${JSON.stringify(VALID)}\n\`\`\``;
    expect(parseGroundedResearch(raw).summary).toBe(VALID.summary);
  });

  it('falls back to sectioned plain-text parsing', () => {
    const sectioned = [
      'SUMMARY:',
      'The market is growing among small clinics.',
      'MARKET_INSIGHTS:',
      '- Insight one',
      '- Insight two',
      '- Insight three',
      'RISKS:',
      '- Risk one',
      '- Risk two',
      'WHAT_TO_TEST_FIRST:',
      '- Test one',
      '- Test two',
      'COMPETITORS:',
      '- Alpha | alpha.com | Brand | Price',
      '- Beta | beta.com | Speed | Support',
      '- Gamma | gamma.com | Scale | Focus',
      'DISTRIBUTION_CHANNELS:',
      '- r/dentistry | Reddit | 50K',
      '- DentalTown | Forum | 250K',
      '- Dental FB Group | Social | 80K',
      '- Clinic Owners Slack | Community | 5K',
      '- Product Hunt | Directory | 1M',
      'MARKET_REPORTS:',
    ].join('\n');

    const parsed = parseGroundedResearch(sectioned);
    expect(parsed.competitors.map((c) => c.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(parsed.distributionChannels).toHaveLength(5);
  });

  it('throws a descriptive error on unusable output', () => {
    expect(() => parseGroundedResearch('total garbage with no structure')).toThrow(
      /Grounded research parse failed/,
    );
  });
});
