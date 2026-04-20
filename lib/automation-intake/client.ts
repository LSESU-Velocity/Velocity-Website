/**
 * Browser-side client for the Automation Intake API.
 * Thin fetch wrapper — no retries, no caching. The endpoint is idempotent.
 */
import type {
  AutomationIntakeDraft,
  ChatResponse,
  SubmissionMode,
  SubmitResponse,
} from './schemas.js';
import {
  ChatResponseSchema,
  SubmitResponseSchema,
} from './schemas.js';

export class IntakeApiError extends Error {
  public readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'IntakeApiError';
    this.status = status;
  }
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return fallback;
    try {
      const json = JSON.parse(text);
      if (typeof json?.error === 'string' && json.error.trim()) return json.error;
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
  return fallback;
}

export async function postIntakeChat(args: {
  draft: AutomationIntakeDraft;
  answer: string;
}): Promise<ChatResponse> {
  const response = await fetch('/api/automation-intake-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft: args.draft, answer: args.answer }),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Unable to continue the conversation right now.');
    throw new IntakeApiError(message, response.status);
  }

  const json = await response.json().catch(() => null);
  const parsed = ChatResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new IntakeApiError('Unexpected response from the server.', 500);
  }

  return parsed.data;
}

export async function postIntakeSubmit(args: {
  draft: AutomationIntakeDraft;
  submissionMode: SubmissionMode;
  honeypot?: string;
}): Promise<SubmitResponse> {
  const response = await fetch('/api/automation-intake-submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      draft: args.draft,
      submissionMode: args.submissionMode,
      honeypot: args.honeypot ?? '',
    }),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response, 'Unable to submit your intake right now.');
    throw new IntakeApiError(message, response.status);
  }

  const json = await response.json().catch(() => null);
  const parsed = SubmitResponseSchema.safeParse(json);
  if (parsed.success) {
    return parsed.data;
  }

  if (typeof (json as { error?: unknown } | null)?.error === 'string') {
    const apiError = (json as { error: string }).error;
    throw new IntakeApiError(
      apiError === 'Thanks!' ? 'Unable to submit your intake right now.' : apiError,
      500,
    );
  }

  throw new IntakeApiError('Unexpected response from the server.', 500);
}
