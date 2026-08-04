import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  clampToZodLimits,
  stripNulls,
  tryBuildStrictJsonSchema,
} from '../lib/automation-intake/model.js';

const schema = z.object({
  name: z.string().max(10).optional(),
  tools: z.array(z.string().max(5)).max(2).optional(),
  consent: z.boolean().optional(),
  maturity: z.enum(['none', 'experimental', 'active']).optional(),
  toolStack: z
    .object({ communication: z.array(z.string().max(120)).max(10).optional() })
    .optional(),
});

describe('tryBuildStrictJsonSchema', () => {
  it('emits an OpenAI-strict object schema', () => {
    const js = tryBuildStrictJsonSchema(schema) as Record<string, unknown>;
    expect(js.type).toBe('object');
    expect(js.additionalProperties).toBe(false);
    // Strict mode: every property must be required; optionality is nullability.
    expect(js.required).toEqual(['name', 'tools', 'consent', 'maturity', 'toolStack']);

    const props = js.properties as Record<string, Record<string, unknown>>;
    expect(props.name.type).toEqual(['string', 'null']);
    expect(props.consent.type).toEqual(['boolean', 'null']);
    expect(props.maturity.anyOf).toBeTruthy();
  });

  it('marks required fields as non-nullable', () => {
    const required = z.object({ title: z.string(), level: z.enum(['low', 'high']) });
    const js = tryBuildStrictJsonSchema(required) as Record<string, unknown>;
    const props = js.properties as Record<string, Record<string, unknown>>;
    expect(props.title.type).toBe('string');
    expect(props.level.enum).toEqual(['low', 'high']);
  });

  it('returns null for unsupported shapes instead of throwing', () => {
    const unsupported = z.object({ weird: z.union([z.string(), z.number()]) });
    expect(tryBuildStrictJsonSchema(unsupported)).toBeNull();
  });
});

describe('stripNulls + clampToZodLimits', () => {
  it('turns a messy strict-mode response into a valid parse', () => {
    const raw = {
      name: 'a-very-long-name-here',
      tools: ['abcdefgh', 'x', 'y'],
      consent: null,
      maturity: 'wildly-invalid',
      toolStack: null,
    };

    const cleaned = clampToZodLimits(stripNulls(raw), schema);

    expect(cleaned).toEqual({ name: 'a-very-lon', tools: ['abcde', 'x'] });
    expect(schema.safeParse(cleaned).success).toBe(true);
  });

  it('keeps valid enum values', () => {
    const cleaned = clampToZodLimits(stripNulls({ maturity: 'active' }), schema) as Record<
      string,
      unknown
    >;
    expect(cleaned.maturity).toBe('active');
  });

  it('strips nulls recursively inside nested objects', () => {
    const cleaned = stripNulls({ toolStack: { communication: null } });
    expect(cleaned).toEqual({ toolStack: {} });
  });
});
