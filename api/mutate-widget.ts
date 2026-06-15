import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceLaunchpadRateLimit, getLaunchpadProviderKey, handleCors } from '../lib/serverSecurity.js';
import { mutateWidget } from '../lib/launchpad-lab/index.js';
import { DashboardDTOSchema, LabPhaseSchema, WidgetTargetSchema } from '../lib/launchpad-lab/schemas.js';
import { getLaunchpadInputSafetyIssue, sanitizeUserInput } from '../lib/launchpad-lab/sanitize.js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userApiKey = getLaunchpadProviderKey(req);

  if (!userApiKey) {
    return res.status(401).json({ error: 'An AI provider API key is required.' });
  }

  try {
    let parsedBody: Record<string, unknown>;
    if (typeof req.body === 'string') {
      try {
        parsedBody = JSON.parse(req.body || '{}');
      } catch {
        return res.status(400).json({ error: 'Request body must be valid JSON' });
      }
    } else {
      parsedBody = (req.body ?? {}) as Record<string, unknown>;
    }

    const idea = parsedBody?.idea;
    const instruction = parsedBody?.instruction;

    if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
      return res.status(400).json({ error: 'Idea description is required (min 3 characters)' });
    }

    if (!instruction || typeof instruction !== 'string' || instruction.trim().length < 3) {
      return res.status(400).json({ error: 'A widget update request is required (min 3 characters)' });
    }

    const safetyIssue = getLaunchpadInputSafetyIssue(`${idea}\n${instruction}`);
    if (safetyIssue) {
      return res.status(400).json({ error: safetyIssue });
    }

    const phaseResult = LabPhaseSchema.safeParse(parsedBody?.phaseId);
    if (!phaseResult.success) {
      return res.status(400).json({ error: 'Unknown phase id.' });
    }

    const targetResult = WidgetTargetSchema.safeParse(parsedBody?.targetId);
    if (!targetResult.success) {
      return res.status(400).json({ error: 'Unknown widget target id.' });
    }

    const analysisResult = DashboardDTOSchema.safeParse(parsedBody?.analysis);
    if (!analysisResult.success) {
      return res.status(400).json({ error: 'The analysis payload does not match the expected shape.' });
    }

    if (await enforceLaunchpadRateLimit(req, res, {
      prefix: 'lp_mutate',
      limit: 60,
      windowMs: 24 * 60 * 60 * 1000,
      minGapMs: 2_000,
    })) {
      return;
    }

    const outcome = await mutateWidget({
      apiKey: userApiKey.trim(),
      idea: sanitizeUserInput(idea.trim()),
      analysis: analysisResult.data,
      phaseId: phaseResult.data,
      targetId: targetResult.data,
      instruction: sanitizeUserInput(instruction.trim(), 1000),
    });

    if (!outcome.success) {
      return res.status(outcome.statusCode).json(
        outcome.details
          ? { error: outcome.error, details: outcome.details }
          : { error: outcome.error },
      );
    }

    return res.status(200).json({
      data: outcome.data,
      summary: outcome.summary,
      phaseId: outcome.phaseId,
      targetId: outcome.targetId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Widget mutation error:', message);
    return res.status(500).json({ error: 'Failed to update widget' });
  }
}
