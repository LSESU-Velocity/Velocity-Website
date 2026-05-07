import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, X } from 'lucide-react';
import { AutomationIntakeProgress } from './AutomationIntakeProgress';
import { AutomationIntakeToggle, type IntakeViewMode } from './AutomationIntakeToggle';
import type { StepId } from '../../lib/automation-intake/schemas';

interface Props {
  mode: IntakeViewMode;
  onModeChange: (mode: IntakeViewMode) => void;
  currentStep: StepId;
  status: 'collecting' | 'review' | 'submitted';
  hideToggle?: boolean;
  toggleDisabled?: boolean;
  chatLocked?: boolean;
  onLockedChatClick?: () => void;
  canReset?: boolean;
  resetDisabled?: boolean;
  onReset?: () => void;
  children: React.ReactNode;
}

export const AutomationIntakeShell: React.FC<Props> = ({
  mode,
  onModeChange,
  currentStep,
  status,
  hideToggle,
  toggleDisabled,
  chatLocked,
  onLockedChatClick,
  canReset = false,
  resetDisabled = false,
  onReset,
  children,
}) => {
  const [confirmingReset, setConfirmingReset] = React.useState(false);

  const handleReset = () => {
    onReset?.();
    setConfirmingReset(false);
  };

  return (
    <div className="relative min-h-screen bg-velocity-black pt-28 pb-24">
      {/* Viewport-fixed red ambient glows — travel with scroll so the page never
          darkens out beneath the fold. Stacked radials for depth; the large
          center layer keeps the middle column from going pitch black. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(90% 80% at 50% 40%, rgba(255,31,31,0.12) 0%, rgba(255,31,31,0.06) 40%, rgba(0,0,0,0) 85%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(55% 55% at 15% 10%, rgba(255,31,31,0.24) 0%, rgba(255,31,31,0.08) 45%, rgba(0,0,0,0) 80%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(45% 45% at 90% 30%, rgba(255,71,71,0.14) 0%, rgba(0,0,0,0) 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 100%, rgba(255,31,31,0.10) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="text-[11px] uppercase tracking-[0.3em] text-velocity-red/80 mb-3">
            For Businesses · Automation Intake
          </div>
          <h1 className="font-sans text-3xl md:text-5xl font-light text-white leading-tight tracking-tight">
            Partner with Velocity on a semester-long student project.
          </h1>
          <p className="mt-4 text-white/60 max-w-2xl text-sm md:text-base leading-relaxed">
            Share your automation brief, and we'll look to match it with Velocity student members
            who can work on it as a semester-long project. Submitted chat and form data is
            encrypted at rest. Please don't paste confidential documents, credentials, or personal
            data about your customers.
          </p>
        </motion.div>

        {!hideToggle && (
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <AutomationIntakeProgress currentStep={currentStep} status={status} />
            {canReset && onReset && (
              <div className="flex items-center justify-end gap-2 flex-wrap">
                {confirmingReset ? (
                  <div className="flex items-center gap-2 border border-velocity-red/40 bg-velocity-red/10 px-2 py-2">
                    <span className="px-2 text-[11px] uppercase tracking-[0.18em] text-white/65">
                      Clear this draft?
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmingReset(false)}
                      disabled={resetDisabled}
                      aria-label="Cancel reset"
                      className="inline-flex h-8 w-8 items-center justify-center border border-white/10 text-white/60 hover:text-white hover:border-white/25 disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={resetDisabled}
                      className="inline-flex h-8 items-center gap-2 bg-velocity-red px-3 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-velocity-red/80 disabled:opacity-40"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(true)}
                    disabled={resetDisabled}
                    className="inline-flex h-10 items-center gap-2 border border-white/10 bg-black/40 px-4 text-xs uppercase tracking-[0.2em] text-white/55 backdrop-blur-sm hover:border-velocity-red/50 hover:text-white disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!hideToggle && (
          <div className="mb-8 flex justify-start">
            <AutomationIntakeToggle
              value={mode}
              onChange={onModeChange}
              disabled={toggleDisabled}
              chatLocked={chatLocked}
              onLockedChatClick={onLockedChatClick}
            />
          </div>
        )}

        <div className="relative">{children}</div>
      </div>
    </div>
  );
};
