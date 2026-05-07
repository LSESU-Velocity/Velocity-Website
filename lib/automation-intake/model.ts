/**
 * OpenAI model adapter for the Automation Intake feature.
 *
 * This deliberately does NOT share code with lib/launchpad-lab/model.ts:
 * - Launchpad uses BYOK (user-supplied provider key via x-provider-key header)
 * - Automation Intake uses a server-owned key from OPENAI_API_KEY
 *
 * If the env var is absent, createIntakeModel throws MissingModelKeyError so
 * the engine can fall back to deterministic heuristic extraction.
 */
import OpenAI from 'openai';
import type { z } from 'zod';

export class MissingModelKeyError extends Error {
  constructor(message = 'OPENAI_API_KEY is not set') {
    super(message);
    this.name = 'MissingModelKeyError';
  }
}

export interface IntakeModelOptions {
  temperature?: number;
  maxOutputTokens?: number;
  modelOverride?: string;
}

type IntakeMessage = {
  content?: unknown;
  _getType?: () => string;
};

type StructuredOutputOptions = {
  name: string;
  method?: string;
  includeRaw?: boolean;
};

type ParsedResponse<T> = {
  output_text?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

const DEFAULT_MODEL = 'gpt-5.4-nano';
const DEFAULT_MAX_RETRIES = 0;
const DEFAULT_REASONING_EFFORT = 'medium';
const DEFAULT_TEXT_VERBOSITY = 'low';

function messageRole(message: IntakeMessage): 'system' | 'user' | 'assistant' {
  const type = typeof message._getType === 'function' ? message._getType() : '';
  if (type === 'system') return 'system';
  if (type === 'ai') return 'assistant';
  return 'user';
}

function messageText(message: IntakeMessage): string {
  const { content } = message;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === 'string' ? text : '';
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function getConfiguredReasoningEffort(): 'none' | 'low' | 'medium' | 'high' | 'xhigh' {
  const raw = process.env.AUTOMATION_INTAKE_OPENAI_REASONING_EFFORT?.trim();
  if (raw === 'minimal') return DEFAULT_REASONING_EFFORT;
  if (raw === 'none' || raw === 'low' || raw === 'medium' || raw === 'high' || raw === 'xhigh') {
    return raw;
  }
  return DEFAULT_REASONING_EFFORT;
}

function getConfiguredTextVerbosity(): 'low' | 'medium' | 'high' {
  const raw = process.env.AUTOMATION_INTAKE_OPENAI_TEXT_VERBOSITY?.trim();
  if (raw === 'medium' || raw === 'high') return raw;
  return DEFAULT_TEXT_VERBOSITY;
}

function getConfiguredMaxRetries(): number {
  const raw = process.env.AUTOMATION_INTAKE_MODEL_MAX_RETRIES;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_MAX_RETRIES;
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_RETRIES;
  return Math.max(0, Math.min(parsed, 1));
}

export function getConfiguredModelName(): string {
  return process.env.AUTOMATION_INTAKE_OPENAI_MODEL || DEFAULT_MODEL;
}

export function hasModelKey(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

export class OpenAIIntakeModel {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxOutputTokens: number;

  constructor(apiKey: string, opts: IntakeModelOptions = {}) {
    this.client = new OpenAI({ apiKey, maxRetries: getConfiguredMaxRetries() });
    this.model = opts.modelOverride || getConfiguredModelName();
    this.maxOutputTokens = opts.maxOutputTokens ?? 2048;
    void opts.temperature;
  }

  withStructuredOutput<T extends z.ZodTypeAny>(
    schema: T,
    opts: StructuredOutputOptions,
  ): {
    invoke: (
      messages: IntakeMessage[],
    ) => Promise<z.infer<T> | { raw: unknown; parsed: z.infer<T> }>;
  } {
    return {
      invoke: async (messages: IntakeMessage[]) => {
        const input = [
          {
            role: 'system' as const,
            content: 'Return only a valid JSON object. Do not wrap it in markdown.',
          },
          ...messages.map((message) => ({
            role: messageRole(message),
            content: messageText(message),
          })),
        ];

        const response = await this.client.responses.create({
          model: this.model,
          input,
          text: {
            format: { type: 'json_object' },
            verbosity: getConfiguredTextVerbosity(),
          },
          reasoning: {
            effort: getConfiguredReasoningEffort(),
          },
          max_output_tokens: this.maxOutputTokens,
        });

        const outputText = (response as ParsedResponse<z.infer<T>>).output_text;
        if (!outputText) {
          throw new Error('openai_json_output_missing');
        }

        let json: unknown;
        try {
          json = JSON.parse(outputText);
        } catch {
          throw new Error('openai_json_parse_failed');
        }

        const result = schema.safeParse(json);
        if (!result.success) {
          throw new Error('openai_json_schema_validation_failed');
        }
        const parsed = result.data;

        if (!opts.includeRaw) return parsed;

        const usage = (response as ParsedResponse<z.infer<T>>).usage;
        return {
          raw: {
            usage_metadata: {
              input_tokens: usage?.input_tokens ?? 0,
              output_tokens: usage?.output_tokens ?? 0,
            },
          },
          parsed,
        };
      },
    };
  }
}

export function createIntakeModel(opts: IntakeModelOptions = {}): OpenAIIntakeModel {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !key.trim()) throw new MissingModelKeyError();

  return new OpenAIIntakeModel(key.trim(), opts);
}
