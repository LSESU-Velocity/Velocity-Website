import type { VercelRequest } from '@vercel/node';
import { createHash, randomBytes } from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const MAGIC_LINK_COLLECTION = 'automationIntakeMagicLinks';
const VERIFIED_SESSION_COLLECTION = 'automationIntakeVerifiedEmailSessions';
const MAGIC_LINK_TTL_MS = 30 * 60 * 1000;
const VERIFIED_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = 'velocity_intake_email_verified';

type SendEmailResult =
  | { ok: true }
  | { ok: false; error: string };

export interface VerifiedIntakeEmail {
  verified: boolean;
  email?: string;
  emailHash?: string;
  expiresAt?: number;
  reason?: 'missing' | 'invalid' | 'expired' | 'unavailable';
}

function firstHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function createToken(): string {
  return randomBytes(32).toString('base64url');
}

function getCookie(req: VercelRequest, name: string): string | null {
  const header = firstHeaderValue(req.headers.cookie);
  if (!header) return null;

  for (const part of header.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (rawKey !== name) continue;
    const value = rawValue.join('=');
    if (!value) return null;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

function isLocalhost(req: VercelRequest): boolean {
  const host = firstHeaderValue(req.headers['x-forwarded-host']) || firstHeaderValue(req.headers.host);
  return /(^localhost(:\d+)?$)|(^127\.0\.0\.1(:\d+)?$)|(^\[?::1\]?(:\d+)?$)/i.test(host);
}

function shouldUseSecureCookie(req: VercelRequest): boolean {
  if (isLocalhost(req)) return false;
  const proto = firstHeaderValue(req.headers['x-forwarded-proto']);
  return proto ? proto === 'https' : true;
}

function buildCookie(req: VercelRequest, value: string, maxAgeSeconds: number): string {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (shouldUseSecureCookie(req)) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearIntakeEmailCookie(req: VercelRequest): string {
  return buildCookie(req, '', 0);
}

export function normalizeMagicEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashMagicEmail(email: string): string {
  return hashValue(normalizeMagicEmail(email)).slice(0, 32);
}

export function initAutomationIntakeFirebase(): Firestore | null {
  try {
    if (getApps().length > 0) return getFirestore();

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) return null;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });

    return getFirestore();
  } catch (error) {
    console.warn(
      'Automation intake Firebase init failed:',
      error instanceof Error ? error.message : 'unknown',
    );
    return null;
  }
}

export function getAutomationIntakeBaseUrl(req: VercelRequest): string {
  const configured = process.env.AUTOMATION_INTAKE_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  const origin = firstHeaderValue(req.headers.origin).trim();
  if (origin) return origin.replace(/\/+$/, '');

  const host =
    firstHeaderValue(req.headers['x-forwarded-host']).trim() ||
    firstHeaderValue(req.headers.host).trim();
  const proto = firstHeaderValue(req.headers['x-forwarded-proto']).trim() || 'https';

  return host ? `${proto}://${host}` : 'https://lsesuvelocity.com';
}

export function createMagicVerificationUrl(req: VercelRequest, token: string): string {
  const baseUrl = getAutomationIntakeBaseUrl(req);
  const url = new URL('/api/automation-intake-email-verify', baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

export async function storeMagicEmailLink(args: {
  db: Firestore;
  email: string;
  sessionId?: string;
  ipHash: string;
}): Promise<{ token: string; tokenHash: string; expiresAt: number }> {
  const token = createToken();
  const tokenHash = hashValue(token);
  const now = Date.now();
  const expiresAt = now + MAGIC_LINK_TTL_MS;

  await args.db.collection(MAGIC_LINK_COLLECTION).doc(tokenHash).set({
    email: args.email,
    emailHash: hashMagicEmail(args.email),
    sessionId: args.sessionId ?? null,
    ipHash: args.ipHash,
    createdAt: now,
    expiresAt,
    usedAt: null,
  });

  return { token, tokenHash, expiresAt };
}

export async function deleteMagicEmailLink(db: Firestore, tokenHash: string): Promise<void> {
  await db.collection(MAGIC_LINK_COLLECTION).doc(tokenHash).delete().catch(() => undefined);
}

export async function sendMagicEmail(args: {
  email: string;
  verificationUrl: string;
}): Promise<SendEmailResult> {
  const apiKey =
    process.env.AUTOMATION_INTAKE_MAGIC_EMAIL_RESEND_API_KEY?.trim() ||
    process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTOMATION_INTAKE_MAGIC_EMAIL_FROM?.trim();
  const replyTo = process.env.AUTOMATION_INTAKE_MAGIC_EMAIL_REPLY_TO?.trim();

  if (!apiKey || !from) {
    return {
      ok: false,
      error: 'Magic email sending is not configured.',
    };
  }

  const escapedUrl = escapeHtml(args.verificationUrl);
  const subject = 'Verify your email for Velocity AI chat';
  const text = [
    'Use this one-time link to unlock AI chat for the Velocity automation intake:',
    args.verificationUrl,
    '',
    'This link expires in 30 minutes. If you did not request this, ignore this email.',
  ].join('\n');

  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.55;color:#111">',
    '<h1 style="font-size:20px;margin:0 0 16px">Verify your email</h1>',
    '<p>Use this one-time link to unlock AI chat for the Velocity automation intake.</p>',
    `<p><a href="${escapedUrl}" style="display:inline-block;background:#ff1f1f;color:#fff;padding:12px 16px;text-decoration:none">Verify email</a></p>`,
    `<p style="font-size:13px;color:#555">Or paste this link into your browser:<br><a href="${escapedUrl}">${escapedUrl}</a></p>`,
    '<p style="font-size:13px;color:#555">This link expires in 30 minutes. If you did not request this, ignore this email.</p>',
    '</div>',
  ].join('');

  const payload: Record<string, unknown> = {
    from,
    to: [args.email],
    subject,
    text,
    html,
  };
  if (replyTo) payload.reply_to = replyTo;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        ok: false,
        error: `Magic email provider rejected the message (${response.status}): ${body.slice(0, 180)}`,
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to send magic email.',
    };
  }
}

