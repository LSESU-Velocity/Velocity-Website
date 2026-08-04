import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  crossedSpendThreshold,
  decideMode,
  DEFAULT_SESSION_MODEL_CALL_CAP,
  estimateCallCostCents,
  type ChatRuntime,
  type DecideModeContext,
} from '../lib/automation-intake/chat-runtime.js';

function runtime(overrides: Partial<ChatRuntime> = {}): ChatRuntime {
  return {
    sessionId: 's1',
    ipHash: 'hash',
    lastSeenAt: Date.now(),
    expiresAt: Date.now() + 1000,
    modelCallsTotal: 0,
    followUpsByStep: {},
    turnstileVerifiedAt: null,
    ...overrides,
  };
}

function ctx(overrides: Partial<DecideModeContext> = {}): DecideModeContext {
  return {
    runtime: runtime(),
    spendCents: 0,
    spendAvailable: true,
    ipSessionAllowed: true,
    ipSessionAvailable: true,
    runtimeAvailable: true,
    currentStep: 'business',
    firestoreAvailable: true,
    ...overrides,
  };
}

describe('decideMode guard ladder', () => {
  const envBackup: Record<string, string | undefined> = {};

  beforeEach(() => {
    envBackup.flag = process.env.AUTOMATION_INTAKE_ASSISTED_CHAT_ENABLED;
    envBackup.key = process.env.OPENAI_API_KEY;
    process.env.AUTOMATION_INTAKE_ASSISTED_CHAT_ENABLED = 'true';
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    if (envBackup.flag === undefined) delete process.env.AUTOMATION_INTAKE_ASSISTED_CHAT_ENABLED;
    else process.env.AUTOMATION_INTAKE_ASSISTED_CHAT_ENABLED = envBackup.flag;
    if (envBackup.key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = envBackup.key;
  });

  it('allows assisted mode when every guard passes', () => {
    expect(decideMode(ctx())).toMatchObject({ mode: 'assisted', guard: null });
  });

  it('is deterministic when the kill switch is off', () => {
    process.env.AUTOMATION_INTAKE_ASSISTED_CHAT_ENABLED = 'false';
    expect(decideMode(ctx()).guard).toBe('flag_off');
  });

  it('is deterministic without a model key', () => {
    delete process.env.OPENAI_API_KEY;
    expect(decideMode(ctx()).guard).toBe('missing_model_key');
  });

  it('never uses AI on the contact step', () => {
    const decision = decideMode(ctx({ currentStep: 'contact' }));
    expect(decision).toMatchObject({ mode: 'deterministic', guard: 'contact_step', stepFollowUpBudget: 0 });
  });

  it('fails closed when any counter is unreadable', () => {
    expect(decideMode(ctx({ spendAvailable: false })).guard).toBe('firestore_unavailable');
    expect(decideMode(ctx({ runtimeAvailable: false })).guard).toBe('firestore_unavailable');
    expect(decideMode(ctx({ ipSessionAvailable: false })).guard).toBe('firestore_unavailable');
  });

  it('enforces the per-IP session cap', () => {
    expect(decideMode(ctx({ ipSessionAllowed: false })).guard).toBe('ip_cap');
  });

  it('enforces the session model-call cap', () => {
    const decision = decideMode(
      ctx({ runtime: runtime({ modelCallsTotal: DEFAULT_SESSION_MODEL_CALL_CAP }) }),
    );
    expect(decision.guard).toBe('session_cap');
  });

  it('enforces the daily spend cap', () => {
    expect(decideMode(ctx({ spendCents: 1_000_000 })).guard).toBe('spend_cap');
  });
});

describe('crossedSpendThreshold', () => {
  it('reports the threshold crossed from below', () => {
    expect(crossedSpendThreshold(240, 260, 500)).toBe('50');
    expect(crossedSpendThreshold(390, 410, 500)).toBe('80');
    expect(crossedSpendThreshold(499, 500, 500)).toBe('100');
  });

  it('returns null when no boundary is crossed or cap is zero', () => {
    expect(crossedSpendThreshold(100, 110, 500)).toBeNull();
    expect(crossedSpendThreshold(0, 100, 0)).toBeNull();
  });
});

describe('estimateCallCostCents', () => {
  it('scales with token counts and never goes negative', () => {
    expect(estimateCallCostCents(1000, 500)).toBeGreaterThan(0);
    expect(estimateCallCostCents(-5, -5)).toBe(0);
  });
});
