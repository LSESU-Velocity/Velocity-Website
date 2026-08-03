// API layer with dev-mode bypass for local testing
import { generateMockAnalysis, generateMockFounderAssets } from './mockData';
// Type-only imports: erased at build time, so the zod schemas stay out of
// the client bundle while the contract stays single-sourced.
import type {
    ArtifactBundle,
    CitationRef as SchemaCitationRef,
    DashboardDTO,
    IdeaIntake,
    LabPhase,
    SourceDocument as SchemaSourceDocument,
    WidgetTarget,
} from './launchpad-lab/schemas';

// Dev mode detection - true when running a development server
const IS_DEV = import.meta.env.DEV;
const USE_MOCK_ANALYSIS = import.meta.env.VITE_USE_MOCK_ANALYSIS === 'true';

/**
 * The dashboard contract is the zod DashboardDTO: the server parses its
 * responses against the same schema this type derives from.
 */
export type AnalysisData = DashboardDTO;
export type SourceDocument = SchemaSourceDocument;
export type CitationRef = SchemaCitationRef;
export type AnalysisIntake = IdeaIntake;
export type FounderAssets = ArtifactBundle;
export type LabPhaseId = LabPhase;
export type WidgetTargetId = WidgetTarget;

// --- BYOK provider detection (mirrors lib/launchpad-lab/model.ts, which is
// server-only because it imports the provider SDKs) ---

export type ProviderId = 'google' | 'openai' | 'anthropic';

export function detectKeyProvider(apiKey: string): ProviderId {
    const key = apiKey.trim();
    if (key.startsWith('sk-ant-')) return 'anthropic';
    if (key.startsWith('sk-')) return 'openai';
    return 'google';
}

export const PROVIDER_LABELS: Record<ProviderId, string> = {
    google: 'Gemini',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
};

export interface LabPromptHistoryEntry {
    id: string;
    phaseId: LabPhaseId;
    targetId: WidgetTargetId;
    instruction: string;
    summary: string;
    createdAt: string;
}

export interface WidgetMutationResult {
    data: AnalysisData;
    summary: string;
    phaseId: LabPhaseId;
    targetId: WidgetTargetId;
}

// API Functions
const API_BASE = '/api';

async function readResponsePayload(response: Response): Promise<unknown> {
    const text = await response.text();

    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

const BURST_RATE_LIMIT_CODE = 'launchpad_burst_rate_limited';
const BURST_RATE_LIMIT_TEXT = 'Too many requests in a short burst';
const MAX_BURST_RETRIES = 2;

function getNumericField(value: unknown, field: string): number | null {
    if (!value || typeof value !== 'object' || !(field in value)) {
        return null;
    }

    const numericValue = Number((value as Record<string, unknown>)[field]);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

function getBurstRetryDelayMs(response: Response, payload: unknown): number | null {
    if (response.status !== 429 || !payload || typeof payload !== 'object') {
        return null;
    }

    const data = payload as Record<string, unknown>;
    const code = typeof data.code === 'string' ? data.code : '';
    const error = typeof data.error === 'string' ? data.error : '';

    if (code !== BURST_RATE_LIMIT_CODE && !error.includes(BURST_RATE_LIMIT_TEXT)) {
        return null;
    }

    const payloadRetrySeconds = getNumericField(data, 'retryAfterSeconds');
    const headerRetrySeconds = Number(response.headers.get('Retry-After'));
    const retrySeconds = payloadRetrySeconds
        ?? (Number.isFinite(headerRetrySeconds) && headerRetrySeconds > 0 ? headerRetrySeconds : null)
        ?? 3;

    return Math.min(Math.max((retrySeconds * 1000) + 250, 500), 15_000);
}

async function fetchWithBurstRetry(url: string, init: RequestInit): Promise<Response> {
    for (let attempt = 0; attempt <= MAX_BURST_RETRIES; attempt += 1) {
        const response = await fetch(url, init);

        if (attempt >= MAX_BURST_RETRIES || response.status !== 429) {
            return response;
        }

        let payload: unknown = null;
        try {
            payload = await readResponsePayload(response.clone());
        } catch {
            return response;
        }

        const retryDelayMs = getBurstRetryDelayMs(response, payload);
        if (retryDelayMs === null) {
            return response;
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }

    throw new Error('Unable to reach Launchpad API');
}

export async function generateAnalysis(idea: string, apiKey: string, includeArtifacts = false): Promise<AnalysisData> {
    // Optional dev-mode bypass for quick UI iteration without hitting the backend
    if (IS_DEV && USE_MOCK_ANALYSIS) {
        console.log('[DEV MODE] Using mock analysis for:', idea);
        return generateMockAnalysis(idea, includeArtifacts);
    }

    const response = await fetchWithBurstRetry(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-provider-key': apiKey,
        },
        body: JSON.stringify({ idea, includeArtifacts }),
    });

    if (!response.ok) {
        const errorData = await readResponsePayload(response);

        if (!errorData) {
            throw new Error(`Launchpad API returned ${response.status} with an empty response. Check the vercel dev terminal for the function error.`);
        }

        if (typeof errorData === 'string') {
            throw new Error(`Launchpad API returned ${response.status}: ${errorData.slice(0, 300)}`);
        }

        // Handle rate limiting with a user-friendly message
        if (response.status === 429 && typeof errorData === 'object' && errorData !== null && 'resetsAt' in errorData) {
            const rateLimitError = errorData as { resetsAt: string; used?: number; limit?: number };
            const resetDate = new Date(rateLimitError.resetsAt);
            const now = new Date();
            const hoursUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60));

            throw new Error(
                `Daily limit reached (${rateLimitError.used}/${rateLimitError.limit} analyses). ` +
                `Resets in ${hoursUntilReset} hour${hoursUntilReset !== 1 ? 's' : ''}.`
            );
        }

        const message = typeof errorData === 'object' && errorData !== null && 'error' in errorData
            ? String(errorData.error)
            : 'Failed to generate analysis';
        const details = typeof errorData === 'object' && errorData !== null && 'details' in errorData
            ? String(errorData.details)
            : '';
        const fullMessage = details ? `${message}\n\nDetails: ${details.slice(0, 600)}` : message;
        throw new Error(fullMessage);
    }

    const payload = await readResponsePayload(response);

    if (!payload || typeof payload !== 'object') {
        throw new Error(`Launchpad API returned ${response.status} but the body was not valid JSON. Check the vercel dev terminal for the server response.`);
    }

    return payload as AnalysisData;
}

