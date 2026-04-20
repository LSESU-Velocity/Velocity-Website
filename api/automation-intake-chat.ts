import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { setCorsHeaders } from '../lib/serverAuth.js';
import {
  ChatRequestSchema,
  type ChatResponse,
} from '../lib/automation-intake/schemas.js';
import { advanceDeterministicDraftFromAnswer } from '../lib/automation-intake/deterministic.js';

const MAX_BODY_BYTES = 48 * 1024; // 48 KB — drafts with trimmed transcripts fit comfortably.
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;
const MIN_REQUEST_GAP_MS = 1500;

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

async function checkRateLimit(
  ip: string,
): Promise<{ allowed: true } | { allowed: false; reason: 'burst' | 'window' }> {
  const db = initFirebaseSafe();
  if (!db) return { allowed: true }; // no firebase configured → skip rate limit in dev
  const now = Date.now();
  const ref = db.collection('rateLimits').doc(`intake_chat_${ip.replace(/[\/\.]/g, '_')}`);
  try {
    const doc = await ref.get();
    if (!doc.exists || (doc.data()?.resetTime ?? 0) < now) {
      await ref.set({ count: 1, resetTime: now + RATE_WINDOW_MS, lastRequestAt: now });
      return { allowed: true };
    }
    const data = doc.data()!;
    if ((data.lastRequestAt ?? 0) + MIN_REQUEST_GAP_MS > now) {
      return { allowed: false, reason: 'burst' };
    }
    if (data.count >= RATE_LIMIT) return { allowed: false, reason: 'window' };
    await ref.update({ count: data.count + 1, lastRequestAt: now });
    return { allowed: true };
  } catch (error) {
    console.warn('Intake chat rate limit check failed:', error instanceof Error ? error.message : 'unknown');
    return { allowed: true };
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

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error:
        rateLimit.reason === 'burst'
          ? 'Please wait a moment before sending another message.'
          : 'Too many requests. Please slow down.',
    });
  }

  try {
    const result = advanceDeterministicDraftFromAnswer({
      draft: parsed.data.draft,
      answer: parsed.data.answer,
    });

    const response: ChatResponse = {
      draft: result.draft,
      assistantMessage: result.assistantMessage,
      readyForReview: result.readyForReview,
    };
    return res.status(200).json(response);
  } catch (error) {
    console.error('Intake chat error:', error instanceof Error ? error.message : 'unknown');
    return res.status(500).json({ error: 'Unable to advance intake right now. Please try again.' });
  }
}
