import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getLaunchpadProviderKey, handleCors } from '../lib/serverSecurity.js';
import { runAnalysis } from '../lib/launchpad-lab/index.js';
import type { NodeProgress } from '../lib/launchpad-lab/index.js';

export const config = {
  maxDuration: 60,
};

function sanitizeUserInput(input: string): string {
  let sanitized = input;

  const dangerousPatterns = [
    /```/g,
    /"""/g,
    /\n\s*---+\s*\n/g,
    /\n\s*===+\s*\n/g,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|.*?\|>/g,
    /<<SYS>>|<<\/SYS>>/gi,
    /IGNORE\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
    /DISREGARD\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
    /FORGET\s+(ALL\s+)?(PREVIOUS|ABOVE|PRIOR)\s+INSTRUCTIONS?/gi,
    /NEW\s+INSTRUCTIONS?\s*:/gi,
    /SYSTEM\s*:/gi,
    /ASSISTANT\s*:/gi,
    /USER\s*:/gi,
    /HUMAN\s*:/gi,
  ];

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, ' ');
  }

  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  const MAX_IDEA_LENGTH = 500;
  if (sanitized.length > MAX_IDEA_LENGTH) {
    sanitized = sanitized.substring(0, MAX_IDEA_LENGTH);
  }

  return sanitized;
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userApiKey = getLaunchpadProviderKey(req);

  if (!userApiKey) {
    return res.status(401).json({ error: 'A Google AI Studio API key is required.' });
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

  const sanitizedIdea = sanitizeUserInput(idea.trim());

  const rawClarifications = parsedBody?.clarifications;
  let clarifications: Record<string, string> | null = null;
  if (rawClarifications !== undefined && rawClarifications !== null) {
    const parsedClarifications = ClarificationsSchema.safeParse(rawClarifications);
    if (!parsedClarifications.success) {
      return res.status(400).json({ error: 'Clarifications must be string answers keyed by field name.' });
    }
    clarifications = Object.fromEntries(
      Object.entries(parsedClarifications.data).map(([key, value]) => [key, value.trim()]),
    );
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
    });

    if ('interrupted' in outcome && outcome.interrupted) {
      sendEvent('interrupt', { reason: outcome.interrupt.reason, questions: outcome.interrupt.questions });
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
