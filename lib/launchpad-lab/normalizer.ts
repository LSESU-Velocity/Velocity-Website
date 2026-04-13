/**
 * Output normalizer: adapts the raw model output to the existing dashboard DTO.
 */
import type { ArtifactBundle, RawAnalysis, DashboardDTO, DashboardLab } from './schemas.js';

/**
 * Convert the raw structured analysis output into the format
 * expected by LaunchpadDashboard.tsx.
 */
export function toDashboardDTO(
  raw: RawAnalysis,
  artifacts: ArtifactBundle = {},
  lab?: DashboardLab,
): DashboardDTO {
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
      marketGap: raw.marketGap,
    },
    customerSegments: raw.customerSegments,
    promptChain: raw.promptChain,
    artifacts,
    ...(lab ? { lab } : {}),
  };
}
