/**
 * Provider/model setup for Launchpad Lab.
 * BYOK: the provider is inferred from the shape of the user-supplied key,
 * so one input accepts Google AI Studio, OpenAI, and Anthropic keys.
 */
import { ChatGoogle } from '@langchain/google/node';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

export type LaunchpadProvider = 'google' | 'openai' | 'anthropic';

export const PROVIDER_LABELS: Record<LaunchpadProvider, string> = {
  google: 'Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

export function detectProvider(apiKey: string): LaunchpadProvider {
  const key = apiKey.trim();

  if (key.startsWith('sk-ant-')) {
    return 'anthropic';
  }

  if (key.startsWith('sk-')) {
    return 'openai';
  }

  return 'google';
}

const GOOGLE_MAIN_MODEL = process.env.LAUNCHPAD_GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
const GOOGLE_FALLBACK_MODEL = process.env.LAUNCHPAD_GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite';
const GOOGLE_RESEARCH_MODEL = process.env.LAUNCHPAD_RESEARCH_MODEL || 'gemini-2.5-flash-lite';
const OPENAI_MAIN_MODEL = process.env.LAUNCHPAD_OPENAI_MODEL || 'gpt-5.4-nano';
const ANTHROPIC_MAIN_MODEL = process.env.LAUNCHPAD_ANTHROPIC_MODEL || 'claude-haiku-4-5';

export function getDefaultModel(provider: LaunchpadProvider): string {
  if (provider === 'openai') return OPENAI_MAIN_MODEL;
  if (provider === 'anthropic') return ANTHROPIC_MAIN_MODEL;
  return GOOGLE_MAIN_MODEL;
}

/** Only Google has a distinct fallback model; other providers retry in place. */
export function getFallbackModel(provider: LaunchpadProvider): string | null {
  return provider === 'google' ? GOOGLE_FALLBACK_MODEL : null;
}

export interface ModelOptions {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export function createModel(opts: ModelOptions): BaseChatModel {
  const provider = detectProvider(opts.apiKey);

  if (provider === 'openai') {
    // gpt-5 family models reject non-default temperature and legacy
    // max_tokens, so only the essentials are passed through.
    return new ChatOpenAI({
      apiKey: opts.apiKey,
      model: opts.model || OPENAI_MAIN_MODEL,
      maxRetries: 2,
    });
  }

  if (provider === 'anthropic') {
    return new ChatAnthropic({
      apiKey: opts.apiKey,
      model: opts.model || ANTHROPIC_MAIN_MODEL,
      temperature: opts.temperature,
      maxTokens: opts.maxOutputTokens ?? 8192,
      maxRetries: 2,
    });
  }

  return new ChatGoogle({
    apiKey: opts.apiKey,
    model: opts.model || GOOGLE_MAIN_MODEL,
    temperature: opts.temperature,
    maxOutputTokens: opts.maxOutputTokens ?? 16384,
    maxRetries: 2,
  });
}

/**
 * Structured-output options per provider: Google and OpenAI support native
 * JSON-schema mode; Anthropic uses its default tool-calling strategy.
 */
export function structuredOutputOptions(apiKey: string, name: string): { name: string; method?: 'jsonSchema' } {
  return detectProvider(apiKey) === 'anthropic' ? { name } : { name, method: 'jsonSchema' };
}

/** Grounded web research relies on Gemini's googleSearch tool. */
export function supportsGroundedResearch(apiKey: string): boolean {
  return detectProvider(apiKey) === 'google';
}

export function createResearchModel(opts: Omit<ModelOptions, 'model'> & { model?: string }): ChatGoogle {
  return new ChatGoogle({
    apiKey: opts.apiKey,
    model: opts.model || GOOGLE_RESEARCH_MODEL,
    temperature: opts.temperature ?? 0.1,
    maxOutputTokens: opts.maxOutputTokens ?? 8192,
    maxRetries: 2,
    tools: [{ googleSearch: {} }],
  });
}
