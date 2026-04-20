import React from 'react';
import { motion } from 'framer-motion';
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
  children: React.ReactNode;
}

export const AutomationIntakeShell: React.FC<Props> = ({
  mode,
  onModeChange,
  currentStep,
  status,
  hideToggle,
  toggleDisabled,
  children,
}) => {
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
            Let's map where automation can help your team.
          </h1>
          <p className="mt-4 text-white/60 max-w-2xl text-sm md:text-base leading-relaxed">
            A short, guided intake — chat or form, your choice. We'll turn your answers into a
            structured brief and, if we can, a student project scoped for your workflow. Please
            don't paste confidential documents, credentials, or personal data about your customers.
          </p>
        </motion.div>

        {!hideToggle && (
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <AutomationIntakeProgress currentStep={currentStep} status={status} />
          </div>
        )}

        {!hideToggle && (
          <div className="mb-8 flex justify-start">
            <AutomationIntakeToggle value={mode} onChange={onModeChange} disabled={toggleDisabled} />
          </div>
        )}

        <div className="relative">{children}</div>
      </div>
    </div>
  );
};
