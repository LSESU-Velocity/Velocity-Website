import type { VercelRequest, VercelResponse } from '@vercel/node';

import { parseJsonBody, rejectOversizedBody, requireMethod } from '../lib/apiHelpers.js';
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

type EmailAction = 'start' | 'status' | 'verify' | 'confirm';

// Magic-link tokens are base64url from randomBytes: anything else is noise.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;

function firstQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
}

function getAction(req: VercelRequest): EmailAction | null {
  const action = firstQueryValue(req.query.action);
  if (action === 'start' || action === 'status' || action === 'verify' || action === 'confirm') {
    return action;
  }
  return null;
}

function getQueryToken(req: VercelRequest): string {
  const token = firstQueryValue(req.query.token);
  return TOKEN_PATTERN.test(token) ? token : '';
}

/** Token from an urlencoded confirm POST; body may be a parsed object or a raw string. */
function getBodyToken(req: VercelRequest): string {
  let token = '';
  if (typeof req.body === 'string') {
    token = new URLSearchParams(req.body).get('token') || '';
  } else if (req.body && typeof req.body === 'object') {
    const raw = (req.body as Record<string, unknown>).token;
    token = typeof raw === 'string' ? raw : '';
  }
  return TOKEN_PATTERN.test(token) ? token : '';
}

function redirect(res: VercelResponse, location: string, status = 302): void {
  res.statusCode = status;
  res.setHeader('Location', location);
  res.end();
}

/**
 * Confirmation page served on the emailed GET link. The GET consumes nothing:
 * corporate mail scanners that prefetch links can no longer burn the one-time
 * token before the human arrives. Redemption happens only on the button's POST.
 *
 * Styling is inline-attribute only and there is no script: the page must
 * render under the site CSP (script-src 'self', style-src-attr 'unsafe-inline').
 */
function renderConfirmPage(token: string): string {
  const page = 'font-family:Arial,Helvetica,sans-serif;background:#0a0a0a;color:#ffffff;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:24px';
  const card = 'max-width:420px;width:100%;border:1px solid #2a2a2a;border-radius:16px;padding:32px;background:#111111;text-align:center';
  const button = 'display:inline-block;width:100%;box-sizing:border-box;background:#ff1f1f;color:#ffffff;border:none;border-radius:9999px;padding:14px 20px;font-size:15px;font-weight:bold;letter-spacing:0.04em;cursor:pointer';
  const muted = 'color:#8a8a8a;font-size:13px;line-height:1.55';

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<meta name="robots" content="noindex" />',
    '<title>Confirm your email | Velocity</title>',
    '</head>',
    `<body style="${page}">`,
    `<main style="${card}">`,
    '<h1 style="font-size:22px;margin:0 0 12px">Confirm your email</h1>',
    `<p style="${muted};margin:0 0 24px">Press the button below to unlock AI chat for the Velocity automation intake. This link is single-use and expires 30 minutes after it was requested.</p>`,
    '<form method="POST" action="/api/automation-intake-email?action=confirm">',
    `<input type="hidden" name="token" value="${token}" />`,
    `<button type="submit" style="${button}">Confirm email</button>`,
    '</form>',
    `<p style="${muted};margin:24px 0 0">If you did not request this, close this page: nothing happens without the confirmation above.</p>`,
    '</main>',
    '</body>',
    '</html>',
  ].join('');
}

function sendVerificationFailureRedirect(req: VercelRequest, res: VercelResponse): void {
  res.setHeader('Set-Cookie', buildClearIntakeEmailCookie(req));
  redirect(res, '/automation-intake?intakeEmailVerified=0', 303);
}

async function handleStart(req: VercelRequest, res: VercelResponse) {
  if (requireMethod(req, res, 'POST')) return;
  if (rejectOversizedBody(req, res, MAX_BODY_BYTES)) return;

  const parsedBody = parseJsonBody(req, res);
  if (!parsedBody.ok) return;

  const parsed = MagicEmailStartRequestSchema.safeParse(parsedBody.body);
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
  if (requireMethod(req, res, 'GET')) return;

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

/**
 * GET from the emailed link: show the confirm page without touching the token.
 */
async function handleVerify(req: VercelRequest, res: VercelResponse) {
  if (requireMethod(req, res, 'GET')) return;

  const token = getQueryToken(req);
  if (!token) {
    sendVerificationFailureRedirect(req, res);
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(renderConfirmPage(token));
}

/**
 * POST from the confirm page: redeem the one-time token and set the cookie.
 */
async function handleConfirm(req: VercelRequest, res: VercelResponse) {
  if (requireMethod(req, res, 'POST')) return;
  if (rejectOversizedBody(req, res, MAX_BODY_BYTES)) return;

  const db = initAutomationIntakeFirebase();
  if (!db) {
    sendVerificationFailureRedirect(req, res);
    return;
  }

  const token = getBodyToken(req);
  if (!token) {
    sendVerificationFailureRedirect(req, res);
    return;
  }

  const redeemed = await redeemMagicEmailToken({ db, req, token });

  if (!redeemed.ok) {
    sendVerificationFailureRedirect(req, res);
    return;
  }

  res.setHeader('Set-Cookie', redeemed.cookie);
  redirect(res, redeemed.redirectTo, 303);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  res.setHeader('Cache-Control', 'no-store');

  const action = getAction(req);
  if (action === 'start') return handleStart(req, res);
  if (action === 'status') return handleStatus(req, res);
  if (action === 'verify') return handleVerify(req, res);
  if (action === 'confirm') return handleConfirm(req, res);

  return res.status(400).json({ error: 'Invalid email verification action.' });
}
