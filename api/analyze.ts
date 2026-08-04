import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseJsonBody, requireMethod } from '../lib/apiHelpers.js';
import { enforceLaunchpadRateLimit, getLaunchpadProviderKey, handleCors } from '../lib/serverSecurity.js';
import { runAnalysis } from '../lib/launchpad-lab/index.js';
import { getLaunchpadInputSafetyIssue, sanitizeUserInput } from '../lib/launchpad-lab/sanitize.js';

export const config = {
  maxDuration: 120,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (requireMethod(req, res, 'POST')) return;

  // Get user-supplied provider API key from header. x-gemini-key is still
  // accepted by getLaunchpadProviderKey for older clients.
  const userApiKey = getLaunchpadProviderKey(req);

  if (!userApiKey) {
    return res.status(401).json({ error: 'An AI provider API key is required.' });
  }

  try {
    const parsed = parseJsonBody(req, res);
    if (!parsed.ok) return;
    const parsedBody = parsed.body;

    const idea = parsedBody?.idea;
    const includeArtifacts = parsedBody?.includeArtifacts === true;

    if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
      return res.status(400).json({ error: 'Idea description is required (min 3 characters)' });
    }

    const safetyIssue = getLaunchpadInputSafetyIssue(idea);
    if (safetyIssue) {
      return res.status(400).json({ error: safetyIssue });
    }

    const sanitizedIdea = sanitizeUserInput(idea.trim());

    // Shares the same daily pool as the streaming endpoint.
    if (await enforceLaunchpadRateLimit(req, res, {
      prefix: 'lp_analyze',
      limit: 30,
      windowMs: 24 * 60 * 60 * 1000,
      minGapMs: 2_500,
    })) {
      return;
    }

    // Stop billing the user's key when the client disconnects mid-run.
    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    const outcome = await runAnalysis({
      apiKey: userApiKey.trim(),
      idea: sanitizedIdea,
      includeArtifacts,
      signal: abortController.signal,
    });

    if (abortController.signal.aborted) {
      return res.end();
    }

    if ('interrupted' in outcome && outcome.interrupted) {
      return res.status(422).json({
        error: 'The idea needs more detail before analysis can proceed.',
        interrupt: outcome.interrupt,
      });
    }

    if (!outcome.success && 'error' in outcome) {
      console.error('Launchpad analysis failed:', outcome.error, outcome.details ? `| details: ${outcome.details}` : '');
      return res.status(outcome.statusCode).json(
        outcome.details
          ? { error: outcome.error, details: outcome.details }
          : { error: outcome.error }
      );
    }

    if (outcome.success) {
      return res.status(200).json(outcome.data);
    }

    return res.status(500).json({ error: 'Failed to generate analysis' });
  } catch (error) {
    console.error('Analysis error:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ error: 'Failed to generate analysis' });
  }
}
