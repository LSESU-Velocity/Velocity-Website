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

const DEFAULT_MAIN_MODEL = process.env.LAUNCHPAD_GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
const DEFAULT_RESEARCH_MODEL = process.env.LAUNCHPAD_RESEARCH_MODEL || 'gemini-2.5-flash-lite';

export function createModel(opts: ModelOptions): ChatGoogle {
  return new ChatGoogle({
    apiKey: opts.apiKey,
    model: opts.model || DEFAULT_MAIN_MODEL,
    temperature: opts.temperature,
    maxOutputTokens: opts.maxOutputTokens ?? 16384,
    maxRetries: 2,
  });
}

export function createResearchModel(opts: Omit<ModelOptions, 'model'> & { model?: string }): ChatGoogle {
  return new ChatGoogle({
    apiKey: opts.apiKey,
    model: opts.model || DEFAULT_RESEARCH_MODEL,
    temperature: opts.temperature ?? 0.1,
    maxOutputTokens: opts.maxOutputTokens ?? 8192,
    maxRetries: 2,
    tools: [{ googleSearch: {} }],
  });
}
