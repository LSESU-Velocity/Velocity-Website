import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthCookie, setCorsHeaders } from '../lib/serverAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    if (setCorsHeaders(req, res)) {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Clear the auth cookie
    clearAuthCookie(res);

    return res.status(200).json({ success: true });
}
