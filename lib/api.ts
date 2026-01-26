// API layer with dev-mode bypass for local testing
import { generateMockAnalysis } from './mockData';

// Dev mode detection - true when running `npm run dev`
const IS_DEV = import.meta.env.DEV;

// Dev-mode test keys (set via VITE_DEV_KEYS env var, not hardcoded)
const DEV_TEST_KEYS = IS_DEV ? (import.meta.env.VITE_DEV_KEYS?.split(',') || []) : [];

export interface LoginResponse {
    valid: boolean;
    error?: string;
}

export interface AnalysisData {
    identity: {
        name: string;
        tagline: string;
        colors?: string[];
        domain?: string[];
        available?: boolean;
    };
    monetization: Array<{
        model: string;
        pricing: string;
        strategies: string[];
        examples: string;
    }>;
    visuals: {
        logoStyle: string;
        appInterface: string;
        screens?: Array<{ type: string; title: string }>;
    };
    blueprint?: {
        stack: string[];
        complexity: string;
        timeline: string;
    };
    validation: {
        aiInsight: string;
        competitors: number;
        competitorList: Array<{
            name: string;
            usp?: string;
            strength: string;
            weakness: string;
            x: number;
            y: number;
            // Competitor profile fields
            founded?: string;
            hq?: string;
            funding?: string;
            employees?: string;
            website?: string;
        }>;
        marketReports: Array<{
            title: string;
            publisher: string;
            keyStat: string;
            url: string;
        }>;
        marketGap: {
            xAxis: { label: string; low: string; high: string };
            yAxis: { label: string; low: string; high: string };
            yourPosition: { x: number; y: number };
            yourGap: string;
        };
        scores?: {
            viability: number;
            scalability: number;
            complexity: number;
        };
    };
    sources: {
        market: Array<{ name: string; url: string }>;
        competitors: Array<{ name: string; url: string }>;
    };
    customerSegments: Array<{
        segment: string;
        age: string;
        income: string;
        interest: string;
    }>;
    promptChain: Array<{
        step: number;
        title: string;
        prompt: string;
    }>;
    distributionChannels: Array<{
        name: string;
        type: string;
        members: string;
    }>;
    artifacts?: {
        waitlistHtml?: string;
        pitchDeckHtml?: string;
    };
}

export interface AnalysisRecord {
    id: string;
    idea: string;
    data: AnalysisData;
    createdAt: string;
}

export interface AnalysesResponse {
    analyses: AnalysisRecord[];
    hasMore: boolean;
    nextCursor: string | null;
}

// API Functions
const API_BASE = '/api';

export async function login(key: string): Promise<LoginResponse> {
    // DEV MODE BYPASS: Accept test keys without hitting the backend
    if (IS_DEV && DEV_TEST_KEYS.includes(key.trim())) {
        console.log('[DEV MODE] Login bypassed with test key:', key);
        return {
            valid: true,
        };
    }

    const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key }),
    });

    if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch {
            // If JSON parse fails (e.g. 500 HTML), get text
            const text = await response.text();
            console.error('API Error (Non-JSON):', text);
            errorMessage = `Server Error (${response.status})`;
        }
        return { valid: false, error: errorMessage };
    }

    return response.json();
}

export async function generateAnalysis(idea: string): Promise<AnalysisData> {
    // DEV MODE BYPASS: Use mock data generator instead of hitting the backend
    if (IS_DEV) {
        console.log('[DEV MODE] Using mock analysis for:', idea);
        return generateMockAnalysis(idea);
    }

    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idea }),
    });

    if (!response.ok) {
        const errorData = await response.json();

        // Handle rate limiting with a user-friendly message
        if (response.status === 429 && errorData.resetsAt) {
            const resetDate = new Date(errorData.resetsAt);
            const now = new Date();
            const hoursUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60));

            throw new Error(
                `Daily limit reached (${errorData.used}/${errorData.limit} analyses). ` +
                `Resets in ${hoursUntilReset} hour${hoursUntilReset !== 1 ? 's' : ''}.`
            );
        }

        throw new Error(errorData.error || 'Failed to generate analysis');
    }

    return response.json();
}

export async function getAnalyses(options?: { cursor?: string; limit?: number }): Promise<AnalysesResponse> {
    // DEV MODE BYPASS: Return empty history in dev mode
    if (IS_DEV) {
        console.log('[DEV MODE] Returning empty analysis history');
        return { analyses: [], hasMore: false, nextCursor: null };
    }

    const params = new URLSearchParams();
    if (options?.cursor) params.set('cursor', options.cursor);
    if (options?.limit) params.set('limit', options.limit.toString());

    const url = `${API_BASE}/analyses${params.toString() ? `?${params}` : ''}`;

    const response = await fetch(url, {
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch analyses');
    }

    return response.json();
}

export async function deleteAnalysis(analysisId: string): Promise<void> {
    // DEV MODE BYPASS: Just log and return in dev mode
    if (IS_DEV) {
        console.log('[DEV MODE] Would delete analysis:', analysisId);
        return;
    }

    const response = await fetch(
        `${API_BASE}/analyses?id=${encodeURIComponent(analysisId)}`,
        {
            method: 'DELETE',
            credentials: 'include',
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete analysis');
    }
}

// Check current auth status via cookie
export async function checkAuth(): Promise<boolean> {
    if (IS_DEV) {
        return false; // In dev mode, always start logged out
    }

    try {
        const response = await fetch(`${API_BASE}/me`, {
            credentials: 'include',
        });
        const data = await response.json();
        return data.authenticated === true;
    } catch {
        return false;
    }
}

// Logout - clear auth cookie
export async function logout(): Promise<void> {
    if (IS_DEV) {
        console.log('[DEV MODE] Logout called');
        return;
    }

    await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
    });
}


