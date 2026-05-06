import type { VercelRequest, VercelResponse } from '@vercel/node';

import {
  checkFirestoreRateLimit,
  getTrustedClientIp,
  handleCors,
  hashClientIp,
} from '../lib/serverSecurity.js';
import {
  MagicEmailStartRequestSchema,
  type EmailVerificationStatusResponse,
  type MagicEmailStartResponse,
} from '../lib/automation-intake/schemas.js';
import {
  buildClearIntakeEmailCookie,
  createMagicVerificationUrl,
  deleteMagicEmailLink,
  getVerifiedIntakeEmail,
  initAutomationIntakeFirebase,
  normalizeMagicEmail,
  redeemMagicEmailToken,
  sendMagicEmail,
  storeMagicEmailLink,
} from '../lib/automation-intake/email-verification.js';

const MAX_BODY_BYTES = 8 * 1024;
const IP_RATE_LIMIT = 5;
const IP_RATE_WINDOW_MS = 60 * 1000;
const EMAIL_RATE_LIMIT = 3;
const EMAIL_RATE_WINDOW_MS = 15 * 60 * 1000;
const MIN_REQUEST_GAP_MS = 5 * 1000;

type EmailAction = 'start' | 'status' | 'verify';

function bodyIsTooLarge(req: VercelRequest): boolean {
  const len = Number(req.headers['content-length'] ?? 0);
  return Number.isFinite(len) && len > 0 && len > MAX_BODY_BYTES;
}

function firstQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
}

function getAction(req: VercelRequest): EmailAction | null {
  const action = firstQueryValue(req.query.action);
  if (action === 'start' || action === 'status' || action === 'verify') return action;
  return null;
}

function getToken(req: VercelRequest): string {
  return firstQueryValue(req.query.token);
}

function redirect(res: VercelResponse, location: string): void {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}

async function readJsonBody(req: VercelRequest): Promise<unknown> {
  return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
}

async function handleStart(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (bodyIsTooLarge(req)) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const parsed = MagicEmailStartRequestSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  const db = initAutomationIntakeFirebase();
  if (!db) {
    return res.status(503).json({ error: 'Email verification is temporarily unavailable.' });
  }

  const ip = getTrustedClientIp(req);
  const email = normalizeMagicEmail(parsed.data.email);
  const ipRateLimit = await checkFirestoreRateLimit(db, {
    prefix: 'intake_magic_email_ip',
    identifier: ip,
    limit: IP_RATE_LIMIT,
    windowMs: IP_RATE_WINDOW_MS,
    minGapMs: MIN_REQUEST_GAP_MS,
  });

  if (!ipRateLimit.allowed) {
    return res.status(429).json({
      error:
        ipRateLimit.reason === 'burst'
          ? 'Please wait a moment before requesting another verification email.'
          : 'Too many verification emails. Please try again later.',
    });
  }

  const emailRateLimit = await checkFirestoreRateLimit(db, {
    prefix: 'intake_magic_email_address',
    identifier: email,
    limit: EMAIL_RATE_LIMIT,
    windowMs: EMAIL_RATE_WINDOW_MS,
    minGapMs: MIN_REQUEST_GAP_MS,
  });

  if (!emailRateLimit.allowed) {
    return res.status(429).json({
      error: 'Too many verification emails for this address. Please try again later.',
    });
  }

  const magicLink = await storeMagicEmailLink({
    db,
    email,
    sessionId: parsed.data.sessionId,
    ipHash: hashClientIp(ip),
  });
  const verificationUrl = createMagicVerificationUrl(req, magicLink.token);

  const sendResult = await sendMagicEmail({ email, verificationUrl });
  if (!sendResult.ok) {
    await deleteMagicEmailLink(db, magicLink.tokenHash);
    console.error('Automation intake magic email failed:', sendResult.error);
    return res.status(503).json({ error: 'Unable to send verification email right now.' });
  }

  const response: MagicEmailStartResponse = {
    success: true,
    email,
  };

  if (process.env.NODE_ENV === 'development') {
    response.devVerificationUrl = verificationUrl;
  }

  return res.status(200).json(response);
}

async function handleStatus(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = initAutomationIntakeFirebase();
  const verified = await getVerifiedIntakeEmail(db, req);

  if (!verified.verified && verified.reason && verified.reason !== 'missing') {
    res.setHeader('Set-Cookie', buildClearIntakeEmailCookie(req));
  }

  const response: EmailVerificationStatusResponse = {
    verified: verified.verified,
    email: verified.email,
    expiresAt: verified.expiresAt,
  };

  return res.status(200).json(response);
}

async function handleVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = initAutomationIntakeFirebase();
  if (!db) {
    res.setHeader('Set-Cookie', buildClearIntakeEmailCookie(req));
    redirect(res, '/automation-intake?intakeEmailVerified=0');
    return;
  }

  const redeemed = await redeemMagicEmailToken({
    db,
    req,
    token: getToken(req),
  });

  if (!redeemed.ok) {
    res.setHeader('Set-Cookie', buildClearIntakeEmailCookie(req));
    redirect(res, '/automation-intake?intakeEmailVerified=0');
    return;
  }

  res.setHeader('Set-Cookie', redeemed.cookie);
  redirect(res, redeemed.redirectTo);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  res.setHeader('Cache-Control', 'no-store');

  const action = getAction(req);
  if (action === 'start') return handleStart(req, res);
  if (action === 'status') return handleStatus(req, res);
  if (action === 'verify') return handleVerify(req, res);

  return res.status(400).json({ error: 'Invalid email verification action.' });
}
