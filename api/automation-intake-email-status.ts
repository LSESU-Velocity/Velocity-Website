import type { VercelRequest, VercelResponse } from '@vercel/node';

import { handleCors } from '../lib/serverSecurity.js';
import type { EmailVerificationStatusResponse } from '../lib/automation-intake/schemas.js';
import {
  buildClearIntakeEmailCookie,
  getVerifiedIntakeEmail,
  initAutomationIntakeFirebase,
} from '../lib/automation-intake/email-verification.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  res.setHeader('Cache-Control', 'no-store');

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
