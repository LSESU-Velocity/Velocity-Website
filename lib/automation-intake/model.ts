/**
 * OpenAI model adapter for the Automation Intake feature.
 *
 * This deliberately does NOT share code with lib/launchpad-lab/model.ts:
 * - Launchpad uses BYOK (user-supplied provider key via x-provider-key header)
 * - Automation Intake uses a server-owned key from OPENAI_API_KEY
 *
 * Structured output runs in the Responses API's strict json_schema mode: the
 * zod schema is converted to an OpenAI-strict JSON Schema (every key required,
 * optional fields expressed as nullable) so the model is constrained at
 * generation time instead of failing zod validation after a paid call. If the
 * API rejects the schema, one fallback request uses plain json_object mode.
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

type ParsedResponse = {
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

// ---------- zod → OpenAI-strict JSON Schema ----------
//
// Strict mode requires every property listed in `required` and
// `additionalProperties: false` on every object; optionality is expressed by
// allowing null. Length keywords are intentionally omitted (support varies by
// model): lengths are clamped locally in clampToZodLimits before validation.

type ZodDefLike = {
  typeName?: string;
  innerType?: z.ZodTypeAny;
  schema?: z.ZodTypeAny;
  type?: z.ZodTypeAny;
  values?: unknown[];
  checks?: Array<{ kind?: string; value?: unknown }>;
  maxLength?: { value: number } | null;
  shape?: () => Record<string, z.ZodTypeAny>;
};

function defOf(schema: z.ZodTypeAny): ZodDefLike {
  return (schema as unknown as { _def: ZodDefLike })._def ?? {};
}

/** Peel Optional/Nullable/Default/Effects wrappers; remember if null/absent is legal. */
function unwrapField(schema: z.ZodTypeAny): { inner: z.ZodTypeAny; optional: boolean } {
  let current = schema;
  let optional = false;

  for (let depth = 0; depth < 8; depth += 1) {
    const def = defOf(current);
    if (def.typeName === 'ZodOptional' || def.typeName === 'ZodNullable') {
      optional = true;
      current = def.innerType as z.ZodTypeAny;
      continue;
    }
    if (def.typeName === 'ZodDefault') {
      current = def.innerType as z.ZodTypeAny;
      continue;
    }
    if (def.typeName === 'ZodEffects') {
      current = def.schema as z.ZodTypeAny;
      continue;
    }
    break;
  }

  return { inner: current, optional };
}

function stringMaxLength(schema: z.ZodTypeAny): number | null {
  const checks = defOf(schema).checks ?? [];
  for (const check of checks) {
    if (check.kind === 'max' && typeof check.value === 'number') return check.value;
  }
  return null;
}

function arrayMaxItems(schema: z.ZodTypeAny): number | null {
  const max = defOf(schema).maxLength;
  return max && typeof max.value === 'number' ? max.value : null;
}

class UnsupportedZodShapeError extends Error {}

function fieldToJsonSchema(schema: z.ZodTypeAny, nullable: boolean): Record<string, unknown> {
  const { inner, optional } = unwrapField(schema);
  const allowNull = nullable || optional;
  const def = defOf(inner);

  switch (def.typeName) {
    case 'ZodString':
      return { type: allowNull ? ['string', 'null'] : 'string' };
    case 'ZodNumber':
      return { type: allowNull ? ['number', 'null'] : 'number' };
    case 'ZodBoolean':
      return { type: allowNull ? ['boolean', 'null'] : 'boolean' };
    case 'ZodEnum': {
      const values = (def.values ?? []).filter((value): value is string => typeof value === 'string');
      const enumSchema = { type: 'string', enum: values };
      return allowNull ? { anyOf: [enumSchema, { type: 'null' }] } : enumSchema;
    }
    case 'ZodArray': {
      const itemSchema = fieldToJsonSchema(def.type as z.ZodTypeAny, false);
      return { type: allowNull ? ['array', 'null'] : 'array', items: itemSchema };
    }
    case 'ZodObject': {
      const objectSchema = objectToJsonSchema(inner);
      return allowNull ? { anyOf: [objectSchema, { type: 'null' }] } : objectSchema;
    }
    default:
      throw new UnsupportedZodShapeError(`Unsupported zod type: ${def.typeName ?? 'unknown'}`);
  }
}

function objectToJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const def = defOf(schema);
  if (def.typeName !== 'ZodObject' || typeof def.shape !== 'function') {
    throw new UnsupportedZodShapeError(`Expected a ZodObject, got ${def.typeName ?? 'unknown'}`);
  }

  const shape = def.shape();
  const properties: Record<string, unknown> = {};

  for (const [key, fieldSchema] of Object.entries(shape)) {
    properties[key] = fieldToJsonSchema(fieldSchema, false);
  }

  return {
    type: 'object',
    properties,
    required: Object.keys(shape),
    additionalProperties: false,
  };
}

