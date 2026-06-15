import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { enforceLaunchpadRateLimit, getLaunchpadProviderKey, handleCors } from '../lib/serverSecurity.js';
import { runAnalysis } from '../lib/launchpad-lab/index.js';
import type { NodeProgress } from '../lib/launchpad-lab/index.js';
import { getLaunchpadInputSafetyIssue, sanitizeUserInput } from '../lib/launchpad-lab/sanitize.js';
import type { IdeaIntake } from '../lib/launchpad-lab/schemas.js';

export const config = {
  // The pipeline runs ~20-30s nominally; cold starts plus a slow research
  // phase need headroom so a timeout never discards a fully billed run.
  maxDuration: 120,
};

const ClarificationsSchema = z.record(z.string().max(500)).superRefine((value, ctx) => {
  const entries = Object.entries(value);
  if (entries.length > 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Too many clarification answers',
    });
  }

  for (const [key] of entries) {
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid clarification field',
        path: [key],
      });
    }
  }
});

const PresetIntakeSchema = z.object({
  idea: z.string().max(600),
  domain: z.string().max(160),
  ideaType: z.string().max(160),
  targetUser: z.string().max(200),
  coreProblem: z.string().max(400),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userApiKey = getLaunchpadProviderKey(req);

  if (!userApiKey) {
    return res.status(401).json({ error: 'An AI provider API key is required.' });
  }

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

  if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
    return res.status(400).json({ error: 'Idea description is required (min 3 characters)' });
  }

  const safetyIssue = getLaunchpadInputSafetyIssue(idea);
  if (safetyIssue) {
    return res.status(400).json({ error: safetyIssue });
  }

  const sanitizedIdea = sanitizeUserInput(idea.trim());

  const rawClarifications = parsedBody?.clarifications;
  let clarifications: Record<string, string> | null = null;
  if (rawClarifications !== undefined && rawClarifications !== null) {
    const parsedClarifications = ClarificationsSchema.safeParse(rawClarifications);
    if (!parsedClarifications.success) {
      return res.status(400).json({ error: 'Clarifications must be string answers keyed by field name.' });
    }
    clarifications = Object.fromEntries(
      Object.entries(parsedClarifications.data).map(([key, value]) => [key, sanitizeUserInput(value)]),
    );
  }

  // A client resuming after an interrupt can return the intake it received,
  // so the pipeline does not pay for the classify call twice.
  let presetIntake: IdeaIntake | null = null;
  if (parsedBody?.intake !== undefined && parsedBody?.intake !== null) {
    const parsedIntake = PresetIntakeSchema.safeParse(parsedBody.intake);
    if (!parsedIntake.success) {
      return res.status(400).json({ error: 'Intake must match the interrupt payload shape.' });
    }
    presetIntake = {
      idea: sanitizedIdea,
      domain: sanitizeUserInput(parsedIntake.data.domain, 160),
      ideaType: sanitizeUserInput(parsedIntake.data.ideaType, 160),
      targetUser: sanitizeUserInput(parsedIntake.data.targetUser, 200),
      coreProblem: sanitizeUserInput(parsedIntake.data.coreProblem, 400),
    };
  }

  if (await enforceLaunchpadRateLimit(req, res, {
    prefix: 'lp_analyze',
    limit: 30,
    windowMs: 24 * 60 * 60 * 1000,
    minGapMs: 2_500,
  })) {
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  function sendEvent(event: string, data: unknown) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const onProgress = (progress: NodeProgress) => {
    sendEvent('progress', progress);
  };

  try {
    const outcome = await runAnalysis({
      apiKey: userApiKey.trim(),
      idea: sanitizedIdea,
      includeArtifacts: false,
      onProgress,
      clarifications,
      presetIntake,
    });

    if ('interrupted' in outcome && outcome.interrupted) {
      sendEvent('interrupt', {
        reason: outcome.interrupt.reason,
        questions: outcome.interrupt.questions,
        partialIntake: outcome.interrupt.partialIntake,
      });
    } else if (!outcome.success) {
      const err = outcome as import('../lib/launchpad-lab/index.js').AnalyzeError;
      sendEvent('error', { error: err.error, details: err.details });
    } else {
      sendEvent('result', outcome.data);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Stream analysis error:', msg);
    sendEvent('error', { error: 'Failed to generate analysis' });
  }

  res.end();
}
