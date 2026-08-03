/**
 * Structured logging for the Automation Intake chat route.
 *
 * One JSON line per chat turn. Emitted to stdout so Vercel log drains pick it up.
 * Never includes raw user content, raw IPs, or secrets.
 */
import type { StepId } from './schemas.js';
import type { ChatGuard, ChatMode } from './chat-runtime.js';

export interface ChatTurnLog {
  ts: string;
  scope: 'automation-intake-chat';
  sessionId: string;
  ipHash: string;
  step: StepId;
  mode: ChatMode;
  askedFollowUp: boolean;
  modelCallsTotal: number;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  estCostCents: number;
  guard: ChatGuard;
}

export type ChatTurnLogInput = Omit<ChatTurnLog, 'ts' | 'scope'>;

export function logChatTurn(entry: ChatTurnLogInput): void {
  const line: ChatTurnLog = {
    ts: new Date().toISOString(),
    scope: 'automation-intake-chat',
    ...entry,
  };
  try {
    // stdout only: never log the raw answer text or full draft.
    console.log(JSON.stringify(line));
  } catch {
    // Logging must never crash a handler.
  }
}

export function logSpendThreshold(
  threshold: '50' | '80' | '100',
  cents: number,
  capCents: number,
): void {
  const line = {
    ts: new Date().toISOString(),
    scope: 'automation-intake-chat',
    event: 'spend_threshold',
    threshold,
    cents: Math.round(cents * 100) / 100,
    capCents,
  };
  try {
    if (threshold === '100') console.error(JSON.stringify(line));
    else console.warn(JSON.stringify(line));
  } catch {
    // ignore
  }
}