/** Null on shapes the converter does not cover: the caller then uses json_object mode. */
export function tryBuildStrictJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> | null {
  try {
    return objectToJsonSchema(unwrapField(schema).inner);
  } catch (error) {
    if (error instanceof UnsupportedZodShapeError) {
      console.warn('Intake strict schema conversion skipped:', error.message);
      return null;
    }
    throw error;
  }
}

/** Recursively drop null values (strict mode's stand-in for omitted optionals). */
export function stripNulls(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) {
    return value.map(stripNulls).filter((item) => item !== undefined);
  }
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      const cleaned = stripNulls(entry);
      if (cleaned !== undefined) out[key] = cleaned;
    }
    return out;
  }
  return value;
}

/**
 * Clamp strings/arrays to the zod schema's .max() limits before validation,
 * since the JSON schema sent to the API omits length keywords. Also drops
 * invalid values for OPTIONAL enums so a single stray label cannot sink the
 * whole extraction.
 */
export function clampToZodLimits(value: unknown, schema: z.ZodTypeAny): unknown {
  const { inner, optional } = unwrapField(schema);
  if (value === undefined || value === null) return undefined;
  const def = defOf(inner);

  switch (def.typeName) {
    case 'ZodString': {
      if (typeof value !== 'string') return value;
      const max = stringMaxLength(inner);
      return max !== null && value.length > max ? value.slice(0, max) : value;
    }
    case 'ZodArray': {
      if (!Array.isArray(value)) return value;
      const max = arrayMaxItems(inner);
      const items = (max !== null ? value.slice(0, max) : value)
        .map((item) => clampToZodLimits(item, def.type as z.ZodTypeAny))
        .filter((item) => item !== undefined);
      return items;
    }
    case 'ZodObject': {
      if (typeof value !== 'object' || Array.isArray(value)) return value;
      const shape = typeof def.shape === 'function' ? def.shape() : {};
      const out: Record<string, unknown> = {};
      for (const [key, fieldSchema] of Object.entries(shape)) {
        const clamped = clampToZodLimits((value as Record<string, unknown>)[key], fieldSchema);
        if (clamped !== undefined) out[key] = clamped;
      }
      return out;
    }
    case 'ZodEnum': {
      const values = (def.values ?? []) as unknown[];
      if (!values.includes(value) && optional) return undefined;
      return value;
    }
    default:
      return value;
  }
}

// ---------- Model ----------

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
    const strictSchema = tryBuildStrictJsonSchema(schema);
    const schemaName = opts.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);

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

        type TextFormat =
          | { type: 'json_object' }
          | { type: 'json_schema'; name: string; strict: true; schema: Record<string, unknown> };

        const request = (format: TextFormat) =>
          this.client.responses.create({
            model: this.model,
            input,
            text: {
              format,
              verbosity: getConfiguredTextVerbosity(),
            },
            reasoning: {
              effort: getConfiguredReasoningEffort(),
            },
            max_output_tokens: this.maxOutputTokens,
          });

        let response;
        if (strictSchema) {
          try {
            response = await request({
              type: 'json_schema',
              name: schemaName,
              strict: true,
              schema: strictSchema,
            });
          } catch (error) {
            // A rejected schema (unsupported keyword, nesting limit) is a
            // request-shape problem: retry once in plain JSON mode rather
            // than losing the turn.
            const status = (error as { status?: number }).status;
            if (status !== 400) throw error;
            console.warn(
              'Intake strict json_schema request rejected, falling back to json_object:',
              error instanceof Error ? error.message.slice(0, 200) : 'unknown',
            );
            response = await request({ type: 'json_object' });
          }
        } else {
          response = await request({ type: 'json_object' });
        }

        const outputText = (response as ParsedResponse).output_text;
        if (!outputText) {
          throw new Error('openai_json_output_missing');
        }

        let json: unknown;
        try {
          json = JSON.parse(outputText);
        } catch {
          throw new Error('openai_json_parse_failed');
        }

        const normalized = clampToZodLimits(stripNulls(json), schema);
        const result = schema.safeParse(normalized);
        if (!result.success) {
          throw new Error('openai_json_schema_validation_failed');
        }
        const parsed = result.data;

        if (!opts.includeRaw) return parsed;

        const usage = (response as ParsedResponse).usage;
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
