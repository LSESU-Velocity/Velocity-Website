import type { VercelRequest, VercelResponse } from '@vercel/node';

import { handleCors } from '../lib/serverSecurity.js';
import {
  buildClearIntakeEmailCookie,
  initAutomationIntakeFirebase,
  redeemMagicEmailToken,
} from '../lib/automation-intake/email-verification.js';

function redirect(res: VercelResponse, location: string): void {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}

function getToken(req: VercelRequest): string {
  const value = req.query.token;
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  res.setHeader('Cache-Control', 'no-store');

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