export async function redeemMagicEmailToken(args: {
  db: Firestore;
  req: VercelRequest;
  token: string;
}): Promise<{ ok: true; redirectTo: string; cookie: string } | { ok: false }> {
  if (!args.token || args.token.length > 256) return { ok: false };

  const tokenHash = hashValue(args.token);
  const sessionToken = createToken();
  const sessionHash = hashValue(sessionToken);
  const now = Date.now();
  const sessionExpiresAt = now + VERIFIED_SESSION_TTL_MS;

  let redirectTo = '/automation-intake?intakeEmailVerified=1';

  try {
    await args.db.runTransaction(async (tx) => {
      const tokenRef = args.db.collection(MAGIC_LINK_COLLECTION).doc(tokenHash);
      const tokenDoc = await tx.get(tokenRef);
      const tokenData = tokenDoc.exists ? tokenDoc.data() ?? {} : null;

      if (!tokenData) throw new Error('invalid-token');
      if (typeof tokenData.usedAt === 'number') throw new Error('used-token');

      const expiresAt = typeof tokenData.expiresAt === 'number' ? tokenData.expiresAt : 0;
      if (expiresAt < now) throw new Error('expired-token');

      const email = typeof tokenData.email === 'string' ? normalizeMagicEmail(tokenData.email) : '';
      if (!email) throw new Error('invalid-email');

      const sessionRef = args.db.collection(VERIFIED_SESSION_COLLECTION).doc(sessionHash);
      tx.update(tokenRef, { usedAt: now });
      tx.set(sessionRef, {
        email,
        emailHash: hashMagicEmail(email),
        sourceTokenHash: tokenHash,
        sourceSessionId: typeof tokenData.sessionId === 'string' ? tokenData.sessionId : null,
        sourceIpHash: typeof tokenData.ipHash === 'string' ? tokenData.ipHash : null,
        verifiedAt: now,
        expiresAt: sessionExpiresAt,
      });
    });
  } catch (error) {
    redirectTo = '/automation-intake?intakeEmailVerified=0';
    console.warn(
      'Automation intake magic email verification failed:',
      error instanceof Error ? error.message : 'unknown',
    );
    return { ok: false };
  }

  return {
    ok: true,
    redirectTo,
    cookie: buildCookie(args.req, sessionToken, Math.floor(VERIFIED_SESSION_TTL_MS / 1000)),
  };
}

export async function getVerifiedIntakeEmail(
  db: Firestore | null,
  req: VercelRequest,
): Promise<VerifiedIntakeEmail> {
  if (!db) return { verified: false, reason: 'unavailable' };

  const sessionToken = getCookie(req, COOKIE_NAME);
  if (!sessionToken) return { verified: false, reason: 'missing' };
  if (sessionToken.length > 256) return { verified: false, reason: 'invalid' };

  try {
    const sessionHash = hashValue(sessionToken);
    const doc = await db.collection(VERIFIED_SESSION_COLLECTION).doc(sessionHash).get();
    if (!doc.exists) return { verified: false, reason: 'invalid' };

    const data = doc.data() ?? {};
    const expiresAt = typeof data.expiresAt === 'number' ? data.expiresAt : 0;
    if (expiresAt < Date.now()) return { verified: false, reason: 'expired' };

    const email = typeof data.email === 'string' ? data.email : undefined;
    const emailHash = typeof data.emailHash === 'string' ? data.emailHash : undefined;

    return {
      verified: Boolean(email),
      email,
      emailHash,
      expiresAt,
      reason: email ? undefined : 'invalid',
    };
  } catch (error) {
    console.warn(
      'Automation intake verified email lookup failed:',
      error instanceof Error ? error.message : 'unknown',
    );
    return { verified: false, reason: 'unavailable' };
  }
}
