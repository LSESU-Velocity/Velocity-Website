import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../lib/serverSecurity.js';

export const config = {
  maxDuration: 10,
};

const MAX_HTML_BYTES = 1_500_000;

/**
 * Echoes a generated artifact back as a sandboxed HTML document.
 *
 * Why this exists: srcdoc/blob iframes inherit the parent page's strict CSP
 * (script-src 'self', no inline styles), which blocks the inline styles and
 * CDN scripts inside generated waitlist/deck previews in production. A real
 * HTTP response can carry its own CSP. The `sandbox` directive forces an
 * opaque origin, so the document gets no same-origin access, no storage, and
 * no credentials — it can only render itself and run its own scripts.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as Record<string, unknown> | string | undefined;
  let html: unknown;

  if (typeof body === 'string') {
    // Raw urlencoded payload (some local dev paths) — parse it directly.
    html = new URLSearchParams(body).get('html');
  } else {
    html = body?.html;
  }

  if (typeof html !== 'string' || !html.trim()) {
    return res.status(400).json({ error: 'An html form field is required.' });
  }

  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    return res.status(413).json({ error: 'Artifact is too large to preview.' });
  }

  if (!/<html[\s>]/i.test(html)) {
    return res.status(400).json({ error: 'The payload does not look like an HTML document.' });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // The whole point of this route: an opaque-origin sandbox with permissive
  // inline styles/scripts INSIDE the sandbox only.
  res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups');
  return res.status(200).send(html);
}
