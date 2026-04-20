import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowUp, Pencil } from 'lucide-react';
import {
  advanceDeterministicDraftFromAnswer,
  getDeterministicAnswer,
  getPreviousCompletedStep,
  isRequiredCatchUpState,
  replaceDeterministicAnswer,
} from '../../lib/automation-intake/deterministic';
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

export const AutomationIntakeChat: React.FC<Props> = ({
  draft,
  onDraftChange,
  onReviewRequested,
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<StepId | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const messages = formatTranscript(draft.transcript);
  const readyForReview = draft.status === 'review';
  const previousCompletedStep = getPreviousCompletedStep(draft);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const answer = input.trim();
    if (!answer) return;

    if (
      !editingStepId &&
      isRequiredCatchUpState(draft) &&
      /^(skip|pass|move on|no more)$/i.test(answer)
    ) {
      setError("That detail is still required before review. Edit the earlier answer or reply with the missing information.");
      return;
    }

    const result = editingStepId
      ? replaceDeterministicAnswer(draft, editingStepId, answer)
      : advanceDeterministicDraftFromAnswer({ draft, answer });

    onDraftChange(result.draft);
    setInput('');
    setEditingStepId(null);
    setError(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
                            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-white/40 hover:text-white transition-colors"
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
                className="text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors"
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
              disabled={!previousCompletedStep}
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
              aria-label="Your answer"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm leading-relaxed resize-none focus:outline-none px-3 py-2 max-h-[180px]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
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
