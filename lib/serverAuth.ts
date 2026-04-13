import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'velocity_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Extract the auth key from the HttpOnly cookie.
 * Returns null if no cookie is present.
 */
export function getAuthKey(req: VercelRequest): string | null {
    const cookies = req.cookies;
    if (!cookies || !cookies[COOKIE_NAME]) {
        return null;
    }
    return cookies[COOKIE_NAME];
}

/**
 * Set the HttpOnly auth cookie on the response.
 */
export function setAuthCookie(res: VercelResponse, key: string): void {
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieValue = [
        `${COOKIE_NAME}=${encodeURIComponent(key)}`,
        `Max-Age=${COOKIE_MAX_AGE}`,
        'Path=/api',
        'HttpOnly',
        'SameSite=Lax',
        isProduction ? 'Secure' : '',
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieValue);
}

/**
 * Clear the auth cookie (for logout).
 */
export function clearAuthCookie(res: VercelResponse): void {
    const cookieValue = [
        `${COOKIE_NAME}=`,
        'Max-Age=0',
        'Path=/api',
        'HttpOnly',
        'SameSite=Lax',
    ].join('; ');

    res.setHeader('Set-Cookie', cookieValue);
}

/**
 * Set CORS headers used by API routes that rely on cookies and/or custom headers.
 * Must be called before sending a response when cross-origin requests are involved.
 * 
 * ALLOWED_ORIGINS env var format: comma-separated URLs
 * Example: "https://site.com,https://staging.app"
 */
export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
    // Load allowed origins from environment variable (keeps staging URLs out of source code)
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || [];

    // Fallback to production domain if env var not set
    const allowedOrigins = envOrigins.length > 0
        ? envOrigins
        : ['https://lsesuvelocity.com', 'https://www.lsesuvelocity.com'];

    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
    }

    const origin = req.headers.origin || '';

    // Check exact match OR your project's Vercel preview deployments
    const isAllowed = allowedOrigins.includes(origin) ||
        /^https:\/\/velocity-website-[\w-]+-lsesuvelocitys-projects\.vercel\.app$/.test(origin);

    if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-key');

    // Return true if this is a preflight request
    return req.method === 'OPTIONS';
}
