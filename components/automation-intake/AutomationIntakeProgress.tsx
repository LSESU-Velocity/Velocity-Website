import React from 'react';
import { STEP_DEFINITIONS } from '../../lib/automation-intake/questions';
import type { StepId } from '../../lib/automation-intake/schemas';

interface Props {
  currentStep: StepId;
  status: 'collecting' | 'review' | 'submitted';
}

export const AutomationIntakeProgress: React.FC<Props> = ({ currentStep, status }) => {
  const currentIndex = STEP_DEFINITIONS.findIndex((s) => s.id === currentStep);
  const effectiveIndex =
    status === 'review' || status === 'submitted' ? STEP_DEFINITIONS.length - 1 : currentIndex;

  return (
    <div className="w-full">
      <div className="flex items-center gap-1.5">
        {STEP_DEFINITIONS.map((step, idx) => {
          const complete = idx < effectiveIndex || status === 'review' || status === 'submitted';
          const active = idx === effectiveIndex && status === 'collecting';
          return (
            <div
              key={step.id}
              className={[
                'h-1 flex-1 transition-all duration-500',
                complete
                  ? 'bg-velocity-red'
                  : active
                    ? 'bg-velocity-red/50'
                    : 'bg-white/10',
              ].join(' ')}
              aria-label={`${step.title} ${complete ? 'complete' : active ? 'current' : 'pending'}`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-white/40">
        <span>
          Step {Math.min(effectiveIndex + 1, STEP_DEFINITIONS.length)} / {STEP_DEFINITIONS.length}
        </span>
        <span className="text-white/60">
          {status === 'review'
            ? 'Ready for review'
            : status === 'submitted'
              ? 'Submitted'
              : STEP_DEFINITIONS[currentIndex]?.title ?? ''}
        </span>
      </div>
    </div>
  );
};
