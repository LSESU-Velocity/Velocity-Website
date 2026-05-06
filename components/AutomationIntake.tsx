import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { AutomationIntakeShell } from './automation-intake/AutomationIntakeShell';
import { AutomationIntakeChat } from './automation-intake/AutomationIntakeChat';
import { AutomationIntakeEmailGate } from './automation-intake/AutomationIntakeEmailGate';
import { AutomationIntakeForm } from './automation-intake/AutomationIntakeForm';
import { AutomationIntakeReview } from './automation-intake/AutomationIntakeReview';
import { AutomationIntakeComplete } from './automation-intake/AutomationIntakeComplete';
import type { IntakeViewMode } from './automation-intake/AutomationIntakeToggle';

import {
  loadDraft,
  saveDraft,
  clearDraft,
} from '../lib/automation-intake/storage';
import {
  createInitialDraft,
} from '../lib/automation-intake/draft';
import {
  getIntakeEmailVerificationStatus,
  requestIntakeMagicEmail,
} from '../lib/automation-intake/client';
import { rebuildDeterministicDraft } from '../lib/automation-intake/deterministic';
import {
  STEP_DEFINITIONS,
  FIRST_STEP,
} from '../lib/automation-intake/questions';
import type {
  AutomationIntakeDraft,
  FinalBrief,
} from '../lib/automation-intake/schemas';

type PageMode = 'collect' | 'review' | 'complete';
type EmailVerificationState = {
  isChecking: boolean;
  verified: boolean;
  email?: string;
  expiresAt?: number;
};

export const AutomationIntake: React.FC = () => {
  const [view, setView] = useState<IntakeViewMode>('chat');
  const [pageMode, setPageMode] = useState<PageMode>('collect');
  const [submittedBrief, setSubmittedBrief] = useState<FinalBrief | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [emailVerification, setEmailVerification] = useState<EmailVerificationState>({
    isChecking: true,
    verified: false,
  });
  const [draft, setDraft] = useState<AutomationIntakeDraft>(() => {
    const existing = loadDraft();
    if (existing) return rebuildDeterministicDraft(existing);
    return rebuildDeterministicDraft(createInitialDraft());
  });

  const refreshEmailVerification = useCallback(async () => {
    setEmailVerification((current) => ({ ...current, isChecking: true }));
    const status = await getIntakeEmailVerificationStatus();
    setEmailVerification({
      isChecking: false,
      verified: status.verified,
      email: status.email,
      expiresAt: status.expiresAt,
    });
    if (status.verified) {
      setVerificationFailed(false);
      setView('chat');
    }
  }, []);

  const handleRequestMagicEmail = useCallback((email: string) => {
    return requestIntakeMagicEmail({
      email,
      sessionId: draft.sessionId,
    });
  }, [draft.sessionId]);

  // Scroll to top on mount — React Router preserves scroll position between routes otherwise.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verificationResult = params.get('intakeEmailVerified');

    if (verificationResult === '0') {
      setVerificationFailed(true);
      setView('chat');
    }

    void refreshEmailVerification().catch((error) => {
      console.warn(
        'Automation intake email verification status failed:',
        error instanceof Error ? error.message : 'unknown',
      );
      setEmailVerification((current) => ({
        ...current,
        isChecking: false,
        verified: false,
      }));
    });

    if (verificationResult) {
      params.delete('intakeEmailVerified');
      const nextQuery = params.toString();
      const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
      window.history.replaceState(null, '', nextUrl);
    }
  }, [refreshEmailVerification]);

  // Persist draft on every change.
  useEffect(() => {
    if (pageMode === 'complete') return;
    saveDraft(draft);
  }, [draft, pageMode]);

  // If engine bumped us into 'review', switch page mode unless we're already there.
  useEffect(() => {
    if (draft.status === 'review' && pageMode === 'collect') {
      // Stay in 'collect' until the user clicks the review CTA — don't auto-jump.
    }
  }, [draft.status, pageMode]);

  const handleDraftChange = useCallback((next: AutomationIntakeDraft) => {
    setDraft(next);
  }, []);

  const handleReset = useCallback(() => {
    const fresh = rebuildDeterministicDraft(createInitialDraft());
    clearDraft();
    setDraft(fresh);
    setPageMode('collect');
    setView('chat');
    setSubmittedBrief(null);
    setHoneypot('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleReviewRequested = useCallback(() => {
    setPageMode('review');
  }, []);

  const handleBackToCollect = useCallback((focusSection?: string) => {
    setPageMode('collect');
    if (focusSection) {
      setView('form');
      // Scroll focus handled by form via data-scroll anchor.
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(`[data-intake-section="${focusSection}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  const handleSubmitted = useCallback((brief: FinalBrief, savedId: string) => {
    void savedId;
    setSubmittedBrief(brief);
    setPageMode('complete');
    setHoneypot('');
    clearDraft();
  }, []);

  const hideToggle = pageMode !== 'collect';

  const body = useMemo(() => {
    if (pageMode === 'complete' && submittedBrief) {
      return <AutomationIntakeComplete brief={submittedBrief} />;
    }

    if (pageMode === 'review') {
      return (
        <AutomationIntakeReview
          draft={draft}
          honeypot={honeypot}
          onEdit={(section) => handleBackToCollect(section)}
          onSubmitted={handleSubmitted}
          submissionMode={view}
        />
      );
    }

    if (view === 'form') {
      return (
        <AutomationIntakeForm
          draft={draft}
          honeypot={honeypot}
          onDraftChange={handleDraftChange}
          onHoneypotChange={setHoneypot}
          onReviewRequested={handleReviewRequested}
        />
      );
    }

    if (!emailVerification.verified) {
      return (
        <AutomationIntakeEmailGate
          isChecking={emailVerification.isChecking}
          verificationFailed={verificationFailed}
          onRequestEmail={handleRequestMagicEmail}
          onRefresh={refreshEmailVerification}
        />
      );
    }

    return (
      <AutomationIntakeChat
        draft={draft}
        onDraftChange={handleDraftChange}
        onReviewRequested={handleReviewRequested}
      />
    );
  }, [pageMode, submittedBrief, view, draft, honeypot, emailVerification.verified, emailVerification.isChecking, verificationFailed, handleDraftChange, handleReviewRequested, handleBackToCollect, handleSubmitted, handleRequestMagicEmail, refreshEmailVerification]);

  return (
    <AutomationIntakeShell
      mode={view}
      onModeChange={setView}
      currentStep={draft.currentStep}
      status={pageMode === 'complete' ? 'submitted' : draft.status === 'review' ? 'review' : 'collecting'}
      hideToggle={hideToggle}
      chatLocked={!emailVerification.verified}
      onLockedChatClick={() => setView('chat')}
      canReset={pageMode !== 'complete'}
      onReset={handleReset}
    >
      <motion.div
        key={pageMode === 'collect' ? view : pageMode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {body}
      </motion.div>
    </AutomationIntakeShell>
  );
};

export default AutomationIntake;
