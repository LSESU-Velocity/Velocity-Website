import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { setCorsHeaders } from '../lib/serverAuth.js';
import {
  SubmitRequestSchema,
  checkMinimumCompleteness,
  formatMissingRequirements,
  type SubmitResponse,
} from '../lib/automation-intake/schemas.js';
import { generateDeterministicFinalBrief } from '../lib/automation-intake/deterministic.js';
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

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0]!.trim();
  return req.socket?.remoteAddress || 'unknown';
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const db = initFirebaseSafe();
  if (!db) return true;
  const now = Date.now();
  const ref = db.collection('rateLimits').doc(`intake_submit_${ip.replace(/[\/\.]/g, '_')}`);
  try {
    const doc = await ref.get();
    if (!doc.exists || (doc.data()?.resetTime ?? 0) < now) {
      await ref.set({ count: 1, resetTime: now + RATE_WINDOW_MS });
      return true;
    }
    const data = doc.data()!;
    if (data.count >= RATE_LIMIT) return false;
    await ref.update({ count: data.count + 1 });
    return true;
  } catch (error) {
    console.warn('Intake submit rate limit check failed:', error instanceof Error ? error.message : 'unknown');
    return true;
  }
}

function bodyIsTooLarge(req: VercelRequest): boolean {
  const len = Number(req.headers['content-length'] ?? 0);
  return Number.isFinite(len) && len > 0 && len > MAX_BODY_BYTES;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return res.status(200).end();

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

  const ip = getClientIp(req);
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
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
    const finalBrief = await generateDeterministicFinalBrief(sanitizedDraft);

    const { savedId } = await saveIntakeSubmission({
      draft: sanitizedDraft,
      finalBrief,
      submissionMode,
      ipHash: hashIp(ip),
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
