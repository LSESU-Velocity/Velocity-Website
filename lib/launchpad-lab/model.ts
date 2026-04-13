/**
 * Provider/model setup for Launchpad Lab.
 * Creates a ChatGoogle instance using a user-supplied API key.
 */
import { ChatGoogle } from '@langchain/google/node';

export interface ModelOptions {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export function createModel(opts: ModelOptions): ChatGoogle {
  return new ChatGoogle({
    apiKey: opts.apiKey,
    model: opts.model || process.env.LAUNCHPAD_GEMINI_MODEL || 'gemini-3.1-flash-lite-preview',
    temperature: opts.temperature,
    maxOutputTokens: opts.maxOutputTokens ?? 16384,
    maxRetries: 2,
  });
}
