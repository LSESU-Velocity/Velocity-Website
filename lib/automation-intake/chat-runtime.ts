/**
 * Server-only runtime metadata for the Automation Intake chat.
 *
 * Tracks everything the client must not be trusted to manage:
 *  - whether AI assistance is enabled for this request (kill switch + key check)
 *  - per-session model-call count
 *  - per-step AI follow-up count (independent of transcript state)
 *  - distinct sessions per IP per day
 *  - global daily AI spend (cents)
 *
 * The Firestore doc lives at `automationIntakeChatRuntime/{sessionId}`.
 * Spend + distinct-session counters live in `rateLimits`.
 *
 * Firestore read failures surface as "unavailable" so the server can fail
 * closed for AI guard decisions while still keeping the chat route itself
 * alive via deterministic fallback.
 */
import { createHash } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';

import { STEP_IDS, type StepId } from './schemas.js';
import { hasModelKey } from './model.js';

// ---------- Defaults ----------

export const DEFAULT_SESSION_MODEL_CALL_CAP = 12;
export const DEFAULT_DAILY_SESSIONS_PER_IP = 8;
export const DEFAULT_DAILY_SPEND_CENTS = 500;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const DAILY_TTL_MS = 36 * 60 * 60 * 1000;

/**
 * Per-step AI follow-up limits. Plan §Architecture decisions.
 * `contact` is deterministic-only (0) so the server never treats it as an AI step.
 */
export const STEP_FOLLOWUP_LIMITS: Record<StepId, number> = {
  business: 2,
  systems: 2,
  'workflow-name': 1,
  'workflow-ownership': 1,
  'workflow-tools': 1,
  'workflow-steps': 2,
  'pain-points': 2,
  'ai-usage': 1,
  'ai-non-use': 1,
  constraints: 1,
  goals: 2,
  contact: 0,
};

// ---------- Types ----------

export type ChatMode = 'assisted' | 'deterministic';

export type ChatGuard =
  | 'flag_off'
  | 'missing_model_key'
  | 'session_cap'
  | 'spend_cap'
  | 'ip_cap'
  | 'step_cap'
  | 'firestore_unavailable'
  | 'contact_step'
  | 'opt_out'
  | 'edit'
  | 'timeout'
  | 'output_rejected'
  | 'extraction_failed'
  | null;

export interface ChatRuntime {
  sessionId: string;
  ipHash: string;
  lastSeenAt: number;
  expiresAt: number;
  modelCallsTotal: number;
  followUpsByStep: Partial<Record<StepId, number>>;
  turnstileVerifiedAt: number | null;
}

// ---------- Config ----------

const RUNTIME_COLLECTION = 'automationIntakeChatRuntime';
const RATE_LIMITS_COLLECTION = 'rateLimits';

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

export function isAssistedChatEnabled(): boolean {
  return process.env.AUTOMATION_INTAKE_ASSISTED_CHAT_ENABLED === 'true';
}

export function getDailySpendCapCents(): number {
  const raw = process.env.AUTOMATION_INTAKE_AI_DAILY_CAP_USD_CENTS;
  if (!raw) return DEFAULT_DAILY_SPEND_CENTS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_DAILY_SPEND_CENTS;
  return parsed;
}

export function getDailySessionsPerIpCap(): number {
  const raw = process.env.AUTOMATION_INTAKE_DAILY_SESSIONS_PER_IP;
  if (!raw) return DEFAULT_DAILY_SESSIONS_PER_IP;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_DAILY_SESSIONS_PER_IP;
  return Math.min(parsed, 100);
}

