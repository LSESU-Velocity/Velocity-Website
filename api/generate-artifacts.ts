import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLaunchpadProviderKey, handleCors } from '../lib/serverSecurity.js';
import { DashboardDTOSchema, generateFounderArtifacts } from '../lib/launchpad-lab/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userApiKey = getLaunchpadProviderKey(req);

  if (!userApiKey) {
    return res.status(401).json({ error: 'A Google AI Studio API key is required.' });
  }

  try {
    let parsedBody: Record<string, unknown>;
    if (typeof req.body === 'string') {
      try {
        parsedBody = JSON.parse(req.body || '{}') as Record<string, unknown>;
      } catch {
        return res.status(400).json({ error: 'Request body must be valid JSON' });
      }
    } else {
      parsedBody = (req.body ?? {}) as Record<string, unknown>;
    }

    const idea = parsedBody.idea;
    const analysis = parsedBody.analysis;

    if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
      return res.status(400).json({ error: 'Idea description is required (min 3 characters)' });
    }

    const validatedAnalysis = DashboardDTOSchema.parse(analysis);
    const outcome = await generateFounderArtifacts({
      apiKey: userApiKey.trim(),
      idea: idea.trim(),
      analysis: validatedAnalysis,
    });

    if (!outcome.success) {
      console.error('Founder asset generation failed:', outcome.error, outcome.details ? `| details: ${outcome.details}` : '');
      return res.status(outcome.statusCode).json(
        outcome.details
          ? { error: outcome.error, details: outcome.details }
          : { error: outcome.error }
      );
    }

    return res.status(200).json(outcome.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Founder asset generation error:', message);
    return res.status(500).json({ error: 'Failed to generate founder assets' });
  }
}
