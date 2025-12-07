// API Types
export interface LoginResponse {
    valid: boolean;
    keyId?: string;
    error?: string;
}

export interface AnalysisData {
    name: string;
    tagline: string;
    colors: string[];
    domain: string[];
    stack: string[];
    interface: string;
    monetization: Array<{
        model: string;
        pricing: string;
        strategies: string[];
        examples: string;
    }>;
    market: {
        tam: { value: string; label: string };
        sam: { value: string; label: string };
        som: { value: string; label: string };
        aiInsight: string;
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
    riskAnalysis: Array<{
        risk: string;
        mitigation: string;
        productFeature: string;
    }>;
    competitors: Array<{
        name: string;
        usp: string;
        weakness: string;
        x: number;
        y: number;
    }>;
    marketGap: {
        xAxis: { label: string; low: string; high: string };
        yAxis: { label: string; low: string; high: string };
        yourPosition: { x: number; y: number };
        yourGap: string;
    };
    searchVolume: Array<{
        keyword: string;
        data: Array<{ name: string; users: number }>;
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
    // Computed scores
    viability?: number;
    scalability?: number;
    complexity?: number;
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
    const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
    });
    return response.json();
}

export async function generateAnalysis(key: string, idea: string): Promise<AnalysisData> {
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
    const response = await fetch(`${API_BASE}/analyses?key=${encodeURIComponent(key)}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch analyses');
    }

    return response.json();
}
