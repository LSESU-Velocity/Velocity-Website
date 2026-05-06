import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLaunchpadProviderKey, handleCors } from '../lib/serverSecurity.js';
import { runAnalysis } from '../lib/launchpad-lab/index.js';

// Sanitize user input to prevent prompt injection attacks
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get user-supplied provider API key from header. x-gemini-key is still
  // accepted by getLaunchpadProviderKey for older clients.
  const userApiKey = getLaunchpadProviderKey(req);

  if (!userApiKey) {
    return res.status(401).json({ error: 'A Google AI Studio API key is required.' });
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
    const includeArtifacts = parsedBody?.includeArtifacts === true;

    if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
      return res.status(400).json({ error: 'Idea description is required (min 3 characters)' });
    }

    // Sanitize user input to prevent prompt injection
    const sanitizedIdea = sanitizeUserInput(idea.trim());

    // Run the LangChain-based analysis pipeline
    const outcome = await runAnalysis({
      apiKey: userApiKey.trim(),
      idea: sanitizedIdea,
      includeArtifacts,
    });

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
