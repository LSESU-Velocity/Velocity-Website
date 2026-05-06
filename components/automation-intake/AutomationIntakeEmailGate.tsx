import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import type { MagicEmailStartResponse } from '../../lib/automation-intake/schemas';

interface Props {
  isChecking: boolean;
  verificationFailed: boolean;
  onRequestEmail: (email: string) => Promise<MagicEmailStartResponse>;
  onRefresh: () => Promise<void>;
}

export const AutomationIntakeEmailGate: React.FC<Props> = ({
  isChecking,
  verificationFailed,
  onRequestEmail,
  onRefresh,
}) => {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(verificationFailed ? 'That verification link could not be used. Request a new one below.' : null);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (verificationFailed) {
      setError('That verification link could not be used. Request a new one below.');
    }
  }, [verificationFailed]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSending) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email address first.');
      return;
    }

    setIsSending(true);
    setError(null);
    setDevVerificationUrl(null);

    try {
      const response = await onRequestEmail(trimmed);
      setSentTo(response.email);
      setEmail(response.email);
      setDevVerificationUrl(response.devVerificationUrl ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send verification email right now.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    try {
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh verification status.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      className="border border-white/10 bg-black/30 backdrop-blur-sm"
      style={{ borderRadius: '1.5rem', minHeight: '420px' }}
    >
      <div className="p-6 md:p-8">
        <div className="inline-flex h-12 w-12 items-center justify-center border border-velocity-red/40 bg-velocity-red/10 text-velocity-red">
          {isChecking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
        </div>

        <div className="mt-6 max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.28em] text-velocity-red/80">
            Email verification required
          </div>
          <h2 className="mt-3 text-2xl md:text-3xl font-light text-white tracking-tight">
            Verify your email to use AI chat.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            The structured form stays open. The AI chat is locked until a one-time email link confirms
            there is a real person behind the session.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 md:flex-row">
          <label className="sr-only" htmlFor="intake-magic-email">
            Email address
          </label>
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              id="intake-magic-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              disabled={isSending || isChecking}
              className="h-12 w-full border border-white/10 bg-black/50 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-velocity-red/60 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={isSending || isChecking}
            className="inline-flex h-12 items-center justify-center gap-2 bg-velocity-red px-5 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-velocity-red/80 disabled:bg-white/10 disabled:text-white/35"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Send link
          </button>
        </form>

        {sentTo && (
          <div className="mt-5 border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-velocity-red" />
              <div>
                <div className="font-medium text-white">Check your inbox at {sentTo}.</div>
                <div className="mt-1 text-white/55">
                  The link expires in 30 minutes. After opening it, return here and refresh access if
                  the chat does not unlock automatically.
                </div>
              </div>
            </div>
          </div>
        )}

        {devVerificationUrl && (
          <div className="mt-4 border border-white/10 bg-black/40 p-4 text-xs text-white/60">
            <div className="mb-2 uppercase tracking-[0.2em] text-white/35">Development link</div>
            <a
              href={devVerificationUrl}
              className="break-all text-white underline decoration-white/30 underline-offset-4 hover:text-velocity-red"
            >
              {devVerificationUrl}
            </a>
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-2 text-sm text-velocity-red">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing || isChecking}
          className="mt-6 inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/55 transition-colors hover:border-white/25 hover:text-white disabled:opacity-40"
        >
          {isRefreshing || isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Refresh access
        </button>
      </div>
    </div>
  );
};
