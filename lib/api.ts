// API layer with dev-mode bypass for local testing
import { generateMockAnalysis, generateMockFounderAssets } from './mockData';

// Dev mode detection - true when running a development server
const IS_DEV = import.meta.env.DEV;
const USE_MOCK_ANALYSIS = import.meta.env.VITE_USE_MOCK_ANALYSIS === 'true';

export interface SourceDocument {
    id: string;
    title: string;
    url: string;
    domain: string;
    snippet?: string;
    categories: Array<'market' | 'competitor' | 'channel' | 'report' | 'general'>;
}

export interface CitationRef {
    sourceIds: string[];
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
        industryInsights: {
            keyInsights: string[];
            risks: string[];
            whatToTestFirst: string[];
        };
        aiInsight?: string; // Legacy field for older saved analyses
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
            sourceIds?: string[];
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
        market: Array<{ id?: string; name: string; url: string }>;
        competitors: Array<{ id?: string; name: string; url: string }>;
        channels?: Array<{ id?: string; name: string; url: string }>;
        queries?: string[];
        documents?: SourceDocument[];
    };
    citations?: {
        summary?: {
            recommendation?: CitationRef;
            openRisks?: Array<CitationRef | null>;
            nextMoves?: Array<CitationRef | null>;
        };
        council?: {
            finalTake?: CitationRef;
            bullCase?: Array<CitationRef | null>;
            bearCase?: Array<CitationRef | null>;
            decidingFactors?: Array<CitationRef | null>;
        };
        validation?: {
            marketInsights?: Array<CitationRef | null>;
            risks?: Array<CitationRef | null>;
            whatToTestFirst?: Array<CitationRef | null>;
            competitors?: Array<CitationRef | null>;
            marketGap?: CitationRef;
            marketSizing?: Array<CitationRef | null>;
            marketReports?: Array<CitationRef | null>;
        };
        strategy?: {
            distributionChannels?: Array<CitationRef | null>;
        };
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
    lab?: {
        intake: null | {
            idea: string;
            domain: string;
            ideaType: string;
            targetUser: string;
            coreProblem: string;
        };
        council: {
            bull: null | {
                perspective: 'bull' | 'bear';
                keyPoints: string[];
                opportunities: string[];
                risks: string[];
                recommendation: string;
            };
            bear: null | {
                perspective: 'bull' | 'bear';
                keyPoints: string[];
                opportunities: string[];
                risks: string[];
                recommendation: string;
            };
            judge?: null | {
                verdict: 'bull' | 'bear' | 'split';
                finalTake: string;
                bullCase: string[];
                bearCase: string[];
                decidingFactors: string[];
                citations?: {
                    finalTake?: CitationRef;
                    bullCase?: CitationRef[];
                    bearCase?: CitationRef[];
                    decidingFactors?: CitationRef[];
                };
            };
        };
        summary: {
            recommendation: string;
            confidenceScore: number;
            confidenceLabel: 'low' | 'medium' | 'high';
            openRisks: string[];
            nextMoves: string[];
        };
        marketSizing?: Array<{
            key: 'tam' | 'sam' | 'som';
            label: 'TAM' | 'SAM' | 'SOM';
            title: string;
            value: number;
            ratio: number;
        }>;
    };
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

export interface FounderAssets {
    waitlistHtml?: string;
    pitchDeckHtml?: string;
}

export type LabPhaseId = 'validation' | 'strategy' | 'execution';

export type WidgetTargetId =
    | 'validation'
    | 'marketSizing'
    | 'marketPosition'
    | 'strategy'
    | 'monetization'
    | 'customerSegments'
    | 'distributionChannels'
    | 'waitlist'
    | 'pitchDeck'
    | 'promptChain';

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

export async function generateAnalysis(idea: string, apiKey: string, includeArtifacts = false): Promise<AnalysisData> {
    // Optional dev-mode bypass for quick UI iteration without hitting the backend
    if (IS_DEV && USE_MOCK_ANALYSIS) {
        console.log('[DEV MODE] Using mock analysis for:', idea);
        return generateMockAnalysis(idea, includeArtifacts);
    }

    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-gemini-key': apiKey,
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

    const response = await fetch(`${API_BASE}/generate-artifacts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-gemini-key': apiKey,
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
    const response = await fetch(`${API_BASE}/mutate-widget`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-gemini-key': apiKey,
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

    const response = await fetch(`${API_BASE}/analyze-stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-gemini-key': apiKey,
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

    return new Promise<AnalysisData>((resolve, reject) => {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function processChunk() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    reject(new Error('Stream ended without a result event'));
                    return;
                }

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE events from buffer
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                let eventType = '';
                let eventData = '';

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        eventType = line.slice(7).trim();
                    } else if (line.startsWith('data: ')) {
                        eventData = line.slice(6);
                    } else if (line === '' && eventType && eventData) {
                        try {
                            const parsed = JSON.parse(eventData);
                            if (eventType === 'progress') {
                                onProgress(parsed as ProgressEvent);
                            } else if (eventType === 'result') {
                                resolve(parsed as AnalysisData);
                                return;
                            } else if (eventType === 'interrupt') {
                                reject(new AnalysisInterruptError(parsed as InterruptEvent));
                                return;
                            } else if (eventType === 'error') {
                                reject(new Error(parsed.error || 'Analysis failed'));
                                return;
                            }
                        } catch (parseErr) {
                            if (parseErr instanceof AnalysisInterruptError) {
                                reject(parseErr);
                                return;
                            }
                        }
                        eventType = '';
                        eventData = '';
                    }
                }

                processChunk();
            }).catch(reject);
        }

        processChunk();
    });
}

