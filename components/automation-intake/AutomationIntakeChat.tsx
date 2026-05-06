import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowUp, Pencil } from 'lucide-react';
import {
  advanceDeterministicDraftFromAnswer,
  getDeterministicAnswer,
  getPreviousCompletedStep,
  isRequiredCatchUpState,
  replaceDeterministicAnswer,
  withDeterministicScopeHint,
} from '../../lib/automation-intake/deterministic';
import { postIntakeChat, IntakeApiError } from '../../lib/automation-intake/client';
import type {
  AutomationIntakeDraft,
  ChatMessage,
  StepId,
} from '../../lib/automation-intake/schemas';

interface Props {
  draft: AutomationIntakeDraft;
  onDraftChange: (next: AutomationIntakeDraft) => void;
  onReviewRequested: () => void;
}

function formatTranscript(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((message) => message.content && message.content.trim().length > 0);
}

function shouldUseLocalFallback(error: unknown): boolean {
  return !(error instanceof IntakeApiError && [401, 403, 429].includes(error.status));
}

const MIN_CHAT_REQUEST_GAP_MS = 1_650;
const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const AutomationIntakeChat: React.FC<Props> = ({
  draft,
  onDraftChange,
  onReviewRequested,
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<StepId | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Optimistic copy of the user's message while the server call is in flight.
  // Clears the moment the server response updates `draft.transcript`.
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastChatRequestAtRef = useRef(0);

  const messages = formatTranscript(draft.transcript);
  const readyForReview = draft.status === 'review';
  const previousCompletedStep = getPreviousCompletedStep(draft);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, isSubmitting, pendingUserText]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input, editingStepId]);

  const startEditing = (stepId: StepId) => {
    setEditingStepId(stepId);
    setInput(getDeterministicAnswer(draft, stepId) ?? '');
    setError(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleBack = () => {
    if (!previousCompletedStep) return;
    startEditing(previousCompletedStep);
  };

  const cancelEditing = () => {
    setEditingStepId(null);
    setInput('');
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const answer = input.trim();
    if (!answer) return;

    if (
      !editingStepId &&
      isRequiredCatchUpState(draft) &&
      /^(skip|pass|move on|no more)$/i.test(answer)
    ) {
      setError(
        "That detail is still required before review. Edit the earlier answer or reply with the missing information.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    // Show the user's message immediately so they aren't staring at an empty
    // input while the server thinks.
    if (!editingStepId) setPendingUserText(answer);

    try {
      const elapsedSinceLastRequest = Date.now() - lastChatRequestAtRef.current;
      if (
        lastChatRequestAtRef.current > 0 &&
        elapsedSinceLastRequest < MIN_CHAT_REQUEST_GAP_MS
      ) {
        await delay(MIN_CHAT_REQUEST_GAP_MS - elapsedSinceLastRequest);
      }
      lastChatRequestAtRef.current = Date.now();
      const { draft: nextDraft } = await postIntakeChat({
        draft,
        answer,
        editingStepId,
      });
      onDraftChange(nextDraft);
      setInput('');
      setEditingStepId(null);
    } catch (err) {
      if (shouldUseLocalFallback(err)) {
        try {
          const fallback = editingStepId
            ? replaceDeterministicAnswer(draft, editingStepId, answer)
            : advanceDeterministicDraftFromAnswer({ draft, answer });
          const hintedFallback = editingStepId
            ? fallback
            : withDeterministicScopeHint(fallback, draft.currentStep, answer);
          onDraftChange(hintedFallback.draft);
          setInput('');
          setEditingStepId(null);
          return;
        } catch (fallbackErr) {
          console.warn(
            'Automation intake local fallback failed:',
            fallbackErr instanceof Error ? fallbackErr.message : 'unknown',
          );
        }
      }

      const message =
        err instanceof IntakeApiError
          ? err.message
          : 'Unable to continue the conversation right now. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
      setPendingUserText(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={listRef}
        className="bg-black/20 border border-white/5 backdrop-blur-sm overflow-y-auto"
        style={{ borderRadius: '1.5rem', maxHeight: '60vh', minHeight: '420px' }}
      >
        <div className="p-5 md:p-8 space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const editable = msg.role === 'user' && Boolean(msg.stepId);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div className={msg.role === 'user' ? 'max-w-[80%]' : 'max-w-[85%]'}>
                    {msg.role === 'assistant' && (
                      <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5">
                        {msg.isFollowUp ? 'Velocity Intake · Follow-up' : 'Velocity Intake'}
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="flex items-center justify-end gap-3 mb-1.5">
                        {editable && (
                          <button
                            type="button"
                            onClick={() => startEditing(msg.stepId!)}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-white/40 hover:text-white transition-colors disabled:opacity-40"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 text-right">
                          You
                        </div>
                      </div>
                    )}
                    <div
                      className={
                        msg.role === 'user'
                          ? 'text-white px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-[0_4px_30px_rgba(255,31,31,0.25)]'
                          : 'bg-black/50 border border-white/10 text-white/90 px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap'
                      }
                      style={{
                        borderRadius: '1.25rem',
                        background:
                          msg.role === 'user'
                            ? 'linear-gradient(135deg, #FF5A7A 0%, #FF1F1F 60%, #C70F0F 100%)'
                            : undefined,
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {pendingUserText && (
              <motion.div
                key="pending-user"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex justify-end"
              >
                <div className="max-w-[80%]">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 text-right mb-1.5">
                    You
                  </div>
                  <div
                    className="text-white px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-[0_4px_30px_rgba(255,31,31,0.25)]"
                    style={{
                      borderRadius: '1.25rem',
                      background:
                        'linear-gradient(135deg, #FF5A7A 0%, #FF1F1F 60%, #C70F0F 100%)',
                    }}
                  >
                    {pendingUserText}
                  </div>
                </div>
              </motion.div>
            )}
            {isSubmitting && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex justify-start"
              >
                <div className="max-w-[85%]">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5">
                    Velocity Intake
                  </div>
                  <div
                    className="bg-black/50 border border-white/10 text-white/90 px-5 py-3 text-sm leading-relaxed"
                    style={{ borderRadius: '1.25rem' }}
                    aria-label="Velocity Intake is thinking"
                    role="status"
                  >
                    <span className="inline-flex items-center gap-1.5 align-middle">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="block w-1.5 h-1.5 rounded-full bg-white/60"
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {error && <div className="text-sm text-velocity-red">{error}</div>}

      {readyForReview ? (
        <div className="flex items-center justify-between gap-3 p-5 bg-velocity-red/10 border border-velocity-red/40">
          <div>
            <div className="text-white font-medium">Ready for review</div>
            <div className="text-white/60 text-sm mt-1">
              Double-check everything before you submit. You can still edit in form mode.
            </div>
          </div>
          <button
            type="button"
            onClick={onReviewRequested}
            className="inline-flex items-center gap-2 px-5 py-3 bg-velocity-red text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-velocity-red/80 transition-colors"
            style={{ borderRadius: '0' }}
          >
            Review submission
          </button>
        </div>
      ) : (
        <>
          {editingStepId && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border border-white/10 bg-white/[0.02] text-sm text-white/70">
              <span>Editing an earlier answer. Re-submitting will rebuild the rest of the chat from there.</span>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSubmitting}
                className="text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-3 p-3 bg-black/60 border border-white/10 backdrop-blur-sm"
            style={{ borderRadius: '1.5rem' }}
          >
            <button
              type="button"
              onClick={handleBack}
              disabled={!previousCompletedStep || isSubmitting}
              aria-label="Edit previous answer"
              className="shrink-0 inline-flex items-center justify-center w-10 h-10 border border-white/10 text-white/70 disabled:text-white/20 disabled:border-white/5 hover:border-white/20 hover:text-white transition-colors"
              style={{ borderRadius: '999px' }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                editingStepId
                  ? 'Edit your earlier answer…'
                  : 'Type your answer… (Enter to send, Shift+Enter for a new line)'
              }
              rows={1}
              maxLength={2000}
              disabled={isSubmitting}
              aria-label="Your answer"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm leading-relaxed resize-none focus:outline-none px-3 py-2 max-h-[180px] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSubmitting}
              aria-label={editingStepId ? 'Save edited answer' : 'Send answer'}
              className="shrink-0 inline-flex items-center justify-center w-10 h-10 bg-velocity-red disabled:bg-white/10 disabled:text-white/30 text-white transition-colors"
              style={{ borderRadius: '999px' }}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