function dateBucket(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

// ---------- Cost estimation ----------

/**
 * Conservative cents estimate for nano-class intake model calls.
 * Defaults to a mild safety margin above the published token rates so the
 * daily cap under-spends rather than overruns if pricing shifts.
 */
export function estimateCallCostCents(tokensIn: number, tokensOut: number): number {
  // Convert the configured nano-class model's approximate USD token rates to
  // cents, then double for a conservative budget guard.
  const inputCents = Math.max(0, tokensIn) * 0.000005;
  const outputCents = Math.max(0, tokensOut) * 0.00004;
  return (inputCents + outputCents) * 2;
}

/** Best-effort token estimate from character count when provider usage isn't returned. */
export function estimateTokensFromChars(chars: number): number {
  if (!Number.isFinite(chars) || chars <= 0) return 0;
  return Math.ceil(chars / 4);
}

// ---------- Runtime doc ----------

function defaultRuntime(sessionId: string, ipHash: string, now = Date.now()): ChatRuntime {
  return {
    sessionId,
    ipHash,
    lastSeenAt: now,
    expiresAt: now + SESSION_TTL_MS,
    modelCallsTotal: 0,
    followUpsByStep: {},
    turnstileVerifiedAt: null,
  };
}

function sanitizeStepCounts(raw: unknown): Partial<Record<StepId, number>> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Partial<Record<StepId, number>> = {};
  for (const stepId of STEP_IDS) {
    const value = (raw as Record<string, unknown>)[stepId];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      out[stepId] = Math.floor(value);
    }
  }
  return out;
}

export async function loadRuntime(
  db: Firestore | null,
  sessionId: string,
  ipHash: string,
): Promise<{ runtime: ChatRuntime; available: boolean }> {
  const now = Date.now();
  const defaults = defaultRuntime(sessionId, ipHash, now);
  // No Firestore at all → treat counters as unknown. `available: false` tells
  // decideMode to fall back to deterministic so we don't burn budget against
  // phantom zeros.
  if (!db) return { runtime: defaults, available: false };

  try {
    const ref = db.collection(RUNTIME_COLLECTION).doc(sessionId);
    const doc = await ref.get();
    if (!doc.exists) return { runtime: defaults, available: true };
    const data = doc.data() ?? {};
    return {
      runtime: {
        sessionId,
        ipHash: typeof data.ipHash === 'string' ? data.ipHash : ipHash,
        lastSeenAt: typeof data.lastSeenAt === 'number' ? data.lastSeenAt : now,
        expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : defaults.expiresAt,
        modelCallsTotal: typeof data.modelCallsTotal === 'number' ? data.modelCallsTotal : 0,
        followUpsByStep: sanitizeStepCounts(data.followUpsByStep),
        turnstileVerifiedAt:
          typeof data.turnstileVerifiedAt === 'number' ? data.turnstileVerifiedAt : null,
      },
      available: true,
    };
  } catch (error) {
    // Partial Firestore failure: we can't trust session-level counters, so we
    // must fail closed at the guard. Return `available: false` and defaults.
    console.warn(
      'Intake chat runtime load failed:',
      error instanceof Error ? error.message : 'unknown',
    );
    return { runtime: defaults, available: false };
  }
}

export async function saveRuntime(db: Firestore | null, runtime: ChatRuntime): Promise<void> {
  if (!db) return;
  try {
    const ref = db.collection(RUNTIME_COLLECTION).doc(runtime.sessionId);
    await ref.set(
      {
        sessionId: runtime.sessionId,
        ipHash: runtime.ipHash,
        lastSeenAt: runtime.lastSeenAt,
        expiresAt: runtime.expiresAt,
        modelCallsTotal: runtime.modelCallsTotal,
        followUpsByStep: runtime.followUpsByStep,
        turnstileVerifiedAt: runtime.turnstileVerifiedAt,
      },
      { merge: true },
    );
  } catch (error) {
    console.warn(
      'Intake chat runtime save failed:',
      error instanceof Error ? error.message : 'unknown',
    );
  }
}

// ---------- IP distinct-session counter ----------

/**
 * Track distinct (ipHash, date, sessionId) triples with a per-IP bucket doc.
 * If the sessionId is already seen for today, allow. If the bucket is at cap,
 * deny further *new* sessions from this IP. Existing ones continue to work.
 */
