import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../lib/serverSecurity.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({
    error: 'Cookie logout is deprecated. Launchpad no longer creates server-side sessions.',
  });
}
