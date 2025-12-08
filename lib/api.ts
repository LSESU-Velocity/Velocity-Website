// API layer with dev-mode bypass for local testing
import { generateMockAnalysis } from './mockData';

// Dev mode detection - true when running `npm run dev`
const IS_DEV = import.meta.env.DEV;

// Valid dev-mode test keys
const DEV_TEST_KEYS = ['VEL-TEST-001', 'VEL-DEV-001'];

export interface LoginResponse {
    valid: boolean;
    keyId?: string;
    error?: string;
}

export interface AnalysisData {
    identity: {
        name: string;
        tagline: string;
        colors: string[];
        domain: string[];
        available: boolean;
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
        screens: Array<{ type: string; title: string }>;
    };
    blueprint: {
        stack: string[];
        complexity: string;
        timeline: string;
    };
    validation: {
        tam: { value: string; label: string };
        sam: { value: string; label: string };
        som: { value: string; label: string };
        aiInsight: string;
        competitors: number;
        competitorList: Array<{
            name: string;
            usp: string;
            weakness: string;
            x: number;
            y: number;
        }>;
        riskAnalysis: Array<{
            risk: string;
            mitigation: string;
            productFeature: string;
        }>;
        searchVolume: Array<{
            keyword: string;
            data: Array<{ name: string; users: number }>;
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
}

export interface AnalysisRecord {
    id: string;
    idea: string;
    data: AnalysisData;
    createdAt: string;
}

// API Functions
const API_BASE = '/api';

export async function login(key: string): Promise<LoginResponse> {
    // DEV MODE BYPASS: Accept test keys without hitting the backend
    if (IS_DEV && DEV_TEST_KEYS.includes(key.trim())) {
        console.log('[DEV MODE] Login bypassed with test key:', key);
        return {
            valid: true,
            keyId: 'dev-mode-key-id'
        };
    }

    const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
    });
    return response.json();
}

export async function generateAnalysis(key: string, idea: string): Promise<AnalysisData> {
    // DEV MODE BYPASS: Use mock data generator instead of hitting the backend
    if (IS_DEV) {
        console.log('[DEV MODE] Using mock analysis for:', idea);
        return generateMockAnalysis(idea);
    }

    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, idea }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate analysis');
    }

    return response.json();
}

export async function getAnalyses(key: string): Promise<AnalysisRecord[]> {
    // DEV MODE BYPASS: Return empty history in dev mode
    if (IS_DEV) {
        console.log('[DEV MODE] Returning empty analysis history');
        return [];
    }

    const response = await fetch(`${API_BASE}/analyses?key=${encodeURIComponent(key)}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch analyses');
    }

    return response.json();
}