export async function checkAndRecordIpSession(
  db: Firestore | null,
  sessionId: string,
  ipHash: string,
): Promise<{ allowed: boolean; count: number; available: boolean }> {
  // No Firestore → counter is unknown. Report unavailable so decideMode can
  // fall back to deterministic rather than silently bypass the IP cap.
  if (!db) return { allowed: false, count: 0, available: false };
  const bucket = dateBucket();
  const ref = db
    .collection(RATE_LIMITS_COLLECTION)
    .doc(`intake_ai_sessions_${bucket}_${ipHash}`);
  const limit = getDailySessionsPerIpCap();
  try {
    const doc = await ref.get();
    const now = Date.now();
    const data = doc.exists ? doc.data() ?? {} : {};
    const existing: string[] = Array.isArray(data.sessionIds) ? data.sessionIds : [];
    if (existing.includes(sessionId)) {
      return { allowed: true, count: existing.length, available: true };
    }
    if (existing.length >= limit) {
      return { allowed: false, count: existing.length, available: true };
    }
    const next = [...existing, sessionId];
    await ref.set(
      {
        sessionIds: next,
        count: next.length,
        updatedAt: now,
        expiresAt: now + DAILY_TTL_MS,
      },
      { merge: true },
    );
    return { allowed: true, count: next.length, available: true };
  } catch (error) {
    // Partial Firestore failure. Don't assume the cap is fine — surface it as
    // unavailable so the guard fails closed.
    console.warn(
      'Intake chat IP session check failed:',
      error instanceof Error ? error.message : 'unknown',
    );
    return { allowed: false, count: 0, available: false };
  }
}

// ---------- Daily spend counter ----------

/**
 * Read the current day's AI spend counter. Returns 0 on failure so we don't block
 * AI calls because Firestore hiccupped — but note the guard so the caller can log it.
 */
export async function getDailySpendCents(
  db: Firestore | null,
): Promise<{ cents: number; available: boolean }> {
  if (!db) return { cents: 0, available: false };
  const bucket = dateBucket();
  const ref = db.collection(RATE_LIMITS_COLLECTION).doc(`intake_ai_spend_${bucket}`);
  try {
    const doc = await ref.get();
    const value = doc.exists ? doc.data()?.cents : 0;
    return { cents: typeof value === 'number' && Number.isFinite(value) ? value : 0, available: true };
  } catch (error) {
    console.warn(
      'Intake chat spend read failed:',
      error instanceof Error ? error.message : 'unknown',
    );
    return { cents: 0, available: false };
  }
}

export async function bumpDailySpendCents(
  db: Firestore | null,
  deltaCents: number,
): Promise<void> {
  if (!db || !Number.isFinite(deltaCents) || deltaCents <= 0) return;
  const bucket = dateBucket();
  const ref = db.collection(RATE_LIMITS_COLLECTION).doc(`intake_ai_spend_${bucket}`);
  try {
    const now = Date.now();
    const doc = await ref.get();
    if (!doc.exists) {
      await ref.set({ cents: deltaCents, updatedAt: now, expiresAt: now + DAILY_TTL_MS });
      return;
    }
    const prev = doc.data()?.cents ?? 0;
    await ref.update({
      cents: (typeof prev === 'number' && Number.isFinite(prev) ? prev : 0) + deltaCents,
      updatedAt: now,
    });
  } catch (error) {
    console.warn(
      'Intake chat spend bump failed:',
      error instanceof Error ? error.message : 'unknown',
    );
  }
}

// ---------- Mode decision ----------

export interface DecideModeContext {
  runtime: ChatRuntime;
  spendCents: number;
  /** Whether the daily spend counter was readable from Firestore. */
  spendAvailable: boolean;
  ipSessionAllowed: boolean;
  /** Whether the per-IP session bucket was readable/writable. */
  ipSessionAvailable: boolean;
  /** Whether the per-session runtime doc was readable. */
  runtimeAvailable: boolean;
  currentStep: StepId;
  /** Whether we even have a Firestore client. */
  firestoreAvailable: boolean;
}

export interface ModeDecision {
  mode: ChatMode;
  guard: ChatGuard;
  /** Remaining AI follow-up budget for the current step. 0 = none left. */
  stepFollowUpBudget: number;
}

