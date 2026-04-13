import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../lib/serverAuth.js';
import { mutateWidget } from '../lib/launchpad-lab/index.js';
import { DashboardDTOSchema, LabPhaseSchema, WidgetTargetSchema } from '../lib/launchpad-lab/schemas.js';

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

  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }

  return sanitized;
}

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
    const parsedBody =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body ?? {});

    const idea = parsedBody?.idea;
    const instruction = parsedBody?.instruction;

    if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
      return res.status(400).json({ error: 'Idea description is required (min 3 characters)' });
    }

    if (!instruction || typeof instruction !== 'string' || instruction.trim().length < 3) {
      return res.status(400).json({ error: 'A widget update request is required (min 3 characters)' });
    }

    const phaseId = LabPhaseSchema.parse(parsedBody?.phaseId);
    const targetId = WidgetTargetSchema.parse(parsedBody?.targetId);
    const analysis = DashboardDTOSchema.parse(parsedBody?.analysis);

    const outcome = await mutateWidget({
      apiKey: userApiKey.trim(),
      idea: sanitizeUserInput(idea.trim()),
      analysis,
      phaseId,
      targetId,
      instruction: sanitizeUserInput(instruction.trim()),
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
