import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../lib/serverAuth.js';
import { DashboardDTOSchema, generateFounderArtifacts } from '../lib/launchpad-lab/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userApiKey = req.headers['x-gemini-key'] as string | undefined;

  if (!userApiKey || typeof userApiKey !== 'string' || !userApiKey.trim()) {
    return res.status(401).json({ error: 'A Gemini API key is required. Pass it via the x-gemini-key header.' });
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
