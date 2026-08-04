/**
 * Shared error classification for the Launchpad Lab pipeline.
 * Single source of truth for provider error matching: graph nodes,
 * the analyze pipeline, mutations, and API handlers all use these.
 */

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** True when the failure came from an AbortSignal (client disconnected). */
export function isAbortError(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') return true;
  const message = getErrorMessage(err).toLowerCase();
  return message.includes('abort');
}

/**
 * Structured-output failures where the model produced text that did not
 * satisfy the schema. These are worth one repair attempt with the error
 * details fed back: unlike auth/quota errors, a regenerated response can fix them.
 */
export function isSchemaValidationError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to parse') ||
    normalized.includes('could not parse') ||
    normalized.includes('output_parsing') ||
    normalized.includes('validation')
  );
}

export function isModelUnavailableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('not_found') ||
    normalized.includes('model not found') ||
    normalized.includes('unsupported model') ||
    normalized.includes('unknown model') ||
    normalized.includes('does not exist') ||
    (normalized.includes('model') && normalized.includes('404'))
  );
}

export function isHighDemandError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('high demand') ||
    normalized.includes('overloaded') ||
    normalized.includes('temporarily unavailable') ||
    normalized.includes('try again later') ||
    normalized.includes('service unavailable') ||
    normalized.includes('503') ||
    normalized.includes('529')
  );
}

export function isAuthError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('api key') ||
    normalized.includes('api-key') ||
    normalized.includes('permission_denied') ||
    normalized.includes('unauthenticated') ||
    normalized.includes('unauthorized') ||
    message.includes('401') ||
    message.includes('403')
  );
}

export function isQuotaError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('resource_exhausted') ||
    normalized.includes('quota') ||
    normalized.includes('rate limit') ||
    message.includes('429')
  );
}

/**
 * Errors that will hit every downstream model call too: there is no point
 * continuing the pipeline once one of these appears.
 */
export function isFatalProviderError(message: string): boolean {
  return isAuthError(message) || isQuotaError(message);
}

export interface ClassifiedError {
  error: string;
  statusCode: number;
  details?: string;
}

const IS_DEV = process.env.NODE_ENV !== 'production';

function withDetails(classification: ClassifiedError, message: string): ClassifiedError {
  return IS_DEV ? { ...classification, details: message } : classification;
}

/**
 * Map a raw provider/pipeline error onto a user-facing message + status code.
 */
export function classifyProviderError(
  message: string,
  opts: { failedNode?: string | null; context?: string } = {},
): ClassifiedError {
  const nodePrefix = opts.failedNode ? `[${opts.failedNode}] ` : '';
  const context = opts.context || 'the analysis';

  if (isAuthError(message)) {
    return withDetails({
      error: `${nodePrefix}Your AI provider key was rejected. Please check it and try again.`,
      statusCode: 401,
    }, message);
  }

  if (isQuotaError(message)) {
    return withDetails({
      error: `${nodePrefix}Your provider account hit a rate or quota limit. Please wait and try again.`,
      statusCode: 429,
    }, message);
  }

  if (isHighDemandError(message)) {
    return withDetails({
      error: `${nodePrefix}The model provider is temporarily overloaded. Please retry.`,
      statusCode: 503,
    }, message);
  }

  if (isModelUnavailableError(message)) {
    return withDetails({
      error: `${nodePrefix}The configured model is unavailable for this key.`,
      statusCode: 502,
    }, message);
  }

  if (message.includes('INVALID_ARGUMENT') || message.includes('400')) {
    return withDetails({
      error: `${nodePrefix}The model provider rejected ${context} request.`,
      statusCode: 502,
    }, message);
  }

  if (message.includes('Could not parse') || message.includes('validation') || message.includes('Validation failed')) {
    return withDetails({
      error: `${nodePrefix}The AI response did not match the expected format. Please try again.`,
      statusCode: 502,
    }, message);
  }

  return withDetails({
    error: `${nodePrefix}Failed to complete ${context}. Please try again.`,
    statusCode: 500,
  }, message);
}