export async function generateFounderAssets(
    idea: string,
    apiKey: string,
    analysis: AnalysisData
): Promise<FounderAssets> {
    if (IS_DEV && USE_MOCK_ANALYSIS) {
        console.log('[DEV MODE] Using mock founder assets for:', idea);
        return generateMockFounderAssets(analysis);
    }

    const response = await fetchWithBurstRetry(`${API_BASE}/generate-artifacts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-provider-key': apiKey,
        },
        body: JSON.stringify({ idea, analysis }),
    });

    if (!response.ok) {
        const errorData = await readResponsePayload(response);

        if (!errorData) {
            throw new Error(`Launchpad API returned ${response.status} with an empty response. Check the dev terminal for the function error.`);
        }

        if (typeof errorData === 'string') {
            throw new Error(`Launchpad API returned ${response.status}: ${errorData.slice(0, 300)}`);
        }

        const message = typeof errorData === 'object' && errorData !== null && 'error' in errorData
            ? String(errorData.error)
            : 'Failed to generate founder assets';
        const details = typeof errorData === 'object' && errorData !== null && 'details' in errorData
            ? String(errorData.details)
            : '';
        const fullMessage = details ? `${message}\n\nDetails: ${details.slice(0, 600)}` : message;
        throw new Error(fullMessage);
    }

    const payload = await readResponsePayload(response);

    if (!payload || typeof payload !== 'object') {
        throw new Error(`Launchpad API returned ${response.status} but the body was not valid JSON. Check the dev terminal for the server response.`);
    }

    return payload as FounderAssets;
}

// --- Streaming analysis with real progress events ---

export interface ProgressEvent {
    node: string;
    status: 'running' | 'done' | 'error';
    error?: string;
    /** Node output snapshot (memos, intake, research summary) for live UI. */
    data?: unknown;
}

export type StreamProgressCallback = (event: ProgressEvent) => void;

export interface ClarificationQuestion {
    field: string;
    question: string;
    hint?: string;
}

export interface InterruptEvent {
    reason: string;
    questions: ClarificationQuestion[];
    /** Intake extracted before the interrupt, returned on resume to skip re-classification. */
    partialIntake?: AnalysisIntake | null;
}

export class AnalysisInterruptError extends Error {
    public readonly interrupt: InterruptEvent;
    constructor(interrupt: InterruptEvent) {
        super(interrupt.reason);
        this.name = 'AnalysisInterruptError';
        this.interrupt = interrupt;
    }
}

export interface StreamOptions {
    clarifications?: Record<string, string> | null;
    /** Intake from a previous interrupt, echoed back to skip re-classification. */
    intake?: AnalysisIntake | null;
}

function getMockClarificationQuestions(idea: string): ClarificationQuestion[] {
    const normalizedIdea = idea.trim().toLowerCase();
    const wordCount = normalizedIdea.split(/\s+/).filter(Boolean).length;
    const questions: ClarificationQuestion[] = [];

    if (wordCount < 10 || /\b(ai|saas)\s+(app|tool|platform)\b/.test(normalizedIdea)) {
        questions.push({
            field: 'ideaType',
            question: 'What are you building first?',
            hint: 'Keep it short: app, website, dashboard, service, or marketplace.',
        });
    }

    if (!/\b(student|founder|designer|manager|parent|developer|marketer|clinic|lawyer|accountant|team|creator|seller)\b/.test(normalizedIdea)) {
        questions.push({
            field: 'targetUser',
            question: 'Who is this mainly for?',
            hint: 'A short answer is enough, like students, recruiters, or parents.',
        });
    }

    if (!/\b(for|helps|because|problem|pain|workflow)\b/.test(normalizedIdea)) {
        questions.push({
            field: 'coreProblem',
            question: 'What is the main problem it solves?',
            hint: 'One short sentence is enough.',
        });
    }

    if (!/\b(fintech|health|legal|education|commerce|e-?commerce|creator|b2b|consumer|enterprise)\b/.test(normalizedIdea)) {
        questions.push({
            field: 'domain',
            question: 'What area is this idea mainly for?',
            hint: 'Examples: fitness, education, hiring, ecommerce.',
        });
    }

    return questions.slice(0, 3);
}

export async function generateWidgetMutation(
    idea: string,
    apiKey: string,
    analysis: AnalysisData,
    input: {
        phaseId: LabPhaseId;
        targetId: WidgetTargetId;
        instruction: string;
    },
): Promise<WidgetMutationResult> {
    const response = await fetchWithBurstRetry(`${API_BASE}/mutate-widget`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-provider-key': apiKey,
        },
        body: JSON.stringify({
            idea,
            analysis,
            ...input,
        }),
    });

    if (!response.ok) {
        const errorData = await readResponsePayload(response);

        if (!errorData) {
            throw new Error(`Launchpad API returned ${response.status} with an empty response. Check the dev terminal for the function error.`);
        }

        if (typeof errorData === 'string') {
            throw new Error(`Launchpad API returned ${response.status}: ${errorData.slice(0, 300)}`);
        }

        const message = typeof errorData === 'object' && errorData !== null && 'error' in errorData
            ? String(errorData.error)
            : 'Failed to update widget';
        const details = typeof errorData === 'object' && errorData !== null && 'details' in errorData
            ? String(errorData.details)
            : '';
        throw new Error(details ? `${message}\n\nDetails: ${details.slice(0, 600)}` : message);
    }

    const payload = await readResponsePayload(response);

    if (!payload || typeof payload !== 'object') {
        throw new Error(`Launchpad API returned ${response.status} but the body was not valid JSON. Check the dev terminal for the server response.`);
    }

    return payload as WidgetMutationResult;
}

export async function generateAnalysisStream(
    idea: string,
    apiKey: string,
    onProgress: StreamProgressCallback,
    options?: StreamOptions,
): Promise<AnalysisData> {
    if (IS_DEV && USE_MOCK_ANALYSIS) {
        console.log('[DEV MODE] Using mock analysis (stream) for:', idea);
        const mockQuestions = getMockClarificationQuestions(idea);
        if (mockQuestions.length >= 2 && !options?.clarifications) {
            throw new AnalysisInterruptError({
                reason: 'Your idea needs a bit more detail for a strong analysis.',
                questions: mockQuestions,
            });
        }
        const fakeNodes = ['classifyIdea', 'normalizeIntake', 'researchWeb', 'runBullAnalyst', 'runBearAnalyst', 'runCouncilJudge', 'synthesizeOpportunity', 'qaAndRepair'];
        for (const node of fakeNodes) {
            onProgress({ node, status: 'running' });
            await new Promise(r => setTimeout(r, 200));
            onProgress({ node, status: 'done' });
        }
        return generateMockAnalysis(idea, false);
    }

    const body: Record<string, unknown> = { idea };
    if (options?.clarifications) {
        body.clarifications = options.clarifications;
    }
    if (options?.intake) {
        body.intake = options.intake;
    }

    const response = await fetchWithBurstRetry(`${API_BASE}/analyze-stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-provider-key': apiKey,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await readResponsePayload(response);
        const message = typeof errorData === 'object' && errorData !== null && 'error' in errorData
            ? String((errorData as { error: string }).error)
            : `Stream request failed with status ${response.status}`;
        throw new Error(message);
    }

    if (!response.body) {
        throw new Error('No response body for stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    // Event state must survive across network chunks: a single SSE event
    // (the ~19KB result especially) routinely arrives split over multiple
    // reads, with the "event:" line and the terminating blank line in
    // different chunks.
    let eventType = '';
    let dataLines: string[] = [];

    const dispatchEvent = (type: string, data: string): AnalysisData | undefined => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(data);
        } catch {
            return undefined;
        }

        if (type === 'progress') {
            onProgress(parsed as ProgressEvent);
            return undefined;
        }
        if (type === 'result') {
            return parsed as AnalysisData;
        }
        if (type === 'interrupt') {
            throw new AnalysisInterruptError(parsed as InterruptEvent);
        }
        if (type === 'error') {
            throw new Error((parsed as { error?: string }).error || 'Analysis failed');
        }
        return undefined;
    };

    const processLine = (rawLine: string): AnalysisData | undefined => {
        const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

        if (line === '') {
            const type = eventType;
            const data = dataLines.join('\n');
            eventType = '';
            dataLines = [];
            return type && data ? dispatchEvent(type, data) : undefined;
        }

        if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).replace(/^ /, ''));
        }
        return undefined;
    };

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const result = processLine(line);
            if (result) {
                reader.cancel().catch(() => {});
                return result;
            }
        }
    }

    throw new Error('Stream ended without a result event');
}
