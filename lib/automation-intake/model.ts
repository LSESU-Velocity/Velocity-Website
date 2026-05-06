/**
 * Gemini model factory for the Automation Intake feature.
 *
 * This deliberately does NOT share code with lib/launchpad-lab/model.ts:
 * - Launchpad uses BYOK (user-supplied key via x-provider-key header)
 * - Automation Intake uses a server-owned key from AUTOMATION_INTAKE_GEMINI_API_KEY
 *
 * If the env var is absent, createIntakeModel throws MissingModelKeyError so
 * the engine can fall back to deterministic heuristic extraction.
 */
import { ChatGoogle } from '@langchain/google/node';

export class MissingModelKeyError extends Error {
  constructor(message = 'AUTOMATION_INTAKE_GEMINI_API_KEY is not set') {
    super(message);
    this.name = 'MissingModelKeyError';
  }
}

export interface IntakeModelOptions {
  temperature?: number;
  maxOutputTokens?: number;
  modelOverride?: string;
}

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const DEFAULT_MAX_RETRIES = 0;

function getConfiguredMaxRetries(): number {
  const raw = process.env.AUTOMATION_INTAKE_MODEL_MAX_RETRIES;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_MAX_RETRIES;
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_RETRIES;
  return Math.max(0, Math.min(parsed, 1));
}

export function getConfiguredModelName(): string {
  return process.env.AUTOMATION_INTAKE_GEMINI_MODEL || DEFAULT_MODEL;
}

export function hasModelKey(): boolean {
  const key = process.env.AUTOMATION_INTAKE_GEMINI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

export function createIntakeModel(opts: IntakeModelOptions = {}): ChatGoogle {
  const key = process.env.AUTOMATION_INTAKE_GEMINI_API_KEY;
  if (!key || !key.trim()) throw new MissingModelKeyError();

  return new ChatGoogle({
    apiKey: key.trim(),
    model: opts.modelOverride || getConfiguredModelName(),
    temperature: opts.temperature ?? 0.2,
    maxOutputTokens: opts.maxOutputTokens ?? 2048,
    maxRetries: getConfiguredMaxRetries(),
  });
}
