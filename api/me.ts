import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../lib/serverSecurity.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({
    authenticated: false,
    error: 'Cookie sessions are deprecated. Launchpad now uses BYOK without server-side login.',
  });
}
