import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

const MAX_BODY_BYTES = 96 * 1024; // 96 KB — full transcript included at submit time.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

function initFirebaseSafe() {
  if (getApps().length > 0) return getFirestore();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
  privateKey = privateKey.replace(/\\n/g, '\n');
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore();
}

function bodyIsTooLarge(req: VercelRequest): boolean {
  const len = Number(req.headers['content-length'] ?? 0);
  return Number.isFinite(len) && len > 0 && len > MAX_BODY_BYTES;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (bodyIsTooLarge(req)) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  let body: unknown;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const parsed = SubmitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid submission' });
  }

  const { draft, submissionMode, honeypot } = parsed.data;

  // Silent-reject honeypot hits. Return a convincing 200 so bots don't learn.
  if (honeypot && honeypot.trim().length > 0) {
    return res.status(200).json({ error: 'Thanks!' });
  }

  const db = initFirebaseSafe();
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

  // Drop empty-named workflows before anything downstream sees the draft — these
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
