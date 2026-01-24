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
 * Set CORS headers that allow credentials (cookies).
 * Must be called before sending a response when cookies are involved.
 */
export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
    const allowedOrigins = [
        'https://lsesuvelocity.com',
        'https://www.lsesuvelocity.com',
        'https://velocity-website-taupe.vercel.app',
    ];

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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return true if this is a preflight request
    return req.method === 'OPTIONS';
}
