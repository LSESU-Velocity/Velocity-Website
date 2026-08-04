import type { VercelRequest, VercelResponse } from '@vercel/node';

import { parseJsonBody, rejectOversizedBody, requireMethod } from '../lib/apiHelpers.js';
import { tryInitFirebaseAdmin } from '../lib/firebaseAdmin.js';
import {
  checkFirestoreRateLimit,
  getTrustedClientIp,
  handleCors,
  hashClientIp,
} from '../lib/serverSecurity.js';
import {
  SubmitRequestSchema,
  checkMinimumCompleteness,
  formatMissingRequirements,
  type SubmitResponse,
} from '../lib/automation-intake/schemas.js';
import { generateFinalBrief } from '../lib/automation-intake/engine.js';
import { sanitizeDraftForServer } from '../lib/automation-intake/sanitize.js';
import { saveIntakeSubmission } from '../lib/automation-intake/persistence.js';

const MAX_BODY_BYTES = 96 * 1024; // 96 KB: full transcript included at submit time.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (requireMethod(req, res, 'POST')) return;
  if (rejectOversizedBody(req, res, MAX_BODY_BYTES)) return;

  const parsedBody = parseJsonBody(req, res);
  if (!parsedBody.ok) return;

  const parsed = SubmitRequestSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid submission' });
  }

  const { draft, submissionMode, honeypot } = parsed.data;

  // Silent-reject honeypot hits. Return a convincing 200 so bots don't learn.
  if (honeypot && honeypot.trim().length > 0) {
    return res.status(200).json({ error: 'Thanks!' });
  }

  const db = tryInitFirebaseAdmin();
  const ip = getTrustedClientIp(req);
  const rateLimit = await checkFirestoreRateLimit(db, {
    prefix: 'intake_submit',
    identifier: ip,
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    if (rateLimit.reason === 'unavailable') {
      return res.status(503).json({ error: 'Rate limiting is temporarily unavailable. Please try again.' });
    }

    return res.status(429).json({ error: 'Too many submissions. Please try again in a minute.' });
  }

  // Re-validate minimum completeness server-side (fail-closed).
  const missing = checkMinimumCompleteness(draft);
  if (missing.length > 0) {
    return res
      .status(400)
      .json({ error: `Submission is missing required detail: ${formatMissingRequirements(missing)}.` });
  }

  // Drop empty-named workflows before anything downstream sees the draft: these
  // come from partial extraction or the form's "add workflow" shortcut and
  // carry no useful data.
  const cleanedDraft = {
    ...draft,
    workflows: draft.workflows.filter((w) => w.name && w.name.trim().length > 0),
  };
  const rawTranscript = cleanedDraft.transcript;
  const sanitizedDraftBase = sanitizeDraftForServer(cleanedDraft);
  const sanitizedDraft = {
    ...sanitizedDraftBase,
    workflows: sanitizedDraftBase.workflows.filter((w) => w.name && w.name.trim().length > 0),
  };
  const missingAfterSanitize = checkMinimumCompleteness(sanitizedDraft);
  if (missingAfterSanitize.length > 0) {
    return res
      .status(400)
      .json({ error: `Submission is missing required detail: ${formatMissingRequirements(missingAfterSanitize)}.` });
  }

  try {
    const finalBrief = await generateFinalBrief(sanitizedDraft);

    const { savedId } = await saveIntakeSubmission({
      draft: sanitizedDraft,
      rawTranscript,
      finalBrief,
      submissionMode,
      ipHash: hashClientIp(ip),
    });

    const response: SubmitResponse = {
      success: true,
      draft: { ...sanitizedDraft, status: 'submitted', finalBrief },
      savedId,
      finalBrief,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Intake submit error:', error instanceof Error ? error.message : 'unknown');
    return res.status(500).json({ error: 'Unable to save your submission right now. Please try again.' });
  }
}
