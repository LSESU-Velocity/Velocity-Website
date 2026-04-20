import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { AutomationIntakeShell } from './automation-intake/AutomationIntakeShell';
import { AutomationIntakeChat } from './automation-intake/AutomationIntakeChat';
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

export const AutomationIntake: React.FC = () => {
  const [view, setView] = useState<IntakeViewMode>('chat');
  const [pageMode, setPageMode] = useState<PageMode>('collect');
  const [submittedBrief, setSubmittedBrief] = useState<FinalBrief | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [draft, setDraft] = useState<AutomationIntakeDraft>(() => {
    const existing = loadDraft();
    if (existing) return rebuildDeterministicDraft(existing);
    return rebuildDeterministicDraft(createInitialDraft());
  });

  // Scroll to top on mount — React Router preserves scroll position between routes otherwise.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

    return (
      <AutomationIntakeChat
        draft={draft}
        onDraftChange={handleDraftChange}
        onReviewRequested={handleReviewRequested}
      />
    );
  }, [pageMode, submittedBrief, view, draft, honeypot, handleDraftChange, handleReviewRequested, handleBackToCollect, handleSubmitted]);

  return (
    <AutomationIntakeShell
      mode={view}
      onModeChange={setView}
      currentStep={draft.currentStep}
      status={pageMode === 'complete' ? 'submitted' : draft.status === 'review' ? 'review' : 'collecting'}
      hideToggle={hideToggle}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={pageMode === 'collect' ? view : pageMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </AutomationIntakeShell>
  );
};

export default AutomationIntake;
