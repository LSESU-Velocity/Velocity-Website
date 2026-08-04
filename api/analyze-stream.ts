import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { parseJsonBody, requireMethod } from '../lib/apiHelpers.js';
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
  if (requireMethod(req, res, 'POST')) return;

  const userApiKey = getLaunchpadProviderKey(req);

  if (!userApiKey) {
    return res.status(401).json({ error: 'An AI provider API key is required.' });
  }

  const parsedBody = parseJsonBody(req, res);
  if (!parsedBody.ok) return;
  const body = parsedBody.body;

  const idea = body?.idea;

  if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
    return res.status(400).json({ error: 'Idea description is required (min 3 characters)' });
  }

  const safetyIssue = getLaunchpadInputSafetyIssue(idea);
  if (safetyIssue) {
    return res.status(400).json({ error: safetyIssue });
  }

  const sanitizedIdea = sanitizeUserInput(idea.trim());

  const rawClarifications = body?.clarifications;
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
  if (body?.intake !== undefined && body?.intake !== null) {
    const parsedIntake = PresetIntakeSchema.safeParse(body.intake);
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

  // A closed connection before the response finished means the client is
  // gone: abort the in-flight model calls instead of billing a dead run.
  const abortController = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  function sendEvent(event: string, data: unknown) {
    if (res.writableEnded || res.destroyed) return;
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
      signal: abortController.signal,
    });

    if (abortController.signal.aborted) {
      // Nobody is listening; end without spending time serializing events.
      res.end();
      return;
    }

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
    if (!abortController.signal.aborted) {
      console.error('Stream analysis error:', msg);
      sendEvent('error', { error: 'Failed to generate analysis' });
    }
  }

  res.end();
}
