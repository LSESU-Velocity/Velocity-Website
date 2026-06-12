import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { initFirebase } from './firebase.js';

type RateLimitReason = 'burst' | 'window' | 'unavailable';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reason?: RateLimitReason;
  /** Epoch ms when the current window resets. */
  resetTime?: number;
  /** Requests counted in the current window, including this one if allowed. */
  used?: number;
}

function firstHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

function firstForwardedAddress(value: string): string {
  return value.split(',')[0]?.trim().slice(0, 100) || '';
}

export function getTrustedClientIp(req: VercelRequest): string {
  const vercelForwarded = firstHeaderValue(req.headers['x-vercel-forwarded-for']);
  if (vercelForwarded.trim()) return firstForwardedAddress(vercelForwarded);

  const realIp = firstHeaderValue(req.headers['x-real-ip']);
  if (realIp.trim()) return realIp.trim().slice(0, 100);

  const forwarded = firstHeaderValue(req.headers['x-forwarded-for']);
  if (forwarded.trim()) return firstForwardedAddress(forwarded);

  return (req.socket?.remoteAddress || 'unknown').slice(0, 100);
}

export function hashClientIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) || [];

  const origins = envOrigins.length > 0
    ? envOrigins
    : ['https://lsesuvelocity.com', 'https://www.lsesuvelocity.com'];

  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:5173', 'http://localhost:3000');
  }

  return origins;
}

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = firstHeaderValue(req.headers.origin).trim();

  if (origin) {
    if (!getAllowedOrigins().includes(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return true;
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token, x-provider-key, x-gemini-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

export function getLaunchpadProviderKey(req: VercelRequest): string {
  const providerKey = firstHeaderValue(req.headers['x-provider-key']);
  const legacyGeminiKey = firstHeaderValue(req.headers['x-gemini-key']);

  return (providerKey || legacyGeminiKey).trim();
}

export async function checkFirestoreRateLimit(
  db: Firestore | null,
  options: {
    prefix: string;
    identifier: string;
    limit: number;
    windowMs: number;
    minGapMs?: number;
  },
): Promise<RateLimitResult> {
  if (!db) {
    return { allowed: false, remaining: 0, reason: 'unavailable' };
  }

  const now = Date.now();
  const idHash = createHash('sha256').update(options.identifier).digest('hex').slice(0, 32);
  const ref = db.collection('rateLimits').doc(`${options.prefix}_${idHash}`);

  try {
    return await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const data = doc.exists ? doc.data() ?? {} : {};
      const resetTime = typeof data.resetTime === 'number' ? data.resetTime : 0;

      if (!doc.exists || resetTime < now) {
        tx.set(ref, {
          count: 1,
          resetTime: now + options.windowMs,
          lastRequestAt: now,
        });
        return { allowed: true, remaining: Math.max(0, options.limit - 1), resetTime: now + options.windowMs, used: 1 };
      }

      const count = typeof data.count === 'number' ? data.count : 0;
      const lastRequestAt = typeof data.lastRequestAt === 'number' ? data.lastRequestAt : 0;

      if (options.minGapMs && lastRequestAt + options.minGapMs > now) {
        return { allowed: false, remaining: Math.max(0, options.limit - count), reason: 'burst' as const, resetTime, used: count };
      }

      if (count >= options.limit) {
        return { allowed: false, remaining: 0, reason: 'window' as const, resetTime, used: count };
      }

      tx.update(ref, {
        count: count + 1,
        lastRequestAt: now,
      });
      return { allowed: true, remaining: Math.max(0, options.limit - count - 1), resetTime, used: count + 1 };
    });
  } catch (error) {
    console.warn(
      `${options.prefix} rate limit check failed:`,
      error instanceof Error ? error.message : 'unknown',
    );
    return { allowed: false, remaining: 0, reason: 'unavailable' };
  }
}

function tryInitFirestore(): Firestore | null {
  try {
    return initFirebase();
  } catch (error) {
    console.warn('Firestore unavailable for rate limiting:', error instanceof Error ? error.message : 'unknown');
    return null;
  }
}

/**
 * Per-IP rate limit for Launchpad endpoints. Sends the 429 response itself
 * and returns true when the request must stop.
 *
 * BYOK note: the user's own provider key carries the model cost, so the
 * limiter's job is protecting Vercel function time — it fails OPEN when
 * Firestore is unreachable rather than taking Launchpad down with it.
 */
export async function enforceLaunchpadRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  options: {
    prefix: string;
    limit: number;
    windowMs: number;
    minGapMs?: number;
  },
): Promise<boolean> {
  const result = await checkFirestoreRateLimit(tryInitFirestore(), {
    prefix: options.prefix,
    identifier: getTrustedClientIp(req),
    limit: options.limit,
    windowMs: options.windowMs,
    minGapMs: options.minGapMs,
  });

  if (result.allowed) {
    return false;
  }

  if (result.reason === 'unavailable') {
    console.warn(`${options.prefix}: rate limiter unavailable, allowing request`);
    return false;
  }

  if (result.reason === 'burst') {
    res.status(429).json({
      error: 'Too many requests in a short burst. Wait a few seconds and try again.',
    });
    return true;
  }

  const resetsAt = new Date(result.resetTime || Date.now() + options.windowMs).toISOString();
  res.status(429).json({
    error: 'Daily limit reached for this endpoint.',
    resetsAt,
    used: result.used ?? options.limit,
    limit: options.limit,
  });
  return true;
}
