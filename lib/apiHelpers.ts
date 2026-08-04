/**
 * Shared request plumbing for the Vercel API handlers.
 * Every handler used to hand-roll the same method guard, size check, and
 * body parse: this is the single copy.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Sends a 405 and returns true when the request method does not match. */
export function requireMethod(
  req: VercelRequest,
  res: VercelResponse,
  method: 'GET' | 'POST',
): boolean {
  if (req.method !== method) {
    res.status(405).json({ error: 'Method not allowed' });
    return true;
  }
  return false;
}

/**
 * Best-effort Content-Length guard. Sends a 413 and returns true when the
 * declared body size exceeds maxBytes. (Vercel enforces its own hard cap;
 * this keeps oversized payloads from reaching JSON.parse.)
 */
export function rejectOversizedBody(
  req: VercelRequest,
  res: VercelResponse,
  maxBytes: number,
): boolean {
  const len = Number(req.headers['content-length'] ?? 0);
  if (Number.isFinite(len) && len > 0 && len > maxBytes) {
    res.status(413).json({ error: 'Payload too large' });
    return true;
  }
  return false;
}

export type ParsedJsonBody =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false };

/**
 * Normalizes req.body (string on some runtimes, object on others) into a
 * plain record. Sends a 400 and returns { ok: false } on malformed JSON.
 */
export function parseJsonBody(req: VercelRequest, res: VercelResponse): ParsedJsonBody {
  if (typeof req.body === 'string') {
    try {
      return { ok: true, body: JSON.parse(req.body || '{}') as Record<string, unknown> };
    } catch {
      res.status(400).json({ error: 'Request body must be valid JSON' });
      return { ok: false };
    }
  }

  return { ok: true, body: (req.body ?? {}) as Record<string, unknown> };
}