/**
 * Decide whether THIS turn may use AI. Always returns a mode plus an optional guard
 * that tells the logger *why* we chose deterministic when we did.
 */
export function decideMode(ctx: DecideModeContext): ModeDecision {
  const stepLimit = STEP_FOLLOWUP_LIMITS[ctx.currentStep] ?? 0;
  const used = ctx.runtime.followUpsByStep[ctx.currentStep] ?? 0;
  const stepBudget = Math.max(0, stepLimit - used);

  if (!isAssistedChatEnabled()) {
    return { mode: 'deterministic', guard: 'flag_off', stepFollowUpBudget: stepBudget };
  }
  if (!hasModelKey()) {
    return { mode: 'deterministic', guard: 'missing_model_key', stepFollowUpBudget: stepBudget };
  }
  if (ctx.currentStep === 'contact') {
    return { mode: 'deterministic', guard: 'contact_step', stepFollowUpBudget: 0 };
  }
  // Fail closed on any unavailable guard counter before interpreting the
  // corresponding values. Otherwise partial Firestore outages get logged as
  // genuine caps (for example `ip_cap`) instead of the underlying storage
  // problem that forced deterministic fallback.
  if (
    !ctx.firestoreAvailable ||
    !ctx.runtimeAvailable ||
    !ctx.ipSessionAvailable ||
    !ctx.spendAvailable
  ) {
    return {
      mode: 'deterministic',
      guard: 'firestore_unavailable',
      stepFollowUpBudget: stepBudget,
    };
  }
  if (!ctx.ipSessionAllowed) {
    return { mode: 'deterministic', guard: 'ip_cap', stepFollowUpBudget: stepBudget };
  }
  if (ctx.runtime.modelCallsTotal >= DEFAULT_SESSION_MODEL_CALL_CAP) {
    return { mode: 'deterministic', guard: 'session_cap', stepFollowUpBudget: stepBudget };
  }
  if (ctx.spendAvailable && ctx.spendCents >= getDailySpendCapCents()) {
    return { mode: 'deterministic', guard: 'spend_cap', stepFollowUpBudget: stepBudget };
  }
  return { mode: 'assisted', guard: null, stepFollowUpBudget: stepBudget };
}

// ---------- Mutators ----------

export function withBumpedFollowUp(runtime: ChatRuntime, stepId: StepId): ChatRuntime {
  const prev = runtime.followUpsByStep[stepId] ?? 0;
  return {
    ...runtime,
    followUpsByStep: { ...runtime.followUpsByStep, [stepId]: prev + 1 },
  };
}

export function withBumpedModelCall(runtime: ChatRuntime): ChatRuntime {
  return {
    ...runtime,
    modelCallsTotal: runtime.modelCallsTotal + 1,
    lastSeenAt: Date.now(),
  };
}

/** Bump the session model-call counter by N at once — used for edit rebuilds. */
export function withBumpedModelCalls(runtime: ChatRuntime, delta: number): ChatRuntime {
  if (!Number.isFinite(delta) || delta <= 0) return runtime;
  return {
    ...runtime,
    modelCallsTotal: runtime.modelCallsTotal + Math.floor(delta),
    lastSeenAt: Date.now(),
  };
}

// ---------- Spend-warning helper ----------

/**
 * Returns a crossing bucket ('50'|'80'|'100') when `next` crosses that threshold
 * from below. Useful for single-shot log warnings without spamming.
 */
export function crossedSpendThreshold(
  prev: number,
  next: number,
  cap: number,
): '50' | '80' | '100' | null {
  if (cap <= 0) return null;
  const thresholds: Array<{ name: '50' | '80' | '100'; ratio: number }> = [
    { name: '50', ratio: 0.5 },
    { name: '80', ratio: 0.8 },
    { name: '100', ratio: 1.0 },
  ];
  for (const { name, ratio } of thresholds) {
    const boundary = cap * ratio;
    if (prev < boundary && next >= boundary) return name;
  }
  return null;
}
