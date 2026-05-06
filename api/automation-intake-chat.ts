import type { VercelRequest, VercelResponse } from '@vercel/node';

import {
  checkFirestoreRateLimit,
  getTrustedClientIp,
  handleCors,
} from '../lib/serverSecurity.js';
import {
  ChatRequestSchema,
  type ChatResponse,
} from '../lib/automation-intake/schemas.js';
import { advanceChatTurn } from '../lib/automation-intake/engine.js';
import {
  bumpDailySpendCents,
  checkAndRecordIpSession,
  crossedSpendThreshold,
  DEFAULT_SESSION_MODEL_CALL_CAP,
  decideMode,
  estimateCallCostCents,
  getDailySpendCapCents,
  getDailySpendCents,
  hashIp,
  loadRuntime,
  saveRuntime,
  withBumpedFollowUp,
  withBumpedModelCalls,
  type ChatGuard,
} from '../lib/automation-intake/chat-runtime.js';
import { logChatTurn, logSpendThreshold } from '../lib/automation-intake/chat-log.js';
import {
  buildClearIntakeEmailCookie,
  getVerifiedIntakeEmail,
  initAutomationIntakeFirebase,
} from '../lib/automation-intake/email-verification.js';

const MAX_BODY_BYTES = 48 * 1024;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;
const MIN_REQUEST_GAP_MS = 1500;

function bodyIsTooLarge(req: VercelRequest): boolean {
  const len = Number(req.headers['content-length'] ?? 0);
  return Number.isFinite(len) && len > 0 && len > MAX_BODY_BYTES;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (bodyIsTooLarge(req)) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  let body: unknown;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const db = initAutomationIntakeFirebase();
  if (!db) {
    return res.status(503).json({ error: 'Email verification is temporarily unavailable.' });
  }

  const verifiedEmail = await getVerifiedIntakeEmail(db, req);
  if (!verifiedEmail.verified) {
    if (verifiedEmail.reason && verifiedEmail.reason !== 'missing') {
      res.setHeader('Set-Cookie', buildClearIntakeEmailCookie(req));
    }

    return res.status(401).json({
      error: 'Verify your email before using AI chat.',
    });
  }

  const ip = getTrustedClientIp(req);
  const ipHashValue = hashIp(ip);

  const rateLimit = await checkFirestoreRateLimit(db, {
    prefix: 'intake_chat',
    identifier: ip,
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS,
    minGapMs: MIN_REQUEST_GAP_MS,
  });
  if (!rateLimit.allowed) {
    if (rateLimit.reason === 'unavailable') {
      return res.status(503).json({ error: 'Rate limiting is temporarily unavailable. Please try again.' });
    }

    return res.status(429).json({
      error:
        rateLimit.reason === 'burst'
          ? 'Please wait a moment before sending another message.'
          : 'Too many requests. Please slow down.',
    });
  }

  const { draft, answer, editingStepId } = parsed.data;
  const sessionId = draft.sessionId;
  const stepAtStart = draft.currentStep;
  const startTs = Date.now();

  // ---------- Load runtime + decide mode ----------
  const { runtime, available: runtimeAvailable } = await loadRuntime(db, sessionId, ipHashValue);
  if (runtimeAvailable && runtime.ipHash !== ipHashValue) {
    return res.status(403).json({ error: 'Session does not belong to this requester.' });
  }

  const { cents: spendCents, available: spendAvailable } = await getDailySpendCents(db);
  const ipSession = await checkAndRecordIpSession(db, sessionId, ipHashValue);

  const decision = decideMode({
    runtime,
    spendCents,
    spendAvailable,
    ipSessionAllowed: ipSession.allowed,
    ipSessionAvailable: ipSession.available,
    runtimeAvailable,
    currentStep: stepAtStart,
    firestoreAvailable: Boolean(db),
  });

  // Budget edit rebuilds so a single edit can't blow the whole session cap.
  const sessionModelCallBudget = Math.max(
    0,
    DEFAULT_SESSION_MODEL_CALL_CAP - runtime.modelCallsTotal,
  );

  // ---------- Advance ----------
  let turnResult;
  try {
    turnResult = await advanceChatTurn({
      draft,
      answer,
      mode: decision.mode,
      editingStepId: editingStepId ?? null,
      stepFollowUpBudget: decision.stepFollowUpBudget,
      sessionModelCallBudget,
    });
  } catch (error) {
    console.error(
      'Intake chat advance error:',
      error instanceof Error ? error.message : 'unknown',
    );
    return res
      .status(500)
      .json({ error: 'Unable to advance intake right now. Please try again.' });
  }

  // ---------- Update runtime + spend ----------
  let nextRuntime = { ...runtime, lastSeenAt: Date.now() };

  if (turnResult.modelCallsMade > 0) {
    nextRuntime = withBumpedModelCalls(nextRuntime, turnResult.modelCallsMade);
    const cost = estimateCallCostCents(turnResult.tokensIn, turnResult.tokensOut);
    if (cost > 0) {
      const cap = getDailySpendCapCents();
      const threshold = crossedSpendThreshold(spendCents, spendCents + cost, cap);
      await bumpDailySpendCents(db, cost);
      if (threshold) logSpendThreshold(threshold, spendCents + cost, cap);
    }
  }

  if (turnResult.followUpEmitted && turnResult.modeUsed === 'assisted') {
    nextRuntime = withBumpedFollowUp(nextRuntime, stepAtStart);
  }

  await saveRuntime(db, nextRuntime);

  // ---------- Log ----------
  const guard: ChatGuard = decision.guard ?? turnResult.guard ?? null;
  logChatTurn({
    sessionId,
    ipHash: ipHashValue,
    step: stepAtStart,
    mode: turnResult.modeUsed,
    askedFollowUp: turnResult.followUpEmitted,
    modelCallsTotal: nextRuntime.modelCallsTotal,
    latencyMs: Date.now() - startTs,
    tokensIn: turnResult.tokensIn,
    tokensOut: turnResult.tokensOut,
    estCostCents:
      turnResult.modelCallsMade > 0
        ? estimateCallCostCents(turnResult.tokensIn, turnResult.tokensOut)
        : 0,
    guard,
  });

  // ---------- Respond ----------
  const response: ChatResponse = {
    draft: turnResult.draft,
    assistantMessage: turnResult.assistantMessage,
    readyForReview: turnResult.readyForReview,
  };
  return res.status(200).json(response);
}
